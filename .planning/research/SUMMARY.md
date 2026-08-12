# Project Research Summary — v3.0 Mortgage Loan Estimator

**Synthesized:** 2026-08-12
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Key Findings

### Stack: Zero New Dependencies Required

Toàn bộ module Mortgage Loan Estimator xây dựng trên stack hiện có — **không cần thêm dependency mới**:
- **Calculation Engine**: Pure TypeScript utility (`utils/mortgage.ts`). Các thư viện tài chính npm (financejs, mortgage-js) không hỗ trợ cấu trúc lãi suất 2 giai đoạn của ngân hàng Việt Nam.
- **Charts**: Chart.js `@^4.5.1` (đã có) — Stacked Bar + Line cho phân bổ gốc/lãi và dư nợ còn lại.
- **UI/Form**: React 19 controlled state + Tailwind CSS v4 (đã có).
- **Icons**: Lucide React `@^1.31.0` (đã có).
- **Tuyệt đối KHÔNG thêm**: react-chartjs-2, react-hook-form, big.js/decimal.js, mathjs, D3.js.

### Features: Vietnamese Mortgage Domain Model

Nghiên cứu 4 ngân hàng (Vietinbank, BIDV, Vietcombank, VPBank) cho thấy mô hình chung:

1. **Lãi suất 2 giai đoạn**: Ưu đãi cố định (6-36 tháng, 6-11%/năm) → Thả nổi (tham chiếu + biên độ 3-4%, ~12-15%/năm)
2. **2 phương thức trả nợ**:
   - **Dư nợ giảm dần** (Equal Principal): Gốc trả đều, lãi giảm dần. Phổ biến nhất ★★★★★
   - **Trả đều hàng tháng** (Annuity/PMT): Tổng trả cố định. ★★★☆☆
3. **Tham số cấu hình**: Tiền vay, thời hạn (5-35 năm), lãi suất ưu đãi, thời gian ưu đãi, lãi suất thả nổi, ân hạn gốc (0-24 tháng)
4. **Tính lãi**: Lãi đơn trên dư nợ giảm dần, chia đều 12 tháng (KHÔNG phải lãi kép, KHÔNG tính theo ngày thực tế)

**Table stakes cho estimator:** Form nhập tham số, 2 phương thức trả nợ, lãi suất 2 giai đoạn, bảng lịch trả nợ, tổng kết KPI, tab riêng.
**Differentiators:** Biểu đồ gốc/lãi stacked bar, biểu đồ lũy kế, ân hạn gốc, dự báo "vách đá lãi suất".

### Architecture: Self-Contained Frontend Module

- **Tab placement**: Mở rộng `ActiveTab` thêm `'mortgage'`, đặt cạnh Analytics.
- **Component structure**: `src/components/mortgage/` — MortgageTab, BankPresetSelector, LoanForm, LoanSummaryCards, LoanChart, LoanScheduleTable.
- **Data flow**: LoanInputs → calculateMortgage (useMemo) → MortgageResult → Charts + Table + Summary Cards.
- **State**: React local state + optional localStorage cho persist inputs. Zero backend/API calls.
- **Data types**: LoanInputs, PaymentScheduleItem, YearlySummaryItem, MortgageResult — đầy đủ interface TypeScript.

### Pitfalls: Top 5 Risks & Mitigations

| # | Pitfall | Severity | Mitigation |
|---|---------|----------|------------|
| 1 | **Floating-point accumulation** (360 months) | CRITICAL | Integer VND arithmetic, Math.round mỗi tháng, final month adjustment |
| 2 | **Missing multi-rate support** | CRITICAL | Design rate segments từ đầu, pre-populate bank presets |
| 3 | **Wrong repayment method** | HIGH | Implement cả 2 methods, toggle rõ ràng, default Annuity |
| 4 | **Chart 360-point perf** | MEDIUM | Aggregate by year default, disable animations, lazy render |
| 5 | **Bundle bloat** (552KB → must <800KB) | MEDIUM | No new dependencies, tree-shake Chart.js, integer math |

---

## Implications for Roadmap

### Recommended Phase Structure

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| **Phase 1: Types & Calculation Engine** | Domain model + math | `types/mortgage.ts`, `utils/mortgage.ts`, 2 repayment methods, multi-rate support, integer arithmetic |
| **Phase 2: Form UI & Bank Presets** | Input interface | LoanForm, BankPresetSelector, progressive disclosure (3 fields visible, advanced expandable) |
| **Phase 3: Charts & Visualization** | Data visualization | Stacked bar (yearly default), cumulative line, remaining balance, yearly/monthly toggle |
| **Phase 4: Summary, Schedule & Integration** | Assembly | LoanSummaryCards, LoanScheduleTable, MortgageTab wrapper, App.tsx tab integration, localStorage |

### Critical Implementation Decisions

1. **Integer arithmetic only** — VND has no fractional unit, Math.round after each step
2. **Multi-stage rate segments** — MUST support at minimum 2 stages (promo + floating)
3. **Yearly aggregation default** for charts — avoid 360-bar mobile performance issues
4. **Progressive disclosure** for form — 3 essential fields visible, rest in "Nâng cao"
5. **Vietnamese number input** — `type="text" inputMode="numeric"` with dot-separated formatting
6. **Self-contained module** — separate `utils/mortgage.ts`, NOT extending existing `interest.ts`

---

## Sources

- Vietcombank mortgage products (vietcombank.com.vn)
- BIDV housing loan programs (bidv.com.vn)
- VPBank mortgage packages (vpbank.com.vn)
- Vietinbank lending rates (vietinbank.vn)
- Chart.js Performance Documentation (chartjs.org)
- IEEE 754 floating-point in financial JS applications

---
*Research synthesis for: Save Manager v3.0 Mortgage Loan Estimator*
*Synthesized: 2026-08-12*
