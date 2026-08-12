# Phase 9: Types & Calculation Engine - Research

## Technical Approach Analysis
- **Domain**: Engine tính toán khoản vay (Mortgage Loan Estimator), thuần logic, chạy 100% trên client.
- **Tính năng cốt lõi**:
  - Hỗ trợ 2 phương thức trả nợ: Dư nợ giảm dần (reducing balance) và Trả đều (fixed annuity).
  - Lãi suất 2 giai đoạn: Ưu đãi (promo) trong N tháng đầu, Thả nổi (floating) cho phần còn lại.
  - Ân hạn gốc: Giai đoạn đầu chỉ trả lãi, dư nợ gốc không đổi.
  - Số học VND: Chỉ sử dụng số nguyên (integer arithmetic), làm tròn với `Math.round()` sau mỗi phép tính.

## Existing Codebase Patterns
- **Types**: Khai báo thẳng vào `frontend/src/types.ts`. Dự án hiện đang dùng flat file cho các type interface. Cần định nghĩa: `LoanInputs`, `PaymentScheduleItem`, `YearlySummaryItem`, `MortgageResult`.
- **Calculation Engine**: Không mở rộng file `frontend/src/utils/interest.ts` vì logic khác biệt. Cần tạo file mới `frontend/src/utils/mortgage.ts` chứa pure functions, không side-effects.
- **Tiền tệ**: Các giá trị tiền tệ trong app đều được làm tròn (Math.round), không dùng thư viện precision như `big.js` hay `decimal.js`.

## Dependencies & Integration Points
- **Dependencies**: Không thêm bất kỳ package nào. Sử dụng hàm thuần Typescript.
- **Integration Points**: 
  - Engine sẽ xuất ra hàm `calculateMortgage` trả về một object `MortgageResult` chứa đầy đủ bảng lịch trả nợ (tháng, năm) và KPI tổng hợp. 
  - Các phase sau (Form, Chart, Bảng) sẽ gọi engine thông qua `useMemo` bên trong component React. Không lưu gì vào database hay gọi backend GAS.

## Edge Cases & Pitfalls
- **Sai số lũy kế (Floating-point accumulation)**: Qua 360 tháng vòng lặp, sai số thập phân có thể tích tụ lớn.
  *Giải pháp*: Làm tròn số tiền từng tháng (`Math.round`). Ở tháng cuối cùng, bắt buộc `tiền gốc trả = dư nợ còn lại` để tổng dư nợ về đúng 0.
- **Chia cho 0 ở Annuity**: Nếu lãi suất = 0%, công thức Annuity sẽ lỗi (chia cho 0).
  *Giải pháp*: Fallback `thanh toán hàng tháng = tổng dư nợ / số tháng`.
- **Validation ân hạn gốc**: Ân hạn gốc (grace period) phải nằm gọn trong thời gian ưu đãi (`gracePeriod <= promoMonths`). Throw/return error nếu vi phạm.
- **Lãi suất ân hạn**: Trong ân hạn, `principalPaid = 0`, lãi = dư nợ gốc * lãi suất. Không cộng dồn lãi vào gốc (simple interest).

## Recommended Implementation Approach
1. **Thêm type vào `frontend/src/types.ts`**:
   - `LoanInputs`: lưu các tham số (tiền vay, số năm, lãi ưu đãi, tháng ưu đãi, lãi thả nổi, phương thức trả nợ, tháng ân hạn gốc).
   - `PaymentScheduleItem`: cấu trúc dữ liệu 1 dòng lịch trả nợ (tháng, năm, gốc, lãi, tổng, dư nợ cuối).
   - `YearlySummaryItem`: cấu trúc gom nhóm năm cho Chart.
   - `MortgageResult`: KPI (total interest, rate cliff payment difference...) & arrays (monthlySchedule, yearlySchedule).
2. **Tạo engine `frontend/src/utils/mortgage.ts`**:
   - Implement hàm `calculateMortgage(inputs: LoanInputs): MortgageResult`.
   - Setup vòng lặp từ tháng 1 đến `tenureYears * 12`.
   - Xác định biến `rate` hiện tại dựa theo tháng (so với `promoMonths`).
   - Xử lý ân hạn gốc: Nếu `tháng <= gracePeriod`, tiền gốc trả = 0.
   - Xử lý 2 phương thức:
     - Giảm dần: Gốc đều (sau ân hạn) = `loanAmount / (totalMonths - gracePeriod)`.
     - Annuity: Tính PMT với gốc không đổi ở ân hạn, sau ân hạn tính PMT cho dư nợ còn lại và số tháng còn lại.
   - Tạo object month-by-month, sau đó aggregate ra yearly schedule và tính các KPI summary.
   - Throw/return lỗi sớm nếu input không hợp lệ.
