# Milestones

## v1.0 milestone (Shipped: 2026-07-14)

**Phases completed:** 5 phases, 11 plans, 32 tasks

**Key accomplishments:**

- Google Sheets database schema setup, appsscript.json configurations with Asia/Ho_Chi_Minh timezone, and SETUP.md installation guide
- Clasp environment configured and system status doGet endpoint implemented
- Triển khai thành công các hàm nghiệp vụ tính toán lãi suất, chuẩn hóa ngày tháng, truy vấn và ghi dữ liệu Google Sheets đồng thời thiết lập bộ unit test nội bộ chạy độc lập.
- Triển khai thành công bộ điều phối doPost tập trung tích hợp cơ chế khóa ghi LockService để tiếp nhận và đồng bộ hóa các yêu cầu từ client, ngăn chặn race condition trên database Google Sheets.
- Tích hợp thành công Webhook Telegram Bot vào Google Apps Script với cơ chế xác thực Token trên query parameter và tự động liên kết Chat ID của người dùng.
- Triển khai thành công tính năng tự động quét ngày đáo hạn, gom nhóm tin nhắn thông báo theo từng người dùng để gửi batch qua Telegram Bot API, và tự động lập lịch daily trigger lúc 7h-8h sáng hàng ngày.
- Scaffolded Vite + React + TS + Tailwind CSS v4 SPA with single-file bundle config and GitHub Actions CI/CD deployment.
- Integrated Telegram Web App SDK, built secure initData HMAC verification on backend, and developed UserSelector interface.
- Created compact active deposit list view, developed DepositForm with input date mask and real-time calculations preview.
- Implemented the matured deposit Rollover (Tái tục) UI form, details panel integration, and API submission wiring.
- Implemented timeseries asset growth projection chart using Chart.js in React 19, along with query string and Telegram start parameter routing, and Telegram bot /chart command support.

---
