---
phase: 11
plan: 1
type: feature
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/PaymentBreakdownChart.tsx
  - frontend/src/components/CumulativeChart.tsx
  - frontend/src/components/MortgageCharts.tsx
  - frontend/src/components/MortgageForm.tsx
  - frontend/package.json
autonomous: true
requirements:
  - VIS-03
  - VIS-04
  - VIS-05
---

# Kế hoạch Phase 11: Charts & Visualization

Mục tiêu: Xây dựng biểu đồ stacked bar phân bổ gốc/lãi (toggle năm/tháng), biểu đồ lũy kế filled area chart, cảnh báo vách đá lãi suất (annotation), và tab switcher wrapper. Tích hợp vào MortgageForm.

## must_haves
- D-01: Mặc định hiển thị theo năm, có nút toggle sang tháng
- D-02: Khi xem tháng, scroll ngang dùng .chart-scroll
- D-03: Stacked bar 2 segment: gốc (cam) + lãi (xanh)
- D-04: Filled area chart 2 vùng chồng với opacity
- D-05: Cumulative sum từ monthlySchedule[]
- D-06: Tooltip hover hiển thị số tiền + tháng/năm
- D-07: Annotation vertical line tại tháng chuyển đổi lãi suất
- D-08: Không hiện annotation nếu rates bằng nhau
- D-09: Dùng chartjs-plugin-annotation
- D-10: Tab switcher 2 tabs: "Phân bổ gốc/lãi" | "Lũy kế"
- D-11: Mỗi chart là component riêng
- D-12: Chart.js responsive mode, container 100% width
- D-13: File tổ chức: PaymentBreakdownChart, CumulativeChart, MortgageCharts
- D-14: Follow pattern UserShareChart.tsx (useRef + manual Chart instance)
- VIS-03: Biểu đồ stacked bar phân bổ gốc/lãi theo năm với option xem theo tháng
- VIS-04: Biểu đồ lũy kế lãi vs gốc đã trả dạng area/line chart
- VIS-05: Cảnh báo vách đá lãi suất highlight chênh lệch payment

## Artifacts this phase produces

- `PaymentBreakdownChart` (React Component)
- `CumulativeChart` (React Component)
- `MortgageCharts` (React Component — tab wrapper)

## Tasks

<task>
<type>command</type>
<files>
- frontend/package.json
</files>
<read_first>
- frontend/package.json
</read_first>
<action>
Cài đặt `chartjs-plugin-annotation` cho rate cliff annotation:
```bash
cd frontend && npm install chartjs-plugin-annotation
```
</action>
<acceptance_criteria>
- `chartjs-plugin-annotation` xuất hiện trong dependencies của `frontend/package.json`.
</acceptance_criteria>
<verify>
Chạy `npm ls chartjs-plugin-annotation` trong thư mục frontend/ để xác nhận package đã cài.
</verify>
</task>

<task>
<type>file_creation</type>
<files>
- frontend/src/components/PaymentBreakdownChart.tsx
</files>
<read_first>
- frontend/src/types.ts
- frontend/src/components/UserShareChart.tsx
- .planning/phases/11-charts-visualization/11-RESEARCH.md
- .planning/phases/11-charts-visualization/11-PATTERNS.md
</read_first>
<action>
Tạo file `frontend/src/components/PaymentBreakdownChart.tsx`.
1. Import Chart.js modules: `BarController`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend` + `annotationPlugin` from `chartjs-plugin-annotation`.
2. Props interface: `result: MortgageResult`, `promoMonths: number`.
3. State `viewMode: 'yearly' | 'monthly'` (default `'yearly'`).
4. useRef + useEffect lifecycle pattern từ `UserShareChart.tsx` — destroy trước khi tạo mới.
5. Khi `viewMode === 'yearly'`: dùng `result.yearlySummary[]` cho data. Labels = `Năm 1, Năm 2, ...`.
6. Khi `viewMode === 'monthly'`: dùng `result.monthlySchedule[]` cho data. Labels = `T1, T2, ...`. Container bọc trong `div.chart-scroll` với `min-width: ${monthCount * 15}px`.
7. 2 datasets stacked: gốc (`#ef5350`, opacity 0.8) và lãi (`#64b5f6`, opacity 0.8).
8. Y-axis formatter: `toLocaleString('vi-VN')` + ` ₫`.
9. Rate cliff annotation (D-07, D-09): nếu `rateCliffPaymentBefore !== rateCliffPaymentAfter`, vẽ vertical line tại vị trí tháng `promoMonths` (yearly mode: `Math.ceil(promoMonths / 12) - 1`, monthly mode: `promoMonths - 1`). Label hiện chênh lệch % tăng.
10. Dark theme colors: grid `#2c3847`, ticks `#708499`, tooltip theo pattern.
11. Toggle button "Năm" / "Tháng" ở header.
</action>
<acceptance_criteria>
- Component render stacked bar chart từ `MortgageResult`.
- Toggle giữa yearly/monthly view hoạt động.
- Rate cliff annotation hiển thị khi có chênh lệch, ẩn khi không.
- Dark theme styling nhất quán.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_creation</type>
<files>
- frontend/src/components/CumulativeChart.tsx
</files>
<read_first>
- frontend/src/types.ts
- frontend/src/components/UserShareChart.tsx
- .planning/phases/11-charts-visualization/11-RESEARCH.md
</read_first>
<action>
Tạo file `frontend/src/components/CumulativeChart.tsx`.
1. Import Chart.js modules: `LineController`, `LineElement`, `PointElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`, `Filler`.
2. Props interface: `result: MortgageResult`.
3. useMemo tính cumulative sum từ `result.monthlySchedule[]`: 2 mảng `cumulativePrincipal` và `cumulativeInterest`.
4. useRef + useEffect lifecycle pattern (destroy + create).
5. type: `'line'`, 2 datasets:
   - Gốc đã trả: `fill: true`, `backgroundColor: 'rgba(239,83,80,0.3)'`, `borderColor: '#ef5350'`
   - Lãi đã trả: `fill: true`, `backgroundColor: 'rgba(100,181,246,0.3)'`, `borderColor: '#64b5f6'`
6. X-axis labels: `T1, T2, ...` hoặc `Năm 1, Năm 2` gom theo năm nếu > 120 tháng (hiển thị gọn hơn).
7. Tooltip callback hiển thị số tiền VNĐ + tháng.
8. `pointRadius: 0` cho smooth line (quá nhiều điểm).
9. Dark theme colors nhất quán.
</action>
<acceptance_criteria>
- Component render filled area chart với 2 vùng overlap.
- Cumulative sum tính đúng.
- Tooltip hover hiện số tiền + thời gian.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_creation</type>
<files>
- frontend/src/components/MortgageCharts.tsx
</files>
<read_first>
- frontend/src/components/PaymentBreakdownChart.tsx
- frontend/src/components/CumulativeChart.tsx
</read_first>
<action>
Tạo file `frontend/src/components/MortgageCharts.tsx`.
1. Props: `result: MortgageResult | null`, `promoMonths: number`.
2. State `activeTab: 'breakdown' | 'cumulative'` (default `'breakdown'`).
3. Nếu `result === null` → return null.
4. Render:
   - Container `bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl`.
   - Header: icon 📊 + "Biểu đồ phân tích".
   - Tab buttons: 2 nút "Phân bổ gốc/lãi" | "Lũy kế". Active tab dùng `bg-[#64b5f6] text-[#0e1621]`, inactive dùng `bg-[#2c3847] text-[#708499]`.
   - Conditional render: `activeTab === 'breakdown'` → `<PaymentBreakdownChart>`, `activeTab === 'cumulative'` → `<CumulativeChart>`.
</action>
<acceptance_criteria>
- Tab switcher hoạt động, chuyển giữa 2 charts.
- Styling nhất quán với dark theme.
- Trả null khi không có result.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_modification</type>
<files>
- frontend/src/components/MortgageForm.tsx
</files>
<read_first>
- frontend/src/components/MortgageForm.tsx
- frontend/src/components/MortgageCharts.tsx
</read_first>
<action>
Sửa file `frontend/src/components/MortgageForm.tsx`:
1. Import `MortgageCharts` from `./MortgageCharts`.
2. Sau `<MortgageKpiCards>`, thêm `<MortgageCharts result={mortgageResult} promoMonths={parseInt(promoMonths) || 12} />`.
</action>
<acceptance_criteria>
- `MortgageCharts` được render sau KPI cards trong MortgageForm.
- Props truyền đúng `mortgageResult` và `promoMonths`.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi. npm run build thành công.
</verify>
</task>

## Verification

1. Kiểm tra build: `npm run build` hoặc `tsc --noEmit` trong frontend/ không báo lỗi.
2. Kiểm tra Stacked Bar: Mở trình duyệt, nhập form, xác nhận chart hiện gốc/lãi stacked. Toggle năm↔tháng.
3. Kiểm tra Area Chart: Switch tab "Lũy kế", xác nhận 2 vùng filled overlap.
4. Kiểm tra Rate Cliff: Với promoRate ≠ floatingRate, xác nhận vertical line annotation trên chart. Với rates bằng nhau, annotation phải ẩn.
5. Kiểm tra Responsive: Resize viewport, charts co theo container.
