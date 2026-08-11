---
phase: "06"
plan: "security-whitelist-authentication"
type: "feature"
wave: 1
depends_on: []
files_modified:
  - "backend/Constants.js"
  - "backend/AuthService.js"
  - "backend/Code.js"
  - "backend/Tests.js"
  - "frontend/src/api.ts"
  - "frontend/src/components/App.tsx"
  - "frontend/src/utils/telegram.ts"
autonomous: true
requirements: ["AUTH-02", "AUTH-03", "AUTH-04", "AUTH-05"]
---

# Phase 06: Security & Whitelist Authentication

## Kế hoạch thực hiện

### Wave 1: Cập nhật Backend Auth & Whitelist Logic
<task>
<read_first>
- backend/Constants.js
- backend/AuthService.js
- backend/Code.js
</read_first>
<action>
1. Trong `backend/Constants.js`, thêm hằng số `PROP_ALLOWED_CHAT_IDS = 'ALLOWED_CHAT_IDS';`.
2. Trong `backend/AuthService.js`:
   - Xóa bỏ dòng code bypass ở đầu hàm `verifyWebAppData` (cụ thể: `if (!botToken) return ''; // Bypass test offline`).
   - Cập nhật tất cả các thông báo lỗi trả về trong `verifyWebAppData` (như lỗi thiếu initData, HMAC mismatch, auth_date hết hạn) thành một thông báo chung nhất: `'Unauthorized'`.
   - Thêm một hàm tĩnh mới `isUserWhitelisted(chatId, properties)`: Hàm này đọc giá trị từ `properties.getProperty(PROP_ALLOWED_CHAT_IDS)`, parse JSON chuỗi này ra một mảng (nếu không tồn tại hoặc parse lỗi thì trả về mảng rỗng). Sau đó kiểm tra xem `String(chatId)` có nằm trong mảng hay không. Trả về `true` hoặc `false`.
3. Trong `backend/Code.js`, tại hàm `doPost`, trong khối logic xác thực fallback (khi không có Worker secret `_serverSecret`):
   - Nếu `AuthService.verifyWebAppData` trả về chuỗi khác rỗng thì lập tức ngắt và gọi `return ResponseHelper.json('error', 'Unauthorized');`.
   - Ngay bên dưới dòng trích xuất `var authenticatedChatId = AuthService.extractUserId(initData);`, thêm lệnh kiểm tra quyền Whitelist: gọi `AuthService.isUserWhitelisted(authenticatedChatId, properties)`.
   - Nếu không có quyền (trả về false) hoặc `authenticatedChatId` bị rỗng/null, từ chối request bằng cách gọi `return ResponseHelper.json('error', 'Unauthorized');`.
</action>
<acceptance_criteria>
- File `backend/Constants.js` có chứa hằng số `PROP_ALLOWED_CHAT_IDS = 'ALLOWED_CHAT_IDS'`.
- Hàm `verifyWebAppData` trong `AuthService.js` không còn đoạn code bypass và luôn trả về nguyên mẫu chuỗi `'Unauthorized'` khi phát sinh lỗi xác thực.
- Hàm `doPost` trong `Code.js` chứa block điều kiện kiểm tra whitelist và sẽ chặn mọi truy cập (trả về JSON `{ "status": "error", "message": "Unauthorized" }`) nếu user ID không nằm trong mảng whitelist.
</acceptance_criteria>
</task>

### Wave 1: Xử lý lỗi xác thực trên Frontend
<task>
<read_first>
- frontend/src/api.ts
- frontend/src/components/App.tsx
</read_first>
<action>
1. Trong `frontend/src/api.ts`: Tạo mới một class `AuthError` kế thừa từ class `Error`. Ở hàm `callBackendApi`, khi nhận được phản hồi có `result.status === 'error'` và message bằng `'Unauthorized'`, thay vì ném ra lỗi thông thường, hãy throw `new AuthError(result.message)`.
2. Trong `frontend/src/components/App.tsx`:
   - Bổ sung state `isUnauthorized` (giá trị mặc định `false`) để lưu trạng thái xác thực.
   - Cập nhật logic fetch dữ liệu lúc mount (lời gọi hàm fetch `get_deposits` đầu tiên). Bọc trong khối try-catch và kiểm tra nếu lỗi bắt được là instance của `AuthError` thì cập nhật state `isUnauthorized = true`.
   - Trong phần render, nếu `isUnauthorized === true`, trả về một màn hình lỗi toàn trang (Full-page Error UI) thay vì load nội dung ứng dụng. Giao diện lỗi bao gồm: Một icon biểu tượng hình ổ khóa (sử dụng icon `Lock` từ thư viện `lucide-react`), dòng text "Không có quyền truy cập", và một nút bấm "Đóng" thực hiện hành động đóng ứng dụng bằng SDK `@telegram-apps/sdk` (ví dụ sử dụng `window.Telegram.WebApp.close()` hoặc các method từ `isTMA`).
</action>
<acceptance_criteria>
- Frontend sinh ra exception kiểu `AuthError` (class kế thừa Error) trong `api.ts` mỗi khi backend báo lỗi "Unauthorized".
- Màn hình chính trong `App.tsx` render chính xác giao diện "Không có quyền truy cập" full-screen với icon Lock và nút Đóng khi state auth gặp sự cố, chặn hoàn toàn việc hiển thị dữ liệu bên trong.
</acceptance_criteria>
</task>

### Wave 1: Cập nhật Mock Auth trên Frontend
<task>
<read_first>
- frontend/src/utils/telegram.ts
</read_first>
<action>
Cập nhật `frontend/src/utils/telegram.ts`:
1. Xây dựng logic sinh mock `initData` có chứa chữ ký HMAC hợp lệ bằng Web Crypto API (`crypto.subtle`) cho môi trường dev.
2. Hàm mock tạo `auth_date` mới (thời gian hiện tại) để vượt qua kiểm tra 24h.
3. Ký HMAC-SHA256 với test bot token (lấy từ biến môi trường `VITE_TEST_BOT_TOKEN` hoặc fallback).
4. Cấu trúc lại `initDataRaw` trả về bao gồm tham số `hash` chính xác, đảm bảo backend verify thành công mà không cần bypass.
</action>
<acceptance_criteria>
- File `frontend/src/utils/telegram.ts` chứa logic sinh HMAC hợp lệ bằng Web Crypto API.
- Chuỗi `initData` sinh ra ở môi trường dev có `auth_date` được cập nhật liên tục và vượt qua hàm `verifyWebAppData` trên backend.
</acceptance_criteria>
</task>

### Wave 2: Cập nhật Unit Tests để tuân thủ xác thực chặt chẽ
<task>
<read_first>
- backend/Tests.js
- backend/AuthService.js
</read_first>
<action>
Trong `backend/Tests.js`:
1. Cập nhật các mock `properties` (đặc biệt trong các hàm test gọi đến `doPost`): Đảm bảo khi gọi `getProperty(PROP_ALLOWED_CHAT_IDS)` hệ thống sẽ trả về chuỗi JSON mảng chứa ID người dùng đang được giả lập (ví dụ `[123456789]`). Đảm bảo trả về mock giá trị hợp lệ khi gọi `getProperty(PROP_TELEGRAM_BOT_TOKEN)`.
2. Do tính chất hàm `AuthService.verifyWebAppData` hiện tại đã xác thực rất chặt chẽ, ta phải sinh ra một chuỗi `initData` mock động có thời gian sống trong 24 giờ.
   - Khai báo một hàm helper tĩnh trong file (ví dụ `function generateMockInitData(chatId, botToken)`) để tạo chuỗi truy vấn giả lập.
   - Hàm helper này tạo `auth_date` mới (`Math.floor(Date.now() / 1000)`), object `user` chứa `id: chatId`, mã hóa nó theo đúng định dạng.
   - Tính toán chuỗi HMAC signature `hash` sử dụng cơ chế `Utilities.computeHmacSha256Signature` tương tự như trên frontend (key="WebAppData").
   - Thay thế các chuỗi `initData` tĩnh "chết" hiện tại trong các payloads test của `Tests.js` bằng chuỗi động được tạo ra từ hàm helper này, để đảm bảo code vượt qua được bài test `verifyWebAppData`.
3. Bổ sung ít nhất 1 assert trong test để xác nhận nếu `chatId` không nằm trong mảng mock whitelist thì `doPost` sẽ trả về lỗi `Unauthorized`.
</action>
<acceptance_criteria>
- Hàm helper tạo mock data (dynamic initData) được khai báo thành công trong `Tests.js` và có thể sinh ra chuỗi query bao gồm tham số `hash` dựa trên token.
- Bài test không bị hỏng (crash/fail) do lỗi "Unauthorized" từ quá trình verifyWebAppData khi chạy các test case thông thường có ID nằm trong whitelist.
- Có ít nhất một test case khẳng định `doPost` trả về status error `Unauthorized` khi gửi request với ID không được whitelist.
</acceptance_criteria>
</task>

## Tiêu chí xác minh (Verification Criteria)
- [ ] File `backend/Constants.js` có biến `PROP_ALLOWED_CHAT_IDS`.
- [ ] Chạy lệnh `npm run build` ở thư mục frontend không xảy ra lỗi syntax.
- [ ] Giả lập một request gửi tới `doPost` mà không chứa `_serverSecret` hợp lệ và mang `initData` không chứa HMAC hợp lệ phải trả về json `{"status":"error","message":"Unauthorized"}`.
- [ ] UI frontend (trình duyệt) hiển thị đúng màn hình "Không có quyền truy cập" sau khi bắt được lỗi "Unauthorized" từ payload gọi tới `get_deposits`.

## Must_haves

truths:
- D-01: Whitelist lưu dạng JSON array trong GAS Script Properties key `ALLOWED_CHAT_IDS`.
- D-02: Check whitelist ngay sau HMAC verify thành công, trước routing action trong `doPost()`.
- D-03: Error message chung "Unauthorized" cho mọi auth failure — không tiết lộ lý do cụ thể.
- D-04: Hằng số `PROP_ALLOWED_CHAT_IDS = 'ALLOWED_CHAT_IDS'` trong `Constants.js`.
- D-05: Backend KHÔNG cần dev mode flag — frontend mock initData là đủ, backend luôn verify nghiêm ngặt.
- D-06: Xóa bypass offline trong `AuthService.verifyWebAppData()`. Buộc mọi request phải có initData hợp lệ hoặc Worker secret.
- D-07: Unit test dùng mock initData với HMAC hợp lệ từ test bot token — không bypass.
- D-08: Frontend hiển thị full-page error screen khi auth fail: icon khóa + "Không có quyền truy cập" + nút đóng TWA.
- D-09: Auth check tại lần gọi API đầu tiên (`get_deposits` khi App mount) — không cần route `verify_auth` riêng.
- D-10: Giữ dual-auth: Worker verify HMAC → inject `_serverSecret` → GAS trust. GAS chỉ verify HMAC khi không có Worker secret.
- D-11: Worker KHÔNG thêm whitelist check — whitelist là trách nhiệm duy nhất của GAS.
- D-12: Whitelist check luôn chạy ở GAS bất kể request đến qua Worker path hay direct path.
- D-13: Phase 6 scope KHÔNG sửa `cloudflare.js` — chỉ sửa backend GAS và frontend.

## Artifacts this phase produces
- Hằng số `PROP_ALLOWED_CHAT_IDS` trong `backend/Constants.js`.
- Hàm tĩnh `AuthService.isUserWhitelisted(chatId, properties)` trong `backend/AuthService.js`.
- Class ngoại lệ `AuthError` tạo mới trong `frontend/src/api.ts`.
- Màn hình Full-page Error UI sử dụng icon Lock và state `isUnauthorized` trong `frontend/src/components/App.tsx`.
- Hàm helper sinh mock initData hợp lệ với Web Crypto API trong `frontend/src/utils/telegram.ts`.
- Hàm helper `generateMockInitData(chatId, botToken)` tạo chuỗi query trong `backend/Tests.js`.

## PLANNING COMPLETE
