# Phase 9: Types & Calculation Engine - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Xây dựng domain types TypeScript và pure calculation engine cho mortgage estimation. Engine hỗ trợ 2 phương thức trả nợ (Dư nợ giảm dần + Annuity), lãi suất 2 giai đoạn (ưu đãi cố định → thả nổi), ân hạn gốc, và integer VND arithmetic. Đây là phase thuần logic — không có UI, không có charts.

</domain>

<decisions>
## Implementation Decisions

### Grace Period Model
- **D-01:** Ân hạn gốc nằm TRONG giai đoạn lãi suất ưu đãi. Timeline khoản vay: `[ân hạn gốc: chỉ trả lãi ưu đãi] → [ưu đãi còn lại: trả gốc+lãi ưu đãi] → [thả nổi: trả gốc+lãi thả nổi]`.
- **D-02:** Validate ân hạn gốc phải ≤ thời gian ưu đãi. Reject (throw error hoặc return validation error) nếu vượt.
- **D-03:** Trong giai đoạn ân hạn, lãi tính trên TOÀN BỘ dư nợ gốc ban đầu (gốc không giảm vì chưa trả gốc). Không cộng dồn lãi vào gốc (simple interest).

### File Organization
- **D-04:** Mortgage types (LoanInputs, RateSegment, PaymentScheduleItem, MortgageResult, etc.) thêm vào `frontend/src/types.ts` hiện tại — giữ flat file pattern, app nhỏ không cần tách.
- **D-05:** Calculation engine tại `frontend/src/utils/mortgage.ts` — file riêng, KHÔNG mở rộng `interest.ts`. Hai domain tính toán hoàn toàn khác nhau (iterative amortization vs simple interest).

### Output Design
- **D-06:** Single function `calculateMortgage(inputs: LoanInputs) → MortgageResult`. Trả về full monthly schedule + yearly aggregation + summary KPI trong 1 object. Downstream components dùng `useMemo` cache.
- **D-07:** MortgageResult chứa cả `monthlySchedule: PaymentScheduleItem[]` và `yearlySummary: YearlySummaryItem[]`. Engine tính sẵn cả hai — Phase 11 Charts dùng trực tiếp.
- **D-08:** Summary KPI tính sẵn trong MortgageResult: `totalInterest`, `totalPayment`, `interestToLoanRatio`, `firstMonthPayment`, `peakPayment`, `rateCliffPaymentBefore`, `rateCliffPaymentAfter`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research Findings
- `.planning/research/FEATURES.md` — Cấu trúc khoản vay VN (2 phương thức, lãi suất 2 giai đoạn, ân hạn gốc), công thức tính, so sánh ngân hàng
- `.planning/research/PITFALLS.md` — Floating-point accumulation, edge cases (0% rate, PMT divide-by-zero), integer VND arithmetic requirement
- `.planning/research/ARCHITECTURE.md` — Component structure, data flow, integration points
- `.planning/research/SUMMARY.md` — Synthesized findings, phase structure recommendation

### Existing Code
- `frontend/src/types.ts` — Existing type definitions (User, Deposit, GoldRecord, GoldPrice) — add mortgage types here
- `frontend/src/utils/interest.ts` — Existing interest calculation pattern (Math.round, simple interest) — do NOT extend, create new file

### Requirements
- `.planning/REQUIREMENTS.md` — CALC-01..05 mapped to this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `types.ts`: Flat file pattern for all domain types — add mortgage interfaces here
- `interest.ts`: Shows project's number handling pattern (Math.round for VND, no precision libs)

### Established Patterns
- Integer VND: All monetary values use `Math.round()` — mortgage engine MUST follow same pattern
- Pure functions: `calculateExpectedInterest()` is a pure function with no side effects — mortgage engine should follow same pattern
- Error handling: `try/catch` with `return 0` fallback in interest.ts

### Integration Points
- `types.ts` — new mortgage types added alongside existing types
- `utils/mortgage.ts` — new file, no integration with existing utils needed
- Phase 10 (Form) and Phase 11 (Charts) will import from both files

</code_context>

<specifics>
## Specific Ideas

- Annuity formula MUST guard against 0% interest rate (PMT formula divides by zero when rate=0 → return simple division instead)
- Final month adjustment: last month's principal = remaining balance to ensure schedule sums to exactly 0 VND
- Rate cliff detection: engine should identify the month where rate changes and calculate payment difference for VIS-05

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 9-Types & Calculation Engine*
*Context gathered: 2026-08-12*
