# Technical Research: Charts & Rollover Mechanics (Phase 5)

## 1. Chart.js Installation and Single-file Bundling

### Installation
To add Chart.js to the frontend, run the following in the `frontend/` directory:
```bash
npm install chart.js
```
*Note: Since we are using React 19, we avoid installing third-party wrapper libraries like `react-chartjs-2` to prevent potential peer dependency conflicts. Instead, we use Chart.js directly via a Canvas reference (`React.useRef`).*

### Bundle Size & Tree Shaking Optimization
Google Apps Script (GAS) Web Apps serve assets from a single HTML file. Our build tool (`vite-plugin-singlefile`) compiles all TS, CSS, and JS into `index.html`. 
To minimize the bundle size impact, we must import and register only the necessary Chart.js controllers, scales, and elements:

```typescript
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Explicitly register required features to enable treeshaking
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

### Canvas Hook & Cleanup Implementation
To prevent memory leaks and duplicate chart rendering on hot reload, we must correctly clean up the chart instance:

```typescript
import React, { useEffect, useRef } from 'react';

export const GrowthChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy old chart before creating new one
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Tổng tài sản',
            data: data.map(d => d.total),
            borderColor: '#64b5f6',
            backgroundColor: 'rgba(100, 181, 246, 0.1)',
            fill: true,
            tension: 0,
            pointRadius: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(44, 56, 71, 0.3)' },
            ticks: { color: '#708499', maxTicksLimit: 6 }
          },
          y: {
            grid: { color: 'rgba(44, 56, 71, 0.3)' },
            ticks: { color: '#708499' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data]);

  return (
    <div className="h-48 w-full relative">
      <canvas ref={canvasRef} />
    </div>
  );
};
```

---

## 2. Step-wise Growth Algorithm

We must calculate the projected growth from **today** up to the **furthest maturity date** among all active/matured deposits. 
The asset total is calculated step-wise:
1. Before a deposit's maturity date, its contribution is its `amount` (principal).
2. On and after the maturity date, its contribution is `amount` + `expected_interest`.

### TypeScript Implementation

```typescript
import { Deposit } from '../types';
import { parseClientDateString } from './interest';

export interface ChartDataPoint {
  date: string; // Format: DD/MM/YYYY
  total: number;
  principal: number;
  interest: number;
}

/**
 * Maps active/matured deposits to a step-wise timeseries timeline.
 * Horizon starts from today to the max maturity date of active deposits.
 */
export function generateStepWiseGrowthData(deposits: Deposit[]): ChartDataPoint[] {
  const activeDeposits = deposits.filter(
    d => d.status === 'active' || d.status === 'matured'
  );

  if (activeDeposits.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the furthest maturity date
  let maxMaturity = new Date(today);
  activeDeposits.forEach(d => {
    try {
      const matDate = parseClientDateString(d.maturity_at);
      if (matDate > maxMaturity) {
        maxMaturity = matDate;
      }
    } catch (e) {
      console.error('Lỗi phân tích ngày đáo hạn:', e);
    }
  });

  const dataPoints: ChartDataPoint[] = [];
  const currentDate = new Date(today);

  // Generate step-wise data for each day from today to maxMaturity
  while (currentDate <= maxMaturity) {
    let totalPrincipal = 0;
    let totalInterest = 0;

    activeDeposits.forEach(d => {
      try {
        const matDate = parseClientDateString(d.maturity_at);
        
        // Principal is always present
        totalPrincipal += d.amount;
        
        // Expected interest is only added once maturity date is reached
        if (currentDate >= matDate) {
          totalInterest += d.expected_interest;
        }
      } catch (e) {
        totalPrincipal += d.amount; // Fallback
      }
    });

    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    dataPoints.push({
      date: dateStr,
      total: totalPrincipal + totalInterest,
      principal: totalPrincipal,
      interest: totalInterest
    });

    // Advance to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}
```

---

## 3. Rollover UI Form & Flow

### UX Flow
1. User taps a matured/overdue deposit card (`diffDays <= 0`).
2. The **Details BottomSheet** opens and displays a prominent **"Tái tục" (Rollover)** button.
3. Tapping "Tái tục" closes the Details BottomSheet and opens the **Rollover Form BottomSheet**.
4. The Rollover form inherits styling and logic from `DepositForm` but points to the `rollover_deposit` action and handles initial parameters differently.

### Form Field Calculation & Prefilling
For the selected matured deposit `deposit`:
- **New Principal**: Prefilled with `deposit.amount` (editable).
- **New Interest Rate**: Prefilled with `deposit.interest_rate` (editable).
- **Start Date (`created_at`)**: Prefilled with `deposit.maturity_at` (editable, defaults to old maturity).
- **New Maturity Date (`maturity_at`)**: Prefilled with `deposit.maturity_at` but with the year incremented by 1.

Leap year protection helper for incrementing the maturity date by 1 year:
```typescript
export function getNextYearDateStr(dateStr: string): string {
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  const nextYear = year + 1;
  
  // Leap year case: Feb 29th -> Feb 28th if next year is not a leap year
  if (day === 29 && month === 2) {
    const isLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
    if (!isLeap) {
      return `28/02/${nextYear}`;
    }
  }
  
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${nextYear}`;
}
```

### Submission API Call
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const payload = {
    action: 'rollover_deposit',
    id: oldDeposit.id,
    new_amount: parseFloat(amount),
    new_interest_rate: parseFloat(interestRate),
    created_at: createdAt,
    maturity_at: maturityAt
  };

  await callBackendApi(payload);
  onSuccess(); // Refresh deposit list
  onClose(); // Close form
};
```

---

## 4. Bot Webhook & Parameter Routing

### 4.1. GAS Webhook Update (`backend/Code.js`)
We will expand the telegram message handler in `handleTelegramWebhook` to route `/chart` command. It will check the script property `MINI_APP_URL` and append the query parameter `?view=chart`.

```javascript
// backend/Code.js -> handleTelegramWebhook
if (text === "/start" || text === "/chart") {
  const properties = PropertiesService.getScriptProperties();
  const miniAppUrl = properties.getProperty("MINI_APP_URL");
  
  let targetUrl = miniAppUrl;
  let replyText = "Chào mừng bạn đến với Save Manager!\n\nHãy nhấn nút bên dưới để mở giao diện quản lý các khoản tiết kiệm cá nhân của bạn.";
  
  if (text === "/chart") {
    // Append view=chart safely
    targetUrl = miniAppUrl.includes("?") 
      ? `${miniAppUrl}&view=chart` 
      : `${miniAppUrl}?view=chart`;
    replyText = "Nhấn nút dưới đây để xem biểu đồ dự phóng tăng trưởng tài sản của bạn:";
  }
  
  const replyPayload = {
    chat_id: chatId,
    text: replyText,
    reply_markup: {
      inline_keyboard: [[
        {
          text: text === "/chart" ? "📈 Xem biểu đồ" : "Mở Save Manager",
          web_app: {
            url: targetUrl
          }
        }
      ]]
    }
  };
  
  sendTelegramApi("sendMessage", replyPayload);
}
```

### 4.2. Frontend URL Parameter Parsing (`App.tsx`)
In `App.tsx`, we retrieve launch params using the Telegram SDK if running in a Telegram Mini App, and fall back to standard URL query string parameters for standard browser/web launches.

```typescript
import { initializeTelegramSDK } from '../utils/telegram';

// inside App component:
const [showChart, setShowChart] = useState<boolean>(false);

useEffect(() => {
  // 1. Check standard URL query string
  const searchParams = new URLSearchParams(window.location.search);
  const viewParam = searchParams.get('view');
  
  // 2. Check Telegram Web App Start Param
  let startParam: string | undefined;
  try {
    const session = initializeTelegramSDK();
    // Retrieve start param from initData
    if (!session.isMock) {
      const lp = retrieveLaunchParams() as any;
      startParam = lp.initData?.startParam;
    }
  } catch (err) {
    console.warn("Failed to retrieve Telegram start param:", err);
  }

  if (viewParam === 'chart' || startParam === 'chart') {
    setShowChart(true);
  }
}, []);
```
