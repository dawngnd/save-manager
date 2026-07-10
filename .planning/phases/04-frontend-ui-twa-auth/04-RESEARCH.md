# Phase 4: Frontend UI (TWA) & Auth - Research

**Researched:** 2026-07-10
**Domain:** Frontend SPA & Auth Integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Hosting):** Frontend SPA deploy lên GitHub Pages (miễn phí, CDN). GAS chỉ làm API backend. Frontend gọi API qua `fetch()` tới GAS Web App URL.
- **D-02 (API URL Config):** GAS Web App URL lưu trong biến môi trường Vite (`.env`) — `VITE_API_URL=https://script.google.com/macros/s/.../exec`.
- **D-03 (CI/CD):** GitHub Actions — Push lên branch `main` tự động build và deploy lên GitHub Pages.
- **D-04 (Code Location):** Mono-repo — Frontend code nằm trong thư mục `frontend/` cùng repo Git với backend.
- **D-05 (No Login Page):** Ứng dụng cá nhân, admin duy nhất. Không cần trang đăng nhập hay phân quyền. Chỉ cần xác thực request đến từ Telegram Bot.
- **D-06 (User Selection):** Dùng luôn sheet `Users` hiện tại. Frontend gọi API mới `get_users` để lấy danh sách `username_bankcode`, hiển thị dropdown cho user chọn.
- **D-07 (No Session Storage):** Không lưu session. Mỗi lần mở app phải chọn lại `username_bankcode` từ dropdown.
- **D-08 (Request Auth):** Xác thực `initData` từ Telegram Web App bằng HMAC-SHA256 trên backend. Đảm bảo request đến từ Telegram Mini App chính thức.
- **D-09 (Layout):** Cards layout — mỗi khoản gửi là 1 card riêng, phù hợp màn hình điện thoại.
- **D-10 (Card Content):** Card compact — hiển thị: số tiền, lãi suất, ngày đáo hạn, trạng thái. Nhấn vào card mở chi tiết đầy đủ dạng bottom sheet.
- **D-11 (Sort):** Sắp xếp theo ngày đáo hạn gần nhất lên đầu.
- **D-12 (Filter):** Chỉ hiển thị các khoản cần xử lý — sắp đáo hạn trong ≤ 3 ngày + đã quá hạn chưa xử lý (active/matured). Không có tab "Tất cả".
- **D-13 (Detail View):** Bottom sheet / slide-up panel khi nhấn vào card.
- **D-14 (Trigger):** FAB (Floating Action Button) — nút "+" nổi góc dưới phải, nhấn vào mở form dạng bottom sheet.
- **D-15 (Date Input):** Nhập text với mask DD/MM/YYYY — nhất quán với format backend. Không dùng datepicker.
- **D-16 (Validation):** Inline realtime validation — lỗi hiện ngay dưới field khi blur (số tiền > 0, lãi suất >= 0, ngày hợp lệ, ngày đáo hạn sau ngày tạo).
- **D-17 (Interest Preview):** Preview lãi dự kiến realtime khi nhập đủ số tiền + lãi suất + ngày.
- **D-18 (Post-Submit):** Giữ form mở để thêm tiếp + hiển thị toast thành công + refresh danh sách phía sau.

### the agent's Discretion
- Chi tiết cấu trúc HTML/CSS component, cách tổ chức TypeScript modules.
- Cách implement date mask input (custom logic không dùng thư viện nặng).
- Design hệ thống bottom sheet animation bằng CSS transition.
- Chi tiết cấu hình GitHub Actions workflow.

### Deferred Ideas (OUT OF SCOPE)
- **Dashboard / Summary bar:** Tổng kết tài sản (tổng gốc + tổng lãi dự kiến) là tính năng riêng ở milestone sau (command `/dashboard`).
- **Tab xem toàn bộ khoản gửi:** Xem tất cả khoản active/rolled_over.
</user_constraints>

<phase_requirements>
## Phase Requirements

| Requirement ID | Description | Research Support |
|----------------|-------------|------------------|
| **UI-01** | Xây dựng SPA bằng Vite + TypeScript + Tailwind CSS, deploy lên GitHub Pages công khai. | Sử dụng Vite và `vite-plugin-singlefile` để tạo bundle tự chứa, tránh lỗi đường dẫn tương đối khi triển khai trên subpath GitHub Pages. |
| **UI-02** | Giao diện hiển thị trực tiếp danh sách các khoản tiết kiệm và nút bấm tương tác (không cần trang login phức tạp, tự động nhận tài khoản hoặc chọn từ danh sách). | Dropdown chọn `username_bankcode` lấy từ API `get_users` (sheet Users). Giao diện danh sách hiển thị các khoản cần xử lý (quá hạn và sắp đáo hạn ≤ 3 ngày). |
| **UI-03** | Tích hợp `@telegram-apps/sdk` để tối ưu hóa hiển thị (theme, viewport) khi chạy trong Telegram Mini App. | Tích hợp `@telegram-apps/sdk` để đọc `initData`, điều chỉnh theme màu đồng bộ với Telegram và tự động liên kết `telegram_chat_id` khi gọi API. |
| **DEP-01** | Form thêm mới khoản tiết kiệm trực quan. | Floating Action Button (FAB) mở bottom sheet form. Tích hợp mask DD/MM/YYYY, inline validation, và tính toán số ngày & lãi dự kiến realtime trên form. |
</phase_requirements>

## Summary
1. **Mono-repo Structure:** Frontend sẽ được tổ chức trong thư mục `/frontend` tại thư mục gốc. Sử dụng React + Vite + TypeScript + Tailwind CSS v4.
2. **Telegram SDK Integration:** Sử dụng `@telegram-apps/sdk` để trích xuất `initDataRaw` gửi lên backend làm mã xác thực, và phân tích `initData` lấy thông tin user (`id` làm `telegram_chat_id`, `username`). Hỗ trợ chế độ Local Mock Dev Mode khi chạy ngoài môi trường Telegram.
3. **GAS Backend Auth:** Sử dụng `Utilities.computeHmacSha256Signature` trong GAS để xác thực chữ ký `initData` của Telegram Web App bằng cách tính toán khóa bí mật qua `botToken` và hằng số `"WebAppData"`.
4. **Vite Single-File Bundle:** Sử dụng `vite-plugin-singlefile` để compile toàn bộ CSS/JS/HTML thành 1 file duy nhất. Thiết kế này giúp ứng dụng chạy được trên mọi subpath của GitHub Pages mà không gặp lỗi 404 assets và giảm thiểu request CDN.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| **Routing & Rendering** | Frontend SPA | None | SPA chạy hoàn toàn phía client, hiển thị danh sách và bottom sheets bằng React State. |
| **User Authentication** | GAS Backend | Frontend SPA | Xác thực chữ ký `initData` qua HMAC-SHA256 trên backend để chống giả mạo dữ liệu. |
| **Data Querying** | GAS Backend | Google Sheets | GAS định tuyến API, truy vấn dữ liệu từ sheet `Users` và `Deposits`. |
| **Data Persistence** | GAS Backend | Google Sheets | Sử dụng `LockService` trên GAS backend để ngăn chặn race condition khi tạo khoản tiết kiệm mới. |

## Standard Stack

| Technology / Library | Version | Purpose | Why Standard / When to use |
|----------------------|---------|---------|----------------------------|
| **TypeScript** | `~5.x` | Application language | Đảm bảo tính an toàn dữ liệu và autocomplete các kiểu dữ liệu API & Telegram SDK. (stack spec ghi `7.0.2` nhưng TS 5.x là phiên bản stable thực tế tương thích tốt nhất hiện tại). |
| **Vite** | `^6.x` | Build tool | Bundler cực nhanh, hỗ trợ HMR trong quá trình phát triển cục bộ. |
| **vite-plugin-singlefile** | `^2.x` | Bundles CSS/JS into single index.html | Tự động inlining toàn bộ tài nguyên vào `index.html` giúp triển khai GitHub Pages không lo sai đường dẫn assets. |
| **Tailwind CSS** | `^4.x` | CSS Framework | Tích hợp v4 dạng compiler trực tiếp trong Vite, tối ưu hóa CSS sinh ra. |
| **@telegram-apps/sdk** | `3.11.8` | Telegram Mini App SDK | Thư viện chuẩn để giao tiếp với nền tảng Telegram, lấy thông tin theme, viewport và `initData`. |

## Package Legitimacy Audit

| Package Name | Version | Age | Daily Downloads | Verdict | Disposition |
|--------------|---------|-----|-----------------|---------|-------------|
| `@telegram-apps/sdk` | `3.11.8` | ~6 months | ~5,000+ | SECURE | Thư viện chính thức từ Telegram Mini Apps team, an sau để sử dụng. |
| `vite-plugin-singlefile` | `2.3.3` | ~8 months | ~150,000+ | SECURE | Plugin phổ biến và đáng tin cậy cho việc bundle single file HTML. |
| `tailwindcss` | `4.3.2` | ~1 month | ~2,500,000+ | SECURE | Framework CSS phổ biến toàn cầu, an toàn tuyệt đối. |
| `chart.js` | `4.5.1` | ~9 months | ~1,200,000+ | SECURE | Thư viện vẽ biểu đồ chuẩn thế giới, an toàn để tích hợp. |

## Architecture Patterns

### 1. Project Directory Layout (Mono-repo)
Thư mục `frontend/` sẽ được tổ chức như sau:
```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env
├── .env.example
├── index.html
└── src/
    ├── main.tsx
    ├── index.css
    ├── types.ts          # Định nghĩa kiểu dữ liệu API và SDK
    ├── api.ts            # Xử lý fetch request tới GAS với header/payload
    ├── components/
    │   ├── App.tsx       # Component gốc quản lý layout và state chính
    │   ├── UserSelector.tsx # Dropdown chọn username_bankcode
    │   ├── DepositList.tsx  # Danh sách cards các khoản tiết kiệm cần xử lý
    │   ├── DepositCard.tsx  # Card hiển thị compact của mỗi khoản tiết kiệm
    │   ├── DepositDetail.tsx # Bottom sheet chi tiết thông tin khoản tiết kiệm
    │   └── DepositForm.tsx  # Bottom sheet thêm mới khoản gửi (FAB kích hoạt)
    └── utils/
        ├── dateMask.ts   # Tự động định dạng chuỗi nhập ngày DD/MM/YYYY
        ├── validation.ts # Kiểm tra tính hợp lệ dữ liệu đầu vào
        └── interest.ts   # Tính lãi dự kiến realtime
```

### 2. Vite & Singlefile Configuration (`vite.config.ts`)
Cấu hình inlining assets tự động:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000, // Đảm bảo inlining mọi file
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

### 3. Telegram Web App Init & Mock Utility (`src/utils/telegram.ts`)
Hỗ trợ kiểm tra môi trường Telegram và fallback về mock data khi dev ngoài bot:
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

  // Mock data phục vụ phát triển cục bộ
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

### 4. HMAC-SHA256 InitData Validation trên GAS Backend
Triển khai thuật toán xác thực trong file `backend/Code.js`:
```javascript
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

    // 1. Kiểm tra thời gian hết hạn (auth_date không quá 24h để tránh replay attack)
    const authDate = parseInt(params['auth_date'], 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(authDate) || (currentTime - authDate) > 86400) {
      Logger.log("Cảnh báo: Yêu cầu xác thực quá hạn (24h).");
      return false;
    }

    // 2. Tạo chuỗi dữ liệu data-check-string (loại bỏ hash và sắp xếp theo key)
    const sortedKeys = Object.keys(params).filter(k => k !== 'hash').sort();
    const dataCheckString = sortedKeys.map(k => `${k}=${params[k]}`).join('\n');

    // 3. Tạo Secret Key bằng cách ký Bot Token với key hằng số "WebAppData"
    // Utilities.computeHmacSha256Signature(value, key)
    const secretKey = Utilities.computeHmacSha256Signature(botToken, "WebAppData");

    // 4. Ký dataCheckString bằng secretKey vừa tạo
    const signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, secretKey);

    // 5. Chuyển đổi byte array sang hex string
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
```

### 5. API Integration & Routing Flow
Tất cả các API call từ client sẽ gửi POST request chứa `initData` và `action` mong muốn:
```typescript
interface ApiPayload {
  action: string;
  initData: string;
  username_bankcode?: string;
  telegram_chat_id?: number;
  data?: any;
}

export async function callBackendApi(payload: Omit<ApiPayload, 'initData'>) {
  const session = initializeTelegramSDK();
  const fullPayload: ApiPayload = {
    ...payload,
    initData: session.rawInitData,
  };

  const response = await fetch(import.meta.env.VITE_API_URL, {
    method: 'POST',
    body: JSON.stringify(fullPayload),
  });

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  return result.data;
}
```

### 6. Date Input Mask Implementation (`src/utils/dateMask.ts`)
Hàm tiện ích định dạng chuỗi tự động khi người dùng gõ ngày:
```typescript
/**
 * Định dạng chuỗi ngày tháng nhập vào dạng DD/MM/YYYY tự động
 * @param value Giá trị hiện tại của input
 * @param prevValue Giá trị trước đó để phát hiện nút xóa
 */
export function formatMaskDate(value: string, prevValue: string): string {
  const clean = value.replace(/\D/g, "");
  
  // Phát hiện xóa ký tự phân tách
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

### 7. Bottom Sheet Animation Pattern (Tailwind CSS)
Sử dụng Tailwind state classes để tạo animation mượt mà cho Bottom Sheet chi tiết và form:
```tsx
import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" onClick={onClose} />
        <div className="px-5 pb-8">{children}</div>
      </div>
    </>
  );
};
```

### 8. GitHub Actions Deployment Pipeline (`.github/workflows/deploy.yml`)
Xây dựng workflow tự động build và deploy lên GitHub Pages khi push vào `main`:
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
*(Lưu ý: User cần cấu hình `VITE_API_URL` trong GitHub Repository Secrets).*

---
*Phase research completed: 2026-07-10*
*Ready for planning: yes*
