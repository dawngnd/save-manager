---
phase: 02-backend-db-operations-calculations
plan: "02"
subsystem: database
tags: [gas, locking, lockservice, dopost, integration-testing]

# Dependency graph
requires:
  - phase: 02-backend-db-operations-calculations
    provides: Date parser and day difference calculation utilities, add, read, and rollover deposit DB operations.
provides:
  - Centralized doPost controller routing get_deposits, add_deposit, and rollover_deposit.
  - Concurrency control with LockService script locking for write operations (add_deposit, rollover_deposit).
  - Robust integration tests for doPost routing and LockService deadlock prevention.
affects:
  - 03-telegram-bot-webhook-integration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Concurrency Locking with LockService
    - Dynamic Test Response Parsing (getResponseData)

key-files:
  created: []
  modified:
    - backend/Code.js
    - backend/Tests.js

key-decisions:
  - "Sử dụng LockService.getScriptLock() để đồng bộ hóa ghi và ngăn ngừa race condition trên Google Sheets."
  - "Triển khai hàm getResponseData trợ giúp trích xuất JSON trong Tests.js để hỗ trợ chạy test trên cả hai môi trường Node.js có/không có Mock ContentService."

patterns-established:
  - "Centralized doPost routing: Định tuyến tập trung dựa trên thuộc tính action trong POST payload."
  - "Lock-protected writes: Bọc các nghiệp vụ ghi trong handleWriteActionWithLock với block try-catch-finally để đảm bảo luôn giải phóng lock."

requirements-completed:
  - DB-02
  - API-01

coverage:
  - id: D1
    description: "Hàm doPost định tuyến chính xác các action get_deposits, add_deposit, và rollover_deposit."
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testDoPostRouting"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cơ chế LockService bảo vệ các action ghi với timeout 10s và giải phóng lock an toàn trong khối finally."
    requirement: "DB-02"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testLockServiceBehavior"
        status: pass
    human_judgment: false

# Metrics
duration: 2min
completed: 2026-07-10
status: complete
---

# Phase 02 Plan 02: doPost Controller & Concurrency Control Summary

**Triển khai thành công bộ điều phối doPost tập trung tích hợp cơ chế khóa ghi LockService để tiếp nhận và đồng bộ hóa các yêu cầu từ client, ngăn chặn race condition trên database Google Sheets.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-10T09:43:06+07:00
- **Completed:** 2026-07-10T09:45:00+07:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Định nghĩa hoàn chỉnh hàm `doPost(e)` tiếp nhận POST request, tự động phân tích JSON payload và định tuyến chính xác tới các action `get_deposits` (đọc, không lock) và các action ghi sử dụng lock.
- Triển khai hàm `handleWriteActionWithLock` sử dụng `LockService.getScriptLock()` với timeout `10000` (10 giây) để khóa đồng bộ, bọc nghiệp vụ ghi trong khối `try-catch-finally` để luôn đảm bảo `lock.releaseLock()` được gọi.
- Cập nhật và bổ sung các hàm kiểm thử `testDoPostRouting()` và `testLockServiceBehavior()` trong `backend/Tests.js`, xác thực toàn bộ hoạt động định tuyến và khóa ghi thành công trên môi trường Node.js.

## Task Commits

Each task was committed atomically:

1. **Task 1: Triển khai hàm doPost và điều phối nghiệp vụ ghi bằng LockService** - `1200f48` (test) và `8bf01d4` (feat)
2. **Task 2: Cập nhật Tests.js kiểm thử tích hợp doPost và giả lập tranh chấp ghi** - Tích hợp trong cùng chuỗi commit của Task 1 (TDD flow)

**Plan metadata:** `8bf01d4` (feat: implement doPost routing and LockService concurrency control)

## Files Created/Modified
- `backend/Code.js` (Modified) - Triển khai `doPost`, `handleWriteActionWithLock` và `buildJsonResponse`.
- `backend/Tests.js` (Modified) - Bổ sung helper `getResponseData`, các hàm test `testDoPostRouting()`, `testLockServiceBehavior()`, và tích hợp chúng vào `runTests()`.

## Decisions Made
- **Đồng bộ hóa ghi:** Sử dụng `LockService` dạng Script Lock với timeout 10 giây để chống race condition khi có nhiều request đồng thời, đồng thời giải phóng lock trong khối `finally`.
- **Hỗ trợ Test đa môi trường:** Thiết lập hàm trợ giúp `getResponseData` để tự động bóc tách JSON string từ `ContentService.TextOutput` (nếu có mock) hoặc trả về đối tượng JSON thô (nếu không có mock), giúp unit tests chạy ổn định trên mọi môi trường Node.js.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Toàn bộ cơ chế API Controller cục bộ và đồng bộ hóa ghi đã hoàn tất và vượt qua tất cả unit & integration tests.
- Sẵn sàng bước sang Phase 03 để tích hợp Webhook với Telegram Bot.

---
*Phase: 02-backend-db-operations-calculations*
*Completed: 2026-07-10*

## Self-Check: PASSED
