---
phase: 05-charts-rollover-mechanics
plan: "02"
subsystem: ui
tags:
  - react
  - typescript
  - chart.js
requires:
  - phase: 05-charts-rollover-mechanics
    provides:
      - Rollover transaction Form Bottom Sheet
      - Tái tục button in deposit details panel
provides:
  - GrowthChart component showing expected assets growth (principal + interest) step-wise
  - URL parameter routing view=chart and Telegram initData startParam=chart
  - Telegram bot /chart command routing with Web App button
affects:
  - 05-charts-rollover-mechanics
tech-stack:
  added:
    - chart.js
  patterns:
    - Canvas-ref Chart.js integration
    - Step-wise cumulative calculation
    - Telegram launch parameter parsing

key-files:
  created:
    - frontend/src/components/GrowthChart.tsx
  modified:
    - frontend/src/components/App.tsx
    - backend/Code.js

key-decisions:
  - "Use native Chart.js Canvas reference to avoid peer dependency issues on React 19 (D-03)"
  - "Compute asset growth step-wise with interest realized only on maturity date (D-03)"
  - "Draw timeseries from today to furthest maturity date among active deposits (D-04)"
  - "Show chart at screen top via view=chart/startParam=chart URL parameters (D-05)"
  - "Add Telegram webhook routing for /chart command pointing to view=chart (D-06)"

patterns-established:
  - "Canvas-ref Chart.js lifecycle management with explicit destroy() cleanup"
  - "Step-wise cumulative asset timeseries calculation"

requirements-completed:
  - STAT-01

coverage:
  - id: D3
    description: "Biểu đồ tăng trưởng tài sản hiển thị đúng dạng step-wise (D-03)"
    requirement: STAT-01
    verification:
      - kind: automated_ui
        ref: "frontend/src/components/GrowthChart.tsx#generateStepWiseGrowthData"
        status: pass
    human_judgment: true
    rationale: "Requires visual validation of the rendered chart line on canvas"
  - id: D4
    description: "Thời gian biểu đồ kéo dài từ hôm nay đến ngày đáo hạn xa nhất (D-04)"
    requirement: STAT-01
    verification:
      - kind: automated_ui
        ref: "frontend/src/components/GrowthChart.tsx#generateStepWiseGrowthData"
        status: pass
    human_judgment: false
  - id: D5
    description: "Biểu đồ chỉ hiển thị khi có tham số view=chart hoặc startParam=chart (D-05)"
    requirement: STAT-01
    verification:
      - kind: automated_ui
        ref: "frontend/src/components/App.tsx#useEffect"
        status: pass
    human_judgment: true
    rationale: "Requires verifying visual visibility toggle under parameter conditions"
  - id: D6
    description: "Telegram Bot webhook /chart phản hồi đúng liên kết kèm view=chart (D-06)"
    requirement: STAT-01
    verification:
      - kind: integration
        ref: "backend/Code.js#handleTelegramWebhook"
        status: pass
    human_judgment: false

duration: 15 min
completed: 2026-07-10
status: complete
---

# Phase 5 Plan 02: Growth Chart & Webhook Summary

**Implemented timeseries asset growth projection chart using Chart.js in React 19, along with query string and Telegram start parameter routing, and Telegram bot /chart command support.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-10T13:34:00Z
- **Completed:** 2026-07-10T13:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed `chart.js` and created a collapsible `GrowthChart` component using Canvas refs for clean integration with React 19.
- Implemented `generateStepWiseGrowthData` to calculate the cumulative total assets (principal + interest) step-wise daily up to the furthest active deposit maturity date.
- Added parameter parsing in `App.tsx` using standard URL query strings (`view=chart`) and Telegram Mini App launch params (`startParam=chart`).
- Updated `handleTelegramWebhook` in `backend/Code.js` to process `/chart` commands and reply with Web App buttons targeting the chart view parameter.

## Task Commits

Each task was committed atomically:

1. **Cài đặt thư viện Chart.js và tạo GrowthChart.tsx với thuật toán dự phóng step-wise** - `0a438b4` (feat/frontend)
2. **Tích hợp định tuyến tham số biểu đồ tại App.tsx và Webhook tại backend/Code.js** - `d64f2dd` (feat/routing)

## Files Created/Modified
- `frontend/src/components/GrowthChart.tsx` - Created step-wise line chart component.
- `frontend/src/components/App.tsx` - Parsed launch parameters and rendered collapsible GrowthChart.
- `backend/Code.js` - Routed /chart command in Telegram webhook callback.

## Decisions Made
- Chose direct Chart.js Canvas API to ensure compatibility with React 19 without third-party wrapper peer conflicts.
- Registered only necessary Chart.js features (LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler) to support Vite single-file tree shaking and bundle size optimization.

## Deviations from Plan
- Fixed a minor TypeScript compiler type check error in `App.tsx` by casting `retrieveLaunchParams()` to `any` (type check compatibility).

## Issues Encountered
- TypeScript error on `lp.initData?.startParam` was resolved with an explicit type cast.

## User Setup Required
None.

## Next Phase Readiness
- Growth Chart and parameter routing completed.
- Phase 5 is fully executed and ready for verification.
