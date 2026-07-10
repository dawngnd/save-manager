# Architecture Research

**Domain:** Google Apps Script + Google Sheet + Telegram Web App
**Researched:** 2026-07-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

The Save Manager system consists of four primary components:
1. **Telegram Webview (Client):** The frontend UI running as a Telegram Web App (TWA) in the user's mobile or desktop client.
2. **Google Apps Script Server (Backend):** Handles incoming web requests (GET to serve TWA, POST for Telegram Webhooks), exposes backend RPC-like methods to the TWA client, and manages database transactions.
3. **Google Sheets (Database):** Serves as the persistent data store.
4. **Telegram Bot API (External API):** Communicates with the GAS server to handle Telegram bot commands, keyboard buttons, and user interaction loops.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Telegram Webview (Client)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │   Auth & Login Form   │  │   Deposits & Form     │  │    Chart.js     │  │
│  │ (username_bankcode)   │  │ (Add/Rollover Save)   │  │ (Asset Growth)  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘  │
│              │                          │                       │           │
└──────────────┼──────────────────────────┼───────────────────────┼───────────┘
               │  google.script.run       │                       │
               │  (Asynchronous RPC)      │                       │
┌──────────────▼──────────────────────────▼───────────────────────▼───────────┐
│                        Google Apps Script (Backend)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Web Server Router (doGet to render UI / doPost to handle Webhooks)  │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  Services Layer (Auth Service, Deposit Operations, Telegram Bot API) │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │  SpreadsheetApp API
                                      │  (with LockService)
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                           Google Sheets (Database)                          │
│  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────┐   │
│  │   Users Sheet    │        │  Deposits Sheet  │        │ History/Logs │   │
│  └──────────────────┘        └──────────────────┘        └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Telegram Webview** | Serves frontend UI, collects input, draws timeseries chart, triggers GAS backend RPC. | Single Page Application (SPA) using HTML, CSS (Tailwind via CDN), Vanilla JS, and Chart.js. |
| **Telegram Bot API** | Directs users to open the Web App via inline keyboard buttons. | Standard HTTPS communication via Telegram Bot Webhooks. |
| **GAS Controller (GET)** | Serves the frontend SPA from Apps Script Web App hosting. | `doGet(e)` using `HtmlService` to evaluate templates and inject assets. |
| **GAS Controller (POST)** | Processes bot interaction (e.g. `/start` command, bot callbacks). | `doPost(e)` parsing webhook payloads and responding via `UrlFetchApp`. |
| **GAS DB Service** | Performs CRUD operations, calculates interest rates, manages transaction locks. | Server-side JavaScript (`.gs`) using `SpreadsheetApp` and `LockService`. |
| **Google Sheets Database** | Persists system data. | A Spreadsheet with separate tabs acting as database tables. |

---

## Recommended Project Structure

Google Apps Script runs in a flat script editor workspace. However, development is best structured locally using Google's `clasp` CLI to organize files into logical directories, which clasp will flatten automatically upon deployment.

```
src/
├── backend/
│   ├── Code.gs         # Entry points (doGet, doPost, include helper)
│   ├── DB.gs           # Database layer (CRUD for Users, Deposits, History)
│   ├── Telegram.gs     # Telegram API integration (Webhook, bot messages)
│   └── Utils.gs        # Interest math, dates, calculations
└── frontend/
    ├── Index.html      # Main HTML SPA structure & DOM layout
    ├── Stylesheet.html # CSS styles (wrapped in <style>...</style>)
    └── JavaScript.html # Frontend logic (Auth, form handling, Chart.js rendering)
```

### Structure Rationale

- **src/backend/:** Keeps all Apps Script execution logic separated from presentation.
- **src/frontend/:** Houses the HTML, CSS, and client JS. Because Apps Script does not support serving separate static files, CSS and JS must be written in HTML format (wrapped in style/script tags) and dynamically embedded into `Index.html` at load time.
- **`include()` function in Code.gs:** A standard GAS pattern to parse sub-templates inside `Index.html`:
  ```javascript
  function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
  ```

---

## Architectural Patterns

### Pattern 1: Single Endpoint Routing (Web App Webhook)

**What:** Using the same deployed GAS Web App URL for both the client Web App (`doGet`) and the Telegram webhook (`doPost`).
**When to use:** Crucial when hosting Telegram Bots inside Apps Script. Saves Web App URLs, prevents CORS issues, and keeps bot integration code consolidated in one script.
**Trade-offs:** Can lead to a bloated `doPost` handler if the bot handles many commands. Since we only need the bot to trigger the Web App launcher, keep the bot commands minimal.

### Pattern 2: Script Lock Concurrency Guard

**What:** Wrapping database writes in a global script lock to prevent race conditions.
**When to use:** Every time the backend writes to Google Sheets, especially during rollover transactions or deposit addition.
**Trade-offs:** Blocked requests will wait. For single-user or small personal systems, this is trivial, but necessary to prevent spreadsheet corruption when double-clicking buttons.

**Example:**
```javascript
function addDeposit(depositData) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for lock
    lock.waitLock(10000); 
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Deposits");
    // Append or edit rows here safely
    sheet.appendRow([
      depositData.id,
      depositData.amount,
      depositData.rate,
      // ...
    ]);
  } catch (e) {
    throw new Error("Could not acquire lock, please try again: " + e.message);
  } finally {
    lock.releaseLock();
  }
}
```

### Pattern 3: Asynchronous Client-Server Bridge (google.script.run)

**What:** Direct RPC mechanism that lets client-side JS call public functions defined in backend `.gs` files.
**When to use:** All client-server communication (authentication, deposit data fetch, savings submission).
**Trade-offs:** Asynchronous. Requires callback chaining (`.withSuccessHandler()`, `.withFailureHandler()`). Cannot use standard `fetch()` or `Axios` because the GAS backend is an isolated sandbox.

---

## Data Flow

### Request Flow (TWA Frontend -> Backend -> DB)

```
[User Action (e.g. Rollover)]
     ↓
[JavaScript (Frontend)] → [google.script.run.executeRollover] → [Code.gs (doGet Context)]
     ↓                                                                     ↓
[TWA Client Updates] ← [Success Handler Callback] ← [Success Result] ← [DB.gs Writes Data]
```

### Webhook Flow (Telegram -> Backend Bot Handler)

```
[User interacts with Bot chat]
     ↓
[Telegram Server] → [HTTPS POST] → [doPost(e) in Code.gs] → [Telegram.gs parses bot command]
                                                                        ↓
[User opens TWA in Telegram] ← [Send Inline Keyboard with Web App URL] ← [UrlFetchApp Response]
```

### Key Data Flows

1. **User Authentication Flow:**
   - User inputs `username_bankcode` on the UI.
   - Client JS executes `google.script.run.withSuccessHandler(...).authenticateUser(username_bankcode)`.
   - Backend queries `Users` sheet.
   - If user exists, backend returns user metadata and a list of active deposits.
   - Frontend stores the username locally (e.g. in `sessionStorage` or local variables) and updates view state.

2. **Deposit Addition & Interest Calculation:**
   - User submits form.
   - Client sends payload: `amount`, `interest_rate`, `created_at`, `maturity_at`.
   - Server validates payload, calculates `expected_interest` using formula: `amount * (interest_rate / 100) * (days_diff / 365)`.
   - Server acquires `ScriptLock`, appends record to `Deposits` sheet, releases lock.
   - Server returns complete deposit object (with computed interest and status) to client.

3. **Maturity Rollover Flow:**
   - Client triggers rollover for deposit `old_id` with new `new_amount`.
   - Backend acquires `ScriptLock`.
   - Backend updates target row in `Deposits` sheet: changes status from `active` to `rolled_over`.
   - Backend logs transaction history in `History` sheet or appends a new row in `Deposits` representing the new active deposit (linked to the same `user_bankcode`).
   - Backend releases `ScriptLock` and returns updated state to the UI.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Baseline Architecture (GAS + Sheets). Zero hosting costs. Single endpoint works perfectly. |
| **1k-10k users** | Cache frequently read user data in `CacheService` to prevent hitting Spreadsheet quota. Implement spreadsheet cleanup cron scripts. |
| **10k+ users** | **Migration required.** Google Apps Script limit of 6 minutes per script run and Sheets limit of 10 million cells will be breached. Migrate to a VPS (Node.js/Python) + relational database (PostgreSQL/Supabase). |

### Scaling Priorities

1. **First bottleneck (GAS Execution Quota & Spreadsheet Read Overhead):** Reading Sheets on every single request degrades performance. Use `CacheService` to store user profiles and active deposit cache.
2. **Second bottleneck (Write Concurrency):** Script lock holds up queues, slowing down client response times. Migrate the database layer from Sheets to a proper cloud database API (like Supabase or Firestore) while keeping Apps Script as the execution environment.

---

## Anti-Patterns

### Anti-Pattern 1: Inlining massive libraries in GAS
**What people do:** Write entire modern framework bundles (React/Vue/Tailwind) directly inside GAS project scripts.
**Why it's wrong:** Exceeds the Apps Script file size limit and makes deployment/push operations very slow.
**Do this instead:** Load styling frameworks (Tailwind) and visualization libraries (Chart.js) from CDNs in `Index.html`. Keep client-side Javascript vanilla or highly compiled.

### Anti-Pattern 2: Missing LockService on writes
**What people do:** Directly update sheets without checking or applying locks.
**Why it's wrong:** Google Sheets will overwrite columns if two API calls modify records simultaneously, leading to corrupted financial histories.
**Do this instead:** Always use `LockService.getScriptLock()` inside write methods, releasing it inside a `finally` block.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Telegram Bot API** | Webhook via POST (`doPost`) and bot commands sent via `UrlFetchApp` (GET/POST to `api.telegram.org/bot<token>`). | Must set Webhook URL once using the `setWebhook` endpoint. |
| **Telegram Web App JS SDK** | Embedded library in frontend header (`https://telegram.org/js/telegram-web-app.js`). | Gives the Web App access to theme colors, screen sizing commands (`tg.expand()`), and user details. |
| **Chart.js CDN** | Embedded script in frontend header. | Renders responsive graphs within the Telegram webview container. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client UI ↔ Backend controller** | Asynchronous RPC calls via `google.script.run` API. | No CORS setup required because it runs in an iframe sandbox hosted on Google domains. |
| **Backend ↔ Spreadsheet Database** | Google's native `SpreadsheetApp` library. | Requires execution context user permissions (`Execute as: Me`). |

---

## Suggested Build Order

To minimize deployment issues and build linearly, follow this ordering:

```
[Phase 1: DB & clasp Project Setup]
               │
               ▼
[Phase 2: Backend DB Operations (DB.gs)]
               │
               ▼
[Phase 3: Telegram Bot Webhook Integration]
               │
               ▼
[Phase 4: Frontend UI (TWA SPA)]
               │
               ▼
[Phase 5: Charts (Chart.js) & Rollover Mechanics]
```

1. **Phase 1: Database Setup & Local Script Dev Env**
   - Create Google Sheets with `Users` and `Deposits` sheets.
   - Configure local `clasp` environment and repo structure. Verify deployment.
2. **Phase 2: Backend Database Operations & Calculations**
   - Write core CRUD scripts in `DB.gs` (read users, write deposits, log transactions).
   - Integrate `LockService` early in write operations.
3. **Phase 3: Telegram Bot Webhook Integration**
   - Register Bot with BotFather.
   - Implement `doPost(e)` to handle bot webhook commands. Establish webhook link.
4. **Phase 4: Frontend UI (TWA) & Auth**
   - Create `Index.html`, `Stylesheet.html`, `JavaScript.html`.
   - Embed Telegram Web App SDK.
   - Set up manual auth check using `username_bankcode` against backend.
5. **Phase 5: Charts & Rollover Mechanics**
   - Connect client-side to backend data APIs using `google.script.run`.
   - Render timeseries projection chart using Chart.js.
   - Integrate rollover button and verification workflow.

---
*Architecture research for: Save Manager*
*Researched: 2026-07-10*
