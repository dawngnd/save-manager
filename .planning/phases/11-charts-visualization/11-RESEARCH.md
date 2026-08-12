# Phase 11 Research: Charts & Visualization

## Chart.js 4.5.1 — Stacked Bar Chart

### Configuration
```typescript
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

new Chart(ctx, {
  type: 'bar',
  data: {
    labels: yearlySummary.map(y => `Năm ${y.year}`),
    datasets: [
      { label: 'Gốc', data: yearlySummary.map(y => y.principalPaid), backgroundColor: '#ef5350' },
      { label: 'Lãi', data: yearlySummary.map(y => y.interestPaid), backgroundColor: '#64b5f6' },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { callback: formatVND } },
    },
  },
});
```

### Year/Month Toggle
- Mặc định: `yearlySummary[]` (20 bars cho 20 năm)
- Toggle: `monthlySchedule[]` (240 bars) — cần scroll ngang, dùng `.chart-scroll` wrapper
- Khi toggle, destroy chart cũ (`chartInstanceRef.current.destroy()`), tạo mới với data mới

## Chart.js — Filled Area Chart (Line với fill)

```typescript
import { Chart, LineController, LineElement, PointElement, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, Filler);

// Cumulative sum
const cumulativePrincipal: number[] = [];
const cumulativeInterest: number[] = [];
let sumP = 0, sumI = 0;
monthlySchedule.forEach(m => {
  sumP += m.principalPaid; sumI += m.interestPaid;
  cumulativePrincipal.push(sumP);
  cumulativeInterest.push(sumI);
});

new Chart(ctx, {
  type: 'line',
  data: {
    labels: monthlySchedule.map(m => `T${m.month}`),
    datasets: [
      { label: 'Gốc đã trả', data: cumulativePrincipal, fill: true, backgroundColor: 'rgba(239,83,80,0.3)', borderColor: '#ef5350' },
      { label: 'Lãi đã trả', data: cumulativeInterest, fill: true, backgroundColor: 'rgba(100,181,246,0.3)', borderColor: '#64b5f6' },
    ],
  },
});
```

## chartjs-plugin-annotation — Rate Cliff Vertical Line

### Installation
```bash
npm install chartjs-plugin-annotation
```

### Usage
```typescript
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);

// Trong options:
plugins: {
  annotation: {
    annotations: {
      rateCliffLine: {
        type: 'line',
        xMin: promoMonths - 1, // hoặc tính index tương ứng
        xMax: promoMonths - 1,
        borderColor: '#ffd54f',
        borderWidth: 2,
        borderDash: [6, 3],
        label: {
          display: true,
          content: `Vách đá: +${diffPercent}%`,
          position: 'start',
        },
      },
    },
  },
}
```

### Điều kiện hiển thị
- Chỉ hiện khi `rateCliffPaymentBefore !== rateCliffPaymentAfter`
- Vị trí: index tháng = `promoMonths` trong monthlySchedule, hoặc `Math.ceil(promoMonths / 12)` trong yearlySummary

## Dark Theme Config (from UserShareChart.tsx)
- Tooltip: `backgroundColor: '#17212b'`, `titleColor: '#64b5f6'`, `bodyColor: '#f5f5f5'`, `borderColor: '#2b394a'`
- Grid: `color: '#2c3847'`
- Ticks: `color: '#708499'`
- Container: `bg-[#0e1621]`, `border-[#2b394a]`, `rounded-2xl`

## Responsive
- `responsive: true`, `maintainAspectRatio: false` cho chart container có fixed height
- Container 100% width, height ~300px desktop, ~250px mobile
