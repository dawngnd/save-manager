# Pitfalls Research

**Domain:** Mortgage Loan Estimator Module — React SPA + Chart.js + Single-File Bundle on GAS
**Milestone:** v3.0 Mortgage Loan Estimator
**Researched:** 2026-08-12
**Confidence:** HIGH

---

## Executive Summary

Adding a **mortgage loan estimator** module to the existing Save Manager app introduces pitfalls across **financial calculation accuracy**, **Vietnamese banking domain complexity**, **chart performance on mobile**, **bundle size inflation**, and **UX overwhelm**. The current bundle is already 552KB — aggressive dependency management is mandatory.

---

## Critical Pitfalls

### Pitfall 1: Floating-Point Accumulation Errors in 360-Month Amortization Schedule

**What goes wrong:** Monthly payment amounts, cumulative interest totals, or remaining principal balance drifts by thousands of VND after iterating through 360 months. User compares output with bank's table and sees discrepancy.

**Why it happens:** JavaScript IEEE 754 double-precision. Each monthly calculation introduces tiny rounding error that compounds across 360 iterations.

**How to avoid:**
1. **Integer arithmetic (VND has no fractional unit):** Store all monetary values as integers. Round to integer after each monthly step:
```typescript
const monthlyInterest = Math.round(remainingPrincipal * monthlyRate);
const principalPayment = Math.round(totalPayment - monthlyInterest);
remainingPrincipal -= principalPayment;
```
2. **Final month adjustment:** Set last month's principal = `remainingPrincipal` exactly to ensure schedule sums to exactly zero.
3. **Do NOT add big.js/decimal.js** — integer rounding is sufficient for VND.

**Phase to address:** LOAN-02 (Calculation engine).

---

### Pitfall 2: Vietnamese Mortgage Structure — Preferential vs. Floating Rate Transition

**What goes wrong:** Estimator shows a single flat interest rate for the entire loan term. Vietnamese banks universally use preferential period (6-36 months) then floating rate — a single-rate calculator is nearly useless.

**How to avoid:** Design with **rate period segments** from day one:
```typescript
interface RateSegment {
  fromMonth: number;
  toMonth: number;
  annualRate: number;
}
```

**Phase to address:** LOAN-01 (Research) → LOAN-04 (Dynamic configuration).

---

### Pitfall 3: Two Different Repayment Methods Producing Wildly Different Results

**What goes wrong:** User expects annuity but calculator uses reducing-balance, or vice versa. Monthly payment difference for a 2 tỷ VND loan can be 2-5 triệu VND/month.

**How to avoid:** Implement **both methods** as a toggle. Default to Annuity. Label clearly in Vietnamese.

**Phase to address:** LOAN-02 (Both formulas), LOAN-04 (Method toggle).

---

### Pitfall 4: Day-Count Convention Mismatch

**What goes wrong:** Monthly interest amounts differ by 50,000-200,000 VND from bank statement for months with 28 or 31 days.

**How to avoid:** Default to Method A (divide by 12). Document the assumption clearly in UI.

**Phase to address:** LOAN-01 (Document assumption), LOAN-02 (Implement default).

---

## Moderate Risks

### Risk 1: Chart.js Performance Rendering 360 Data Points on Mobile

**How to avoid:**
1. **Aggregate by year for overview:** Show 30 annual bars by default instead of 360 monthly.
2. **Disable animations:** `animation: false`.
3. **Lazy-render:** Only render mortgage chart when user navigates to Loan tab.

**Phase to address:** LOAN-03 (Chart implementation).

---

### Risk 2: Bundle Size Inflation Beyond GAS Practical Limits

Current bundle: **552KB**. Must stay under **800KB**.

**How to avoid:**
1. Use integer arithmetic instead of precision libraries.
2. Tree-shake Chart.js aggressively.
3. Reuse existing chart component patterns.

**Phase to address:** LOAN-02 + LOAN-03.

---

### Risk 3: UX Overwhelm — Too Many Input Fields

**How to avoid:**
1. **Progressive disclosure:** Start with 3 essential fields only (tiền vay, thời hạn, lãi suất).
2. **Smart defaults:** Pre-fill floating rate at 11%/năm, preferential period at 24 months.
3. **Expandable "Cài đặt nâng cao" section** for: repayment method toggle, rate segments.

**Phase to address:** LOAN-04, LOAN-05.

---

### Risk 4: Vietnamese Number Formatting (1.000.000 vs 1,000,000)

**How to avoid:**
1. Use `<input type="text" inputMode="numeric">` with auto-format.
2. Strip formatting before calculation: `value.replace(/\./g, '').replace(',', '.')`.
3. Accept both `6.5` and `6,5` for interest rate field.

**Phase to address:** LOAN-05.

---

### Risk 5: Edge Cases — 0% Interest, Extreme Values

**How to avoid:**
```typescript
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  if (annualRate === 0) return Math.round(principal / months);
  const r = annualRate / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return Math.round(principal * (r * factor) / (factor - 1));
}
```
Add input validation with sensible bounds: amount 10M-100B VND, term 1-50 years, rate 0-30%.

**Phase to address:** LOAN-02 (Guards), LOAN-05 (Input validation).

---

## Prevention Strategies

### Strategy 1: Golden Test Cases

Collect reference amortization tables from bank websites:

| Case | Amount | Term | Rate | Method | Expected Month 1 Payment |
|------|--------|------|------|--------|--------------------------|
| Basic Annuity | 2,000,000,000 | 20y | 8%/năm | Trả đều | ~16,729,264 ₫ |
| Basic Reducing | 2,000,000,000 | 20y | 8%/năm | Gốc đều | ~21,666,667 ₫ |
| Rate Change | 2,000,000,000 | 20y | 6.5% × 24m then 11% | Trả đều | Verify both periods |
| Zero Rate | 1,000,000,000 | 10y | 0% | Trả đều | 8,333,333 ₫ |

### Strategy 2: Bundle Size Budget Gate

```bash
npm run build
SIZE=$(stat -c%s dist/index.html)
if [ "$SIZE" -gt 819200 ]; then
  echo "ERROR: Bundle size exceeds 800KB budget"
  exit 1
fi
```

### Strategy 3: Chart Performance Testing

Test on lowest-target device (Android phone via Telegram Web App). Chart must re-render within 300ms on parameter change.

### Strategy 4: Phased Input Complexity

| Phase | Visible Fields | Hidden (Advanced) |
|-------|---------------|-------------------|
| LOAN-02 (MVP) | Amount, Term, Rate | — |
| LOAN-04 (Config) | + Method toggle, Rate segments | Day-count convention |
| Future | + Property value, Down payment % | Early repayment fee |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-----------------|--------------|
| **Floating-point accumulation** | LOAN-02 | Sum of principal payments === loan amount |
| **Preferential → floating rate** | LOAN-04 | Multi-segment rate schedule correct |
| **Wrong repayment method** | LOAN-02 | Both methods match bank calculators |
| **Chart 360-point perf** | LOAN-03 | Smooth scroll on mobile |
| **Bundle bloat** | LOAN-02 + LOAN-03 | `dist/index.html` < 800KB |
| **UX overwhelm** | LOAN-04 + LOAN-05 | ≤ 3 visible fields initially |
| **VN number formatting** | LOAN-05 | Type `1.500.000.000` → parsed correctly |
| **Edge case crashes** | LOAN-02 | No NaN/Infinity for valid inputs |

---
*Pitfalls research for: Save Manager v3.0 Mortgage Loan Estimator*
*Researched: 2026-08-12*
