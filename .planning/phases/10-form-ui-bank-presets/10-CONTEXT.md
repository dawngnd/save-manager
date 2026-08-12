# Phase 10: Form UI & Bank Presets - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Xây dựng giao diện form nhập tham số khoản vay với progressive disclosure (4 fields cơ bản hiển thị, phần nâng cao ẩn), bank preset selector auto-fill lãi suất, KPI summary cards inline, và localStorage persist inputs. Đây là phase UI — kết nối form inputs tới engine `calculateMortgage()` đã có từ Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Bank Preset Behavior
- **D-01:** Preset chỉ fill 3 field lãi suất: `promoRate`, `promoMonths`, `floatingRate`. KHÔNG ghi đè tiền vay, thời hạn, phương thức trả nợ.
- **D-02:** User tự do edit lại bất kỳ field nào sau khi chọn preset. Preset chỉ là điểm khởi đầu, không lock.
- **D-03:** Dữ liệu preset hardcode trong file TypeScript `frontend/src/data/bankPresets.ts`. Không gọi API, không cần backend.

### Progressive Disclosure
- **D-04:** 4 fields cơ bản luôn hiển thị: Tiền vay (VNĐ), Thời hạn (năm), Lãi suất ưu đãi (%/năm), Phương thức trả nợ (dropdown).
- **D-05:** Expandable section mở bằng click toggle button. Label: "Tùy chọn nâng cao" hoặc "Chi tiết thêm". User chủ động mở/đóng.
- **D-06:** Default values cho fields ẩn: Ân hạn gốc = 0 tháng, Lãi thả nổi = 8.5%/năm, Thời gian ưu đãi = 12 tháng.

### Realtime Calculation
- **D-07:** Tính toán debounce 300ms — tránh gọi `calculateMortgage()` quá nhiều khi user đang gõ.
- **D-08:** KPI summary cards (tổng lãi, tổng trả, tỷ lệ lãi/gốc) hiển thị inline ngay dưới form. Bảng lịch trả nợ + charts nằm ở Phase 11-12.

### File Organization
- **D-09:** Tách nhỏ components: `MortgageForm.tsx` (form chính + state management), `BankPresetSelector.tsx` (dropdown preset), `MortgageKpiCards.tsx` (hiển thị KPI summary).
- **D-10:** Bank presets data tại `frontend/src/data/bankPresets.ts` — tách data ra khỏi component, dễ update.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### From Phase 9
- `frontend/src/types.ts` — LoanInputs, MortgageResult, PaymentScheduleItem types
- `frontend/src/utils/mortgage.ts` — calculateMortgage() engine, pure function

### Existing Patterns
- `frontend/src/components/DepositForm.tsx` — Form pattern: useState, FormErrors, touched, validation, Tailwind styling
- `frontend/src/components/BottomSheet.tsx` — Modal/overlay pattern
- `frontend/src/components/WairKpiCard.tsx` — KPI card display pattern

### Requirements
- `.planning/REQUIREMENTS.md` — CONF-01..04 mapped to this phase

### Research
- `.planning/research/FEATURES.md` — Bank rate data (Vietcombank, BIDV, Vietinbank, VPBank)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DepositForm.tsx`: Complete form pattern (useState per field, FormErrors interface, touched tracking, validation, submit flow)
- `WairKpiCard.tsx`: KPI card rendering pattern — reuse for mortgage KPI summary
- Tailwind dark theme styling consistent across app

### Established Patterns
- Form state: individual `useState<string>` per field, not `useReducer`
- Validation: `validateField()` function with error messages
- Currency format: `toLocaleString('vi-VN') + ' ₫'`
- Component naming: PascalCase, exported as named export

### Integration Points
- `calculateMortgage(inputs: LoanInputs)` from `utils/mortgage.ts` — debounced via `useMemo` hoặc `useEffect` + timeout
- `LoanInputs` type from `types.ts` — form state maps directly to this interface
- `MortgageResult.totalInterest`, `.totalPayment`, `.interestToLoanRatio` — KPI cards data

</code_context>

<specifics>
## Specific Ideas

- Bank preset selector nên có option "Tùy chỉnh" (custom) ngoài 4 ngân hàng — cho user tự nhập hoàn toàn
- localStorage key pattern: `mortgage_form_inputs` — serialize LoanInputs object
- Debounce chỉ áp dụng cho text inputs (tiền vay, lãi suất). Dropdown/toggle thay đổi → tính ngay

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-Form UI & Bank Presets*
*Context gathered: 2026-08-12*
