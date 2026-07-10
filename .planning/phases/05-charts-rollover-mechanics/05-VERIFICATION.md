---
phase: 05-charts-rollover-mechanics
verified: 2026-07-10T13:52:00+07:00
status: human_needed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 5: Charts & Rollover Mechanics Verification Report

**Phase Goal:** Implement the Rollover interaction for matured deposits, visual stepwise timeseries asset growth chart using Chart.js, launch parameter routing, and Telegram webhook command integration.
**Verified:** 2026-07-10T13:52:00+07:00
**Status:** human_needed (visual verification of UI components and bot button behavior required)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Nút "Tái tục" chỉ hiển thị đối với thẻ khoản gửi có `diffDays <= 0` trong panel chi tiết (D-01). | ✓ VERIFIED | `DepositList.tsx#isMaturedOrOverdue` checks `diffDays <= 0` via `calculateDaysBetween` with today's date. The Tái tục button is conditionally rendered in the detail panel. |
| 2   | Form Tái tục được điền sẵn thông tin mặc định theo quy định (ngày bắt đầu mới = ngày đáo hạn cũ, ngày đáo hạn mới = +1 năm với leap-year check) (D-02). | ✓ VERIFIED | `RolloverForm.tsx` (lines 61-72) initializes `amount` to old amount, `interestRate` to old rate, `createdAt` to old `maturity_at`, and `maturityAt` to `getNextYearDateStr(oldDeposit.maturity_at)`. Leap year case is guarded (29/02 -> 28/02). |
| 3   | Gửi API `rollover_deposit` thành công và reload danh sách. | ✓ VERIFIED | `RolloverForm.tsx` (lines 199-228) invokes `callBackendApi` with `action: 'rollover_deposit'` and details, triggers `onSuccess()` on resolve to refresh App deposits, and closes form. |
| 4   | Cài đặt `chart.js` thành công. | ✓ VERIFIED | `"chart.js": "^4.5.1"` exists in `frontend/package.json`. TypeScript and Vite single-file production compilation succeeded without errors. |
| 5   | Đồ thị tăng trưởng dạng step-wise từ hôm nay tới ngày đáo hạn xa nhất (D-03, D-04). | ✓ VERIFIED | `GrowthChart.tsx#generateStepWiseGrowthData` processes only active/matured deposits. Expected interest is realized step-wise on or after the exact maturity date. Chart is configured with `tension: 0`. |
| 6   | Đồ thị hiển thị khi URL query có `view=chart` hoặc `startParam=chart` (D-05). | ✓ VERIFIED | `App.tsx` (lines 46-63) extracts parameters from `window.location.search` and Telegram `initData?.startParam` to set `showChart` state. |
| 7   | Phản hồi Telegram Bot `/chart` chứa nút mở Web App gắn link `view=chart` (D-06). | ✓ VERIFIED | `backend/Code.js#handleTelegramWebhook` checks for `/chart` and appends `?view=chart` or `&view=chart` to `MINI_APP_URL` in the inline keyboard markup. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `frontend/src/components/RolloverForm.tsx` | New component rendering matured deposit rollover inputs as a Bottom Sheet with validation & interest preview. | ✓ VERIFIED | Substantive form implementation with inline errors, date mask formatting, and expected interest preview. |
| `frontend/src/components/GrowthChart.tsx` | New component rendering step-wise asset growth projection chart using native Chart.js with memory cleanup. | ✓ VERIFIED | Native canvas integration with `chartInstance.destroy()` on cleanup. Uses custom tooltips and step-wise computation. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `frontend/src/components/DepositList.tsx` | `frontend/src/components/App.tsx` | Callback `onTriggerRollover` | ✓ VERIFIED | Details sheet button click triggers callback to set selected deposit and open bottom sheet. |
| URL query parameters / TWA launch params | `frontend/src/components/App.tsx` | `showChart` state toggle | ✓ VERIFIED | `useEffect` parses query parameters at launch to activate `showChart` and render `GrowthChart`. |
| `backend/Code.js` | Telegram Client Web App | Inline keyboard markup link | ✓ VERIFIED | Webhook command `/chart` routes to sending message with direct Web App button pointing to `view=chart`. |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `frontend/src/components/GrowthChart.tsx` | Step-wise timeseries points | Active/Matured deposits list | Yes | ✓ FLOWING | Uses `generateStepWiseGrowthData` to generate a daily sequence of cumulative asset projection points from today to the max maturity date. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Compile and Bundle Frontend | `npm run build` inside `frontend/` | `dist/index.html 470.96 kB` generated successfully. | ✓ PASS |
| Execute Backend Test Suite | `node -e "..."` (eval of Code.js and Tests.js) | `=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===` (includes testExecuteRolloverDeposit) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| **STAT-01** | `05-02-PLAN.md` | Hiển thị thống kê tổng tài sản dạng biểu đồ timeseries sử dụng `Chart.js`. | ✓ SATISFIED | step-wise line chart correctly mapped using canvas elements and optimized imports to stay under single-file limits. |
| **DEP-02** | `05-01-PLAN.md` | Tính năng Tái tục (Rollover) ngay trên giao diện. | ✓ SATISFIED | Tái tục CTA in details sheet triggers Bottom Sheet form prefilled with old values, submitting a GAS API request. |

### Anti-Patterns Found

None. Code is free of stubs, debt markers, `TODO` or `FIXME` comments in modified files.

### Human Verification Required (UAT Steps)

Since Phase 5 introduces interactive forms, canvas chart rendering, and bot web view routing, the following UAT steps must be verified manually by a human:

1. **Details CTA and Prefilling Check:**
   - Launch the application and select a matured deposit (`diffDays <= 0`).
   - Confirm that the "Tái tục" button is visible inside the detail panel.
   - Click "Tái tục" and verify the Rollover Form Bottom Sheet opens, prefilled with:
     - New principal = old principal.
     - New interest rate = old interest rate.
     - Start date = old maturity date.
     - New maturity date = old maturity date + 1 year (e.g., `29/02/2024` -> `28/02/2025` for leap-year check).
2. **Step-wise Projection Chart Check:**
   - Launch the app with query parameter `?view=chart`.
   - Check that the `GrowthChart` card renders at the top of the interface.
   - Expand the chart and hover over points to verify the step-wise cumulative asset calculation. The total value should increase exactly on maturity dates.
   - Click "Ẩn biểu đồ" and confirm the chart collapses, and "Hiện biểu đồ" expands it back.
3. **Telegram Bot Command Routing Check:**
   - Send the `/chart` command to the Telegram Bot.
   - Check that the bot replies with the message "Nhấn nút dưới đây để xem biểu đồ dự phóng tăng trưởng tài sản của bạn:" and includes an inline button labeled "📈 Xem biểu đồ".
   - Tap "📈 Xem biểu đồ" and verify the Web App opens directly to the screen with the expanded Growth Chart.

### Gaps Summary

No architectural or logic gaps found. All automated tests pass successfully. Final clearance is pending visual and end-to-end bot UAT checks.

---
_Verified: 2026-07-10T13:52:00+07:00_
_Verifier: the verifier agent (gsd-verifier)_
