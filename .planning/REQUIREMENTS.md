# Requirements: Save Manager

**Defined:** 2026-07-10
**Core Value:** Quản lý các khoản tiết kiệm cá nhân, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ ước tính tăng trưởng tài sản trên giao diện Telegram Mini App (Web App) sử dụng Google Sheets làm database.

## v1 Requirements

Requirements for initial release.

### Database (Google Sheets)

- [x] **DB-01**: Thiết lập Google Sheets làm database với 2 bảng:
  - Bảng `Users`: các cột `username_bankcode` (khóa chính)
  - Bảng `Deposits`: các cột `id`, `amount` (số tiền gốc), `interest_rate` (% lãi dự tính), `status` (active / matured / rolled_over), `expected_interest` (tiền lãi dự tính), `created_at` (ngày tạo), `maturity_at` (ngày đáo hạn), `user_bankcode` (liên kết bảng Users)
- [x] **DB-02**: Triển khai cơ chế khóa ghi bằng `LockService` trên Google Apps Script để tránh tranh chấp dữ liệu khi có nhiều yêu cầu ghi đồng thời.

### Backend API (Google Apps Script)

- [x] **API-01**: Cung cấp API endpoint (`doPost`) nhận định dạng JSON để xử lý các yêu cầu từ Frontend:
  - Lấy danh sách các khoản tiết kiệm của user.
  - Thêm mới một khoản tiết kiệm.
  - Thực hiện tái tục (rollover) một khoản tiết kiệm.
- [x] **API-02**: Tự động tính toán tiền lãi dự tính (`expected_interest = amount * interest_rate * (maturity_at - created_at) / 365`) khi thêm mới hoặc tái tục.
- [x] **API-03**: Thiết lập timezone mặc định `Asia/Ho_Chi_Minh` cho toàn bộ GAS project và Google Sheet để tránh lệch ngày giờ.

### Telegram Integration & Notifications

- [x] **BOT-01**: Thiết lập Telegram Bot webhook trỏ về GAS Web App để nhận tin nhắn và cung cấp nút bấm mở Telegram Mini App.
- [ ] **NOTF-01**: Thiết lập trigger quét hàng ngày (daily cron job) trong GAS để tìm các khoản sắp đáo hạn (trong vòng 3 ngày tới) hoặc đã đáo hạn và gửi tin nhắn cảnh báo trực tiếp qua Telegram Bot.

### Frontend User Interface (GitHub Pages)

- [ ] **UI-01**: Xây dựng SPA bằng Vite + TypeScript + Tailwind CSS, deploy lên GitHub Pages công khai (hoàn toàn miễn phí).
- [ ] **UI-02**: Giao diện hiển thị trực tiếp danh sách các khoản tiết kiệm và nút bấm tương tác (không yêu cầu trang đăng nhập phức tạp, tự động lưu thông tin cấu hình hoặc dùng tài khoản mặc định).
- [ ] **UI-03**: Tích hợp `@telegram-apps/sdk` để tối ưu hóa hiển thị (theme, viewport) khi chạy trong Telegram Mini App.
- [ ] **STAT-01**: Hiển thị thống kê tổng tài sản (gốc + lãi dự kiến tại thời điểm đáo hạn) dạng biểu đồ timeseries sử dụng `Chart.js`.
- [ ] **DEP-01**: Form thêm mới khoản tiết kiệm trực quan.
- [x] **DEP-02**: Tính năng Tái tục (Rollover) ngay trên giao diện: Cho phép người dùng nhập thủ công số tiền gốc mới cho chu kỳ tiếp theo, hệ thống tự động lưu trữ thông tin khoản cũ và tạo mới khoản mới.

## v2 Requirements

Deferred to future release.

- **AUTH-02**: Xác thực chữ ký `initData` của Telegram Web App bằng HMAC-SHA256 để nâng cao bảo mật nếu ứng dụng mở rộng cho nhiều người dùng ngoài.
- **STAT-02**: Hỗ trợ phân tích tỷ lệ phân bổ tiết kiệm theo các kỳ hạn khác nhau.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Đăng nhập bằng tên đăng nhập/mật khẩu | Ứng dụng cá nhân phục vụ một người dùng, không cần màn hình đăng nhập phức tạp. |
| Rút tiền trước hạn | Chỉ tập trung quản lý tiết kiệm đúng hạn và tái tục khi đáo hạn. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 2 | Complete |
| API-01 | Phase 2 | Complete |
| API-02 | Phase 2 | Complete |
| API-03 | Phase 1 | Complete |
| BOT-01 | Phase 3 | Complete |
| NOTF-01 | Phase 3 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| STAT-01 | Phase 5 | Pending |
| DEP-01 | Phase 4 | Pending |
| DEP-02 | Phase 5 | Complete |

**Coverage:**

- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-10*
*Last updated: 2026-07-10 after initial definition*
