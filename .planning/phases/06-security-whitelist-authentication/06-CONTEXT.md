# Phase 6: Security & Whitelist Authentication - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Bảo mật REST API bằng xác thực HMAC-SHA256 trên GAS backend, chống replay attack qua auth_date 24h, kiểm tra chat_id thuộc whitelist cấu hình trong GAS Script Properties, và duy trì Mock Auth cho môi trường dev desktop. Sau auth, load toàn bộ deposits không phân quyền theo bankcode.

**Scope chỉ bao gồm:** GAS backend (`AuthService.js`, `Code.js`, `Constants.js`) và frontend (error handling). **KHÔNG** sửa `cloudflare.js` (Worker code).

</domain>

<decisions>
## Implementation Decisions

### Whitelist chat_id
- **D-01:** Lưu whitelist dạng **JSON array** trong GAS Script Properties với key `ALLOWED_CHAT_IDS` (ví dụ: `[123456789, 987654321]`).
- **D-02:** Check whitelist **ngay sau HMAC verify thành công, trước routing action** — 1 gate duy nhất trong `doPost()`. Luồng: HMAC verify → extract chat_id → whitelist check → routing.
- **D-03:** Error message **chung "Unauthorized"** cho mọi auth failure (HMAC fail, whitelist fail, expired) — không tiết lộ lý do cụ thể.
- **D-04:** Tên constant mới: `PROP_ALLOWED_CHAT_IDS = 'ALLOWED_CHAT_IDS'` trong `Constants.js`.

### Mock Auth backend
- **D-05:** Backend **KHÔNG cần dev mode flag** — frontend mock initData là đủ, backend luôn verify nghiêm ngặt.
- **D-06:** **Xóa bypass offline** hiện tại trong `AuthService.verifyWebAppData()` (`if (!initData && !botToken) return ''`). Buộc mọi request phải có initData hợp lệ hoặc Worker secret.
- **D-07:** Unit test dùng **mock initData với HMAC hợp lệ** được tạo từ test bot token — test như thật, không bypass.

### Auth error UX
- **D-08:** Frontend hiển thị **full-page error screen** khi auth fail: icon khóa + "Không có quyền truy cập" + nút đóng TWA.
- **D-09:** Auth check tại **lần gọi API đầu tiên** (`get_deposits` khi App mount) — không cần tạo route `verify_auth` riêng.

### Cloudflare Worker auth flow
- **D-10:** **Giữ dual-auth** như hiện tại: Worker verify HMAC → inject `_serverSecret` → GAS trust (skip HMAC). GAS chỉ verify HMAC khi không có Worker secret (fallback).
- **D-11:** **Worker KHÔNG thêm whitelist check** — whitelist là trách nhiệm duy nhất của GAS (GAS có Script Properties, Worker không có dynamic config).
- **D-12:** **Whitelist check luôn chạy ở GAS** bất kể request đến qua Worker path hay direct path.
- **D-13:** Phase 6 scope **KHÔNG sửa `cloudflare.js`** — chỉ sửa backend GAS và frontend.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Auth
- `backend/AuthService.js` — HMAC-SHA256 verify + extractUserId hiện tại, cần xóa bypass và thêm whitelist check method
- `backend/Code.js` — doPost() entry point, cần thêm whitelist gate sau HMAC verify
- `backend/Constants.js` — Hằng số auth, cần thêm PROP_ALLOWED_CHAT_IDS

### Frontend Auth
- `frontend/src/api.ts` — callBackendApi() gửi initData, cần handle auth error response
- `frontend/src/utils/telegram.ts` — Mock dev mode, trả isMock + fake initData

### Cloudflare Worker (READ ONLY — không sửa)
- `cloudflare.js` — Worker proxy verify HMAC + inject _serverSecret. Hiểu flow để không phá vỡ dual-auth.

### Unit Test
- `backend/Tests.js` — Test suite hiện tại, cần update mock initData với HMAC hợp lệ

### Telegram Auth Spec
- [Telegram Web App Data Validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) — Spec chính thức cho HMAC-SHA256 verify flow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AuthService.verifyWebAppData()` — Đã implement đúng HMAC-SHA256 + auth_date 24h check. Chỉ cần xóa bypass và thêm whitelist method.
- `AuthService.extractUserId()` — Parse user.id từ initData query string. Dùng cho whitelist check.
- `ResponseHelper.json()` — Helper trả JSON response. Dùng cho whitelist reject response.
- `CORS_HEADERS` trong Worker — Đã cấu hình đúng, frontend gọi qua fetch.

### Established Patterns
- **Dual-auth pattern** trong `Code.js`: Worker secret path HOẶC fallback HMAC verify. Whitelist check cần chạy SAU cả 2 path (vì cả 2 đều extract `authenticatedChatId`).
- **Script Properties** cho config: `PROP_TELEGRAM_BOT_TOKEN`, `PROP_WEBHOOK_TOKEN`, `PROP_WORKER_SECRET`. Thêm `PROP_ALLOWED_CHAT_IDS` theo cùng pattern.
- **AUTH_EXPIRY_SECONDS = 86400** (24h) đã define trong Constants.js.
- **Frontend mock pattern**: `initializeTelegramSDK()` catch error → return mock data với `isMock: true`.

### Integration Points
- `doPost()` line 64-73: Sau block dual-auth, trước `var authenticatedChatId = AuthService.extractUserId(initData)` → thêm whitelist check ngay sau dòng extract.
- `frontend/src/api.ts` line 42-44: `if (result.status === 'error')` → cần phân biệt auth error để hiển thị full-page error thay vì toast/snackbar.

</code_context>

<specifics>
## Specific Ideas

Không có yêu cầu đặc biệt — triển khai theo standard patterns đã mô tả.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-Security & Whitelist Authentication*
*Context gathered: 2026-08-11*
