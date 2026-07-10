# Pitfalls Research

**Domain:** Google Apps Script + Google Sheets + Telegram Web App
**Researched:** 2026-07-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Aggressive GAS Web App Caching & Versioning Issues

**What goes wrong:**
Developers update the HTML/JS/CSS code in Google Apps Script, but the Telegram Web App interface continues to load the old version. New features appear broken, or style changes are completely ignored, leading to inconsistent behavior and difficult debugging.

**Why it happens:**
Google Apps Script caches Web App outputs aggressively. A deployment URL ending with `/exec` is static and only reflects the codebase state at the exact moment the deployment version was created. Simply saving the file in the GAS Editor does not update the active Web App.

**How to avoid:**
1. During active development, use the Developer Mode URL (`.../dev`) inside the Telegram Bot settings. The `/dev` URL executes the latest code directly.
2. For production updates, always create a **New Version** in the GAS deployment settings. Avoid just editing an existing deployment without incrementing the version.
3. Use script-bundling or inject dependencies dynamically. For external CSS/JS libraries (like Chart.js), append a cache-busting query parameter (e.g., `?v=TIMESTAMP`) to force refresh.

**Warning signs:**
- Direct console logs added in code do not print in the Telegram Web App inspector.
- CSS layout changes appear on local browser test but fail inside the Telegram container.

**Phase to address:**
Phase 1: Setup & Web App Integration.

---

### Pitfall 2: Telegram Web App Authentication Bypass (Lack of `initData` Validation)

**What goes wrong:**
Because the app uses manual input of `username_bankcode` to authenticate (Decision DB-01), the GAS backend is vulnerable. A malicious user can inspect Telegram client traffic, extract the GAS Web App endpoint URL, and send custom HTTP requests to fetch or modify another user's financial details.

**Why it happens:**
Developers mistakenly assume that because the Web App is opened inside Telegram, only authorized Telegram users can hit the underlying API. In reality, the Apps Script URL is public and exposed.

**How to avoid:**
1. Do not rely solely on the self-declared `username_bankcode`.
2. Extract the `window.Telegram.WebApp.initData` query string on the client side and forward it with every backend request (via headers or payload).
3. In GAS, implement a validation function: parse the `initData` query string, sort the keys alphabetically, concatenate them as `key=value\n` (excluding `hash`), calculate the HMAC-SHA256 signature using the SHA256 of the Bot Token as the key, and verify it matches the received `hash`.
4. Check that `auth_date` is within a reasonable window (e.g., last 24 hours) to prevent replay attacks.

**Warning signs:**
- The backend accepts and executes requests from standard HTTP tools (like curl or Postman) without requiring valid Telegram signature headers.

**Phase to address:**
Phase 2: Authentication & Database Schema.

---

### Pitfall 3: Google Sheets Row Overwrites & Concurrent Write Race Conditions

**What goes wrong:**
When a user adds a deposit or executes a rollover, and another write occurs simultaneously (or the user double-taps the submit button due to UI lag), the second operation overwrites the first, or creates duplicate IDs in the sheet, corrupting the database.

**Why it happens:**
Google Sheets is not an ACID-compliant transactional relational database. A common code pattern—reading the last row index, calculating the next incremented ID, and calling `appendRow()`—is not atomic. Multiple concurrent executions of this sequence will fetch the same "last row" and write overlapping data.

**How to avoid:**
Use `LockService` in Google Apps Script to serialize database operations:
```javascript
var lock = LockService.getScriptLock();
try {
  // Wait up to 15 seconds to acquire lock
  lock.waitLock(15000);
  
  // Read sheets, compute IDs, and write data here...
  
} catch (e) {
  Logger.log("Lock acquisition timeout: " + e.toString());
  throw new Error("Hệ thống đang bận, vui lòng thử lại sau giây lát.");
} finally {
  lock.releaseLock();
}
```

**Warning signs:**
- Duplicate IDs in the `Deposits` sheet.
- Fast successive form submissions lead to missing transaction logs.

**Phase to address:**
Phase 3: Deposit CRUD Operations.

---

### Pitfall 4: Date Parsing & Time Zone Offset Misalignment

**What goes wrong:**
A deposit set to mature on `2026-08-10` is saved as `2026-08-09` or `2026-08-11` in the sheet, causing incorrect interest accrual calculations and showing wrong maturity countdowns.

**Why it happens:**
JavaScript client-side parsed dates use the browser's local timezone. Google Apps Script runs on Google's servers (defaulting to America/New_York or UTC depending on settings), and the Google Spreadsheet itself has its own timezone settings (`File > Settings > Time zone`). If these three timezones don't align, date string parsing (e.g. `new Date("2026-08-10")`) can shift the date by several hours, crossing day boundaries.

**How to avoid:**
1. Synchronize timezones: Set both the Google Sheet and Google Apps Script (`appsscript.json`) timezone to `Asia/Ho_Chi_Minh` (UTC+7).
2. Keep date values as ISO 8601 strings (`YYYY-MM-DD`) during transmission.
3. Parse and format dates explicitly using utilities (e.g., `Utilities.formatDate` in GAS) rather than relying on default JavaScript date-to-string conversions.

**Warning signs:**
- Saving a deposit with a date shows a different date in the Google Sheet cell, or the Web App UI shows a date one day off from what is in the sheet.

**Phase to address:**
Phase 3: Deposit CRUD Operations.

---

### Pitfall 5: Web App Executed under Wrong User Identity Context

**What goes wrong:**
When users open the Telegram Web App, they are prompted with a Google Account Login screen, or they receive a "Permission Denied" error, preventing them from interacting with the bot.

**Why it happens:**
The GAS Web App was deployed with the setting "Execute as: User accessing the webapp". Since Telegram Web App runs in an embedded browser sandbox, the user has no Google session active, and they cannot access the script.

**How to avoid:**
When deploying the Web App, always select:
- **Execute as:** `Me` (your developer Google account, which has access to the Sheet).
- **Who has access:** `Anyone` (this allows the Telegram webhook/client to communicate with the Apps Script endpoint without needing a Google login).

**Warning signs:**
- Opening the Web App URL inside a private browser window prompts for Google sign-in.

**Phase to address:**
Phase 1: Setup & Web App Integration.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Using Sheet row index as Deposit ID** | Simple to implement, no ID generator needed. | Row deletions or manual sorts destroy ID references; breaks relations to Users sheet. | **Never.** Use unique IDs (UUIDs or `t-[timestamp]-[random]`). |
| **Storing all JS & CSS inline in `Index.html`** | Single file deployment, simple to copy-paste into GAS editor. | Difficult to format, test, and manage as CSS and JS libraries grow. | **Only in MVP.** Refactor to separate files and use Google's script evaluation to include them (`HtmlService.createHtmlOutputFromFile`). |
| **Direct client-side manipulation of Sheets** | Faster response time bypassing App Script backend logic. | Vulnerable to client-side injection; business logic leaks; no write locks. | **Never.** Keep all validation and calculations (like interest formulas) on the Apps Script server side. |
| **Calculated expected interest on client-side** | Avoids GAS computation lag. | Discrepancies between database records and UI representation; risk of user-manipulated values. | **Never.** Compute interest on the server when creating/updating the record. |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Telegram Bot API** | Exposing the Telegram Bot Token inside client-side JS or Web App HTML. | Keep the Bot Token strictly inside the server-side GAS script properties (`PropertiesService.getScriptProperties()`). |
| **Telegram Web App SDK** | Not calling `window.Telegram.WebApp.ready()` on initialization. | Execute `ready()` as soon as the DOM is loaded to notify the Telegram client to compute viewport height and theme variables. |
| **Google Sheets API** | Using string formats of numbers (e.g. `$1,000` or `1.000.000đ`) in data calculations. | Store raw numeric values in the sheet. Let Sheets handle format styling via cell UI, and parse numeric values in GAS backend. |
| **Telegram Web App Theme** | Hardcoding background/font colors in CSS. | Use Telegram's native theme variables (e.g. `var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)`) so the UI adapts automatically to light/dark mode. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Cell-by-Cell Read/Write Loops** | Extremely slow response times (>5 seconds); script execution timeout errors. | Retrieve data using `sheet.getValues()` into a 2D array, perform edits, and write back in one operation using `sheet.setValues()`. | **> 50 records.** Slowdowns are noticeable even at small datasets. |
| **Full Sheet scan for specific users** | High memory usage; request latency. | Create a fast lookup index or filter rows in memory using JavaScript arrays rather than calling Sheets search functions repeatedly. | **> 500 deposits.** |
| **Recalculating Timeseries Chart Data on demand** | Chart loading delays when users open the Web App. | Store aggregated stats or cache the computed values in Apps Script CacheService for fast reads. | **> 1 year of daily historical data.** |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Exposing GAS deployment URL publicly without auth** | Unauthorized data editing or theft. | Restrict processing of `doPost`/`doGet` routes to requests that carry a verified Telegram `initData` payload or a valid session token. |
| **Leaking bankcodes/usernames in client-side logs** | Disclosure of user keys to anyone who can open DevTools. | Do not log `username_bankcode` to `console.log`. Only log clean validation outcomes (e.g., `auth: true`). |
| **Saving Plaintext Session Tokens on Client** | Hijacking of authenticated sessions. | Leverage Telegram Web App's native context lifecycle; re-validate `initData` on critical transitions rather than storing custom cookies. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No loading indicator during backend calls** | User thinks the button did not work, double-submits, or exits the bot. | Disable buttons and display a spinner immediately upon submission while awaiting the `google.script.run` callback. |
| **No Viewport Adaptation** | The keyboard covers the deposit input form on mobile screens, hiding what the user is typing. | Use Telegram viewport parameters, ensure inputs are centered or scrolled into view, and disable zoom styling. |
| **Failure to close Web App after success** | User is stuck on a static "Success" page and must manually tap Close. | Call `Telegram.WebApp.close()` automatically 1-2 seconds after confirming a successful deposit write. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Rollover Execution:** Appears to work because the active deposit amount is updated, but it is missing the creation of a historical record in a log sheet — verify that old data is saved in a history table.
- [ ] **Mobile Responsive Layout:** Form looks correct in desktop browser inspect tool, but has broken margins on small iPhone SE or Android screens — verify layout on real mobile Telegram clients.
- [ ] **Keyboard Interactivity:** Inputs work on desktop, but focus is lost or container scrolls incorrectly when mobile keyboard is toggled — verify input scrolling behaves correctly.
- [ ] **Token Expiry Handling:** App works fine on first launch, but breaks after 24 hours of inactivity due to cached obsolete credentials — verify token validation handles expiry gracefully.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Corrupted Sheets Data (Overwrite/Concurrent Write)** | LOW | Leverage Google Sheets Version History (`File > Version history`) to roll back to the state prior to corruption. |
| **Compromised Telegram Bot Token** | MEDIUM | Revoke token via `@BotFather`, generate a new one, and update it in Apps Script properties. |
| **Stuck Web App Cached Code** | LOW | Force a re-deploy with a brand new Version in Apps Script and update the webhook URL. |
| **Date Timezone Shift (One day offset across all dates)** | MEDIUM | Export data, run a repair script in GAS to shift timestamps (+/- Hours) matching `Asia/Ho_Chi_Minh`, adjust sheet timezone settings, and re-import. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **Caching & Identity Context** | Phase 1: Setup & Web App Integration | Test deploying Web App, opening URL in Incognito browser, and editing text to ensure changes propagate. |
| **Authentication Bypass** | Phase 2: Authentication & Database Schema | Attempt to curl the Apps Script endpoint with missing/altered `initData` parameters and confirm it rejects the request. |
| **Timezone Shifts** | Phase 2: Authentication & Database Schema | Save a test date from the web app client, read it back, and check that the sheet shows exact expected date cells in UTC+7. |
| **Concurrent Writes** | Phase 3: Deposit CRUD Operations | Trigger concurrent asynchronous HTTP post requests to write deposits and verify that `LockService` serializes them. |
| **No Viewport/Keyboard Adaptation** | Phase 4: UI & Telegram Web App Integration | Open the form on a mobile device, focus inputs, and verify keyboard does not cover the Save button. |

## Sources

- [Google Apps Script Web Apps Documentation](https://developers.google.com/apps-script/guides/web)
- [Telegram Web Apps Documentation](https://core.telegram.org/bots/webapps)
- [Google Apps Script Lock Service Guide](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Managing Timezones in Google Sheets & GAS](https://developers.google.com/apps-script/guides/support/troubleshooting#time-zones)

---
*Pitfalls research for: Save Manager (Google Apps Script + Google Sheet + Telegram Web App)*
*Researched: 2026-07-10*
