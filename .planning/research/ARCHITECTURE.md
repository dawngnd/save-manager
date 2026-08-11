# Architecture Research — v2.0 Polish & Analytics

**Domain:** Google Apps Script (GAS) + Google Sheets DB + Vite/React SPA + Telegram Web App SDK  
**Researched:** 2026-08-11  
**Confidence:** HIGH  

---

## Standard Architecture

### System Overview

The Save Manager architecture is a single-page React SPA bundled into a single HTML artifact (`index.html`) deployed to GitHub Pages / Telegram Web App, backed by Google Apps Script (GAS) `doPost` REST endpoints and Google Sheets as a relational database.

For **Milestone v2.0**, three core capabilities integrate into this existing architecture:
1. **HMAC-SHA256 Auth Verification (AUTH-02):** Cryptographic verification of Telegram Web App `initData` signatures on all POST requests handled by GAS `AuthService`.
2. **Deposit Lineage Tree View (HIST-01):** Interactive visualization of rollover history chains constructed client-side using `parent_id` and `child_id` pointers stored in Google Sheets.
3. **Portfolio Analytics Engine (STAT-02):** In-memory client-side aggregation of active deposits into term duration buckets (`< 1M`, `1-3M`, `3-6M`, `6-12M`, `12M+`) and bank balance shares.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              Telegram Web App Client (SPA)                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────────────┐  │
│  │   Auth & Telegram SDK  │  │  Lineage Tree Modal   │  │  Portfolio Analytics Engine │  │
│  │ (initData payload)     │  │ (parent_id/child_id)  │  │ (Term/Bank Chart.js)        │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────────┬──────────────┘  │
│              │                          │                             │                 │
└──────────────┼──────────────────────────┼─────────────────────────────┼─────────────────┘
               │ HTTPS POST (JSON)        │                             │
               │ { action, initData, ... }│                             │
┌──────────────▼──────────────────────────▼─────────────────────────────▼─────────────────┐
│                               Google Apps Script (Backend)                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  doPost(e) Centralized JSON Router & Auth Interceptor                             │  │
│  │  ├── AuthService.verifyWebAppData(initData, TELEGRAM_BOT_TOKEN)                    │  │
│  │  └── Extract authenticatedChatId                                                  │  │
│  ├───────────────────────────────────────────────────────────────────────────────────┤  │
│  │  Repository Layer                                                                 │  │
│  │  ├── DepositRepository (add, getAll, rollover)                                    │  │
│  │  └── UserRepository (findOrCreate, linkChatId)                                   │  │
│  └───────────────────────────────────┬───────────────────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────────────────┘
                                       │ SpreadsheetApp API
                                       │ (with LockService on writes)
┌──────────────────────────────────────▼──────────────────────────────────────────────────┐
│                            Google Sheets Database (Persisted)                           │
│  ┌─────────────────────────────────┐        ┌────────────────────────────────────────┐  │
│  │ Users Sheet                     │        │ Deposits Sheet                         │  │
│  │ (username_bankcode, chat_id)    │        │ (id, amount, rate, parent_id, child_id)│  │
│  └─────────────────────────────────┘        └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New vs Modified | Implementation Detail |
|-----------|----------------|-----------------|-----------------------|
| **`AuthService.js`** | Validates Telegram `initData` HMAC-SHA256 signature, enforces auth expiry (24h), and extracts `telegram_chat_id`. | **Modified** | Uses `Utilities.computeHmacSha256Signature()` in GAS; returns sanitized `authenticatedChatId`. |
| **`Code.js` (`doPost`)** | Centralized REST controller; verifies auth interceptor before dispatching actions to repositories. | **Modified** | Enforces `AuthService` check, passes `authenticatedChatId` into `DepositRepository` and `UserRepository`. |
| **`DepositRepository.js`** | Handles deposit CRUD, computes interest, sets bidirectional pointers (`parent_id` & `child_id`) on rollover. | **Existing / Preserved** | Already updates `child_id` on rollover; returns complete parent/child links in `getAll`. |
| **`api.ts`** | Client HTTP layer; automatically attaches `initData` from Telegram SDK to all outgoing POST requests. | **Modified** | Enhances error handling for `401 Unauthorized` and integrates auto-linking payload parameters. |
| **Lineage Tree Engine (`lineage.ts` + `DepositLineageModal.tsx`)** | Constructs ancestor/descendant rollover chains from flat deposit list; renders interactive timeline UI. | **NEW** | Client-side pointer traversal (O(N) graph builder); displays cumulative interest & term duration. |
| **Portfolio Analytics Engine (`analytics.ts` + `TermShareChart.tsx`)** | Classifies deposits into standardized term buckets (`1M`, `3M`, `6M`, etc.) & calculates term/bank yield distribution. | **NEW** | Pure TypeScript client aggregation functions; feeds Chart.js Doughnut & Bar components. |
| **`DepositForm.tsx`** | Deposit creation form; supports manual entry of new bank code when user select lacks bank. | **Modified** | Adds custom bankcode input mode (GAP-02) alongside `UserSelector` integration (GAP-01). |

---

## Recommended Project Structure

```
save-manager/
├── backend/
├── backend/
│   ├── Code.js                # Centralized doPost/doGet router [MODIFIED]
│   ├── AuthService.js         # Telegram HMAC-SHA256 signature verification [MODIFIED]
│   ├── DepositRepository.js   # CRUD & Rollover with parent_id/child_id [EXISTING]
│   ├── UserRepository.js      # User management & Chat ID linking [MODIFIED]
│   ├── SheetManager.js        # Sheets initialization & schema definition [EXISTING]
│   └── Constants.js            # Global constants & column indices [EXISTING]
└── frontend/
    └── src/
        ├── api.ts             # API client with auto initData wrapping [MODIFIED]
        ├── types.ts           # Shared TypeScript interfaces (Deposit, User) [MODIFIED]
        ├── components/
        │   ├── App.tsx                    # Main layout, tab navigation, user selector [MODIFIED]
        │   ├── DepositCard.tsx            # Deposit item card with Lineage action button [MODIFIED]
        │   ├── DepositList.tsx            # List container for active/matured/rolled_over [MODIFIED]
        │   ├── DepositForm.tsx            # FAB deposit modal with manual bankcode input [MODIFIED]
        │   ├── DepositLineageModal.tsx    # Lineage tree / rollover chain viewer [NEW]
        │   ├── TermShareChart.tsx         # Term duration breakdown chart [NEW]
        │   ├── PortfolioAnalyticsModal.tsx# Combined portfolio analytics dashboard [NEW]
        │   ├── UserSelector.tsx           # User selection dropdown component [MODIFIED]
        │   ├── GrowthChart.tsx            # Timeseries step-wise growth chart [EXISTING]
        │   └── BankSummaryChart.tsx       # Bank total asset breakdown chart [EXISTING]
        └── utils/
            ├── lineage.ts     # Lineage tree graph traversal & metric calculator [NEW]
            ├── analytics.ts   # Term classification & aggregation utilities [NEW]
            └── telegram.ts    # Telegram Web App SDK initializer [EXISTING]
```

### Structure Rationale

- **`frontend/src/utils/lineage.ts` & `analytics.ts`:** Separating graph traversal and mathematical aggregation into pure utility modules enables 100% unit testability without React component rendering overhead.
- **`DepositLineageModal.tsx` as a standalone component:** Keeps modal rendering decoupled from `DepositList` and `DepositCard`, allowing it to be popped up from anywhere (e.g., direct deep links or detail sheets).
- **Backend structure untouched in layout:** GAS code remains in `backend/` as flat JavaScript files, adhering to GAS runtime conventions where all `.js` files share global scope.

---

## Architectural Patterns

### Pattern 1: Interceptor-Based HMAC Authentication (AUTH-02)

**What:** Centralized signature validation inside `doPost` prior to executing any backend route.
**When to use:** Every API call arriving at GAS `doPost` from Telegram Web App.
**Trade-offs:** Adds ~2-5ms CPU time per request for HMAC computation, but guarantees payload integrity and prevents user impersonation.

**Implementation Architecture:**
```javascript
// backend/AuthService.js
static verifyWebAppData(initData, botToken) {
  if (!initData) return botToken ? 'initData missing' : '';
  
  var params = parseQueryString(initData);
  var hash = params['hash'];
  delete params['hash'];
  
  // 1. Enforce freshness (auth_date must be within 24h)
  var authDate = parseInt(params['auth_date'], 10);
  if (Math.floor(Date.now() / 1000) - authDate > 86400) {
    return 'Session expired';
  }
  
  // 2. Data check string: alphabetical key=value joined by \n
  var dataCheckString = Object.keys(params).sort()
    .map(function(k) { return k + '=' + params[k]; }).join('\n');
    
  // 3. HMAC-SHA256 signature chain
  var secretKey = Utilities.computeHmacSha256Signature(botToken, 'WebAppData');
  var calculatedHashHex = bytesToHex(Utilities.computeHmacSha256Signature(dataCheckString, secretKey));
  
  return (calculatedHashHex === hash) ? '' : 'Invalid signature';
}
```

### Pattern 2: Bidirectional Linked List Lineage Traversal (HIST-01)

**What:** Representing deposit rollover chains as a doubly-linked list (`parent_id` ↔ `child_id`) and traversing it client-side.
**When to use:** When viewing the historical lineage of any deposit that has been rolled over or created from a previous deposit.
**Trade-offs:** Requires fetching the full deposit list (which is already cached client-side in `useDepositsCache`), avoiding expensive recursive backend database lookups.

**Traversal Architecture:**
```typescript
// frontend/src/utils/lineage.ts
export interface LineageChain {
  root: Deposit;
  nodes: Deposit[];
  totalInterestEarned: number;
  totalDurationDays: number;
  growthFactor: number;
}

export function buildDepositLineage(targetId: string, allDeposits: Deposit[]): LineageChain {
  const depositMap = new Map(allDeposits.map(d => [d.id, d]));
  const target = depositMap.get(targetId);
  if (!target) throw new Error("Deposit not found");

  // 1. Traverse upward to root
  let root = target;
  while (root.parent_id && depositMap.has(root.parent_id)) {
    root = depositMap.get(root.parent_id)!;
  }

  // 2. Traverse downward from root to collect full ordered chain
  const chain: Deposit[] = [root];
  let current = root;
  while (current.child_id && depositMap.has(current.child_id)) {
    current = depositMap.get(current.child_id)!;
    chain.push(current);
  }

  // 3. Compute aggregated metrics across chain
  const totalInterest = chain.reduce((sum, d) => sum + d.expected_interest, 0);
  const totalDays = DateUtils.daysDifference(root.created_at, chain[chain.length - 1].maturity_at);

  return { root, nodes: chain, totalInterestEarned: totalInterest, totalDurationDays: totalDays, growthFactor: ... };
}
```

### Pattern 3: In-Memory Client-Side Portfolio Analytics (STAT-02)

**What:** Transforming raw active deposit records into term duration buckets and bank allocation metrics directly in React hooks/utilities.
**When to use:** Rendering term distribution doughnut charts and portfolio summary cards.
**Trade-offs:** Zero extra server calls or GAS execution time. Requires lightweight utility functions in frontend.

**Bucket Classification Scheme:**
- **Short-term (< 3M):** 1 - 89 days duration
- **Medium-term (3M - <6M):** 90 - 179 days duration
- **Standard-term (6M - <12M):** 180 - 364 days duration
- **Long-term (12M+):** ≥ 365 days duration

---

## Data Flow

### Request Flow with HMAC Verification

```
[User Action in React SPA]
           ↓
[api.ts: callBackendApi(payload)]
           ↓ (Appends rawInitData from Telegram SDK)
[HTTPS POST JSON Payload]
           ↓
[GAS Code.js: doPost(e)]
           ↓
[AuthService.verifyWebAppData(initData, BOT_TOKEN)]
     ├── If Invalid → Return HTTP JSON Error ("Xác thực thất bại")
     └── If Valid   → Extract authenticatedChatId
           ↓
[UserRepository.linkChatId / DepositRepository.getAll / add / rollover]
           ↓
[Return JSON Response to React SPA]
```

### Key Data Flows

1. **Telegram HMAC Auth & Auto-Link Flow (AUTH-02 & GAP-03):**
   - TWA launches in Telegram context; Telegram SDK populates `window.Telegram.WebApp.initData`.
   - Client calls `get_deposits` via `callBackendApi` sending `username_bankcode` and `initData`.
   - `doPost` validates HMAC signature. On success, `AuthService.extractUserId(initData)` extracts Telegram Chat ID.
   - If `payload.telegram_chat_id` matches `authenticatedChatId`, `UserRepository.linkChatId` updates the `Users` sheet to bind `telegram_chat_id` to `username_bankcode`.

2. **Lineage Tree Construction Flow (HIST-01):**
   - User clicks "Lịch sử phả hệ" on a deposit card in `DepositList`.
   - React state sets `selectedLineageDepositId`.
   - `DepositLineageModal` invokes `buildDepositLineage(selectedId, deposits)` from `lineage.ts`.
   - `lineage.ts` performs upward lookup for root, then downward lookup for child nodes, returning the chain array and summary metrics.
   - Modal renders step-by-step interactive node timeline.

3. **Portfolio Analytics Aggregation Flow (STAT-02):**
   - User clicks 📊 Analytics icon or tab in header.
   - `PortfolioAnalyticsModal` reads `deposits` from `useDepositsCache()`.
   - `analytics.ts` filters active deposits, calculates days to maturity and total term length.
   - Aggregates principal + expected interest into Term Buckets (`<3M`, `3-6M`, `6-12M`, `12M+`) and Bank Buckets.
   - Chart.js datasets are generated and rendered in `TermShareChart`.

---

## Scaling & Boundary Considerations

| Metric / Dimension | Scale Limit | Architecture Handling |
|--------------------|-------------|-----------------------|
| **Deposit Records per User** | < 1,000 deposits | Full array loaded in single `get_deposits` call (~50KB JSON). In-memory client traversal O(N) takes < 2ms. |
| **GAS doPost Timeout** | 6 seconds | All v2.0 queries are O(1) sheet reads or single-row updates. Read ops bypass `LockService` for maximum throughput. |
| **Session Security** | 24 Hours | `AuthService` rejects `initData` older than 86,400 seconds, requiring fresh Telegram launch. |

---

## Anti-Patterns

### Anti-Pattern 1: Server-Side Recursive Sheet Scans for Lineage
- **What people do:** Call backend API recursively or iterate sheet rows in GAS to find parent/child relationships on demand.
- **Why it's wrong:** Google Sheets API calls in GAS are slow (~100-300ms per `getValues` call). Recursive backend scans hit GAS timeout limits.
- **Do this instead:** Return full deposit list to client (which is already fetched on app start) and construct the lineage tree client-side in TypeScript.

### Anti-Pattern 2: Storing Bot Token in Client Frontend
- **What people do:** Compute HMAC signatures on client-side JS to bypass server authentication.
- **Why it's wrong:** Exposes `TELEGRAM_BOT_TOKEN` in frontend JavaScript, allowing total bot takeover by attackers.
- **Do this instead:** Bot token resides strictly in GAS `PropertiesService.getScriptProperties()`. Signature verification occurs exclusively inside GAS backend.

### Anti-Pattern 3: Bypassing LockService on Write Actions
- **What people do:** Direct sheet updates during `rollover_deposit` without acquiring `ScriptLock`.
- **Why it's wrong:** Double-clicking rollover creates duplicate deposits or orphan parent links in Google Sheets.
- **Do this instead:** Maintain strict `LockService.getScriptLock().tryLock(10000)` wrapper in `handleWriteActionWithLock` in `Code.js`.

---

## Integration Points

### External Services

| Service | Integration Pattern | Purpose / Notes |
|---------|---------------------|-----------------|
| **Telegram Web App JS SDK** | Embedded JS (`@telegram-apps/sdk` / `telegram-web-app.js`) | Obtains `initData` string containing user info, timestamp, and signature hash. |
| **Telegram Bot API** | HTTPS Webhook via GAS `doPost` | Processes `/start` command, sends daily maturity notification alerts via `TelegramService`. |
| **Chart.js / React-ChartJS-2** | Bundled NPM library in Vite SPA | Renders step-wise growth, bank summary, rate distribution, and term duration charts. |

### Internal Component Boundaries

| Boundary | Interface / Protocol | Implementation Details |
|----------|----------------------|------------------------|
| **React SPA ↔ GAS Backend** | HTTPS POST `callBackendApi()` | Passes `{ action, initData, username_bankcode, ... }` payload formatted as JSON string (`text/plain` content-type to avoid CORS preflight). |
| **`doPost` Router ↔ `AuthService`** | Direct class invocation | `AuthService.verifyWebAppData(initData, botToken)` returns error message or empty string. |
| **`doPost` Router ↔ Repositories** | Function calls | Passes initialized `sheets` object and `authenticatedChatId` to `DepositRepository` and `UserRepository`. |

---

## Suggested Build Order

To integrate new v2.0 capabilities smoothly without breaking existing v1.0 functionality, follow this dependency-ordered sequence:

```
[Step 1: Auth & Security Integration (AUTH-02, GAP-03)]
               │
               ▼
[Step 2: Lineage Utility & Tree Component (HIST-01)]
               │
               ▼
[Step 3: Portfolio Analytics Utility & Term Charts (STAT-02)]
               │
               ▼
[Step 4: UI Polish & Form Gaps (GAP-01, GAP-02, App Integration)]
```

1. **Step 1: HMAC Auth Interceptor & Auto-Link (AUTH-02, GAP-03)**
   - Verify `AuthService.verifyWebAppData` in backend against Telegram `initData`.
   - Update `Code.js` `doPost` to enforce auth and pass `authenticatedChatId`.
   - Update `api.ts` to pass `telegram_chat_id` and test auto-linking in `UserRepository.linkChatId`.

2. **Step 2: Deposit Lineage Tree View (HIST-01)**
   - Create `frontend/src/utils/lineage.ts` with graph traversal logic and metrics calculations.
   - Build `frontend/src/components/DepositLineageModal.tsx` displaying interactive step-by-step rollover timeline.
   - Connect "Lịch sử phả hệ" button in `DepositCard.tsx` / `BottomSheet.tsx`.

3. **Step 3: Portfolio Analytics & Term Share (STAT-02)**
   - Create `frontend/src/utils/analytics.ts` for term duration bucketing (`<3M`, `3-6M`, `6-12M`, `12M+`).
   - Create `frontend/src/components/TermShareChart.tsx` using Chart.js Doughnut/Bar visualizations.
   - Build `frontend/src/components/PortfolioAnalyticsModal.tsx` for consolidated portfolio views.

4. **Step 4: UI Polish & Gap Fixes (GAP-01, GAP-02)**
   - Integrate `UserSelector.tsx` into start/header view of `App.tsx` (GAP-01).
   - Add custom bankcode text input toggle in `DepositForm.tsx` (GAP-02).
   - End-to-end integration testing and single-file build bundle verification (`vite-plugin-singlefile`).

---

*Architecture research for: Save Manager v2.0*  
*Researched: 2026-08-11*  
