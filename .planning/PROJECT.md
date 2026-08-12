# Save Manager

## What This Is

Ứng dụng quản lý các khoản tiết kiệm cá nhân chạy trên Google Apps Script (GAS) và Google Sheets làm cơ sở dữ liệu. Người dùng tương tác với hệ thống thông qua giao diện Web App tích hợp trong Telegram Bot để cập nhật và theo dõi các khoản gửi tiền của mình.

## Core Value

Quản lý chính xác trạng thái các khoản tiết kiệm, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ trực quan ước tính tăng trưởng tổng tài sản theo thời gian.

## Current State

- **Shipped Version:** v1.0 (2026-07-14)
- **Status:** Hoàn tất 5 phase cốt lõi của MVP, tích hợp hệ thống Database Google Sheets, API GAS, Telegram Bot Webhook, daily triggers cảnh báo và frontend React SPA dạng single-file.

## Current Milestone: v3.0 Mortgage Loan Estimator

**Goal:** Xây dựng module ước tính khoản vay mua nhà hoàn toàn phía frontend, với tham số cấu hình động dựa trên cấu trúc thực tế của các ngân hàng Việt Nam.

**Target features:**
- LOAN-01: Nghiên cứu cấu trúc khoản vay mua nhà các ngân hàng (Vietinbank, BIDV, Vietcombank, VPBank)
- LOAN-02: Module ước tính lãi hàng tháng & lũy kế lãi theo khoản vay
- LOAN-03: Biểu đồ trực quan phân bổ gốc/lãi theo tháng và lũy kế
- LOAN-04: Tham số cấu hình động (thời hạn, lãi suất, % trả gốc, ...)
- LOAN-05: Tab riêng trên giao diện đặt cạnh Analytics

## Requirements

### Validated

- ✓ **DB-01**: Google Sheets database schema with `Users` & `Deposits` sheets — v1.0
- ✓ **DB-02**: Script locking via `LockService` to prevent race conditions — v1.0
- ✓ **API-01**: Centralized JSON REST API `doPost` routing — v1.0
- ✓ **API-02**: Expected interest calculation dynamically — v1.0
- ✓ **API-03**: Asia/Ho_Chi_Minh Timezone configuration — v1.0
- ✓ **BOT-01**: Telegram Bot webhook & TWA command integration — v1.0
- ✓ **NOTF-01**: Daily cron alerts and batch message grouping — v1.0
- ✓ **UI-01**: Single-file bundle and GitHub Actions deploy to GitHub Pages — v1.0
- ✓ **UI-02**: Compact deposit list view & details BottomSheet — v1.0
- ✓ **UI-03**: Telegram Web App SDK & fallback mock development — v1.0
- ✓ **STAT-01**: Step-wise timeseries growth chart — v1.0
- ✓ **DEP-01**: FAB deposit form with realtime interest calculation — v1.0
- ✓ **DEP-02**: Matured deposit Rollover transaction UI & backend execution — v1.0
- ✓ **AUTH-02**: Xác thực chữ ký `initData` của Telegram Web App bằng HMAC-SHA256 — v2.0
- ✓ **STAT-02**: Phân tích tỷ trọng tiết kiệm theo kỳ hạn/ngân hàng — v2.0
- ✓ **HIST-01**: Phả hệ (lineage tree) khoản gửi đã tái tục — v2.0
- ✓ **GAP-01**: Tích hợp UserSelector dropdown vào App.tsx — v2.0
- ✓ **GAP-02**: Nhập tay bankcode mới trong DepositForm — v2.0
- ✓ **GAP-03**: Auto-link Chat ID qua API get_deposits — v2.0

### Active (v3.0)

- [ ] **LOAN-01**: Nghiên cứu cấu trúc khoản vay mua nhà các ngân hàng Việt Nam
- [ ] **LOAN-02**: Module ước tính lãi hàng tháng & lũy kế lãi
- [ ] **LOAN-03**: Biểu đồ trực quan phân bổ gốc/lãi
- [ ] **LOAN-04**: Tham số cấu hình động
- [ ] **LOAN-05**: Tab riêng trên giao diện cạnh Analytics

### Out of Scope

- **Đăng nhập bằng tên đăng nhập/mật khẩu** — Ứng dụng cá nhân phục vụ một người dùng, không cần màn hình đăng nhập phức tạp.
- **Rút tiền trước hạn** — Chỉ tập trung quản lý tiết kiệm đúng hạn và tái tục khi đáo hạn.
- **Hỗ trợ đa tiền tệ** — Chỉ sử dụng một loại tiền tệ mặc định cho v1.

## Context

- Google Apps Script có giới hạn về thời gian thực thi (6 phút/lần gọi) và quota gọi API bên ngoài, nhưng hoàn toàn đủ cho nhu cầu cá nhân.
- Google Sheets là cơ sở dữ liệu trực quan, giúp người dùng dễ dàng kiểm tra chéo và chỉnh sửa thủ công khi cần.
- Cấu trúc frontend được đóng gói trong một file `index.html` duy nhất giúp triển khai trên GAS cực kỳ nhanh chóng và tránh được các giới hạn của GAS Web App sandbox.

## Constraints

- **Tech Stack**: Google Apps Script, Google Sheets, HTML/CSS/Vanilla Javascript, Telegram Bot API.
- **Database**: Google Sheets (mỗi sheet đóng vai trò là một table).
- **Hosting**: Google Apps Script Web App URL (doGet/doPost).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sử dụng Google Sheets làm database | Dễ xem, chỉnh sửa trực tiếp, hoàn toàn miễn phí và tích hợp sâu với Google Apps Script. | ✓ Good — Phase 1 |
| Tương tác qua Telegram Web App thay vì Text Bot | Cung cấp giao diện đồ họa (chart, form nhập liệu) phong phú hơn nhiều so với tin nhắn text. | ✓ Good — Phase 3 |
| Nhập thủ công username/bankcode để đăng nhập | Tránh việc phụ thuộc chặt chẽ vào Chat ID Telegram, cho phép truy cập linh hoạt từ nhiều thiết bị/tài khoản Telegram nếu cần. | ⚠️ Revisit (Orphaned in v1.0, need fix in v2.0) |
| Sử dụng LockService.getScriptLock() để đồng bộ hóa ghi | Ngăn ngừa tranh chấp dữ liệu (race condition) trên Google Sheets khi có nhiều ghi đồng thời. | ✓ Good — Phase 2 |
| Lưu trữ và xử lý ngày tháng theo chuỗi thô dạng DD/MM/YYYY | Tránh hiện tượng dịch lệch ngày do chênh lệch múi giờ giữa GAS server và client. | ✓ Good — Phase 2 |
| Single-file bundle via vite-plugin-singlefile | GAS Web App không cho phép import stylesheet/script rời, inlining toàn bộ tài nguyên vào một file HTML là giải pháp bắt buộc. | ✓ Good — Phase 4 |
| Step-wise growth chart calculation | Phản ánh đúng thực tế tài sản: Tiền lãi chỉ thực sự phát sinh và cộng gộp vào ngày đáo hạn của khoản gửi. | ✓ Good — Phase 5 |
| Webhook Token Authentication | Khắc phục giới hạn không đọc được HTTP headers trên GAS bằng cách đính kèm token trên query parameter. | ✓ Good — Phase 3 |
| Local Mock Development Fallback | Cho phép phát triển và debug frontend trực tiếp trên các trình duyệt desktop mà không cần nhúng vào Telegram Web App thực sự. | ✓ Good — Phase 4 |

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
*Last updated: 2026-08-12 after v3.0 milestone start*
