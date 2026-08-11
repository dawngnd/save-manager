# Phase 6: Security & Whitelist Authentication - Research

## 1. Mục tiêu
Bảo mật REST API của backend bằng HMAC-SHA256 (Telegram Web App), chống replay attack, triển khai Whitelist (kiểm tra `chat_id` từ Script Properties) và fallback Mock Auth ở local dev.

## 2. Phân tích hiện trạng
Dựa trên mã nguồn hiện tại, quy trình auth đã được hỗ trợ cơ bản thông qua hàm `AuthService.verifyWebAppData` (đã có HMAC + expiry check) và Dual-auth trong `Code.js` (Worker secret hoặc fallback HMAC).
- **Backend**:
  - `Code.js`: `doPost` đã có logic Dual-auth và trích xuất `authenticatedChatId`. Chưa có bước kiểm tra Whitelist.
  - `AuthService.js`: Còn chứa đoạn code bypass offline `if (!botToken) return '';`. Cần loại bỏ để thực thi kiểm tra chặt chẽ. Cần thêm hàm kiểm tra Whitelist.
  - `Constants.js`: Cần bổ sung key `PROP_ALLOWED_CHAT_IDS`.
  - `Tests.js`: Cần thay đổi mock data của `initData` trong các unit test để pass qua bước kiểm tra chữ ký HMAC (hoặc dùng test token hợp lệ để tự tạo chữ ký trong test) và kiểm tra Whitelist.
- **Frontend**:
  - `frontend/src/api.ts`: Hiện tại throw Error thông thường nếu API trả về `status === 'error'`. Cần bắt được lỗi "Unauthorized" từ backend để báo cho UI.
  - `frontend/src/utils/telegram.ts`: Có hàm tạo mock data cho `initData`. Tuy nhiên vì backend sẽ không còn bypass offline, local dev bắt buộc phải gửi một `initData` mock được ký hợp lệ với một `test_bot_token`, hoặc dựa vào Dual-auth `_serverSecret` (nếu có cách truyền). Quyết định: Frontend mock initData là đủ, backend tự verify bằng mock botToken trong môi trường dev (với test initData có hash hợp lệ).
  - **Full-page error**: Cần có cơ chế render một trang lỗi khi bị unauthorized (có thể quản lý state trong `App.tsx` hoặc một wrapper, dựa trên custom Error class từ `api.ts`).

## 3. Các thay đổi chi tiết cần thực hiện

### 3.1. `backend/Constants.js`
- Thêm hằng số: `const PROP_ALLOWED_CHAT_IDS = 'ALLOWED_CHAT_IDS';`

### 3.2. `backend/AuthService.js`
- Xóa dòng bypass trong `verifyWebAppData`: `if (!botToken) return ''; // Bypass test offline`
- Thêm hàm `isUserWhitelisted(chatId, properties)`:
  - Lấy chuỗi JSON từ `properties.getProperty(PROP_ALLOWED_CHAT_IDS)`.
  - Parse ra mảng và kiểm tra xem `chatId` (có thể cần parse về Number hoặc String để so sánh chuẩn) có nằm trong mảng không.

### 3.3. `backend/Code.js`
- Trong `doPost`, ngay sau khi lấy `var authenticatedChatId = AuthService.extractUserId(initData);`, thêm block check:
  - Gọi `AuthService.isUserWhitelisted(authenticatedChatId, properties)`.
  - Nếu trả về false (hoặc `authenticatedChatId` không tồn tại), trả về: `ResponseHelper.json('error', 'Unauthorized');` (thông điệp lỗi chung theo D-03).
- Lưu ý: Do lỗi chung "Unauthorized" được áp dụng cho mọi lỗi xác thực, tại `verifyWebAppData` (khi fallback) cũng nên trả về "Unauthorized" thay vì các lỗi cụ thể như hiện tại (hoặc frontend chỉ bắt đúng text "Unauthorized").

### 3.4. `backend/Tests.js`
- Cập nhật các mock Test sử dụng `doPost`:
  - Vì đã có Whitelist check, cần mock `PROP_ALLOWED_CHAT_IDS` trả về một mảng chứa ID của test user (vd: `[123456789]`).
  - Nếu giả lập gọi `doPost` fallback xác thực, cần sinh ra `initData` có `hash` hợp lệ (dùng hàm HMAC nội bộ trong test để sinh mock hash).

### 3.5. `frontend/src/api.ts` & Frontend UI
- `api.ts`: Khi nhận được thông báo lỗi xác thực từ backend (như "Unauthorized"), throw ra một lỗi đặc biệt (ví dụ `AuthError`) hoặc bắt giữ nó để trả về một mã nhận diện.
- `App.tsx` (hoặc root component): Bắt lỗi Auth, nếu xảy ra, cập nhật state `isUnauthorized = true` và hiển thị Full-page Error UI gồm icon khóa, "Không có quyền truy cập" và một nút `Telegram.WebApp.close()` (nếu trong môi trường TWA).

### 3.6. `frontend/src/utils/telegram.ts`
- Phần tạo `isMock: true` cần sinh ra một chuỗi `rawInitData` sao cho backend có thể giải mã và tính toán hash. Do backend dùng một `botToken` thực hoặc test để cấu hình, `initData` mock này nếu chỉ chứa thông tin giả sẽ báo `HMAC mismatch` khi backend verify (nếu backend không bị bỏ qua bởi `_serverSecret`).
- **Giải pháp**: Nếu chạy môi trường dev (Node/Vite), frontend không thể tự tạo hash hợp lệ nếu không biết `botToken`. Quyết định (D-05, D-06) yêu cầu backend luôn verify, do đó phải cấu hình một `test bot token` và gen trước một chuỗi `initData` giả có hash hợp lệ trong vòng 24h, hoặc có cơ chế cho developer cập nhật `test_initData` vào `.env`. (Đợi đến lúc lập kế hoạch chi tiết cần định nghĩa rõ cách tạo mock này sao cho không bị hết hạn 24h). Hoặc auth_date có thể được tạo runtime và hash được tạo bằng Web Crypto API? Tuy nhiên frontend không nên chứa token. Phải xem lại D-07: "Unit test dùng mock initData với HMAC hợp lệ được tạo từ test bot token". Với frontend dev mode, có thể cần một bypass nào đó nếu không có Worker, nhưng D-05 nói "Frontend mock initData là đủ, backend luôn verify nghiêm ngặt." -> **Cần lưu ý rủi ro**: Hash của initData dùng thời gian `auth_date`, nếu backend check quá 24h thì mock cố định sẽ hết hạn. Ta cần một phương án sinh mock cho dev mode hoặc vô hiệu hóa check expiry đối với một số test config. Sẽ giải quyết rõ ở Plan.

## 4. Kết luận (Research Blocked / Complete)
Nghiên cứu hoàn tất, mọi thành phần kỹ thuật đã được phân tích đầy đủ và sẵn sàng để lập kế hoạch.

## RESEARCH COMPLETE
