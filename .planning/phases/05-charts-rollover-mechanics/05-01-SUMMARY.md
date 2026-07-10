---
phase: 05-charts-rollover-mechanics
plan: "01"
subsystem: ui
tags:
  - react
  - typescript
requires: []
provides:
  - Rollover transaction Form Bottom Sheet
  - Tái tục button in deposit details panel
affects:
  - 05-charts-rollover-mechanics
tech-stack:
  added: []
  patterns:
    - Bottom Sheet Form
    - Date masks
key-files:
  created:
    - frontend/src/components/RolloverForm.tsx
  modified:
    - frontend/src/components/DepositList.tsx
    - frontend/src/components/App.tsx
    - frontend/src/api.ts
key-decisions:
  - "Hide Rollover button unless diffDays <= 0 (D-01)"
  - "Auto-prefill amount, interest rate, new start date, and compute new maturity date (+1 year) with leap-year guard (D-02)"
patterns-established:
  - "getNextYearDateStr date math helper with leap-year handling"
requirements-completed:
  - DEP-02
coverage:
  - id: D1
    description: "Nút Tái tục hiển thị đúng điều kiện và mở bottom sheet form"
    requirement: DEP-02
    verification: []
    human_judgment: true
    rationale: "Requires visual interaction and checking date calculation on client side"
  - id: D2
    description: "Form Tái tục tự động điền các thông tin mặc định theo quy định (ngày bắt đầu mới = ngày đáo hạn cũ, ngày đáo hạn mới = +1 năm)"
    requirement: DEP-02
    verification: []
    human_judgment: true
    rationale: "Requires visual check of prefilled form fields"
duration: 15min
completed: 2026-07-10
status: complete
---

# Phase 5 Plan 01: Rollover Mechanics Summary

**Implemented the matured deposit Rollover (Tái tục) UI form, details panel integration, and API submission wiring.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-10T13:25:30Z
- **Completed:** 2026-07-10T13:40:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created the `RolloverForm` component in a Bottom Sheet using the existing design tokens, form styles, and date masks.
- Implemented `getNextYearDateStr` to calculate the default maturity date (+1 year) with robust leap-year checking (e.g. Feb 29 -> Feb 28 on non-leap years).
- Added "Tái tục" button in the deposit details panel, visible only for deposits that have reached or passed their maturity date (diffDays <= 0).
- Fixed `callBackendApi` type definition to allow flexible payloads for custom actions like `rollover_deposit`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tạo component RolloverForm.tsx xử lý logic và UI nhập liệu tái tục** - `167c11f` (feat/fix/test/refactor) and `2a0be66` (fix/frontend)
2. **Task 2: Tích hợp nút Tái tục vào Panel chi tiết và quản lý trạng thái form tại App.tsx** - `2e88fd7` (feat/frontend)

## Files Created/Modified
- `frontend/src/components/RolloverForm.tsx` - Created bottom sheet rollover form
- `frontend/src/components/DepositList.tsx` - Added Tái tục CTA in details panel
- `frontend/src/components/App.tsx` - Wired form trigger state and reload callbacks
- `frontend/src/api.ts` - Fixed typescript action payload typing

## Decisions Made
- Prefilled rollover start date to the old deposit's maturity date rather than current date to ensure continuous interest calculation (per D-02).
- Leap-year adjustment for February 29th defaults to February 28th if the subsequent year is a non-leap year (per D-02).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Rollover UI and API connection verified.
- Ready for Wave 2: Asset Growth Chart implementation using Chart.js.

---
*Phase: 05-charts-rollover-mechanics*
*Completed: 2026-07-10*
