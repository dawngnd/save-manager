<!-- GSD:project-start source:PROJECT.md -->

## Project

**Save Manager**

Ứng dụng quản lý các khoản tiết kiệm cá nhân chạy trên Google Apps Script (GAS) và Google Sheets làm cơ sở dữ liệu. Người dùng tương tác với hệ thống thông qua giao diện Web App tích hợp trong Telegram Bot để cập nhật và theo dõi các khoản gửi tiền của mình.

**Core Value:** Quản lý chính xác trạng thái các khoản tiết kiệm, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ trực quan ước tính tăng trưởng tổng tài sản theo thời gian.

### Constraints

- **Tech Stack**: Google Apps Script, Google Sheets, HTML/CSS/Vanilla Javascript, Telegram Bot API.
- **Database**: Google Sheets (mỗi sheet đóng vai trò là một table).
- **Hosting**: Google Apps Script Web App URL (doGet/doPost).

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **TypeScript** | `7.0.2` | Application language for safety | Type safety and autocompletion for GAS API prevents runtime errors before pushing code. |
| **@google/clasp** | `3.3.0` | Local development and deployment CLI | Official Google CLI. Allows local Git version control and script deployment. (Note: clasp 3+ drops native TS transpilation, requiring external bundler). |
| **Vite** | `8.1.4` | Build tool and bundler | Fast bundling, HMR, and official plugins for compiling client assets. |
| **vite-plugin-singlefile** | `2.3.3` | Bundles CSS/JS into single index.html | Google Apps Script serves Web Apps from a single HTML file. This plugin inlines all assets (JS, CSS, SVGs) into `index.html` automatically. |
| **Tailwind CSS** | `4.3.2` | CSS Framework | Modern, utility-first styling. Tailwind v4 offers native Vite integration and is highly optimized. |
| **@telegram-apps/sdk** | `3.11.8` | Telegram Web App frontend SDK | Official, modular TypeScript SDK to interface with Telegram theme, viewport, main/back buttons. |
| **Google Sheets (Native SpreadsheetApp)** | Native | Database storage and direct editor access | Free, low-latency native API, easy manual entry and check-cross by user. |
| **Chart.js** | `4.5.1` | Analytics timeseries charts | Lightweight, fully responsive canvas charting for displaying wealth growth projection. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@types/google-apps-script** | `2.0.11` | TypeScript typings for GAS APIs | Dev dependency for IDE autocompletion of Google script methods (`SpreadsheetApp`, `CacheService`, etc.). |
| **LockService** | Native | Concurrency lock control | Essential when writing to Google Sheets to prevent race conditions during concurrent user submissions. |
| **CacheService** | Native | Data caching | Optional: cache user settings or sheet values to reduce calls to Sheet API (limit spreadsheet read overhead). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **VS Code** | Local IDE | Configure with ESLint and Prettier for clean code format. |
| **Telegram Bot API (Webhooks)** | Direct communication | Set up webhook URL pointing to deployed Google Apps Script Web App url. |
| **Local Mock Dev Server** | Sandbox emulation | Mock `google.script.run` and Telegram `window.Telegram` objects to test Web App interface in local browser without pushing. |

## Installation

# Initialize npm project

# Dev dependencies (Core toolchain)

# Production / Client dependencies (Bundled by Vite)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vite Single-File Bundle** | Separate CDN hosting (GitHub Pages/Vercel) | When frontend application is large (assets > 5MB quota limits of GAS output size). However, this introduces CORS and API validation overhead. |
| **@telegram-apps/sdk** | Telegram Web App CDN script | When using quick, pure Vanilla JS without any npm or local bundler step. |
| **Google Sheets DB** | Cloud SQL or Firebase | If dataset size exceeds ~20,000 rows or high concurrent transactions require relational database features. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **GAS Script ID Libraries** | Remote script libraries dynamically loaded in GAS add high compilation/network latency, slowing down doGet/doPost calls. | Local typescript compilation and bundling into output JS using Vite. |
| **Volatile Spreadsheet Formulas** | Formulas like `NOW()` or `TODAY()` trigger full recalculation on every sheet write, causing script runtime timeouts. | In-memory timestamp calculation using JavaScript `new Date()`. |
| **Multi-file build assets** | GAS does not support loading relative local scripts or stylesheets inside iframes. | Inlining all CSS/JS into a single index.html using `vite-plugin-singlefile`. |

## Stack Patterns by Variant

- Use Telegram CDN script `https://telegram.org/js/telegram-web-app.js` and load CSS via Tailwind CDN.
- Because it avoids local setup complexity (no node/npm/clasp config needed, can edit directly in Apps Script UI).
- Use `@google/clasp` + `vite` + `vite-plugin-singlefile` + `@telegram-apps/sdk`.
- Because it enables git version control, type safety, autocomplete, fast Tailwind v4 compilation, and modern UI library capabilities.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@google/clasp@3.3.0` | Node.js `>=20.0.0` | Clasp 3+ requires modern Node environments and drops internal TS transpilation. |
| `@types/google-apps-script@2.0.11` | TypeScript `>=5.0` | Compatible with latest TS v7.x features. |
| `@tailwindcss/vite@4.3.2` | Vite `8.1.4` | Native Tailwind v4 compiler plugin for Vite. |

## Sources

- [Google clasp GitHub repo](https://github.com/google/clasp) — Verified clasp 3.3.0 latest status, drop of TS compiler.
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps) — Web App initData validation flow and HMAC security requirements.
- [npm registry database] — Verified latest stable versions for 2026.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

- **Ngôn ngữ**: Trao đổi và giải thích bằng tiếng Việt.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
