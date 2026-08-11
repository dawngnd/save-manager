# Pitfalls Research

**Domain:** Google Apps Script + Google Sheets + Telegram Web App (React SPA)
**Milestone:** v2.0 Polish & Analytics (HMAC Auth, Lineage Tree, Portfolio Analytics)
**Researched:** 2026-08-11
**Confidence:** HIGH

---

## Executive Summary

Adding **HMAC-SHA256 Telegram authentication (`AUTH-02`)**, **deposit lineage tree visualization (`HIST-01`)**, and **portfolio analytics charts (`STAT-02`)** to an existing Google Apps Script (GAS) + Google Sheets + React SPA architecture introduces distinct technical edge cases.

The primary pitfalls center around:
1. **Google Apps Script Cryptographic Quirks**: `Utilities.computeHmacSha256Signature` argument ordering `(value, key)` and string conversion corruption of raw binary key bytes when validating Telegram WebApp `initData`.
2. **Data Structure & Visualization Hazards**: Circular parent-child references in Google Sheets causing infinite recursion loops in React tree components, and single-file bundle bloat from heavy graph libraries.
3. **Chart.js Lifecycle & Data Aggregation Errors**: Canvas re-use crashes during React state changes, theme text invisibility across Telegram light/dark mode transitions, and financial double-counting of historical `rolled_over` deposits in asset allocation summaries.

---

## Critical Pitfalls

### Pitfall 1: GAS `Utilities.computeHmacSha256Signature` Binary Key Conversion & Argument Order Corruption (`AUTH-02`)

**What goes wrong:**
`AuthService.verifyWebAppData` continuously fails validation in production inside Telegram Web App (returning `"Xác thực thất bại"` even for legitimate users), or fails silently by allowing invalid signatures.

**Why it happens:**
Two subtle Google Apps Script behaviors cause standard Telegram WebApp HMAC verification code to break:
1. **Argument Order Reversal**: Unlike Node.js `crypto.createHmac(algo, key).update(data)`, GAS `Utilities.computeHmacSha256Signature(value, key)` expects **`value` (message)** as the 1st parameter and **`key`** as the 2nd parameter. Reversing these produces completely invalid hashes.
2. **Binary Byte Array Key Encoding Distortion**: Telegram's HMAC verification requires a two-step hash:
   - `secret_key = HMAC-SHA256(key="WebAppData", msg=bot_token)`
   - `hash = HMAC-SHA256(key=secret_key, msg=data_check_string)`
   `computeHmacSha256Signature` returns a signed byte array (`Byte[]` with range -128 to 127). If code converts this byte array to a JavaScript UTF-16 string via `String.fromCharCode(b < 0 ? b + 256 : b)` and passes that string as the `key` parameter to the second `computeHmacSha256Signature` call, GAS internally converts the UTF-16 string back to UTF-8. Bytes in range 128–255 become 2-byte UTF-8 sequences, corrupting the 32-byte binary key!

**How to avoid:**
Pass the intermediate `secretKeyBytes` array directly as `Byte[]` into the second `computeHmacSha256Signature` call without converting to a String:
```javascript
// Step 1: secret_key = HMAC-SHA256(key="WebAppData", msg=bot_token)
// Note: GAS takes (value, key) -> (bot_token, "WebAppData")
var secretKeyBytes = Utilities.computeHmacSha256Signature(botToken, 'WebAppData');

// Step 2: hash = HMAC-SHA256(key=secretKeyBytes, msg=dataCheckString)
// Pass secretKeyBytes directly as Byte[] array key parameter!
var signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, secretKeyBytes);

var signatureHex = signatureBytes.map(function(b) {
  var val = b < 0 ? b + 256 : b;
  return ('0' + val.toString(16)).slice(-2);
}).join('');
```

**Warning signs:**
- Direct curl tests with official Telegram test vectors fail on GAS backend while succeeding in Node.js.
- Legitimate Telegram Web App requests are rejected with authentication errors.

**Phase to address:**
Phase 1: Telegram HMAC Authentication (`AUTH-02`).

---

### Pitfall 2: `initData` URL-Encoding Mismatch, Token Expiry, and Local Dev Lockout (`AUTH-02`)

**What goes wrong:**
Backend HMAC verification works during initial manual tests but fails intermittently in Telegram Web App, or breaks local development (`npm run dev` on localhost) completely because `window.Telegram.WebApp.initData` is empty string `""` outside Telegram.

**Why it happens:**
1. **URL Parameter Encoding**: Telegram sends `initData` as a raw query string. If the frontend parses and re-stringifies `initData`, or if GAS `doPost(e)` receives auto-decoded values in `e.parameter`, string escaping differences (e.g. JSON quotes inside `user={"id":...}`) corrupt the byte-for-byte exact `data_check_string` (`key=value\n`).
2. **`auth_date` Expiration**: Telegram `initData` includes an `auth_date` UNIX timestamp. If the user keeps the Telegram Web App open for over 24 hours, background API requests send stale `initData`, triggering auth failure.
3. **Local Dev Lockout**: Strict server-side verification blocks developers from testing new frontend features in a desktop browser.

**How to avoid:**
1. **Transmit Raw String**: Pass raw `window.Telegram.WebApp.initData` unmodified in request body payload (`{ initData: window.Telegram.WebApp.initData, ... }`).
2. **Backend Decoding**: In GAS, split raw `initData` string by `&`, decode keys and values once, filter out `hash`, sort keys alphabetically, and build `data_check_string`.
3. **Auth Date Window**: Enforce reasonable `AUTH_EXPIRY_SECONDS` (e.g., 86400 = 24h) and trigger a clear UI prompt when token expires.
4. **Dev Fallback Guard**: Allow bypass ONLY when `botToken` property is missing or when request carries an explicit developer secret parameter in non-production environments.

**Warning signs:**
- `initData` verification fails specifically when user profile contains special characters (spaces, unicode names, quotes).
- Desktop `npm run dev` displays endless loading spinner or permission denied errors.

**Phase to address:**
Phase 1: Telegram HMAC Authentication (`AUTH-02`).

---

### Pitfall 3: Lineage Tree Infinite Recursion Loops & Broken Parent Node Crashes (`HIST-01`)

**What goes wrong:**
Opening the deposit lineage tree view freezes the Web App UI or throws `RangeError: Maximum call stack size exceeded` or `TypeError: Cannot read properties of undefined (reading 'amount')`.

**Why it happens:**
1. **Circular References in Sheet Data**: Manual editing in Google Sheets or unexpected script behavior can create circular parent-child links (e.g. Deposit A has `parent_id` = B, and Deposit B has `parent_id` = A; or Deposit A has `parent_id` = A). Recursive chain traversal without cycle tracking runs infinitely.
2. **Orphaned Nodes**: Deposit record specifies `parent_id` pointing to an old ID that was manually deleted from the sheet, causing lookups to return `undefined`.

**How to avoid:**
1. **Cycle Detection with Visited Set**: Always track visited deposit IDs during lineage tree traversal:
```typescript
export function buildLineageTree(depositId: string, allDeposits: Deposit[]): DepositNode {
  const depositMap = new Map(allDeposits.map(d => [d.id, d]));
  const visited = new Set<string>();

  function traverse(id: string): DepositNode | null {
    if (visited.has(id)) {
      console.warn(`Circular lineage reference detected at ID: ${id}`);
      return null; // Break circular loop
    }
    visited.add(id);

    const current = depositMap.get(id);
    if (!current) {
      // Orphan fallback: Return dummy node or handle missing parent gracefully
      return { id, isMissing: true, children: [] };
    }

    const children = allDeposits
      .filter(d => d.parent_id === id)
      .map(child => traverse(child.id))
      .filter((node): node is DepositNode => node !== null);

    return { ...current, isMissing: false, children };
  }

  return traverse(depositId) || { id: depositId, isMissing: true, children: [] };
}
```
2. **Graceful UI Rendering**: Render missing parent nodes as "Khoản gốc đã xóa (N/A)" cards instead of throwing unhandled null pointer exceptions.

**Warning signs:**
- Browser tab memory spikes and freezes when tapping "Xem phả hệ" on a historical deposit.
- Uncaught TypeError in console: `Cannot read properties of undefined`.

**Phase to address:**
Phase 3: Deposit Lineage Tree View (`HIST-01`).

---

### Pitfall 4: Chart.js Canvas Re-render Leaks & Telegram Dark/Light Mode Invisibility (`STAT-02`)

**What goes wrong:**
1. Navigating between tabs or toggling analytics options causes console error: `Canvas is already in use. Chart with ID 'X' must be destroyed before the canvas can be reused`.
2. When user switches Telegram theme (Dark to Light or vice versa), chart text, gridlines, and legends become invisible (e.g., black text on dark background).

**Why it happens:**
1. **Missing Cleanup**: React re-renders canvas components without destroying existing Chart.js instances bound to the HTML canvas context.
2. **Static Color Configurations**: Hardcoding hex color strings (`#708499`, `#17212b`) inside Chart.js initial options prevents charts from adapting to dynamic Telegram theme changes (`var(--tg-theme-text-color)` or `Telegram.WebApp.colorScheme`).

**How to avoid:**
1. **Chart Reference Cleanup**: Always store the instance in a React `useRef` and execute `chartInstanceRef.current.destroy()` in the `useEffect` cleanup return:
```typescript
useEffect(() => {
  if (!canvasRef.current) return;
  if (chartInstanceRef.current) {
    chartInstanceRef.current.destroy();
  }
  const ctx = canvasRef.current.getContext('2d');
  if (!ctx) return;

  chartInstanceRef.current = new Chart(ctx, { /* options */ });

  return () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  };
}, [deposits, theme]);
```
2. **Theme Awareness**: Read Telegram Web App CSS variables or listen to theme change events `window.Telegram.WebApp.onEvent('themeChanged', reRenderCharts)` to dynamic update chart colors.

**Warning signs:**
- Red error logs in browser console whenever state changes.
- Chart labels disappear or become unreadable when Telegram client toggles night mode.

**Phase to address:**
Phase 2: Portfolio Analytics (`STAT-02`).

---

### Pitfall 5: Portfolio Analytics Double-Counting Historical `rolled_over` Deposits (`STAT-02`)

**What goes wrong:**
Portfolio breakdown charts (Bank Share, Term Allocation, Interest Comparison) show inflated total assets (e.g., displaying 500M ₫ instead of actual 100M ₫ current savings).

**Why it happens:**
In Google Sheets, when a deposit is rolled over, the old deposit status changes to `rolled_over` and a new `active` deposit is created. If portfolio analytics functions compute sums across the entire `Deposits` array without filtering `d.status === 'active'`, historical principal amounts that have already been reinvested are summed again alongside new active deposits.

**How to avoid:**
Strictly scope portfolio breakdown charts and total net worth calculations to active deposits:
```typescript
// Correct: Only sum active (or matured pending action) deposits for current portfolio breakdown
const activeDeposits = deposits.filter(d => d.status === 'active' || d.status === 'matured');
```
Keep timeseries growth charts (`GrowthChart`) distinct from current portfolio allocation breakdown charts (`BankShareChart`, `TermShareChart`).

**Warning signs:**
- Total asset sum in bank distribution chart does not match the active balance shown on the main list view.

**Phase to address:**
Phase 2: Portfolio Analytics (`STAT-02`).

---

### Pitfall 6: Single-File Bundle Bloat & Mobile Touch Gesture Conflicts on Tree / Chart Canvas (`HIST-01` & `STAT-02`)

**What goes wrong:**
1. Adding heavy graph visualization libraries (e.g., D3.js, React Flow, vis.js) increases the built `index.html` size beyond 2MB, causing slow initial loads inside Telegram Web App on mobile connections.
2. Panning or dragging wide lineage tree canvas horizontally triggers Telegram Web App's native "swipe-down to dismiss" gesture, closing the Mini App unexpectedly.

**Why it happens:**
1. `vite-plugin-singlefile` inlines all JS, CSS, and SVG assets into a single document. Heavy external tree packages bring large bundle dependencies.
2. Telegram Web App intercepts vertical/horizontal drag gestures on canvas elements unless viewport expansion and scroll locks are enabled via Telegram SDK.

**How to avoid:**
1. **Lightweight Custom Tree Component**: Build the lineage tree using plain React components, CSS flexbox/grid, and SVG connector lines instead of pulling in multi-megabyte node-graph packages.
2. **Telegram Viewport & Gesture Configuration**:
```typescript
import { expandViewport } from '@telegram-apps/sdk';

// On app initialization:
try {
  expandViewport(); // Expand to max height
} catch (e) { /* ignore fallback */ }
```
Add CSS `touch-action: pan-x pan-y` on container elements to prevent native pull-to-close behavior during touch navigation.

**Warning signs:**
- `dist/index.html` size exceeds 1.5MB after running `npm run build`.
- Swiping across lineage tree view accidentally exits Telegram Mini App.

**Phase to address:**
Phase 3: Lineage Tree & Mobile UX.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Client-side HMAC Validation** | Avoids writing GAS HMAC script logic. | Zero security — tokens can be spoofed or bypassed in browser DevTools. | **Never.** Backend MUST validate `initData`. |
| **Omitting Cycle Detection in Tree Traversal** | Cleaner, shorter recursive function. | Infinite loops freeze app if Sheet data contains circular `parent_id` links. | **Never.** Always use a `visited` Set. |
| **Hardcoding Chart Colors in Hex** | Faster styling during setup. | Invisible chart text when user switches Telegram Light/Dark themes. | **Only in initial prototype.** Use CSS variables or dynamic theme helper. |
| **Rendering Entire Lineage History in Single Un-paginated Tree** | Simple implementation. | DOM lag on deposits with 10+ consecutive rollovers on low-end mobile devices. | **Acceptable for <20 nodes.** |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Telegram `initData` Verification** | Parsing parameters via `e.parameter` in GAS `doPost`. GAS decodes values automatically, corrupting raw string signature check. | Send raw `initData` string inside JSON body `{ initData: "..." }`. Decode parameters manually once in `AuthService.js`. |
| **Chart.js React 19 Binding** | Re-creating `new Chart()` on state update without calling `.destroy()` on unmount/re-render. | Store instance in `useRef<Chart | null>(null)` and call `chartInstanceRef.current?.destroy()` in `useEffect` cleanup. |
| **GAS `LockService` & Auth Guard** | Acquiring `ScriptLock` BEFORE verifying HMAC authentication. | Validate HMAC `initData` signature **BEFORE** acquiring script lock to prevent unauthenticated requests from locking the DB. |
| **Telegram Web App Theme Sync** | Reading `window.Telegram.WebApp.colorScheme` once on load without event listener. | Listen to `themeChanged` event to update active Chart.js instance color settings dynamically. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Un-indexed Lineage Tree Lookups** | `Array.find()` called repeatedly inside recursive tree traversal (O(N^2) complexity). | Pre-build `Map<id, Deposit>` and `Map<parent_id, Deposit[]>` lookup tables before rendering tree. | **> 50 deposit records.** |
| **Chart.js Re-animation on Every Render** | Smooth animation lag & battery drain when switching tabs or filtering lists. | Disable Chart.js animation (`animation: false`) or limit to initial mount. | Low-end mobile devices. |
| **Server-side Tree Building in GAS** | Processing tree JSON on GAS server adds latency to `doPost` execution. | Send flat array of deposits from GAS; build tree structure in client-side React SPA. | When deposit history expands. |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Accepting Unsigned Backend Requests** | Malicious users can hit public GAS `/exec` URL and tamper with deposit records. | Enforce strict HMAC-SHA256 `initData` verification on every state-modifying POST route in GAS. |
| **Exposing Bot Token in Client Code** | Full compromise of Telegram Bot and Webhook control. | Keep Telegram Bot Token strictly inside GAS `PropertiesService.getScriptProperties().getProperty('BOT_TOKEN')`. |
| **Ignoring `auth_date` Timestamp Expiry** | Stale stolen `initData` query strings remain valid indefinitely. | Check `currentTime - authDate <= 86400` (24 hours) in backend verification. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Unresponsive Lineage Tree Layout** | Tree node labels overlap or overflow offscreen on small mobile screens. | Use a vertical card-based tree list with collapsible child nodes and clear vertical connector lines. |
| **Chart Legend Overcrowding** | Bank allocation doughnut chart legend takes up 70% of mobile screen height. | Display compact legend list with top 5 banks and group remaining into "Khác". |
| **Silent Auth Failure** | User sees endless spinner without feedback when HMAC validation fails. | Show clear error card: *"Xác thực Telegram không hợp lệ. Vui lòng mở lại ứng dụng từ Telegram Bot."* |

---

## "Looks Done But Isn't" Checklist

- [ ] **HMAC Verification:** Tested and verified with raw Telegram `initData` on both iOS and Android Telegram clients.
- [ ] **Local Dev Mode:** `npm run dev` in local desktop browser works seamlessly without being blocked by HMAC auth guard.
- [ ] **Multi-generation Lineage:** Tested lineage tree with 3+ consecutive rollovers (A → B → C → D) and verified no recursion stack overflow occurs.
- [ ] **Orphan Link Fallback:** Tested lineage display when a parent deposit ID is missing from database; app renders node gracefully without crashing.
- [ ] **Asset Sum Consistency:** Total assets in Bank Allocation chart exactly match the sum of active deposits in list view.
- [ ] **Chart Memory Leak Audit:** Switching tabs 20 times does not cause canvas memory leaks or Chart.js ID errors in console.
- [ ] **Dark / Light Mode Switching:** Toggling Telegram night mode dynamically updates Chart.js text colors without requiring app reload.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **HMAC Validation Lockout** | LOW | Check `BOT_TOKEN` in GAS Script Properties; verify `Utilities.computeHmacSha256Signature` argument order `(dataCheckString, secretKeyBytes)`; re-deploy via `clasp push`. |
| **Corrupted Lineage References** | MEDIUM | Run a backend repair function in GAS to audit `parent_id`/`child_id` integrity in `Deposits` sheet and clean up broken reference strings. |
| **Bundle Size Build Failure** | LOW | Replace heavy external tree/chart packages with native React SVG/CSS components; verify bundle size with `vite-plugin-singlefile`. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **HMAC Binary Key & Arg Order** | Phase 1: Authentication (`AUTH-02`) | Run GAS test function in `Tests.js` against official Telegram HMAC test payload; confirm signature matches. |
| **Local Dev Lockout & Expiry** | Phase 1: Authentication (`AUTH-02`) | Test both local browser `npm run dev` and Telegram Web App client; confirm both function cleanly. |
| **Chart Canvas Reuse & Leaking** | Phase 2: Portfolio Analytics (`STAT-02`) | Repeatedly toggle Analytics charts on/off in SPA; verify zero console errors or canvas ID warnings. |
| **Asset Double-Counting** | Phase 2: Portfolio Analytics (`STAT-02`) | Execute a deposit rollover; verify total bank allocation pie chart sum remains constant and matches active deposit sum. |
| **Lineage Infinite Loops** | Phase 3: Lineage Tree (`HIST-01`) | Add a test row with circular `parent_id` in Sheet; verify app renders fallback without freezing browser tab. |
| **Single-File Bundle Bloat** | Phase 3: Lineage Tree & UX Polish | Run `npm run build` and confirm `dist/index.html` size is under 1.5MB. |

---

## Sources

- [Telegram Web Apps SDK & Authentication Documentation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app)
- [Google Apps Script Utilities Reference (`computeHmacSha256Signature`)](https://developers.google.com/apps-script/reference/utilities/utilities#computehmacsha256signaturevalue,-key)
- [Chart.js Integration & Lifecycle Management in React](https://www.chartjs.org/docs/latest/getting-started/integration.html)
- [Vite Single-File Plugin GitHub Repository](https://github.com/richardtallent/vite-plugin-singlefile)

---
*Pitfalls research updated for: Save Manager v2.0 (Google Apps Script + Google Sheet + React Telegram Web App)*
*Researched: 2026-08-11*
