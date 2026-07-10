# Phase 1: DB & clasp Project Setup — Research

**Researched:** 2026-07-10
**Confidence:** HIGH
**Sources:** Google Apps Script docs, clasp GitHub repo, web research on best practices 2025-2026

## 1. Google Sheets Database Schema

### 1.1 Users Sheet

| Column | Data Type | Format | Notes |
|--------|-----------|--------|-------|
| `username_bankcode` | String | Plain Text | **Primary key**. Composite identifier (e.g. `dangnd_vcb`). Set column format to Plain Text to prevent auto-formatting. |

- Bảng Users chỉ có 1 cột theo REQUIREMENTS.md (DB-01).
- Header row ở dòng 1, dữ liệu bắt đầu từ dòng 2.

### 1.2 Deposits Sheet

| Column | Data Type | Format | Notes |
|--------|-----------|--------|-------|
| `id` | String | Plain Text | **Primary key**. Dùng UUID hoặc format `dep-{timestamp}-{random}`. **KHÔNG** dùng row index làm ID (xem PITFALLS.md). |
| `amount` | Number | Number (no formatting) | Số tiền gốc. Lưu raw number, không format tiền tệ trong cell data. |
| `interest_rate` | Number | Number | Phần trăm lãi dự tính (VD: `6.5` cho 6.5%). |
| `status` | String | Plain Text | Enum: `active`, `matured`, `rolled_over`. |
| `expected_interest` | Number | Number | Tiền lãi dự tính. Tính trên server: `amount * (interest_rate/100) * (days/365)`. |
| `created_at` | String | Plain Text (ISO 8601) | Format `YYYY-MM-DD`. Lưu dạng string để tránh timezone shift (PITFALLS.md #4). |
| `maturity_at` | String | Plain Text (ISO 8601) | Format `YYYY-MM-DD`. |
| `user_bankcode` | String | Plain Text | Foreign key liên kết bảng Users. |

### 1.3 Schema Design Principles (từ web research)

- **One sheet = one table**: Mỗi tab là một bảng riêng biệt.
- **Header row luôn ở row 1**: Nhất quán cho `getDataRange().getValues()`.
- **Plain Text cho IDs và dates**: Ngăn Google Sheets auto-format (VD: `00123` → `123`, hoặc date shift).
- **Raw numbers cho amounts**: Không format tiền tệ trong data, chỉ format display trên UI.
- **Validate trên server**: Sheets không enforce data types, phải validate trong Apps Script trước khi ghi.

## 2. clasp Project Setup

### 2.1 Prerequisites

- Node.js >= 20.0.0 (clasp 3.x requirement)
- Google Apps Script API enabled: https://script.google.com/home/usersettings → ON
- `npm install -g @google/clasp` hoặc dùng local: `npx clasp`

### 2.2 Initialization Steps

```bash
# 1. Login
clasp login

# 2. Create standalone GAS project
cd backend/
clasp create --title "Save Manager" --type standalone
```

Lệnh `clasp create` tự động tạo 2 file:
- `.clasp.json` — chứa `scriptId` liên kết local → GAS cloud
- `appsscript.json` — manifest file

### 2.3 .clasp.json Configuration

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./dist"
}
```

- `rootDir` trỏ đến thư mục output sau build. clasp chỉ push nội dung trong `rootDir`.
- Với Phase 1 (chưa có Vite build), có thể tạm set `"rootDir": "."` và push trực tiếp file `.gs`/`.ts`.

### 2.4 clasp 3.x Key Changes

- **Không còn transpile TypeScript nội bộ**: clasp 3+ đã bỏ tính năng biên dịch TS. Cần dùng bundler bên ngoài (Vite/esbuild).
- **Workflow**: Write TS → Build (Vite) → Output `.js` to `dist/` → `clasp push` from `dist/`.
- Với Phase 1, vì chỉ cần test cơ bản, có thể viết trực tiếp file `.js` (rename thành `.gs` hoặc để `.js`) mà chưa cần setup Vite.

### 2.5 Essential Commands

```bash
clasp push          # Push local → GAS cloud
clasp pull          # Pull cloud → local
clasp open          # Mở GAS editor trong browser
clasp deployments   # Liệt kê deployments
clasp deploy        # Tạo deployment mới
```

## 3. Project Structure

### 3.1 Phase 1 Backend Directory Layout

Theo D-03 (01-CONTEXT.md), project chia 2 thư mục tại root: `backend/` và `frontend/`.

```
save-manager/
├── backend/
│   ├── .clasp.json          # scriptId + rootDir config
│   ├── appsscript.json      # GAS manifest (timezone, runtime, webapp)
│   ├── src/
│   │   └── Code.ts          # Entry point: doGet, doPost
│   ├── dist/                # Build output (clasp pushes from here)
│   │   ├── Code.js          # Compiled backend
│   │   └── appsscript.json  # Copied manifest
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts       # Backend bundler config (Phase 1 có thể defer)
├── frontend/                # (Phase 4, trống trong Phase 1)
├── .planning/
├── GEMINI.md
└── package.json             # Root workspace (optional)
```

### 3.2 Phase 1 Minimal Approach (Recommended)

Vì Phase 1 chỉ cần verify clasp push hoạt động, có thể dùng approach đơn giản:

```
backend/
├── .clasp.json          # rootDir: "."
├── appsscript.json      # timezone + runtime
└── Code.js              # Minimal doGet test (plain JS, no TS build yet)
```

Sau đó Phase 2 mới setup TypeScript + Vite build pipeline đầy đủ. Điều này tuân thủ nguyên tắc **simplicity first** (AGENT_karpathy.md).

**Quyết định cho planner**: Chọn giữa:
- **Option A (Simple)**: Phase 1 viết trực tiếp `.js`, Phase 2 migrate sang TS+Vite. Nhanh, ít risk.
- **Option B (Full setup)**: Phase 1 setup luôn TS+Vite+build pipeline. Mất thêm effort nhưng không phải migrate sau.

## 4. Configuration & Script Properties

### 4.1 Script Properties cho Spreadsheet ID

Theo D-02 (01-CONTEXT.md): "Người dùng tạo thủ công Google Sheet và cấu hình ID vào Script Properties."

```javascript
// Cách set (thủ công qua GAS Editor > Project Settings > Script Properties):
// Key: SPREADSHEET_ID
// Value: your_spreadsheet_id_here

// Cách đọc trong code:
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  if (!ssId) {
    throw new Error('SPREADSHEET_ID not configured in Script Properties');
  }
  return SpreadsheetApp.openById(ssId);
}
```

### 4.2 Best Practices cho Properties

- Dùng `Script Properties` (không phải User/Document Properties) vì config này thuộc app-wide.
- Lưu ý: `PropertiesService` chỉ lưu **strings**. Các giá trị number/JSON cần `JSON.parse()` khi đọc.
- Fetch properties **một lần** đầu script rồi cache vào biến local để tránh latency.
- **Không hardcode** Spreadsheet ID vào source code. Luôn đọc từ Script Properties.
- Script Properties cũng sẽ dùng cho `TELEGRAM_BOT_TOKEN` (Phase 3) — giữ secrets an toàn phía server.

### 4.3 Cách set Script Properties thủ công

1. Mở GAS Editor (hoặc `clasp open`)
2. Vào **Project Settings** (gear icon ⚙️)
3. Scroll xuống **Script Properties**
4. Thêm property: Key = `SPREADSHEET_ID`, Value = `<ID từ URL Google Sheet>`

## 5. appsscript.json Reference

### 5.1 Full Configuration cho Phase 1

```json
{
  "timeZone": "Asia/Ho_Chi_Minh",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```

### 5.2 Field Explanations

| Field | Value | Rationale |
|-------|-------|-----------|
| `timeZone` | `"Asia/Ho_Chi_Minh"` | **Requirement API-03**. Đồng bộ timezone với Google Sheet settings. Ảnh hưởng time-driven triggers và `Utilities.formatDate()`. |
| `dependencies` | `{}` | Không dùng GAS libraries bên ngoài (STACK.md: "Avoid GAS Script ID Libraries"). |
| `exceptionLogging` | `"STACKDRIVER"` | Log errors ra Google Cloud Logging để debug. |
| `runtimeVersion` | `"V8"` | V8 engine (modern JS). Bắt buộc cho syntax ES6+. |
| `webapp.executeAs` | `"USER_DEPLOYING"` | Script chạy dưới quyền developer (người deploy). **PITFALLS.md #5**: tránh Google login prompt trong Telegram. |
| `webapp.access` | `"ANYONE"` | Cho phép bất kỳ ai truy cập URL (cần thiết vì Telegram users không có Google session). |

### 5.3 Timezone Synchronization (API-03)

**Phải đồng bộ 3 nơi:**
1. `appsscript.json` → `"timeZone": "Asia/Ho_Chi_Minh"` ✅ (trong code)
2. Google Sheet → `File > Settings > Time zone` → `(GMT+07:00) Ho Chi Minh` ✅ (thủ công)
3. Client-side dates → Luôn gửi ISO 8601 strings `YYYY-MM-DD` ✅ (convention)

**Lưu ý quan trọng từ web research**: Timezone trong `appsscript.json` **KHÔNG** tự động ảnh hưởng đến timezone của Google Sheet được liên kết. Phải set riêng biệt.

## 6. Basic Test Endpoint

### 6.1 Minimal doGet cho verify clasp push

```javascript
/**
 * Minimal doGet endpoint to verify clasp push works.
 * Access: Deploy as Web App → open URL in browser.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'ok',
      message: 'Save Manager backend is running',
      timestamp: new Date().toISOString(),
      timezone: Session.getScriptTimeZone()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

### 6.2 Verification Steps

1. `clasp push` — push code lên GAS
2. `clasp deploy` — tạo deployment mới
3. `clasp open` — mở GAS editor, lấy Web App URL
4. Mở URL `/exec` trong browser → phải thấy JSON response với timezone `Asia/Ho_Chi_Minh`
5. Hoặc dùng URL `/dev` trong quá trình develop (PITFALLS.md #1: tránh caching)

### 6.3 Alternative: doGet trả về HTML

```javascript
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<h1>Save Manager</h1><p>Backend active. Timezone: '
    + Session.getScriptTimeZone() + '</p>'
  ).setTitle('Save Manager')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

**Lưu ý**: `setXFrameOptionsMode(ALLOWALL)` cần thiết để cho phép embedding trong Telegram WebApp iframe (Phase 4).

## 7. Key Decisions for Planner

### Decisions planner cần đưa ra:

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Build pipeline cho Phase 1** | (A) Plain JS, no build step / (B) Full TS+Vite setup | **Option A** — Phase 1 chỉ cần verify clasp push + sheet schema. Setup Vite ở Phase 2 khi cần. Tuân thủ simplicity first. |
| 2 | **rootDir cho .clasp.json** | (A) `"."` (push trực tiếp) / (B) `"./dist"` (qua build) | Phụ thuộc Decision #1. Nếu Option A → `"."`. Nếu Option B → `"./dist"`. |
| 3 | **Deposit ID format** | (A) UUID / (B) `dep-{timestamp}-{random}` / (C) Auto-increment | **Option B** — human-readable, sortable theo thời gian, unique enough cho personal app. **KHÔNG** dùng row index (PITFALLS.md). |
| 4 | **Sheet creation** | (A) Thủ công bởi user / (B) Script tự tạo sheets nếu chưa có | **Option A** — theo D-02, user tạo thủ công Sheet. Code chỉ cần kết nối via ID. Nhưng có thể viết thêm init script kiểm tra sheets tồn tại. |
| 5 | **Schema init script** | (A) User tạo headers thủ công / (B) Script tự thêm headers nếu sheet trống | **Option B** — viết function `initializeSheets()` tự tạo headers nếu chưa có. Giảm human error. |
| 6 | **doGet response type cho test** | (A) JSON (ContentService) / (B) HTML (HtmlService) | **Option A** cho Phase 1 test — dễ verify bằng curl/browser. Phase 4 sẽ chuyển sang HtmlService. |

### Risks cần lưu ý:

1. **Timezone mismatch**: Phải set timezone ở CẢ `appsscript.json` VÀ Google Sheet settings. Hai cái độc lập nhau.
2. **clasp auth expiry**: Token login của clasp có thể hết hạn. Cần `clasp login` lại khi gặp auth errors.
3. **GAS caching**: Luôn dùng URL `/dev` khi test, hoặc tạo deployment version mới mỗi lần test production URL.
4. **File phải nằm trong rootDir**: clasp CHỈ push file trong `rootDir`. File ngoài rootDir sẽ bị bỏ qua.

---
*Phase research completed: 2026-07-10*
*Ready for planning: yes*
