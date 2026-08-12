# Phase 12 Context: Summary, Schedule & Tab Integration

<domain>
Tích hợp cuối cùng của Mortgage Estimator — bảng lịch trả nợ chi tiết (accordion gộp năm), và tab "Vay" trong App.tsx bottom bar.
</domain>

<canonical_refs>
- frontend/src/types.ts — `MortgageResult`, `PaymentScheduleItem`, `YearlySummaryItem`
- frontend/src/components/App.tsx — Tab system (`ActiveTab`, bottom bar navigation)
- frontend/src/components/MortgageForm.tsx — Container chính (form + KPIs + charts)
- frontend/src/components/MortgageKpiCards.tsx — KPI cards (VIS-02 đã covered)
- frontend/src/components/MortgageCharts.tsx — Charts wrapper (Phase 11)
</canonical_refs>

<decisions>

## Implementation Decisions

### Bảng Lịch Trả Nợ Accordion (VIS-01)
- **D-01:** Accordion gộp theo năm — header năm hiển thị tổng gốc + tổng lãi của năm đó. Click expand/collapse xem từng tháng.
- **D-02:** 6 cột cho mỗi hàng tháng: Tháng, Lãi suất (%), Gốc, Lãi, Tổng trả, Số dư còn lại.
- **D-03:** Cột lãi suất giúp user thấy rõ rate cliff (chuyển từ ưu đãi sang thả nổi).
- **D-04:** Format tiền: `toLocaleString('vi-VN')` + ` ₫` nhất quán với toàn app.
- **D-05:** Mặc định tất cả năm đều collapse. User click mở từng năm.

### KPI Tổng Kết (VIS-02)
- **D-06:** [informational] MortgageKpiCards (Phase 10) đã hiển thị đủ 4 KPIs cần thiết: Tổng thanh toán, Tổng lãi, Tỷ lệ Lãi/Gốc, Peak payment. VIS-02 đã được cover, không cần component mới.

### Tab Integration (INTG-01)
- **D-07:** Thêm `'mortgage'` vào `ActiveTab` type: `'deposits' | 'gold' | 'analytics' | 'mortgage'`.
- **D-08:** Tab "Vay" ở vị trí thứ 4 (cuối cùng) trong bottom bar: Deposits | Gold | Analytics | Vay.
- **D-09:** Icon cho tab: 🏠 (nhà).
- **D-10:** Tạo `MortgageTab.tsx` wrapper chứa `MortgageForm` (bao gồm KPIs + Charts) + `AmortizationTable` bên dưới.

### File Organization
- **D-11:** File mới: `AmortizationTable.tsx` (bảng lịch trả nợ accordion), `MortgageTab.tsx` (tab wrapper).
- **D-12:** Sửa file: `App.tsx` (thêm tab + import MortgageTab).

</decisions>

<code_context>
## Reusable Assets
- `App.tsx` tab pattern: `useState<ActiveTab>`, bottom bar buttons với conditional styling (`bg-[#64b5f6] text-[#0e1621]` active, `text-[#708499]` inactive)
- Dark theme container: `bg-[#0e1621]`, `border-[#2b394a]`, `rounded-2xl`
- VNĐ format: `toLocaleString('vi-VN')` + ` ₫`
- `MortgageResult.monthlySchedule[]` — data source cho bảng (PaymentScheduleItem có: month, year, principalPaid, interestPaid, totalPayment, remainingBalance, interestRate)
- `MortgageResult.yearlySummary[]` — data source cho accordion headers (YearlySummaryItem có: year, principalPaid, interestPaid, totalPayment, remainingBalance)
</code_context>
