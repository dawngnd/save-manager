# Stack Research

**Domain:** Google Apps Script + Google Sheets + Vite/React SPA (Telegram Web App)
**Researched:** 2026-08-11
**Confidence:** HIGH

## Recommended Stack

This document focuses **exclusively on stack additions and changes required for v2.0 milestone features**:
1. **AUTH-02**: HMAC-SHA256 Telegram `initData` validation
2. **HIST-01**: Deposit lineage tree visualization (`rolled_over` history chain)
3. **STAT-02**: Portfolio analytics (bank & term breakdown pie/donut charts)

### Core Technologies (New Additions)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **lucide-react** | `^1.31.0` | UI Icon set for lineage tree nodes & analytics | Lightweight SVG icon library; provides tree-shakeable icons (`GitCommit`, `RotateCw`, `ChevronRight`, `Building2`, `PieChart`, `Layers`) without inflating single-file bundle size. |

### Validated Existing Stack (Retained — DO NOT Replace)

| Technology | Version | Purpose | Integration Status |
|------------|---------|---------|--------------------|
| **Google Apps Script (`Utilities`)** | Native | Server-side HMAC-SHA256 initData validation & REST API | Uses `Utilities.computeHmacSha256Signature()` in `AuthService.js`. Zero external server dependencies required. |
| **Chart.js** | `^4.5.1` | Portfolio analytics pie & doughnut visualization | Native `DoughnutController` & `PieController` included. Managed via canvas `useRef` + `useEffect` in React. |
| **@telegram-apps/sdk** | `^3.11.8` | Telegram Mini App SDK & initData extraction | Supplies `initData` query string from Telegram webview to backend REST payload. |
| **Vite + vite-plugin-singlefile** | `^6.1.0` / `^2.3.3` | Bundles CSS/JS into single index.html | Enforces single HTML output for GAS Web App deployment with zero external network script loads. |
| **Tailwind CSS** | `^4.0.0` | Styling and tree layout alignment | Utility classes for flex, grid, borders, and tree branch connector positioning. |

### Supporting Libraries (Optional Additions)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **d3-hierarchy** | `^3.1.2` | Tree coordinate layout calculation engine | Use ONLY if deposit lineage tree evolves into multi-branching tree structures requiring layout coordinate calculation (`stratify`, `tree`). For linear rollover chains (`parent_id` -> `child_id`), custom React + SVG is cleaner and 0KB. |
| **@types/d3-hierarchy** | `^3.1.7` | TypeScript definitions for d3-hierarchy | Dev dependency required if `d3-hierarchy` is installed. |
| **chartjs-plugin-datalabels** | `^2.2.0` | Pie/donut slice data value renderer | Use if percentage numbers or amount labels must be rendered directly inside chart arcs rather than custom DOM legend. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Google Apps Script V8 Engine** | Server-side HMAC execution | Native `Utilities.computeHmacSha256Signature(value, key)` handles secret key generation (`"WebAppData"`, `BOT_TOKEN`) and signature comparison. |
| **Local Mock Dev Server / Sandbox** | Offline Mini App simulation | Mock `window.Telegram.WebApp.initData` and `google.script.run` locally without deploying to Telegram during UI development. |

## Installation

```bash
# In frontend directory:
cd frontend

# Core UI additions (Icons)
npm install lucide-react@^1.31.0

# Optional supporting additions (if explicit tree math or slice labels needed)
# npm install d3-hierarchy@^3.1.2 chartjs-plugin-datalabels@^2.2.0
# npm install -D @types/d3-hierarchy@^3.1.7
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Custom SVG + Tailwind Tree Component** | `@xyflow/react` (`react-flow`) or `react-d3-tree` | Avoid for single-file bundle! Heavy graph libraries add 250KB–500KB JS overhead. Only use if user needs drag-and-drop interactive canvas with pan-zoom. |
| **Native Chart.js (`useEffect` canvas ref)** | `react-chartjs-2` (`^5.3.0`) | Use `react-chartjs-2` only if declarative JSX chart elements are strictly required. Direct `Chart.js` instance management avoids React 19 peer-dependency warnings. |
| **GAS Native `Utilities.computeHmacSha256Signature`** | `crypto-js` or Node `crypto` polyfill | Use npm crypto libraries only if running on standalone Node.js server. On Google Apps Script, native `Utilities` API is faster and requires 0 dependencies. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`@xyflow/react` (react-flow) / `react-d3-tree`** | Adds 250KB–500KB to `index.html` single-file bundle, causing slow Telegram Web App startup on mobile devices. | Custom Tailwind CSS v4 vertical timeline/tree component with SVG connector paths. |
| **`crypto-js` in GAS backend** | Unnecessary 100KB+ bundle bloat; GAS V8 engine provides native high-performance `Utilities.computeHmacSha256Signature()`. | Native `Utilities.computeHmacSha256Signature(msg, key)`. |
| **`Recharts` / `ApexCharts` / `Nivo`** | Duplicates charting framework; `chart.js` is already installed and validated in `package.json`. | Native `chart.js` `doughnut` and `pie` chart controllers. |
| **Remote Script Tag / CDN imports in HTML** | Telegram Web App sandbox and GAS iframe security policies can block or delay third-party CDN script loading. | Single-file bundle compilation via `vite-plugin-singlefile`. |

## Stack Patterns by Feature

### 1. Telegram initData HMAC-SHA256 Validation (AUTH-02)
- **Backend (GAS)**: `AuthService.js` receives `initData` string.
- **Crypto Flow**:
  1. Parse query params from `initData`.
  2. Extract `hash` and sort remaining keys alphabetically.
  3. Format `data_check_string` (`key=value\n`).
  4. Compute `secret_key` = HMAC-SHA256(`key="WebAppData"`, `msg=BOT_TOKEN`).
  5. Convert `secret_key` bytes to byte array string.
  6. Compute `calculated_hash` = HMAC-SHA256(`key=secret_key`, `msg=data_check_string`).
  7. Hex format and compare with `hash` parameter.
- **Dependency**: 0 additional npm/GAS packages needed.

### 2. Rollover Deposit Lineage Tree (HIST-01)
- **Data Model**: `Deposit` objects linked via `parent_id` (root deposit) and `child_id` (rolled-over deposit).
- **Frontend Component**: `DepositLineageTree.tsx`
- **UI Pattern**: Vertical cascading tree view.
  - Parent node (original deposit, `status: 'rolled_over'`)
  - Vertical SVG branch curve (`<path d="..." />` or Tailwind border-l / flex connector)
  - Child node (current deposit, `status: 'active'`)
- **Icons**: `lucide-react` (`GitCommit`, `RotateCw`, `Building2`, `Calendar`, `ChevronRight`).
- **Dependency**: `lucide-react@^1.31.0`.

### 3. Portfolio Analytics (STAT-02)
- **Data Breakdown**:
  - Bank/Institution proportion (`user_bankcode` aggregation)
  - Maturity term distribution (1M, 3M, 6M, 12M+ duration buckets)
- **Frontend Component**: `PortfolioAnalytics.tsx` / extension of `BankShareChart.tsx`
- **UI Pattern**: Doughnut chart with center text summary (total principal + estimated interest) + custom DOM legend table.
- **Dependency**: Existing `chart.js@^4.5.1`.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `lucide-react@^1.31.0` | `react@^19.0.0`, `vite@^6.1.0` | Fully compatible with React 19 and Tailwind CSS v4. |
| `chart.js@^4.5.1` | `react@^19.0.0` | Native canvas ref integration works with React 19 without peer dependency warnings. |
| `Utilities.computeHmacSha256Signature` | GAS V8 Runtime | Native Google Apps Script API. Returns `Byte[]` requiring signed-to-hex string conversion `(b < 0 ? b + 256 : b).toString(16)`. |

## Sources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) — HMAC-SHA256 initData validation specification.
- [Google Apps Script Utilities Reference](https://developers.google.com/apps-script/reference/utilities/utilities#computehmacsha256signaturevalue,-key) — `computeHmacSha256Signature` method docs.
- [npm registry database] — Verified latest package versions for `lucide-react` (`1.31.0`), `d3-hierarchy` (`3.1.2`), `chart.js` (`4.5.1`).

---
*Stack research for: Save Manager v2.0 Polish & Analytics*
*Researched: 2026-08-11*
