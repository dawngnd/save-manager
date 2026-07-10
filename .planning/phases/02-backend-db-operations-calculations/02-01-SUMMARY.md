---
phase: 02-backend-db-operations-calculations
plan: "01"
subsystem: database
tags: [gas, typescript, nodejs, unit-testing]

# Dependency graph
requires:
  - phase: 01-db-clasp-project-setup
    provides: Google Sheets database setup and clasp configuration
provides:
  - Date parser and day difference calculation utilities
  - Database operations for adding, reading, and rolling over deposits with lock control
  - Local unit test suite running on Node.js
affects:
  - 03-telegram-bot-webhook-integration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Concurrency Locking with LockService
    - Safe Date Normalization for Plain Text Storage
    - Unified Error Handling

key-files:
  created:
    - backend/Tests.js
  modified:
    - backend/Code.js

key-decisions:
  - "Lưu ngày tháng dưới dạng Plain Text và tự parse ngày dạng DD/MM/YYYY để tránh lệch múi giờ trên GAS."
  - "Sử dụng LockService khi thực hiện ghi/tái tục để chống race condition."

patterns-established:
  - "Concurrency Locking: Bọc các nghiệp vụ ghi trong handleWriteActionWithLock sử dụng tryLock."
  - "Safe Date Normalization: parseDateString để chuyển đổi ngày độc lập với múi giờ chạy script."

requirements-completed:
  - API-01
  - API-02

coverage:
  - id: D1
    description: "Hàm parseDateString phân tích chính xác chuỗi ngày DD/MM/YYYY thành ngày local nửa đêm (00:00:00) tại múi giờ Việt Nam."
    requirement: "API-02"
    verification:
      - kind: unit
        ref: "backend/Tests.js#testParseDateString"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hàm calculateDaysDifference tính chính xác số ngày chênh lệch thực tế giữa hai ngày."
    requirement: "API-02"
    verification:
      - kind: unit
        ref: "backend/Tests.js#testCalculateDaysDifference"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hàm executeAddDeposit tự động tính expected_interest đúng theo công thức của dự án và làm tròn thành tiền VND."
    requirement: "API-02"
    verification:
      - kind: unit
        ref: "backend/Tests.js#testExpectedInterestCalculation"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hàm executeGetDeposits lọc và trả về đúng danh sách các khoản gửi của user dựa trên username_bankcode."
    requirement: "API-01"
    verification:
      - kind: unit
        ref: "backend/Tests.js#testExecuteGetDeposits"
        status: pass
    human_judgment: false
  - id: D5
    description: "Hàm executeRolloverDeposit cập nhật trạng thái khoản cũ thành rolled_over và tạo khoản mới chính xác."
    requirement: "API-01"
    verification:
      - kind: unit
        ref: "backend/Tests.js#testExecuteRolloverDeposit"
        status: pass
    human_judgment: false

# Metrics
duration: 10min
completed: 2026-07-10
status: complete
---

# Phase 02 Plan 01: Backend DB Operations & Calculations Summary

**Triển khai thành công các hàm nghiệp vụ tính toán lãi suất, chuẩn hóa ngày tháng, truy vấn và ghi dữ liệu Google Sheets đồng thời thiết lập bộ unit test nội bộ chạy độc lập.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-10T02:40:56Z
- **Completed:** 2026-07-10T02:51:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Triển khai thành công `parseDateString` và `calculateDaysDifference` để chuyển đổi và tính toán ngày chính xác độc lập với múi giờ chạy script.
- Triển khai `executeAddDeposit` và `executeRolloverDeposit` tự động tính toán tiền lãi dự tính chính xác, thực hiện ép kiểu và kiểm tra giá trị số dương (T-02-02, T-02-03).
- Triển khai `executeGetDeposits` giúp lọc và trả về danh sách các khoản tiền gửi thuộc về đúng user yêu cầu (T-02-01).
- Xây dựng bộ mock Database và Spreadsheet API trong `backend/Tests.js` chạy unit test thành công trên môi trường Node.js.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Triển khai các hàm chuẩn hóa ngày, tính lãi suất và nghiệp vụ DB (read/write/rollover deposits)** - `b3d0db4` (test)
2. **Task 1 (GREEN): Triển khai các hàm chuẩn hóa ngày, tính lãi suất và nghiệp vụ DB (read/write/rollover deposits)** - `bc7d4f8` (feat)

## Files Created/Modified
- `backend/Code.js` - Bổ sung các hàm nghiệp vụ, định tuyến POST request (`doPost`), cơ chế lock bảo vệ race condition.
- `backend/Tests.js` - Khởi tạo bộ test đơn vị và các mock sheets hỗ trợ chạy test độc lập qua Node.js.

## Decisions Made
- **Định dạng và xử lý ngày tháng:** Chỉ chấp nhận định dạng ngày `DD/MM/YYYY` thông qua Regex kiểm tra chặt chẽ, tự động parse thủ công và kiểm tra tính toàn vẹn (ví dụ: ngày 31/02 sẽ bị báo lỗi) để tránh hiện tượng trôi lệch múi giờ trên GAS.
- **Mocking trong Unit Tests:** Xây dựng cơ chế mock động cho `ContentService` trong hàm `buildJsonResponse`. Khi chạy trong môi trường Node.js (không có GAS runtime), hàm sẽ trực tiếp trả về đối tượng JSON để unit test có thể kiểm thử dễ dàng mà không cần cài đặt mock phức tạp cho `ContentService`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phần core logic backend và DB operations đã hoàn tất và được kiểm chứng.
- Sẵn sàng bước sang Phase 02 Plan 02 để thiết lập API Controller và tích hợp API Gateway.

---
*Phase: 02-backend-db-operations-calculations*
*Completed: 2026-07-10*

## Self-Check: PASSED

