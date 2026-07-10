# Phase 3 Context: Telegram Bot Webhook Integration

## Domain
Tích hợp Webhook Telegram Bot để nhận tin nhắn và thiết lập trigger tự động kiểm tra đáo hạn hàng ngày trong Google Apps Script.

## Locked Requirements
- **BOT-01**: Thiết lập Telegram Bot webhook trỏ về GAS Web App để nhận tin nhắn và cung cấp nút bấm mở Telegram Mini App.
- **NOTF-01**: Thiết lập trigger quét hàng ngày (daily cron job) trong GAS để tìm các khoản sắp đáo hạn (trong vòng 3 ngày tới) hoặc đã đáo hạn và gửi tin nhắn cảnh báo trực tiếp qua Telegram Bot.

## Decisions

### Telegram Mini App Integration
- **D-01 (URL Storage)**: URL của Telegram Mini App được cấu hình trong Script Properties của Google Apps Script với mã khóa là `MINI_APP_URL`. Điều này giúp quản trị viên linh hoạt thay đổi URL front-end mà không cần deploy lại code backend.

### Concurrency and Triggers
- **D-02 (Daily Alert Timing)**: Trigger tự động kiểm tra đáo hạn sẽ chạy vào khung giờ buổi sáng hàng ngày (từ 7:00 AM đến 8:00 AM) để người dùng nhận được thông báo sớm trong ngày.
- **D-03 (Maturity Notification Logic)**: Cảnh báo đáo hạn sẽ được gửi lặp lại hàng ngày đối với tất cả các khoản tiết kiệm đang ở trạng thái `active` có ngày đáo hạn nằm trong khoảng <= 3 ngày tới hoặc đã đáo hạn (trạng thái `matured` hoặc `active` quá hạn) cho đến khi chúng được xử lý (được tái tục thành `rolled_over` hoặc cập nhật trạng thái khác).

### Webhook Setup
- **D-04 (Webhook Registration)**: Đăng ký Webhook URL với Telegram Bot API sử dụng một hàm chạy một lần (`setupWebhook()`) thực thi trực tiếp từ môi trường GAS Editor hoặc menu tiện ích trên Google Sheets, nhằm đảm bảo tính bảo mật và ngăn chặn người ngoài truy cập trái phép.

## Code Context
- File chính backend: [Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js)
- File unit test: [Tests.js](file:///home/dangnd/code/github/save-manager/backend/Tests.js)

## Canonical Refs
- [ROADMAP.md](file:///home/dangnd/code/github/save-manager/.planning/ROADMAP.md)
- [REQUIREMENTS.md](file:///home/dangnd/code/github/save-manager/.planning/REQUIREMENTS.md)
- [PROJECT.md](file:///home/dangnd/code/github/save-manager/.planning/PROJECT.md)
