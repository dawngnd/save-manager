# Architecture: Mortgage Loan Estimator Integration

## Integration Points

The Mortgage Loan Estimator module is a purely client-side feature that operates without backend API calls or Google Sheets database persistence. It integrates into the existing React 19 SPA shell (`src/components/App.tsx`) as a dedicated top-level tab.

### 1. Navigation & Tab Placement
- **Tab Type Extension**: Extend `ActiveTab` in `App.tsx`:
  ```typescript
  type ActiveTab = 'deposits' | 'gold' | 'analytics' | 'mortgage';
  ```
- **Tab Navigation Bar**: Add a 4th tab button inside the Tab Bar container in `App.tsx`:
  - Label: `🏡 Vay mua nhà` (or `🏠 Khoản vay`)
  - Layout: All 4 tabs fit inside a single flex row.
- **Header Bar Integration**:
  - Title: Dynamic header title updates to `Ước tính khoản vay` when `activeTab === 'mortgage'`.
  - Icon: Header icon displays `🏠`.
  - Action buttons: Hide refresh/chart toggle buttons used for API-backed deposits/gold tabs.

### 2. Standalone Client-Side Execution
- **Zero API/GAS Overhead**: No calls to `doPost` / `doGet`, `CacheService`, or `LockService`.
- **Zero Backend Storage**: All inputs and calculations exist in React local state (with optional `localStorage` caching key `save_manager_mortgage_input` to preserve inputs across session reloads).
- **Vite Single-File Bundle**: All new components and math utilities will be bundled into the single output `index.html` by `vite-plugin-singlefile` without build changes.

---

## Component Structure

All mortgage components reside in a dedicated directory `src/components/mortgage/`.

```
src/
  ├── types/
  │   └── mortgage.ts              # Mortgage interfaces (LoanInputs, ScheduleRow, BankPreset)
  ├── utils/
  │   └── mortgage.ts              # Calculation engine & bank promotional presets
  └── components/
      └── mortgage/
          ├── MortgageTab.tsx       # Main tab container component
          ├── BankPresetSelector.tsx # Quick bank selection chips (Vietinbank, BIDV, VCB, VPBank)
          ├── LoanForm.tsx          # Interactive dynamic input form
          ├── LoanSummaryCards.tsx   # KPI summary cards (Total Interest, Peak Payment, etc.)
          ├── LoanChart.tsx         # Chart.js visualization (Stacked Bar + Line balance curve)
          └── LoanScheduleTable.tsx # Amortization schedule table with yearly accordion headers
```

### Component Breakdown
1. **`MortgageTab.tsx`**: Main tab wrapper rendering all sub-components, managing calculation state and bank preset selection.
2. **`BankPresetSelector.tsx`**: Horizontal scrolling chips for instant selection of Vietnamese bank presets to auto-fill interest rates and promo periods.
3. **`LoanForm.tsx`**: Interactive form with numeric inputs & quick percentage buttons:
   - Target property value (Giá trị nhà)
   - Down payment % or loan ratio (Tỷ lệ vay / Số tiền vay)
   - Loan tenure (Thời hạn vay: 1 - 30 năm)
   - Promotional rate (%/năm ưu đãi) & promo period (số tháng ưu đãi)
   - Post-promotional rate (%/năm thả nổi)
   - Repayment method ("Gốc đều, lãi giảm dần" or "Dư nợ cố định - Niên kim")
4. **`LoanSummaryCards.tsx`**: Display grid of key financial metrics.
5. **`LoanChart.tsx`**: Canvas wrapper for Chart.js with stacked monthly/yearly principal vs interest bars and remaining balance decay line.
6. **`LoanScheduleTable.tsx`**: Scrollable, collapsible amortization table displaying Month, Opening Balance, Principal Paid, Interest Paid, Total Monthly Payment, and Closing Balance.

---

## Data Flow

Strictly unidirectional, synchronous, and reactive:

```
[Bank Preset Selection] ───┐
                           ▼
[User Input in LoanForm] ──► [LoanInputs State]
                                   │
                                   ▼ (useMemo / Reactive Recalculation)
                          [calculateMortgage Engine]
                                   │
                                   ├─────────────────────────┐
                                   ▼                         ▼
                         [MortgageResult]          [PaymentScheduleItem[]]
                                   │                         │
                                   ▼                         ├─────────────────┐
                        [LoanSummaryCards]                   ▼                 ▼
                                                        [LoanChart]   [LoanScheduleTable]
```

### Data Structures (`src/types/mortgage.ts`)
```typescript
export interface LoanInputs {
  propertyValue: number;       // Giá trị BĐS (VNĐ)
  loanAmount: number;          // Số tiền vay (VNĐ)
  tenureYears: number;         // Thời hạn vay (Năm)
  promoRate: number;           // Lãi suất ưu đãi (%/năm)
  promoMonths: number;         // Thời gian ưu đãi (Tháng)
  floatingRate: number;        // Lãi suất thả nổi (%/năm)
  repaymentMethod: 'reducing_balance' | 'fixed_annuity';
}

export interface PaymentScheduleItem {
  month: number;
  year: number;
  isPromo: boolean;
  rate: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalMonthlyPayment: number;
  closingBalance: number;
}

export interface YearlySummaryItem {
  year: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  closingBalance: number;
}

export interface MortgageResult {
  summary: {
    totalPrincipal: number;
    totalInterest: number;
    totalPayment: number;
    maxMonthlyPayment: number;
    minMonthlyPayment: number;
    firstFloatingPayment: number;
    interestToPrincipalRatio: number;
  };
  monthlySchedule: PaymentScheduleItem[];
  yearlySchedule: YearlySummaryItem[];
}
```

---

## Chart Integration Strategy

### Reuse existing Chart.js Setup
- `LoanChart.tsx` will register `BarController`, `BarElement`, `LineController`, `LineElement`, `PointElement`, `LinearScale`, `CategoryScale`, `Tooltip`, `Legend`, `Filler`.

### Visualizations & Mobile Performance
1. **Dual Dataset Visualizer**:
   - **Bar Dataset 1**: Principal Paid (Gốc trả) - Green
   - **Bar Dataset 2**: Interest Paid (Lãi trả) - Orange/Red
   - **Line Dataset**: Remaining Balance (Dư nợ còn lại) - Blue on Y-axis 2
2. **Granularity Toggle (Yearly vs Monthly)**:
   - **Default View**: Grouped by Year, displaying 10-30 clear stacked bars.
   - **Toggle View**: "Xem theo tháng" option for detailed month-by-month inspection.

---

## Build Order

```
Phase 1: Domain Engine & Types
Phase 2: Form & Presets UI
Phase 3: Summary Cards & Schedule Table
Phase 4: Chart.js Visualizer
Phase 5: App.tsx Tab Integration
```
