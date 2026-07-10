# Phase 3 Discussion Log: Telegram Bot Webhook Integration

## Participants
- Builder (AI assistant)
- Visionary (dangnd)

## Discussion History

### 1. Cấu hình URL Telegram Mini App
- **Question:** Bạn muốn lưu trữ URL của giao diện Mini App (sẽ được nhúng vào nút bấm của Telegram Bot) ở đâu?
- **Options:**
  - Option A: Lưu cấu hình trong Script Properties (MINI_APP_URL) để tăng tính linh hoạt và dễ thay đổi khi deploy front-end.
  - Option B: Cứng (hardcode) URL Mini App trực tiếp trong mã nguồn Code.js.
- **Selection:** Option A (Lưu cấu hình trong Script Properties).

### 2. Thời điểm chạy Trigger tự động kiểm tra đáo hạn
- **Question:** Hệ thống sẽ tự động quét hàng ngày và gửi tin nhắn cảnh báo qua Telegram Bot vào khung giờ nào?
- **Options:**
  - Option A: Buổi sáng (khoảng 7:00 AM - 8:00 AM) để nhận thông báo sớm.
  - Option B: Buổi tối (khoảng 8:00 PM - 9:00 PM).
- **Selection:** Option A (Buổi sáng).

### 3. Cơ chế kích hoạt đăng ký Webhook (setWebhook)
- **Question:** Bạn muốn thực hiện đăng ký Webhook URL của GAS với Telegram Bot API bằng cách nào?
- **Options:**
  - Option A: Sử dụng hàm chạy một lần (run-once function setupWebhook()) chạy thủ công từ GAS Editor hoặc menu tùy chỉnh trên Google Sheets.
  - Option B: Expose một API endpoint GET (ví dụ: ?action=setup_webhook) để kích hoạt tự động qua trình duyệt.
- **Selection:** Option A (Sử dụng hàm chạy một lần).

### 4. Tần suất gửi cảnh báo đáo hạn
- **Question:** Bạn muốn nhận cảnh báo cho các khoản tiết kiệm sắp đáo hạn với tần suất thế nào?
- **Options:**
  - Option A: Cảnh báo lặp lại hàng ngày đối với tất cả các khoản gửi nằm trong khoảng <= 3 ngày tới hoặc đã đáo hạn cho tới khi chúng được xử lý (tái tục/đóng).
  - Option B: Chỉ cảnh báo duy nhất 1 lần vào đúng ngày cách đáo hạn 3 ngày và đúng ngày đáo hạn.
- **Selection:** Option A (Cảnh báo lặp lại hàng ngày).

## Notes & Deferred Ideas
- Không có ý tưởng hoãn lại hoặc phát sinh ngoài phạm vi trong phiên thảo luận này.
