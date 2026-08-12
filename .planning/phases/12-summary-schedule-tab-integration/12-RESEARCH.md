# Phase 12 Research: Summary, Schedule & Tab Integration

## Accordion Table Pattern (React + Tailwind)

### HTML Structure
```tsx
// Year header row (clickable)
<div onClick={() => toggle(year)} className="flex justify-between cursor-pointer bg-[#17212b] p-3 rounded-lg">
  <span>Năm {year}</span>
  <span>{isExpanded ? '▼' : '▶'}</span>
</div>

// Month rows (conditionally rendered)
{isExpanded && monthsInYear.map(m => (
  <div className="grid grid-cols-6 text-xs px-3 py-2 border-b border-[#2c3847]/30">
    <span>T{m.month}</span>
    <span>{m.interestRate}%</span>
    <span>{formatVND(m.principalPaid)}</span>
    <span>{formatVND(m.interestPaid)}</span>
    <span>{formatVND(m.totalPayment)}</span>
    <span>{formatVND(m.remainingBalance)}</span>
  </div>
))}
```

### State Management
```tsx
const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
const toggle = (year: number) => {
  setExpandedYears(prev => {
    const next = new Set(prev);
    next.has(year) ? next.delete(year) : next.add(year);
    return next;
  });
};
```

## App.tsx Tab Integration Pattern

### Current Pattern (from App.tsx lines 38-270)
```tsx
type ActiveTab = 'deposits' | 'gold' | 'analytics';
const [activeTab, setActiveTab] = useState<ActiveTab>('deposits');

// Tab button pattern — each tab has its own accent color:
// deposits: bg-[#5288c1]
// gold: bg-[#f5a623]
// analytics: bg-[#4caf50]
// mortgage (new): pick accent color, e.g. bg-[#ef5350] (red) or bg-[#64b5f6] (blue)
```

### Adding 4th Tab
- Extend type: `'deposits' | 'gold' | 'analytics' | 'mortgage'`
- Add button in tab bar (line 240-271)
- Add conditional content section after analytics

## Data Flow for AmortizationTable

```
MortgageResult (from calculateMortgage)
├── monthlySchedule: PaymentScheduleItem[]
│   ├── month, year, principalPaid, interestPaid
│   ├── totalPayment, remainingBalance, interestRate
│   └── (240 items for 20-year loan)
└── yearlySummary: YearlySummaryItem[]
    ├── year, principalPaid, interestPaid
    ├── totalPayment, remainingBalance
    └── (20 items for 20-year loan)
```

Group monthlySchedule by year: `Object.groupBy` or manual reduce.

## MortgageTab Wrapper

Simple passthrough component that composes:
1. MortgageForm (includes KPIs + Charts internally)
2. AmortizationTable (needs MortgageResult — passed from MortgageForm state)

Challenge: MortgageResult lives inside MortgageForm state. Options:
1. **Lift state up** to MortgageTab → MortgageForm becomes controlled
2. **Callback prop** — MortgageForm calls `onResultChange(result)` → MortgageTab passes to AmortizationTable
3. **Render AmortizationTable inside MortgageForm** — simplest, no state lifting

Option 3 is simplest — AmortizationTable rendered inside MortgageForm after Charts.
