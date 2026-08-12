---
phase: 09
plan: 1
type: execution
wave: 1
depends_on: []
files_modified:
  - frontend/src/types.ts
  - frontend/src/utils/mortgage.ts
autonomous: true
requirements:
  - CALC-01
  - CALC-02
  - CALC-03
  - CALC-04
  - CALC-05
---

# Phase 09: Types & Calculation Engine - Execution Plan

## Phase Goal
Xây dựng domain types TypeScript và pure calculation engine cho mortgage estimation. Hỗ trợ 2 phương thức trả nợ, lãi suất 2 giai đoạn, ân hạn gốc, và integer VND arithmetic.

## must_haves
- Định nghĩa đầy đủ `RepaymentMethod`, `LoanInputs`, `PaymentScheduleItem`, `YearlySummaryItem`, `MortgageResult` trong `frontend/src/types.ts`.
- File mới `frontend/src/utils/mortgage.ts` chứa logic `calculateMortgage`.
- Xử lý phương thức Dư nợ giảm dần (CALC-01) và Trả đều hàng tháng (CALC-02).
- Xử lý lãi suất 2 giai đoạn (CALC-03).
- Xử lý KPI tổng hợp như tổng lãi, tổng trả, tỷ lệ (CALC-04).
- Xử lý ân hạn gốc (CALC-05).
- Mọi tính toán số tiền sử dụng integer arithmetic và làm tròn bằng `Math.round()`.

## Tasks

<task>
<type>code</type>
<files>
- frontend/src/types.ts
</files>
<read_first>
- frontend/src/types.ts
</read_first>
<action>
Thêm các interface và type mới vào cuối file `frontend/src/types.ts`:
1. `export type RepaymentMethod = 'reducing_balance' | 'annuity';`
2. `export interface LoanInputs`:
   - `loanAmount: number`
   - `tenureYears: number`
   - `promoRate: number`
   - `promoMonths: number`
   - `floatingRate: number`
   - `repaymentMethod: RepaymentMethod`
   - `gracePeriodMonths: number`
3. `export interface PaymentScheduleItem`:
   - `month: number`
   - `year: number`
   - `principalPaid: number`
   - `interestPaid: number`
   - `totalPayment: number`
   - `remainingBalance: number`
   - `interestRate: number`
4. `export interface YearlySummaryItem`:
   - `year: number`
   - `principalPaid: number`
   - `interestPaid: number`
   - `totalPayment: number`
   - `remainingBalance: number`
5. `export interface MortgageResult`:
   - `monthlySchedule: PaymentScheduleItem[]`
   - `yearlySummary: YearlySummaryItem[]`
   - `totalInterest: number`
   - `totalPayment: number`
   - `interestToLoanRatio: number`
   - `firstMonthPayment: number`
   - `peakPayment: number`
   - `rateCliffPaymentBefore: number`
   - `rateCliffPaymentAfter: number`
</action>
<acceptance_criteria>
- Source assertion: `frontend/src/types.ts` chứa định nghĩa `RepaymentMethod`, `LoanInputs`, `PaymentScheduleItem`, `YearlySummaryItem`, `MortgageResult`.
- Source assertion: Không phá hỏng các type đang có (`User`, `Deposit`, v.v.).
</acceptance_criteria>
<verify>
Chạy `npx tsc --noEmit` để đảm bảo code compile lỗi (nếu có dự án config TSC) hoặc mắt thường thấy file đã export đúng.
</verify>
</task>

<task>
<type>code</type>
<files>
- frontend/src/utils/mortgage.ts
</files>
<read_first>
- frontend/src/types.ts
</read_first>
<action>
Tạo file mới `frontend/src/utils/mortgage.ts` với các yêu cầu:
1. Import `LoanInputs`, `MortgageResult`, `PaymentScheduleItem`, `YearlySummaryItem` từ `../types`.
2. Tạo và export function `calculateMortgage(inputs: LoanInputs): MortgageResult`.
3. Khởi tạo mảng `monthlySchedule` và các biến tracking logic:
   - `totalMonths = inputs.tenureYears * 12`
   - Throw/return error báo nếu `inputs.gracePeriodMonths > inputs.promoMonths`.
4. Vòng lặp từ `month = 1` đến `totalMonths`:
   - Lãi suất tháng hiện tại `currentRate` = (`month <= inputs.promoMonths`) ? `inputs.promoRate` : `inputs.floatingRate`.
   - Tiền lãi tháng hiện tại = `Math.round(remainingBalance * (currentRate / 100 / 12))`.
   - Nếu `month <= inputs.gracePeriodMonths` (ân hạn gốc), `principalPaid = 0`.
   - Nếu hết ân hạn gốc:
     - Dư nợ giảm dần: `principalPaid = Math.round(inputs.loanAmount / (totalMonths - inputs.gracePeriodMonths))`. Ở tháng cuối cùng (`month === totalMonths`), `principalPaid = remainingBalance`.
     - Trả đều (Annuity): Tính PMT cho phần kỳ hạn còn lại với dư nợ hiện tại (sử dụng công thức tính dòng tiền trả đều). Fallback `principalPaid = remainingBalance / (totalMonths - month + 1)` nếu rate = 0. PMT = `totalPayment - interestPaid`. Ở tháng cuối cùng, `principalPaid = remainingBalance`.
   - Cập nhật `remainingBalance = remainingBalance - principalPaid`.
5. Tạo `yearlySummary` bằng cách gom nhóm `monthlySchedule` theo biến `year = Math.ceil(month / 12)`.
6. Trích xuất KPIs:
   - `totalInterest`, `totalPayment`, `interestToLoanRatio`.
   - `firstMonthPayment` là totalPayment tháng 1.
   - `peakPayment` là max của tất cả totalPayment.
   - `rateCliffPaymentBefore` là totalPayment ở tháng cuối ưu đãi.
   - `rateCliffPaymentAfter` là totalPayment ở tháng đầu tiên thả nổi.
7. Return object `MortgageResult`.
</action>
<acceptance_criteria>
- Source assertion: `calculateMortgage` trả về chính xác object `MortgageResult`.
- Source assertion: Lãi và Gốc từng tháng được làm tròn bằng `Math.round`.
- Source assertion: Logic ưu đãi (promo) và thả nổi (floating) được map đúng số tháng.
- Source assertion: Ân hạn gốc hoạt động, `principalPaid` bằng 0 trong suốt giai đoạn này.
</acceptance_criteria>
<verify>
Mở file `frontend/src/utils/mortgage.ts`, kiểm tra hàm `calculateMortgage` và các công thức trả nợ.
</verify>
</task>

## Artifacts this phase produces
- Decorators: N/A
- Classes: N/A
- Functions: `calculateMortgage`
- CLI flags: N/A
- Struct/Dataclass fields: 
  - `RepaymentMethod` (Type string)
  - `LoanInputs` (Interface)
  - `PaymentScheduleItem` (Interface)
  - `YearlySummaryItem` (Interface)
  - `MortgageResult` (Interface)
- New file paths:
  - `frontend/src/utils/mortgage.ts`
