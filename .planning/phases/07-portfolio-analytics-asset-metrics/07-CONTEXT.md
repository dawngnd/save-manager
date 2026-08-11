# Phase 7: Portfolio Analytics & Asset Metrics - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Cung cấp bức tranh tổng quan phân bổ danh mục tiết kiệm active theo ngân hàng, nhóm kỳ hạn và đo lường chỉ số lãi suất trung bình gia quyền (WAIR). Tất cả biểu đồ và KPI nằm trong tab riêng "Analytics" mới.

**Scope chỉ bao gồm:** Frontend (tab Analytics mới, 2 Doughnut charts, 1 WAIR KPI card). **KHÔNG** sửa backend — dữ liệu deposits đã có đủ fields cần thiết.

</domain>

<decisions>
## Implementation Decisions

### Vị trí hiển thị
- **D-01:** Thêm tab **"Analytics"** mới — tab thứ 3 bên cạnh "Deposits" và "Gold" trong `App.tsx`. Cập nhật `ActiveTab` type thêm `'analytics'`.

### Bucket kỳ hạn
- **D-02:** Tính kỳ hạn bằng **`maturity_at - created_at`** (parse DD/MM/YYYY, tính số tháng). 4 bucket: `<3 tháng`, `3-6 tháng`, `6-12 tháng`, `>12 tháng`. Không thêm field mới vào DB.

### WAIR KPI
- **D-03:** Chỉ hiển thị **1 thẻ KPI duy nhất** — WAIR (Weighted Average Interest Rate) tính bằng `%`. Công thức: `Σ(amount × interest_rate) / Σ(amount)` cho tất cả deposits có `status === 'active'`. Không thêm tổng tài sản hay số khoản.

### Chart.js pattern
- **D-04:** Reuse pattern **BankShareChart.tsx** — `useRef` + `useEffect` cleanup với `chart.destroy()` khi unmount. Màu sắc palette **cố định** (dark theme hiện tại), không detect Telegram theme color.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Chart Components (Pattern Reference)
- `frontend/src/components/BankShareChart.tsx` — Doughnut chart theo ngân hàng, pattern chính để reuse
- `frontend/src/components/UserShareChart.tsx` — Doughnut chart theo user, pattern phụ
- `frontend/src/components/GrowthChart.tsx` — Line chart tăng trưởng
- `frontend/src/components/InterestRateChart.tsx` — Line chart lãi suất

### Data Types
- `frontend/src/types.ts` — Deposit interface với `amount`, `interest_rate`, `user_bankcode`, `status`, `created_at`, `maturity_at`

### App Entry
- `frontend/src/components/App.tsx` — Tab navigation hiện tại (deposits/gold), cần thêm tab analytics

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BankShareChart.tsx` — Doughnut chart đã implement đầy đủ: useRef canvas, Chart.js register modules, destroy on unmount, dark color palette. Copy pattern cho 2 chart mới.
- `extractBankCode()` trong `InterestRateChart.tsx` — parse `user_bankcode` thành bankcode. Dùng lại cho grouping.
- `Deposit.status === 'active'` — filter deposits active cho tính toán.
- `Chart.js` modules đã register toàn cục: `DoughnutController`, `ArcElement`, `Tooltip`, `Legend`.

### Established Patterns
- **Doughnut chart pattern**: Register → useRef → new Chart(ctx, config) → cleanup trong useEffect return. Xem `BankShareChart.tsx`.
- **Tab navigation**: `ActiveTab` type union + conditional render trong `App.tsx`.
- **Date parsing**: DD/MM/YYYY format, đã có utils parse trong codebase.

### Integration Points
- `App.tsx` line 19: `type ActiveTab = 'deposits' | 'gold'` → thêm `'analytics'`.
- `App.tsx` tab buttons section → thêm nút Analytics.
- `useDepositsCache` hook → cung cấp deposits data cho tab Analytics.

</code_context>

<specifics>
## Specific Ideas

Không có yêu cầu đặc biệt — triển khai theo standard chart patterns đã mô tả.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-Portfolio Analytics & Asset Metrics*
*Context gathered: 2026-08-11*
