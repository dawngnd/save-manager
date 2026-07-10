# Project Research Summary

**Project:** Save Manager
**Domain:** Google Apps Script + Google Sheet + Telegram Web App (Personal Finance)
**Researched:** 2026-07-10
**Confidence:** HIGH

## Executive Summary

Save Manager is a personal finance tool built on a serverless, low-cost stack: Google Apps Script (GAS) serves as the backend application environment, Google Sheets acts as the lightweight relational database, and a Telegram Web App (TWA) serves as the responsive client interface. Experts build such tools to bypass complex hosting setups, utilizing native Google spreadsheet tools for transparent, easy data manipulation and manual verification, combined with the rich interactive capabilities of Telegram's Mini Apps SDK.

The recommended approach utilizes local development with `@google/clasp` and Vite to bundle the frontend code into a single, high-performance HTML asset, mitigating the file loading limitations of Google's `HtmlService`. We will leverage standard database locking via `LockService` to prevent write collisions and implement the Telegram Web App's native user verification context to secure communications between the client and the Google host.

The primary technical risks involve aggressive GAS caching, potential authentication bypasses due to public script endpoints, and date mismatch issues caused by mismatched server and client timezones. We mitigate these by establishing a version-incremented clasp deployment pipeline, enforcing cryptographic validation of `initData` signatures on the server, and synchronizing script and spreadsheet timezones to `Asia/Ho_Chi_Minh`.

## Key Findings

### Recommended Stack

The stack relies on a local TypeScript toolchain compiling to a unified client-server deployment on Google Apps Script, with Google Sheets serving as the data store and Telegram providing the application frame.

**Core technologies:**
- **TypeScript (7.0.2)**: Application language — provides type safety and autocompletion for GAS APIs to catch bugs during development.
- **@google/clasp (3.3.0)**: Local development & deployment CLI — permits version control and automated script upload.
- **Vite (8.1.4) & vite-plugin-singlefile (2.3.3)**: Bundler & compiler — bundles and inlines JS, CSS, and HTML assets into a single index.html file to meet GAS single-file hosting constraints.
- **Tailwind CSS (4.3.2)**: CSS Framework — utility-first styling for fast layout generation and responsive design.
- **@telegram-apps/sdk (3.11.8)**: Telegram SDK — interfaces with the native Telegram client theme, viewport, and buttons.
- **Google Sheets (Native)**: Database — free, direct-access tabular storage for easy user manual editing.
- **Chart.js (4.5.1)**: Canvas Charting — displays responsive asset growth timeseries projections.

For more details, see [STACK.md](file:///home/dangnd/code/github/save-manager/.planning/research/STACK.md).

### Expected Features

The feature set is prioritized to deliver a secure, functional savings rollover management tool inside Telegram with a clean growth projection dashboard.

**Must have (table stakes):**
- **Google Sheet DB Setup (DB-01)**: Relational table structures inside spreadsheet tabs.
- **Manual Credentials Login (AUTH-01)**: Verification of user `username_bankcode` to retrieve personal assets.
- **New Deposit Creation (DEP-01)**: Interactive form to input active savings with auto-calculated interest.
- **Rollover Action (DEP-02)**: Resolves matured deposits, arches old ones, and creates new ones with concurrency locks.
- **Telegram Web App UI (UI-01)**: Responsive, theme-aware client view.
- **Wealth Growth Projection Chart (STAT-01)**: Visual timeseries chart showing projected net worth growth.

**Should have (competitive):**
- **Proactive Maturity Push Alerts**: Daily script scan and Telegram Bot webhook pushes to remind users of nearing maturities.
- **Direct Sheet Sync Validation**: Automated sanitization of manual Sheet updates.
- **Multi-account Switcher**: Allow quick switching between different credential identifiers in the UI.

**Defer (v2+):**
- **Partial Withdrawal Calculator**: Deferred due to high complexity in compound interest adjustment.
- **OCR/Bank Statement Parser**: Scanning bank screenshots for automatic entry.
- **Multi-currency Support**: Tracking foreign deposits with live exchange rates.

For more details, see [FEATURES.md](file:///home/dangnd/code/github/save-manager/.planning/research/FEATURES.md).

### Architecture Approach

The system follows a classic decoupled client-server pattern. The client SPA runs inside a Telegram Web App viewport, executing asynchronous RPC calls to the Google Apps Script backend controller. The backend handles database transactions on Google Sheets using transaction locks and interacts with the Telegram Bot API using incoming webhooks.

**Major components:**
1. **Telegram Webview (Client)**: Hosts the SPA, collects user input, draws growth charts, and manages UI states.
2. **Google Apps Script Server (Backend)**: Implements doGet/doPost routing, parses bot callbacks, executes business calculations, and validates Web App signatures.
3. **Google Sheets (Database)**: Tab-based tables storing Users, Deposits, and transaction histories.

For more details, see [ARCHITECTURE.md](file:///home/dangnd/code/github/save-manager/.planning/research/ARCHITECTURE.md).

### Critical Pitfalls

1. **Aggressive GAS Caching**: Web App deployment URLs cache output HTML files statically. Avoided by using `/dev` URL during dev and enforcing incremental version deploys for production.
2. **Authentication Bypass**: Threat of direct endpoints manipulation. Avoided by cryptographically validating the `Telegram.WebApp.initData` HMAC-SHA256 signature on the server.
3. **Concurrency Row Overwrites**: Sheets are not ACID-compliant; simultaneous writes cause overlaps. Avoided by enclosing database write steps inside `LockService.getScriptLock()`.
4. **Date Timezone Shift Offset**: Discrepancies between browser, server, and sheet timezones shift dates. Avoided by setting timezones explicitly to `Asia/Ho_Chi_Minh` in both the script and spreadsheet settings.
5. **Wrong Execution Context**: Google login prompts inside Telegram. Avoided by deploying Web App as "Execute as: Me" and "Access: Anyone".

For more details, see [PITFALLS.md](file:///home/dangnd/code/github/save-manager/.planning/research/PITFALLS.md).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: DB & clasp Project Setup
- **Rationale**: Establishes local-to-cloud sync pipeline (clasp) and database spreadsheets early so backend developers can begin operations.
- **Delivers**: Spreadsheet tables for Users, Deposits, and history logs, plus local development environment.
- **Addresses**: DB-01
- **Avoids**: Aggressive GAS Caching & Versioning (establishes Developer Mode `/dev` URL pipeline early).

### Phase 2: Backend DB Operations & Calculations
- **Rationale**: Creates the backend CRUD functions and calculations before frontend integration, serving as the interface contract.
- **Delivers**: Server-side code for user retrieval, deposit creation, and expected interest calculations with LockService concurrency guards.
- **Addresses**: DEP-01, part of DB-01
- **Uses**: Google Sheets (SpreadsheetApp), LockService, TypeScript
- **Implements**: GAS DB Service
- **Avoids**: Date Timezone Shift, Concurrent Writes

### Phase 3: Telegram Bot Webhook Integration
- **Rationale**: Connects the Telegram API to the GAS server to handle webhooks and launch the Web App via buttons.
- **Delivers**: doPost route, webhook linkage with Telegram, properties configurations (secure tokens storage).
- **Addresses**: UI-01 (Partially - Bot backend)
- **Uses**: Telegram Bot API, PropertiesService
- **Implements**: GAS Controller (POST), Telegram Bot API
- **Avoids**: Authentication Bypass (sets up webhook environment to validate initData).

### Phase 4: Frontend UI (TWA) & Auth
- **Rationale**: Sets up the client SPA inside the Telegram container, including responsive layout, login form, and user validation.
- **Delivers**: Index.html, Stylesheet.html, JavaScript.html, and authentication flow using initData.
- **Addresses**: AUTH-01, UI-01
- **Uses**: @telegram-apps/sdk, Tailwind CSS, Vite Single-File Bundle
- **Implements**: Telegram Webview, Asynchronous Client-Server Bridge (google.script.run)
- **Avoids**: Viewport/Keyboard Adaptation issues, Authentication Bypass.

### Phase 5: Charts & Rollover Mechanics
- **Rationale**: Combines all layers to build the complex business logic (rollovers) and data visualization components.
- **Delivers**: Chart.js timeseries visualization and rollover execution with history logging.
- **Addresses**: DEP-02, STAT-01
- **Uses**: Chart.js
- **Implements**: Chart.js (Asset Growth) component, Rollover operations
- **Avoids**: Incorrect rollover execution (missing history logs), performance/caching issues with large datasets.

### Phase Ordering Rationale

- **Dependency Ordering**: Database schema and backend functions must exist before connecting the Telegram webhooks and compiling frontends.
- **Logical Boundaries**: Segregating backend development (Phases 2-3) from frontend compilation (Phases 4-5) ensures early API contracts remain stable.
- **Pitfall Mitigation**: Incorporating security signature verification during frontend setup (Phase 4) and timezone alignments in backend setup (Phase 2) prevents regression debugging later.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Telegram Bot Webhook Integration)**: Needs verification of `initData` signature algorithm implementation in Google Apps Script (lack of crypto library in standard GAS, must construct HMAC-SHA256 manually using `Utilities.computeHmacSignature`).
- **Phase 5 (Charts & Rollover Mechanics)**: Needs API research on how to transform active deposits into projection timeseries (Chart.js input structure) efficiently in Apps Script.

Phases with standard patterns (skip research-phase):
- **Phase 1 (DB & clasp Project Setup)**: Standard clasp configuration and spreadsheet creation.
- **Phase 2 (Backend DB Operations)**: Standard SpreadsheetApp reading and writing operations.
- **Phase 4 (Frontend UI & Auth)**: Well-documented Telegram Web App client SDK integration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vite bundling to single-file is standard; clasp facilitates Git-sync; SpreadsheetApp and Telegram Bot integration are extremely well-documented. |
| Features | HIGH | Table stakes features map directly to client requirements; anti-features are eliminated to respect GAS limitations. |
| Architecture | HIGH | Single endpoint route pattern and ScriptLock concurrency guards fully address typical serverless/multi-user sheet limitations. |
| Pitfalls | HIGH | Identified top risks (GAS caching, HMAC validation, timezone offsets, write collisions) and specified mitigation strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **GAS HMAC Validation**: Need to write custom JS HMAC calculation for Telegram initData using `Utilities.computeHmacSha256Signature`.
- **Timezone consistency**: We must explicitly force timezones in script settings and spreadsheet settings to avoid date shifts.

## Sources

### Primary (HIGH confidence)
- [Google Apps Script Web Apps Documentation](https://developers.google.com/apps-script/guides/web) — doGet/doPost structure and execution permissions details.
- [Telegram Web Apps Documentation](https://core.telegram.org/bots/webapps) — initData validation algorithms and theme parameters.
- [Google clasp GitHub repo](https://github.com/google/clasp) — clasp 3.3.0 latest status, drop of TS compiler.

### Secondary (MEDIUM confidence)
- [funfinance/fin-bot-miniapp](https://github.com/funfinance/fin-bot-miniapp) — Database structure and Telegram Web App UI reference implementation.
- [izlabs/MoneyNeBot](https://github.com/izlabs/MoneyNeBot) — Integration of GAS and Telegram bot webhook.

---
*Research completed: 2026-07-10*
*Ready for roadmap: yes*
