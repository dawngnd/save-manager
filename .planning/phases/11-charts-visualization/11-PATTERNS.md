# Phase 11 Patterns: Charts & Visualization

## Chart.js Initialization Pattern (from UserShareChart.tsx)

```typescript
// 1. Tree-shakeable imports
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

// 2. Refs
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const chartInstanceRef = useRef<Chart | null>(null);

// 3. useEffect lifecycle
useEffect(() => {
  if (!canvasRef.current) return;
  // Destroy previous
  if (chartInstanceRef.current) chartInstanceRef.current.destroy();
  // Create new
  const ctx = canvasRef.current.getContext('2d');
  if (!ctx) return;
  chartInstanceRef.current = new Chart(ctx, { ... });
  // Cleanup on unmount
  return () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  };
}, [dependencies]);
```

## Dark Theme Colors (consistent across project)

| Purpose | Color |
|---------|-------|
| Container bg | `#0e1621` |
| Inner card bg | `#17212b` |
| Border | `#2b394a` or `#2c3847` |
| Text primary | `#f5f5f5` |
| Text muted | `#708499` |
| Accent blue | `#64b5f6` |
| Accent red | `#ef5350` |
| Accent orange | `#ffb74d` |
| Chart grid | `#2c3847` |
| Button bg | `#2c3847` |
| Button hover | `#374657` |

## MortgageResult Data Flow

```
MortgageForm (state owner)
  └─ calculateMortgage(inputs) → MortgageResult
       ├─ MortgageKpiCards (result, loanAmount)  ← Phase 10
       └─ MortgageCharts (result)                ← Phase 11
            ├─ PaymentBreakdownChart (yearlySummary, monthlySchedule, rateCliff*)
            └─ CumulativeChart (monthlySchedule)
```

## Tab Pattern (không có sẵn trong project — cần tạo mới)

Simple state-based tab chỉ cần:
```tsx
const [activeTab, setActiveTab] = useState<'breakdown' | 'cumulative'>('breakdown');
```
Render button group + conditional render chart component.

## .chart-scroll CSS (index.css lines 73-100)
Đã có sẵn. Dùng cho container khi xem monthly (240 bars).
Container cần `overflow-x: auto` và `min-width` lớn hơn viewport.

## Tooltip Pattern (from UserShareChart.tsx)
```typescript
tooltip: {
  backgroundColor: '#17212b',
  titleColor: '#64b5f6',
  bodyColor: '#f5f5f5',
  borderColor: '#2b394a',
  borderWidth: 1,
  padding: 10,
  callbacks: { ... }
}
```
