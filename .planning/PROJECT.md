# Save Manager

## What This Is

Ứng dụng quản lý các khoản tiết kiệm cá nhân chạy trên Google Apps Script (GAS) và Google Sheets làm cơ sở dữ liệu. Người dùng tương tác với hệ thống thông qua giao diện Web App tích hợp trong Telegram Bot để cập nhật và theo dõi các khoản gửi tiền của mình.

## Core Value

Quản lý chính xác trạng thái các khoản tiết kiệm, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ trực quan ước tính tăng trưởng tổng tài sản theo thời gian.

## Requirements

### Validated

- **DB-01**: Thiết lập Google Sheets làm database với 2 bảng (sheets) (Validated in Phase 1: DB & clasp Project Setup):
  - `Users`: cột `username_bankcode` (khóa chính)
  - `Deposits`: các cột `id` (khoản gửi), `amount` (số tiền gửi), `interest_rate` (% lãi suất dự tính), `status` (trạng thái), `expected_interest` (tiền lãi dự tính), `created_at` (ngày tạo), `maturity_at` (ngày đáo hạn), `user_bankcode` (liên kết bảng Users)

### Active

- [ ] **AUTH-01**: Xác thực người dùng bằng cách nhập thủ công `username_bankcode` trên giao diện Web App để truy cập dữ liệu cá nhân.
- [ ] **DEP-01**: Thêm mới một khoản tiết kiệm với các thông tin: số tiền, % lãi suất, ngày tạo, ngày đáo hạn. Hệ thống tự động tính toán tiền lãi dự tính và lưu vào sheet.
- [ ] **DEP-02**: Thực hiện tái tục (rollover) khi khoản tiết kiệm đáo hạn. Cho phép người dùng nhập thủ công số tiền gốc mới và lưu trữ lịch sử hoạt động/khoản cũ vào lịch sử.
- [ ] **UI-01**: Tích hợp giao diện Web App vào Telegram Bot sử dụng Telegram WebApp API. Giao diện xây dựng bằng HTML/CSS/JS chạy trên Web App của GAS.
- [ ] **STAT-01**: Hiển thị thống kê tổng tài sản (tổng tiền gửi hiện tại + tổng lãi dự tính) dưới dạng biểu đồ timeseries ước tính tăng trưởng trên giao diện Web App.

### Out of Scope

- **Xác thực tự động qua Telegram Chat ID** — Đã quyết định nhập thủ công username/bankcode trên Web App để tăng tính linh hoạt và bảo mật.
- **Tính toán rút trước hạn phức tạp** — Đơn giản hóa v1, chỉ tập trung vào việc lưu trữ và tái tục khi đáo hạn.
- **Hỗ trợ đa tiền tệ** — Chỉ sử dụng một loại tiền tệ mặc định cho v1.

## Context

- Google Apps Script có giới hạn về thời gian thực thi (6 phút/lần gọi) và quota gọi API bên ngoài, nhưng hoàn toàn đủ cho nhu cầu cá nhân.
- Google Sheets là cơ sở dữ liệu trực quan, giúp người dùng dễ dàng kiểm tra chéo và chỉnh sửa thủ công khi cần.

## Constraints

- **Tech Stack**: Google Apps Script, Google Sheets, HTML/CSS/Vanilla Javascript, Telegram Bot API.
- **Database**: Google Sheets (mỗi sheet đóng vai trò là một table).
- **Hosting**: Google Apps Script Web App URL (doGet/doPost).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sử dụng Google Sheets làm database | Dễ xem, chỉnh sửa trực tiếp, hoàn toàn miễn phí và tích hợp sâu với Google Apps Script. | — Validated in Phase 1 |
| Tương tác qua Telegram Web App thay vì Text Bot | Cung cấp giao diện đồ họa (chart, form nhập liệu) phong phú hơn nhiều so với tin nhắn text. | — Pending |
| Nhập thủ công username/bankcode để đăng nhập | Tránh việc phụ thuộc chặt chẽ vào Chat ID Telegram, cho phép truy cập linh hoạt từ nhiều thiết bị/tài khoản Telegram nếu cần. | — Pending |
| Sử dụng LockService.getScriptLock() để đồng bộ hóa ghi | Ngăn ngừa tranh chấp dữ liệu (race condition) trên Google Sheets khi có nhiều ghi đồng thời. | — Validated in Phase 2 |
| Lưu trữ và xử lý ngày tháng theo chuỗi thô dạng DD/MM/YYYY | Tránh hiện tượng dịch lệch ngày do chênh lệch múi giờ giữa GAS server và client. | — Validated in Phase 2 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-10 after Phase 2 completion*
