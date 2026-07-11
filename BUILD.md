# Hướng dẫn Build & Deploy — Save Manager

Tài liệu hướng dẫn build ứng dụng ở local, cấu hình GitHub Actions CI/CD để tự động deploy frontend lên GitHub Pages và backend lên Google Apps Script.

---

## Mục lục

- [1. Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
- [2. Cấu trúc dự án](#2-cấu-trúc-dự-án)
- [3. Build Frontend (Local)](#3-build-frontend-local)
- [4. Deploy Backend (Local)](#4-deploy-backend-local)
- [5. Cấu hình GitHub Actions](#5-cấu-hình-github-actions)
- [6. Cấu hình GitHub Secrets](#6-cấu-hình-github-secrets)
- [7. Kích hoạt GitHub Pages](#7-kích-hoạt-github-pages)
- [8. Quy trình CI/CD tổng quan](#8-quy-trình-cicd-tổng-quan)
- [9. Xử lý sự cố](#9-xử-lý-sự-cố)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Mục đích |
|---------|---------------------|----------|
| **Node.js** | `>= 20.0.0` | Chạy Vite build và clasp CLI |
| **npm** | `>= 10.0.0` | Quản lý dependencies |
| **@google/clasp** | `>= 2.4.0` | Đẩy code lên Google Apps Script |
| **Git** | `>= 2.30` | Quản lý phiên bản |

Cài đặt clasp global (nếu chưa có):

```bash
npm install -g @google/clasp
```

---

## 2. Cấu trúc dự án

```
save-manager/
├── backend/                    # Google Apps Script backend
│   ├── .clasp.json             # Cấu hình clasp (Script ID)
│   ├── .claspignore            # Danh sách file bỏ qua khi push
│   ├── appsscript.json         # Manifest GAS (timezone, webapp config)
│   ├── Code.js                 # Logic chính (doGet, doPost, DB operations)
│   ├── Tests.js                # Bộ test chạy trên GAS
│   └── SETUP.md                # Hướng dẫn thiết lập Google Sheets DB
│
├── frontend/                   # Vite + React + TypeScript + Tailwind SPA
│   ├── src/                    # Source code frontend
│   ├── dist/                   # Build output (gitignored)
│   ├── .env.example            # Mẫu biến môi trường
│   ├── package.json            # Dependencies & scripts
│   ├── vite.config.ts          # Cấu hình Vite + singlefile plugin
│   └── tsconfig.json           # Cấu hình TypeScript
│
├── .github/workflows/
│   ├── deploy.yml              # CI/CD: Build frontend → Deploy GitHub Pages
│   └── clasp-push.yml          # CI/CD: Push backend → Google Apps Script
│
└── BUILD.md                    # ← File này
```

---

## 3. Build Frontend (Local)

### 3.1 Cài đặt dependencies

```bash
cd frontend
npm install
```

### 3.2 Cấu hình biến môi trường

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Mở `.env` và điền URL Web App của Google Apps Script:

```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

> [!TIP]
> Lấy URL này bằng cách chạy `clasp deployments` trong thư mục `backend/`, hoặc xem trong **Apps Script Editor → Deploy → Manage deployments**.

### 3.3 Chạy dev server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

> [!NOTE]
> Dev server chỉ dùng để phát triển giao diện. Một số tính năng yêu cầu Telegram WebApp context sẽ không hoạt động trên trình duyệt thường.

### 3.4 Build production

```bash
npm run build
```

Output là file **single HTML** tại `frontend/dist/index.html` (toàn bộ JS/CSS đã được inline bởi `vite-plugin-singlefile`).

---

## 4. Deploy Backend (Local)

### 4.1 Đăng nhập clasp

```bash
clasp login
```

### 4.2 Cấu hình Script ID

Sửa file `backend/.clasp.json`, thay `YOUR_SCRIPT_ID_HERE` bằng Script ID thực:

```json
{
  "scriptId": "1a2b3c4d5e6f...",
  "rootDir": "."
}
```

> [!TIP]
> Lấy Script ID tại **Apps Script Editor → Project Settings → IDs → Script ID**.

### 4.3 Push code lên GAS

```bash
cd backend
clasp push
```

### 4.4 Tạo deployment mới

```bash
clasp deploy --description "v1.0 release"
```

> Chi tiết hơn xem file [backend/SETUP.md](backend/SETUP.md).

---

## 5. Cấu hình GitHub Actions

Dự án sử dụng 2 workflow:

### 5.1 Workflow 1: Deploy Frontend (`deploy.yml`)

**File**: `.github/workflows/deploy.yml`

**Trigger**: Push vào branch `main` khi có thay đổi trong `frontend/**`.

**Chức năng**: Build frontend SPA → Deploy lên branch `gh-pages` → GitHub Pages phục vụ Web App.

**Luồng hoạt động**:

```
Push to main (frontend/**) → Checkout → Setup Node 20 → npm ci → npm run build → Deploy to gh-pages branch
```

### 5.2 Workflow 2: Push Backend (`clasp-push.yml`)

**File**: `.github/workflows/clasp-push.yml`

**Trigger**: Push vào branch `main` khi có thay đổi trong `backend/**`.

**Chức năng**: Tự động `clasp push` code backend lên Google Apps Script cloud.

**Luồng hoạt động**:

```
Push to main (backend/**) → Checkout → Setup Node 20 → npm i -g @google/clasp → Ghi .clasprc.json → clasp push
```

> [!IMPORTANT]
> Workflow `clasp-push.yml` yêu cầu cấu hình thêm secrets cho clasp authentication (xem mục 6).

---

## 6. Cấu hình GitHub Secrets

Vào **GitHub repo → Settings → Secrets and variables → Actions → New repository secret** để thêm các secrets sau:

### 6.1 Secrets cho Frontend

| Secret Name | Giá trị | Mô tả |
|-------------|---------|-------|
| `VITE_API_URL` | `https://script.google.com/macros/s/.../exec` | URL Web App endpoint của GAS deployment |

### 6.2 Secrets cho Backend (clasp push)

| Secret Name | Giá trị | Mô tả |
|-------------|---------|-------|
| `CLASP_SCRIPT_ID` | `1a2b3c4d5e6f...` | Script ID của dự án GAS |
| `CLASP_ACCESS_TOKEN` | OAuth access token | Token xác thực clasp |
| `CLASP_REFRESH_TOKEN` | OAuth refresh token | Token làm mới clasp |
| `CLASP_CLIENT_ID` | OAuth client ID | ID ứng dụng OAuth |
| `CLASP_CLIENT_SECRET` | OAuth client secret | Secret ứng dụng OAuth |
| `CLASP_EXPIRY_DATE` | Timestamp (ms) | Thời gian hết hạn token |

### 6.3 Cách lấy clasp credentials

Sau khi chạy `clasp login` ở máy local, file `~/.clasprc.json` sẽ chứa tất cả thông tin cần thiết:

```bash
cat ~/.clasprc.json
```

Output có dạng:

```json
{
  "token": {
    "access_token": "ya29.xxx...",
    "refresh_token": "1//0xxx...",
    "scope": "https://www.googleapis.com/auth/...",
    "token_type": "Bearer",
    "expiry_date": 1720000000000
  },
  "oauth2ClientSettings": {
    "clientId": "1234567890.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-xxx...",
    "redirectUri": "http://localhost"
  }
}
```

Copy từng giá trị vào GitHub Secrets tương ứng:

| Trường trong `.clasprc.json` | → GitHub Secret |
|------------------------------|-----------------|
| `token.access_token` | `CLASP_ACCESS_TOKEN` |
| `token.refresh_token` | `CLASP_REFRESH_TOKEN` |
| `token.expiry_date` | `CLASP_EXPIRY_DATE` |
| `oauth2ClientSettings.clientId` | `CLASP_CLIENT_ID` |
| `oauth2ClientSettings.clientSecret` | `CLASP_CLIENT_SECRET` |

> [!WARNING]
> `access_token` có thời hạn ngắn (1 giờ), nhưng clasp sẽ tự dùng `refresh_token` để lấy token mới. Chỉ cần đảm bảo `refresh_token` vẫn hợp lệ (không bị revoke trong Google Account).

---

## 7. Kích hoạt GitHub Pages

1. Vào **GitHub repo → Settings → Pages**.
2. Ở mục **Source**, chọn **Deploy from a branch**.
3. Chọn branch **`gh-pages`**, thư mục **`/ (root)`**.
4. Nhấn **Save**.

Sau khi workflow `deploy.yml` chạy lần đầu, GitHub Pages sẽ tự động tạo branch `gh-pages` và phục vụ site tại:

```
https://<username>.github.io/save-manager/
```

> [!NOTE]
> Lần push đầu tiên có thể mất 1-2 phút để GitHub Pages khởi tạo. Các lần sau sẽ nhanh hơn (~30 giây).

---

## 8. Quy trình CI/CD tổng quan

```
Developer push to main
         │
         ├─── frontend/** thay đổi?
         │         │
         │         ▼
         │    deploy.yml
         │    ┌─────────────────────────────┐
         │    │ 1. Checkout code             │
         │    │ 2. Setup Node.js 20          │
         │    │ 3. npm ci (frontend/)        │
         │    │ 4. npm run build (với VITE_  │
         │    │    API_URL từ secrets)        │
         │    │ 5. Deploy dist/ → gh-pages   │
         │    └─────────────────────────────┘
         │
         └─── backend/** thay đổi?
                   │
                   ▼
              clasp-push.yml
              ┌─────────────────────────────┐
              │ 1. Checkout code             │
              │ 2. Setup Node.js 20          │
              │ 3. npm i -g @google/clasp    │
              │ 4. Ghi .clasprc.json từ      │
              │    secrets                   │
              │ 5. Ghi .clasp.json với       │
              │    CLASP_SCRIPT_ID           │
              │ 6. clasp push                │
              └─────────────────────────────┘
```

---

## 9. Xử lý sự cố

### Frontend build lỗi TypeScript

```bash
cd frontend
npx tsc --noEmit
```

Kiểm tra lỗi type và sửa trước khi push.

### clasp push bị lỗi authentication

```
Error: Could not read API credentials
```

**Giải pháp**: Chạy lại `clasp login` ở local, copy lại credentials từ `~/.clasprc.json` vào GitHub Secrets.

### clasp push bị lỗi "Script not found"

```
Could not find script
```

**Giải pháp**: Kiểm tra `CLASP_SCRIPT_ID` trong GitHub Secrets đúng với Script ID trong Apps Script Editor.

### GitHub Pages hiển thị 404

**Giải pháp**:
1. Kiểm tra branch `gh-pages` đã được tạo (xem tab **Actions** có workflow nào chạy thành công chưa).
2. Kiểm tra **Settings → Pages** đã chọn đúng branch `gh-pages`.
3. Đợi 1-2 phút sau deployment đầu tiên.

### Refresh token bị hết hạn

Nếu Google revoke refresh token (thường do thay đổi mật khẩu hoặc security event):

```bash
clasp login   # Login lại
cat ~/.clasprc.json   # Copy credentials mới
# Cập nhật lại tất cả CLASP_* secrets trên GitHub
```
