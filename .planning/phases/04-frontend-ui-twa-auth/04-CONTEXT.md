# Phase 4: Frontend UI (TWA) & Auth - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Xây dựng SPA frontend bằng Vite + TypeScript + Tailwind CSS, deploy lên GitHub Pages. Tích hợp `@telegram-apps/sdk` để tối ưu hiển thị trong Telegram Mini App. Giao diện bao gồm dropdown chọn `username_bankcode`, danh sách các khoản gửi cần xử lý (sắp đáo hạn ≤ 3 ngày + quá hạn), và form thêm khoản gửi mới.

</domain>

<decisions>
## Implementation Decisions

### Hosting & Deployment
- **D-01 (Hosting):** Frontend SPA deploy lên GitHub Pages (miễn phí, CDN). GAS chỉ làm API backend. Frontend gọi API qua `fetch()` tới GAS Web App URL.
- **D-02 (API URL Config):** GAS Web App URL lưu trong biến môi trường Vite (`.env`) — `VITE_API_URL=https://script.google.com/macros/s/.../exec`. Build-time inject.
- **D-03 (CI/CD):** GitHub Actions — Push lên branch `main` tự động build và deploy lên GitHub Pages.
- **D-04 (Code Location):** Mono-repo — Frontend code nằm trong thư mục `frontend/` cùng repo Git với backend.

### Login Flow
- **D-05 (No Login Page):** Ứng dụng cá nhân, admin duy nhất. Không cần trang đăng nhập hay phân quyền. Chỉ cần xác thực request đến từ Telegram Bot.
- **D-06 (User Selection):** Dùng luôn sheet `Users` hiện tại. Frontend gọi API mới `get_users` để lấy danh sách `username_bankcode`, hiển thị dropdown cho user chọn.
- **D-07 (No Session Storage):** Không lưu session. Mỗi lần mở app phải chọn lại `username_bankcode` từ dropdown.
- **D-08 (Request Auth):** Xác thực `initData` từ Telegram Web App bằng HMAC-SHA256 trên backend. Đảm bảo request đến từ Telegram Mini App chính thức.

### Giao diện danh sách khoản gửi
- **D-09 (Layout):** Cards layout — mỗi khoản gửi là 1 card riêng, phù hợp màn hình điện thoại.
- **D-10 (Card Content):** Card compact — chỉ hiển thị: số tiền, lãi suất, ngày đáo hạn, trạng thái. Nhấn vào card mở chi tiết đầy đủ dạng bottom sheet.
- **D-11 (Sort):** Sắp xếp theo ngày đáo hạn gần nhất lên đầu.
- **D-12 (Filter):** Chỉ hiển thị các khoản cần xử lý — sắp đáo hạn trong ≤ 3 ngày + đã quá hạn chưa xử lý (active/matured). Không có tab "Tất cả".
- **D-13 (Detail View):** Bottom sheet / slide-up panel khi nhấn vào card — hiển thị đầy đủ thông tin khoản gửi.

### Form thêm khoản gửi
- **D-14 (Trigger):** FAB (Floating Action Button) — nút "+" nổi góc dưới phải, nhấn vào mở form dạng bottom sheet.
- **D-15 (Date Input):** Nhập text với mask DD/MM/YYYY — nhất quán với format backend. Không dùng datepicker.
- **D-16 (Validation):** Inline realtime validation — lỗi hiện ngay dưới field khi blur (số tiền > 0, lãi suất >= 0, ngày hợp lệ, ngày đáo hạn sau ngày tạo).
- **D-17 (Interest Preview):** Preview lãi dự kiến realtime — khi nhập đủ số tiền + lãi suất + ngày, tự động tính và hiển thị `expected_interest` ngay trên form.
- **D-18 (Post-Submit):** Giữ form mở để thêm tiếp + hiển thị toast thành công + refresh danh sách phía sau.

### Agent's Discretion
- Chi tiết cấu trúc HTML/CSS component, cách tổ chức TypeScript modules.
- Cách implement date mask input (custom logic hay thư viện nhỏ).
- Design hệ thống bottom sheet animation.
- Chi tiết GitHub Actions workflow configuration.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning Docs
- `.planning/PROJECT.md` — Giá trị cốt lõi, constraints, key decisions.
- `.planning/REQUIREMENTS.md` — Yêu cầu chi tiết v1 (UI-01, UI-02, UI-03, DEP-01 thuộc Phase 4).
- `.planning/ROADMAP.md` — Roadmap phase 4: 3 plans dự kiến.

### Prior Phase Context
- `.planning/phases/02-backend-db-operations-calculations/02-CONTEXT.md` — API routing qua `action` field, date format DD/MM/YYYY, LockService patterns.
- `.planning/phases/03-telegram-bot-webhook-integration/03-CONTEXT.md` — MINI_APP_URL config, auto-link chat_id, daily trigger patterns.

### Stack Documentation
- `research/STACK.md` (referenced in GEMINI.md) — Recommended tech stack: Vite, Tailwind CSS v4, @telegram-apps/sdk, Chart.js.

### Telegram Mini Apps
- Telegram Mini Apps official docs (https://core.telegram.org/bots/webapps) — initData validation, HMAC-SHA256, web_app_data flow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js) — Chứa toàn bộ API backend: `doPost`, `executeGetDeposits`, `executeAddDeposit`, `executeRolloverDeposit`, `sendTelegramApi`, `buildJsonResponse`. Frontend sẽ gọi các action này.
- [backend/Tests.js](file:///home/dangnd/code/github/save-manager/backend/Tests.js) — Unit test framework với mock patterns cho `UrlFetchApp`, `PropertiesService`.

### Established Patterns
- API routing qua `action` field trong POST payload JSON.
- Date format DD/MM/YYYY cho tất cả input/output/storage.
- Response format: `{ status: "success", data: ... }` hoặc `{ status: "error", message: "..." }`.
- LockService cho write operations.

### Integration Points
- Frontend → GAS Web App URL qua `fetch()` POST với JSON payload.
- Frontend cần gửi `telegram_chat_id` kèm `get_deposits` để auto-link (D-08 Phase 3).
- Backend cần API mới `get_users` để frontend lấy danh sách dropdown.
- Backend cần logic xác thực `initData` HMAC-SHA256.

</code_context>

<specifics>
## Specific Ideas

- User muốn danh sách chỉ hiện các khoản **cần hành động** (sắp đáo hạn ≤ 3 ngày + quá hạn), không phải toàn bộ khoản active.
- Dashboard/summary bar sẽ là tính năng riêng ở milestone sau (command `/dashboard`).
- Không cần tab "Tất cả" hay "Rolled Over" — chỉ focus khoản cần xử lý.

</specifics>

<deferred>
## Deferred Ideas

- **Dashboard / Summary bar** — Tổng kết tài sản (tổng gốc + tổng lãi dự kiến) sẽ là tính năng riêng, có thể qua command `/dashboard` ở milestone v2.
- **Tab xem toàn bộ khoản gửi** — Xem tất cả khoản active/rolled_over, không chỉ khoản cần xử lý.

</deferred>

---

*Phase: 04-Frontend UI (TWA) & Auth*
*Context gathered: 2026-07-10*
