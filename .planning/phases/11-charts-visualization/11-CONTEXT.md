# Phase 11 Context: Charts & Visualization

<domain>
Biểu đồ phân tích khoản vay — stacked bar phân bổ gốc/lãi, area chart lũy kế, và cảnh báo vách đá lãi suất. Tất cả consume data từ `MortgageResult` (Phase 9).
</domain>

<canonical_refs>
- frontend/src/types.ts — `MortgageResult`, `YearlySummaryItem`, `PaymentScheduleItem`
- frontend/src/utils/mortgage.ts — `calculateMortgage()` engine
- frontend/src/components/UserShareChart.tsx — Chart.js pattern reference (useRef, manual Chart instance, dark theme)
- frontend/src/index.css (lines 73-100) — `.chart-scroll` CSS class cho horizontal scroll
- GEMINI.md — Chart.js 4.5.1 là library được chọn
</canonical_refs>

<decisions>

## Implementation Decisions

### Stacked Bar Chart
- **D-01:** Mặc định hiển thị theo năm (`yearlySummary[]`), có nút toggle sang xem theo tháng (`monthlySchedule[]`).
- **D-02:** Khi xem theo tháng (240 bars cho vay 20 năm), container dùng `.chart-scroll` CSS class sẵn có để scroll ngang.
- **D-03:** Mỗi bar gồm 2 segment: gốc (màu cam/đỏ) và lãi (màu xanh). Y-axis = số tiền VNĐ. Tooltip hiện chi tiết khi hover.

### Area Chart Lũy Kế
- **D-04:** Dùng filled area chart với 2 vùng chồng lên nhau (opacity/trong suốt) — hiện tổng lãi đã trả vs tổng gốc đã trả tích lũy theo thời gian.
- **D-05:** Data tính cumulative sum từ `monthlySchedule[]` — mỗi tháng accumulate `principalPaid` và `interestPaid`.
- **D-06:** Tooltip hover hiển thị số tiền cụ thể + tháng/năm.

### Vách Đá Lãi Suất
- **D-07:** Annotation trực tiếp trên stacked bar chart — vẽ đường dọc (vertical line) tại tháng chuyển đổi từ lãi ưu đãi sang thả nổi + label hiển thị chênh lệch thanh toán.
- **D-08:** Nếu `rateCliffPaymentBefore === rateCliffPaymentAfter` (lãi ưu đãi = lãi thả nổi) → không hiển thị cảnh báo.
- **D-09:** Sử dụng Chart.js annotation plugin (`chartjs-plugin-annotation`) cho vertical line.

### Chart Layout & Responsive
- **D-10:** Tab switcher với 2 tabs: "Phân bổ gốc/lãi" | "Lũy kế". Chỉ hiện 1 chart tại 1 thời điểm. Tiết kiệm space trên mobile.
- **D-11:** Mỗi chart là 1 component riêng (pattern như `UserShareChart.tsx`): `PaymentBreakdownChart.tsx` và `CumulativeChart.tsx`.
- **D-12:** Chart.js responsive mode tự co. Container 100% width. Mobile-friendly mặc định.

### File Organization
- **D-13:** Components: `PaymentBreakdownChart.tsx` (stacked bar + rate cliff annotation), `CumulativeChart.tsx` (filled area), `MortgageCharts.tsx` (tab wrapper).
- **D-14:** Tất cả dùng Chart.js 4.5.1 (đã có trong project), follow pattern `UserShareChart.tsx` (useRef + manual Chart instance + destroy on unmount).

</decisions>

<code_context>
## Reusable Assets
- `UserShareChart.tsx` — Chart.js doughnut chart pattern: `useRef<Chart>`, manual `new Chart()`, `chartInstanceRef.current.destroy()` cleanup
- `.chart-scroll` CSS class — horizontal scrollbar styling cho chart container (dark theme)
- `MortgageResult` interface — data source sẵn có với `yearlySummary[]`, `monthlySchedule[]`, `rateCliffPaymentBefore/After`
- Dark theme colors: `bg-[#17212b]`, `border-[#2c3847]`, text `text-gray-300`
</code_context>
