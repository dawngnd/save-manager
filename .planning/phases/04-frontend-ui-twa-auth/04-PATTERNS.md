# Phase 4: Frontend UI (TWA) & Auth - Patterns

Tài liệu này xác định các mẫu thiết kế, quy ước lập trình, cấu trúc thư mục và mẫu mã nguồn tham chiếu cho các tệp tin được tạo mới hoặc sửa đổi trong **Phase 4: Frontend UI (TWA) & Auth**.

---

## 1. Sửa đổi Backend (Google Apps Script)

### 1.1. `backend/Code.js`
* **Vai trò & Luồng dữ liệu**: 
  - Định tuyến API dựa trên trường `action` trong payload POST.
  - Tích hợp logic xác thực `initData` của Telegram Web App bằng thuật toán HMAC-SHA256 nhằm đảm bảo yêu cầu đến từ Telegram Mini App chính thức.
  - Thêm API mới `get_users` để trả về danh sách `username_bankcode` hiển thị ở dropdown phía Frontend.
* **Tệp analog hiện tại trong codebase**: Bản thân [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js).
* **Quy ước coding & cấu trúc hàm**:
  - Viết code thuần ES5 tương thích với Google Apps Script V8 Engine.
  - Sử dụng JSDoc đầy đủ cho các hàm mới.
  - Dùng `LockService` đối với các hành động ghi (`add_deposit`, `rollover_deposit`), và bỏ qua LockService đối với các hành động chỉ đọc (`get_deposits`, `get_users`) để tránh nghẽn luồng.
  - Trả về response thông qua hàm trợ giúp `buildJsonResponse(status, messageOrData)` có sẵn trong codebase.

#### Code Excerpt mẫu (Xác thực WebAppData & API Routing):
```javascript
// Thêm vào backend/Code.js

/**
 * Xác thực dữ liệu initData từ Telegram Web App gửi lên.
 * @param {string} initData Chuỗi query string nhận từ client
 * @param {string} botToken Token của bot Telegram lấy từ Script Properties
 * @returns {boolean} True nếu hợp lệ, False nếu giả mạo hoặc quá hạn
 */
function verifyTelegramWebAppData(initData, botToken) {
  if (!initData) return false;

  try {
    const params = {};
    const parts = initData.split('&');
    for (let i = 0; i < parts.length; i++) {
      const pair = parts[i].split('=');
      const key = decodeURIComponent(pair[0]);
      const value = decodeURIComponent(pair[1] || '');
      params[key] = value;
    }

    const hash = params['hash'];
    if (!hash) return false;

    // Kiểm tra thời gian hết hạn (auth_date không quá 24h để tránh replay attack)
    const authDate = parseInt(params['auth_date'], 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(authDate) || (currentTime - authDate) > 86400) {
      Logger.log("Cảnh báo: Yêu cầu xác thực quá hạn (24h).");
      return false;
    }

    // Tạo chuỗi dữ liệu data-check-string (loại bỏ hash và sắp xếp theo key)
    const sortedKeys = Object.keys(params).filter(k => k !== 'hash').sort();
    const dataCheckString = sortedKeys.map(k => `${k}=${params[k]}`).join('\n');

    // Tạo Secret Key bằng cách ký Bot Token với key hằng số "WebAppData"
    const secretKey = Utilities.computeHmacSha256Signature(botToken, "WebAppData");

    // Ký dataCheckString bằng secretKey vừa tạo
    const signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, secretKey);

    // Chuyển đổi byte array sang hex string
    const signatureHex = signatureBytes.map(b => {
      const val = b < 0 ? b + 256 : b;
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    return signatureHex === hash;
  } catch (err) {
    Logger.log("Lỗi trong verifyTelegramWebAppData: " + err.toString());
    return false;
  }
}

/**
 * Nghiệp vụ lấy danh sách users phục vụ hiển thị dropdown ở Frontend.
 * @param {{users: GoogleAppsScript.Spreadsheet.Sheet}} sheets
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function executeGetUsers(sheets) {
  const usersSheet = sheets.users;
  const lastRow = usersSheet.getLastRow();
  const result = [];
  
  if (lastRow > 1) {
    // Chỉ đọc cột A (username_bankcode)
    const values = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0]) {
        result.push(values[i][0]);
      }
    }
  }
  return buildJsonResponse("success", result);
}
```

* **Xử lý lỗi**:
  - Bọc toàn bộ các hoạt động routing trong khối `try-catch` và trả về thông tin lỗi có cấu trúc thông qua `buildJsonResponse("error", error.message)`.

---

## 2. Tạo mới CI/CD Pipeline

### 2.1. `.github/workflows/deploy.yml`
* **Vai trò & Luồng dữ liệu**: Tự động hóa quá trình đóng gói và phát hành Frontend SPA lên nhánh `gh-pages` của GitHub Pages bất cứ khi nào có thay đổi được đẩy lên nhánh chính `main` trong thư mục `frontend/`.
* **Tệp analog trong codebase**: Không có (Tạo mới hoàn toàn).
* **Quy ước & Định dạng**: Sử dụng định dạng YAML tiêu chuẩn cho GitHub Actions. Sử dụng phiên bản Node.js v20 LTS và caching cho `npm` dependencies để tăng tốc độ build.

#### Code Excerpt mẫu:
```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy.yml'

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'frontend/package.json'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Build SPA
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: |
          cd frontend
          npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: frontend/dist
          branch: gh-pages
```

---

## 3. Tạo mới Frontend SPA (React + TypeScript + Tailwind CSS)

### 3.1. `frontend/vite.config.ts`
* **Vai trò**: Cấu hình quy trình biên dịch Vite. Tích hợp `vite-plugin-singlefile` để đóng gói toàn bộ CSS, JS và tài nguyên tĩnh trực tiếp vào bên trong `index.html`.
* **Mẫu cấu hình**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000, // Inlining tuyệt đối mọi file
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```

### 3.2. `frontend/src/utils/telegram.ts`
* **Vai trò**: Cấu hình khởi tạo và tương tác với SDK Telegram Web App, quản lý viewport và cung cấp cơ chế giả lập dữ liệu (`Local Mock Dev Mode`) khi phát triển hoặc kiểm thử cục bộ trên trình duyệt thông thường.
* **Mẫu cấu hình**:
```typescript
import { init, initData } from '@telegram-apps/sdk';

export interface TelegramSession {
  rawInitData: string;
  user: {
    id: number;
    username?: string;
    firstName?: string;
  } | null;
  isMock: boolean;
}

export function initializeTelegramSDK(): TelegramSession {
  try {
    init();
    if (initData.isSupported() && initData.raw()) {
      const parsed = initData.parse();
      return {
        rawInitData: initData.raw() || "",
        user: parsed.user || null,
        isMock: false,
      };
    }
  } catch (e) {
    console.warn("Telegram SDK không khả dụng. Chuyển sang chế độ Local Mock Dev.", e);
  }

  // Fallback Mock Data phục vụ dev ngoài telegram bot
  return {
    rawInitData: "query_id=mock_query&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Admin%22%2C%22username%22%3A%22admin_test%22%7D&auth_date=1719999999&hash=mock_hash",
    user: {
      id: 123456789,
      username: "admin_test",
      firstName: "Admin",
    },
    isMock: true,
  };
}
```

### 3.3. `frontend/src/api.ts`
* **Vai trò & Luồng dữ liệu**: Gọi API tới Google Apps Script Web App URL bằng phương thức `fetch()` POST. Tự động đính kèm `initData` lấy từ Telegram Session để backend thực hiện xác thực chữ ký.
* **Tệp analog hiện tại**: Hàm `buildJsonResponse` của backend định nghĩa cấu trúc dữ liệu trả về. Mẫu Frontend API cần phân tích kết quả theo cấu trúc này.
* **Mẫu cấu hình**:
```typescript
import { initializeTelegramSDK } from './utils/telegram';

interface ApiPayload {
  action: string;
  initData: string;
  username_bankcode?: string;
  telegram_chat_id?: number;
  data?: any;
}

export async function callBackendApi<T = any>(payload: Omit<ApiPayload, 'initData'>): Promise<T> {
  const session = initializeTelegramSDK();
  const fullPayload: ApiPayload = {
    ...payload,
    initData: session.rawInitData,
  };

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error("VITE_API_URL chưa được định nghĩa trong biến môi trường.");
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Tránh CORS preflight nếu cần
    },
    body: JSON.stringify(fullPayload),
  });

  if (!response.ok) {
    throw new Error(`Lỗi kết nối API: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message || "Đã xảy ra lỗi từ API backend.");
  }
  return result.data;
}
```

### 3.4. `frontend/src/utils/dateMask.ts`
* **Vai trò**: Cung cấp hàm định dạng tự động (mask) khi người dùng nhập chuỗi ngày tháng ở ô Input theo định dạng `DD/MM/YYYY`.
* **Mẫu cấu hình**:
```typescript
/**
 * Định dạng chuỗi ngày tháng nhập vào dạng DD/MM/YYYY tự động
 * @param value Giá trị hiện tại của input
 * @param prevValue Giá trị trước đó để phát hiện nút xóa
 */
export function formatMaskDate(value: string, prevValue: string): string {
  const clean = value.replace(/\D/g, "");
  
  // Phát hiện xóa ký tự phân tách '/'
  if (value.length < prevValue.length && (prevValue.endsWith('/') || prevValue.length === 3 || prevValue.length === 6)) {
    return value;
  }
  
  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
}
```

### 3.5. `frontend/src/utils/interest.ts`
* **Vai trò**: Hỗ trợ Frontend tính toán số ngày gửi thực tế và tính lãi dự kiến realtime để hiển thị preview cho người dùng ngay trên Form trước khi lưu.
* **Tệp analog hiện tại**: `calculateDaysDifference(startDateStr, endDateStr)` và logic tính lãi của hàm `executeAddDeposit` trong [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js).
* **Mẫu cấu hình**:
```typescript
/**
 * Chuyển đổi chuỗi DD/MM/YYYY thành đối tượng Date client
 */
export function parseClientDateString(dateStr: string): Date {
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Tính số ngày gửi thực tế giữa hai chuỗi ngày DD/MM/YYYY
 */
export function calculateDaysBetween(startStr: string, endStr: string): number {
  const start = parseClientDateString(startStr);
  const end = parseClientDateString(endStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Tính lãi dự kiến realtime
 */
export function calculateExpectedInterest(amount: number, rate: number, startStr: string, endStr: string): number {
  try {
    const days = calculateDaysBetween(startStr, endStr);
    if (days <= 0 || amount <= 0 || rate <= 0) return 0;
    
    // Công thức tính lãi của dự án: expected_interest = amount * (rate / 100) * (days / 365)
    const interest = amount * (rate / 100) * (days / 365);
    return Math.round(interest);
  } catch {
    return 0;
  }
}
```

### 3.6. `frontend/src/components/BottomSheet.tsx`
* **Vai trò**: Component khung (wrapper) hiển thị Bottom Sheet dạng trượt từ dưới lên, áp dụng animation mượt mà bằng Tailwind CSS transition.
* **Mẫu cấu hình**:
```tsx
import React, { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300); // Khớp với transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sheet Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-2xl z-50 transition-transform duration-300 transform shadow-2xl overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3 cursor-pointer" onClick={onClose} />
        
        <div className="px-5 pb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button className="text-gray-500 hover:text-gray-700 text-xl font-bold" onClick={onClose}>
              &times;
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};
```

### 3.7. `frontend/src/components/DepositList.tsx`
* **Vai trò & Luồng dữ liệu**: Hiển thị danh sách các khoản tiết kiệm cần xử lý của người dùng.
* **Tệp analog trong codebase**: Logic lọc của hàm `checkMaturityAndSendAlerts` trong [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js) (Chỉ lọc các khoản có số ngày đáo hạn còn lại `<= 3` hoặc đã quá hạn).
* **Mẫu cấu hình**:
```typescript
// Trong Component render danh sách:
const filterDepositsToResolve = (deposits: any[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deposits
    .filter(item => item.status === 'active' || item.status === 'matured')
    .filter(item => {
      try {
        const maturityDate = parseClientDateString(item.maturity_at);
        const diffTime = maturityDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        // Lọc các khoản sắp đáo hạn <= 3 ngày HOẶC đã quá hạn (diffDays < 0)
        return diffDays <= 3;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = parseClientDateString(a.maturity_at).getTime();
      const dateB = parseClientDateString(b.maturity_at).getTime();
      return dateA - dateB; // Đáo hạn gần nhất lên đầu
    });
};
```

---

## 4. Kiểm soát lỗi và Logging ở Frontend

* **Xử lý lỗi API**: Tất cả các lỗi API phải được bắt ở tầng component và hiển thị thông báo thân thiện (ví dụ: dùng Toast notification).
* **Logging**: Sử dụng `console.error` hoặc `console.warn` đối với lỗi phát triển và fallback mock session. Tránh log các thông tin nhạy cảm của người dùng như số dư hoặc thông tin tài khoản ngân hàng lên console ở môi trường production.
