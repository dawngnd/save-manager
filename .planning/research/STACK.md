# Stack Research: Mortgage Loan Estimator Module (v3.0)

**Domain:** Vietnam Bank Mortgage Loan Calculation + Amortization & Charting (Frontend-only SPA)
**Researched:** 2026-08-12
**Confidence:** HIGH

## Findings

### 1. Amortization Calculation Requirements for Vietnam Banks
- Vietnamese mortgage loans (VietinBank, BIDV, Vietcombank, VPBank, Techcombank, etc.) require domain-specific amortization logic that off-the-shelf Western financial npm packages (e.g., `financejs`, `amortization`, `mortgage-js`) do not handle properly:
  - **Tiered Preferential Interest Rates**: Fixed interest rate for initial months (e.g. 6.5% for 12 or 24 months), followed by floating interest rate (Reference Rate + Margin, e.g. 10.5%) for remaining term.
  - **Flexible Repayment Schedules**:
    1. *Dư nợ giảm dần (Decreasing Balance)*: Equal monthly principal P/N + interest calculated on remaining principal balance.
    2. *Dư nợ đều (Annuity / PMT)*: Constant total monthly installment PMT = P × r(1+r)^N / ((1+r)^N - 1).
    3. *Ân hạn nợ gốc (Principal Grace Period)*: Interest-only monthly payments for first G months (6-24 months), amortizing principal over remaining N-G months.
- Standard npm packages lack multi-tier interest rate support, principal grace periods, or Vietnamese bank rounding rules (VND integer rounding). A custom **pure TypeScript calculation module** provides 100% type safety, exact domain match, and zero bundle size bloat.

### 2. Charting Stack Capabilities (Stacked Bar & Stacked Area)
- The project already has `chart.js@^4.5.1` installed and validated in `frontend/package.json`.
- Chart.js 4.x natively supports:
  - **Stacked Bar Charts**: Monthly payment breakdown of Principal vs Interest.
  - **Stacked Area / Filled Line Charts**: Cumulative payments & remaining balance.
- Direct Chart.js canvas registration with React `useRef` + `useEffect` works seamlessly with React 19 without requiring `react-chartjs-2`.

### 3. Form Handling & Dynamic Parameters
- Form inputs managed via custom React hooks or controlled `useState`.
- Adding form libraries like `react-hook-form` or `zod` adds unnecessary bundle overhead without meaningful benefit for a single interactive tool view.

## Recommendations

### Recommended Stack Additions / Changes

| Module / Layer | Recommendation | Package & Version | Rationale |
|----------------|----------------|-------------------|-----------|
| **Amortization Engine** | Pure TypeScript Utility (`src/utils/mortgage.ts`) | **None (0KB)** | Custom math functions handle VN bank tiered rates, grace periods, and decreasing vs annuity models without library bloat. |
| **Monthly Breakdown Chart** | Stacked Bar Chart via Chart.js | `chart.js@^4.5.1` (Existing) | Native `BarController` & `BarElement` with `stacked: true`. 0 new dependencies. |
| **Cumulative Growth Chart** | Stacked Area / Filled Line Chart via Chart.js | `chart.js@^4.5.1` (Existing) | Native `LineController` + `Filler` plugin. 0 new dependencies. |
| **Icons & Indicators** | Lucide React Icons | `lucide-react@^1.31.0` (Existing) | Icons for calculator, loan terms, bank presets. |
| **Form & State Management** | React Controlled State / Custom Hook | Native React 19 (`useState`, `useMemo`) | Light, reactive, zero-dependency state updates. |

### Summary of Dependencies

```bash
# NO NEW DEPENDENCIES REQUIRED!
# All required capabilities exist in frontend/package.json:
# - react@^19.0.0
# - chart.js@^4.5.1
# - lucide-react@^1.31.0
# - tailwindcss@^4.0.0 (via @tailwindcss/vite)
```

## Integration Notes

### What NOT to Add (Strict Exclusion List)

| Library / Tool | Reason for Exclusion | Alternative |
|----------------|----------------------|-------------|
| **`financejs` / `mortgage-js`** | Inflexible for Vietnam bank tiered rate schedules; adds npm bloat. | Pure TS domain functions. |
| **`Recharts` / `ApexCharts` / `Nivo`** | Duplicate charting engines adding 200KB–500KB JS payload. | Existing `chart.js@^4.5.1`. |
| **`react-chartjs-2`** | Unnecessary JSX wrapper with React 19 peer-dependency warnings. | Direct Chart.js canvas with `useEffect`. |
| **`react-hook-form` / `zod`** | Over-engineering for a single calculator form. | Standard React controlled inputs. |
| **`mathjs`** | 500KB+ heavy library for basic arithmetic. | Native JS `Math`. |

### Key Integration Points

1. **Amortization Engine** (`frontend/src/utils/mortgage.ts`): Inputs include loanAmount, termMonths, preferentialRate, preferentialMonths, floatingRate, repaymentMethod, gracePeriodMonths. Outputs AmortizationSchedule array.

2. **Chart Registration**: Register Chart.js controllers (BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend) for stacked bar chart.

3. **Cumulative Chart**: Register LineController, LineElement, PointElement, Filler for cumulative principal vs interest area chart.

4. **UI Layout**: Placed as top-level tab alongside Deposits, Analytics, Gold in App.tsx.
