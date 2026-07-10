# Phase 5: Charts & Rollover Mechanics - Patterns

Tài liệu này xác định các mẫu thiết kế, quy ước lập trình, cấu trúc dữ liệu và mẫu mã nguồn tham chiếu cho các tệp tin được tạo mới hoặc sửa đổi trong **Phase 5: Charts & Rollover Mechanics**.

---

## 1. Sửa đổi Backend (Google Apps Script)

### 1.1. `backend/Code.js` (Webhook Routing Update)
* **Vai trò & Luồng dữ liệu**:
  - Cập nhật hàm `handleTelegramWebhook` để định tuyến thêm lệnh `/chart` từ Telegram.
  - Đọc thuộc tính `MINI_APP_URL` từ Script Properties và nối thêm tham số truy vấn `view=chart` trước khi gửi lại tin nhắn kèm theo nút mở Web App cho người dùng.
* **Tệp analog hiện tại trong codebase**: Xử lý lệnh `/start` tại các dòng 407-435 của [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js#L407-L435).
* **Quy ước coding & cấu trúc hàm**:
  - Tuân thủ chuẩn ES5 tương thích với GAS V8 Engine.
  - Sử dụng hàm kiểm tra ký tự hoặc hàm nối chuỗi an toàn để không làm hỏng URL hiện có (ví dụ: kiểm tra xem URL đã chứa `?` hay chưa để nối tiếp `&view=chart` hoặc `?view=chart`).

#### Mẫu mã nguồn tham chiếu (Webhook Routing):
```javascript
// Sửa đổi trong backend/Code.js -> handleTelegramWebhook
if (payload.message && payload.message.text) {
  const chatId = payload.message.chat.id;
  const text = payload.message.text.trim();
  
  if (text === "/start" || text === "/chart") {
    const properties = PropertiesService.getScriptProperties();
    const miniAppUrl = properties.getProperty("MINI_APP_URL");
    
    let targetUrl = miniAppUrl;
    let replyText = "Chào mừng bạn đến với Save Manager!\n\nHãy nhấn nút bên dưới để mở giao diện quản lý các khoản tiết kiệm cá nhân của bạn.";
    
    if (text === "/chart") {
      // Ghép tham số view=chart một cách an toàn vào URL của Mini App
      targetUrl = miniAppUrl.indexOf("?") !== -1 
        ? miniAppUrl + "&view=chart" 
        : miniAppUrl + "?view=chart";
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
}
```

---

## 2. Sửa đổi Frontend SPA (React + TypeScript + Tailwind CSS)

### 2.1. `frontend/src/components/App.tsx` (URL Parameter Parsing & Toggles)
* **Vai trò & Luồng dữ liệu**:
  - Đọc tham số URL query string (`?view=chart`) hoặc Telegram Web App Launch parameter (`start_param` / `tgWebAppStartParam` chứa `chart`) khi khởi chạy ứng dụng.
  - Quản lý trạng thái `showChart: boolean` để hiển thị phần biểu đồ ở đầu màn hình và trạng thái collapse của biểu đồ để tối ưu không gian hiển thị của người dùng.
* **Tệp analog hiện tại**: Bản thân [frontend/src/components/App.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/App.tsx).
* **Quy ước kỹ thuật**:
  - Sử dụng `URLSearchParams` để đọc tham số URL.
  - Sử dụng `@telegram-apps/sdk` (`retrieveLaunchParams`) để lấy `startParam` từ initData của Telegram Mini App.

#### Mẫu mã nguồn tham chiếu (App.tsx):
```typescript
import { useState, useEffect } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { GrowthChart } from './GrowthChart';

// Bên trong component App:
const [showChart, setShowChart] = useState<boolean>(false);

useEffect(() => {
  // 1. Kiểm tra URL query string thông thường
  const searchParams = new URLSearchParams(window.location.search);
  const viewParam = searchParams.get('view');
  
  // 2. Kiểm tra Telegram Web App Launch Param
  let startParam: string | undefined;
  try {
    const lp = retrieveLaunchParams();
    startParam = lp.initData?.startParam;
  } catch (err) {
    console.warn("Không thể lấy Telegram start param:", err);
  }

  if (viewParam === 'chart' || startParam === 'chart') {
    setShowChart(true);
  }
}, []);
```

### 2.2. `frontend/src/components/GrowthChart.tsx` (Tạo mới Component biểu đồ)
* **Vai trò & Luồng dữ liệu**:
  - Hiển thị biểu đồ tăng trưởng tài sản lũy tiến step-wise dạng Line Chart từ hôm nay đến ngày đáo hạn xa nhất của các khoản tiết kiệm đang hoạt động.
  - Nhận danh sách các khoản tiết kiệm (`deposits: Deposit[]`) qua props, tự động tính toán dữ liệu step-wise cho từng ngày và vẽ lên canvas thông qua Chart.js.
* **Tệp analog trong codebase**: Không có analog trực tiếp (đây là component biểu đồ đầu tiên).
* **Quy ước kỹ thuật**:
  - Do dự án sử dụng React 19, tránh sử dụng các thư viện wrapper bên thứ ba (như `react-chartjs-2`) nhằm giảm thiểu rủi ro xung đột peer dependency. Sử dụng Chart.js gốc trực tiếp qua `React.useRef`.
  - Chỉ import và đăng ký các Controller, Scale, Element cần thiết để tối ưu hóa Tree Shaking và giảm dung lượng bundle size đơn file (`index.html`).
  - Phải có cơ chế cleanup (`chartInstance.destroy()`) khi component bị unmount hoặc danh sách deposits thay đổi để tránh rò rỉ bộ nhớ và lỗi vẽ đè lên canvas.
  - Sử dụng các màu sắc tối giản, sang trọng, phù hợp với theme tối của Telegram (Dark mode).

#### Mẫu mã nguồn tham chiếu (GrowthChart.tsx & Step-wise Algorithm):
```typescript
import React, { useEffect, useRef } from 'react';
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
import { Deposit } from '../types';
import { parseClientDateString } from '../utils/interest';

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

interface ChartDataPoint {
  date: string;
  total: number;
}

export const GrowthChart: React.FC<{ deposits: Deposit[] }> = ({ deposits }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Hủy biểu đồ cũ nếu tồn tại trước khi khởi tạo biểu đồ mới
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const data = generateStepWiseGrowthData(deposits);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Tổng tài sản (gốc + lãi)',
          data: data.map(d => d.total),
          borderColor: '#64b5f6',
          backgroundColor: 'rgba(100, 181, 246, 0.1)',
          fill: true,
          tension: 0, // step-wise dùng góc nhọn, đường thẳng gấp khúc không cong
          pointRadius: 2,
        }]
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
  }, [deposits]);

  return (
    <div className="h-48 w-full relative">
      <canvas ref={canvasRef} />
    </div>
  );
};

// Hàm sinh dữ liệu step-wise lũy tiến
export function generateStepWiseGrowthData(deposits: Deposit[]): ChartDataPoint[] {
  const activeDeposits = deposits.filter(
    d => d.status === 'active' || d.status === 'matured'
  );

  if (activeDeposits.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tìm ngày đáo hạn xa nhất
  let maxMaturity = new Date(today);
  activeDeposits.forEach(d => {
    try {
      const matDate = parseClientDateString(d.maturity_at);
      if (matDate > maxMaturity) {
        maxMaturity = matDate;
      }
    } catch (e) {
      console.error(e);
    }
  });

  const dataPoints: ChartDataPoint[] = [];
  const currentDate = new Date(today);

  while (currentDate <= maxMaturity) {
    let totalValue = 0;
    activeDeposits.forEach(d => {
      try {
        const matDate = parseClientDateString(d.maturity_at);
        totalValue += d.amount; // Cộng tiền gốc
        
        // Chỉ cộng tiền lãi khi ngày hiện tại đã đạt hoặc vượt qua ngày đáo hạn
        if (currentDate >= matDate) {
          totalValue += d.expected_interest;
        }
      } catch (e) {
        totalValue += d.amount;
      }
    });

    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    
    dataPoints.push({
      date: `${dd}/${mm}/${yyyy}`,
      total: totalValue
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}
```

### 2.3. `frontend/src/components/RolloverForm.tsx` (Tạo mới Component Form tái tục)
* **Vai trò & Luồng dữ liệu**:
  - Hiển thị form Bottom Sheet cho phép người dùng thực hiện tái tục khoản gửi đã đáo hạn.
  - Gửi yêu cầu với `action: 'rollover_deposit'` tới backend, truyền thông tin ID cũ cùng các thông số mới (`new_amount`, `new_interest_rate`, `created_at`, `maturity_at`).
* **Tệp analog hiện tại**: [frontend/src/components/DepositForm.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/DepositForm.tsx) (Analog hoàn hảo về cấu trúc form, validation trên blur, logic preview lãi suất và API post).
* **Quy ước kỹ thuật**:
  - Prefill dữ liệu mặc định:
    - Tiền gốc = Tiền gốc của khoản cũ.
    - Lãi suất = Lãi suất của khoản cũ.
    - Ngày gửi = Ngày đáo hạn của khoản cũ.
    - Ngày đáo hạn = Ngày đáo hạn của khoản cũ cộng thêm 1 năm (tương ứng kỳ hạn 12 tháng phổ biến).
  - Cung cấp hàm bảo vệ năm nhuận (Feb 29) khi dịch chuyển ngày đáo hạn lên 1 năm.
  - Sử dụng validation inline tương tự `DepositForm` cho toàn bộ các trường nhập liệu trước khi submit.

#### Mẫu mã nguồn tham chiếu (RolloverForm.tsx & Leap-Year Protection):
```typescript
import React, { useState, useEffect } from 'react';
import { callBackendApi } from '../api';
import { formatMaskDate } from '../utils/dateMask';
import { calculateExpectedInterest } from '../utils/interest';
import { Deposit } from '../types';

interface RolloverFormProps {
  isOpen: boolean;
  onClose: () => void;
  oldDeposit: Deposit;
  onSuccess: () => void;
}

export function getNextYearDateStr(dateStr: string): string {
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  const nextYear = year + 1;
  
  // Leap year case: 29/02 -> 28/02 nếu năm tiếp theo không phải năm nhuận
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

export const RolloverForm: React.FC<RolloverFormProps> = ({
  isOpen,
  onClose,
  oldDeposit,
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [maturityAt, setMaturityAt] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  // Khởi tạo các giá trị prefill khi mở Form
  useEffect(() => {
    if (isOpen && oldDeposit) {
      setAmount(oldDeposit.amount.toString());
      setInterestRate(oldDeposit.interest_rate.toString());
      setCreatedAt(oldDeposit.maturity_at); // Ngày bắt đầu tái tục = Ngày đáo hạn của khoản cũ
      setMaturityAt(getNextYearDateStr(oldDeposit.maturity_at)); // Mặc định cộng 1 năm
      setErrors({});
      setTouched({});
    }
  }, [isOpen, oldDeposit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form...
    
    try {
      setSubmitting(true);
      const payload = {
        action: 'rollover_deposit',
        id: oldDeposit.id,
        new_amount: parseFloat(amount),
        new_interest_rate: parseFloat(interestRate),
        created_at: createdAt,
        maturity_at: maturityAt
      };
      
      await callBackendApi(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu trúc JSX kế thừa trực tiếp từ DepositForm (Theme tối #0e1621 và input #17212b)
  return (
    // ...
  );
};
```

### 2.4. `frontend/src/components/DepositList.tsx` (Details & Trigger Rollover)
* **Vai trò & Luồng dữ liệu**:
  - Tích hợp nút "Tái tục" vào Panel chi tiết của từng khoản tiết kiệm.
  - Chỉ hiển thị nút "Tái tục" khi khoản tiết kiệm đã đến hạn hoặc quá hạn (`diffDays <= 0`).
  - Khi nhấn nút "Tái tục", thực hiện đóng panel chi tiết và kích hoạt trạng thái mở `RolloverForm` ở component cha.
* **Tệp analog hiện tại**: [frontend/src/components/DepositList.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/DepositList.tsx).

#### Mẫu mã nguồn tham chiếu (Details Panel Action Integration):
```typescript
// Trong details sheet của DepositList:
{selectedDeposit && (
  <div className="space-y-5 text-sm">
    {/* ... Chi tiết khoản gửi ... */}
    
    <div className="flex gap-3">
      <button
        onClick={() => setSelectedDeposit(null)}
        className="flex-1 py-3 bg-[#2c3847] hover:bg-[#374657] text-[#f5f5f5] font-semibold rounded-xl transition cursor-pointer"
      >
        Đóng
      </button>
      
      {/* Chỉ hiển thị nút Tái tục nếu khoản tiết kiệm đã đáo hạn hoặc quá hạn */}
      {isMaturedOrOverdue(selectedDeposit) && (
        <button
          onClick={() => {
            const depToRollover = selectedDeposit;
            setSelectedDeposit(null);
            // Trigger mở form tái tục ở component cha/App
            onTriggerRollover(depToRollover);
          }}
          className="flex-1 py-3 bg-[#5288c1] hover:bg-[#4678ad] text-white font-semibold rounded-xl transition cursor-pointer"
        >
          Tái tục
        </button>
      )}
    </div>
  </div>
)}
```

---

## 3. Quản lý Lỗi và Trải nghiệm Người dùng (UX & Resiliency)

1. **Leap-Year Safety**: Khi tính toán tự động ngày đáo hạn mới dựa trên ngày cũ + 1 năm, luôn áp dụng hàm `getNextYearDateStr` để xử lý chính xác trường hợp ngày 29 tháng 2 (năm nhuận) chuyển sang năm thường thành ngày 28 tháng 2.
2. **Chart.js Cleanup**: Luôn bảo đảm việc khởi tạo Chart.js nằm trong vòng đời `useEffect` và có cơ chế unmount/destroy rõ ràng để tránh bị rò rỉ tài nguyên, vẽ lặp hoặc đè canvas khi hot-reload SPA hoặc khi tải lại dữ liệu.
3. **Validation & Preview**: Giữ nguyên quy chuẩn validation tại Frontend của `DepositForm` cho `RolloverForm`, bao gồm việc kiểm tra tính hợp lệ của chuỗi ngày tháng, số dương đối với tiền gửi, số không âm đối với lãi suất, và ngày đáo hạn phải đứng sau ngày bắt đầu gửi.
