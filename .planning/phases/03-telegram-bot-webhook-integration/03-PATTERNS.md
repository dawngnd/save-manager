# Phase 3: Telegram Bot Webhook Integration - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 2
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/Code.js` | controller, service, model | request-response, event-driven | `backend/Code.js` | exact |
| `backend/Tests.js` | test | request-response, event-driven | `backend/Tests.js` | exact |

## Pattern Assignments

### `backend/Code.js` (controller, service, model, request-response, event-driven)

**Analog:** `backend/Code.js`

**Imports/Init & Sheet initialization pattern** (lines 18-32):
```javascript
function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Khởi tạo sheet Users với cột telegram_chat_id bổ sung
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
  }
  
  const usersHeaders = ['username_bankcode', 'telegram_chat_id'];
  if (usersSheet.getLastRow() === 0 || isHeaderEmpty(usersSheet, usersHeaders.length)) {
    usersSheet.getRange(1, 1, 1, usersHeaders.length).setValues([usersHeaders]);
  }
  // ...
```

**Webhook Routing & Token Authorization pattern** (lines 96-121):
```javascript
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildJsonResponse("error", "Dữ liệu yêu cầu trống.");
    }
    
    // Đọc token từ query parameter và cấu hình Script Properties
    const properties = PropertiesService.getScriptProperties();
    const webhookToken = properties.getProperty("WEBHOOK_TOKEN");
    const requestToken = e.parameter.token;
    
    const payload = JSON.parse(e.postData.contents);
    const isTelegramWebhook = payload.message || payload.callback_query;
    
    if (isTelegramWebhook) {
      if (!webhookToken || requestToken !== webhookToken) {
        Logger.log("Cảnh báo: Webhook request không có token hợp lệ.");
        return buildJsonResponse("error", "Unauthorized access.");
      }
      return handleTelegramWebhook(payload);
    }
    
    const action = payload.action;
    
    if (action === "get_deposits") {
      const sheets = initializeSheets();
      if (payload.telegram_chat_id) {
        linkTelegramChatId(sheets.users, payload.username_bankcode, payload.telegram_chat_id);
      }
      return executeGetDeposits(sheets, payload);
    }
    // ...
```

**Error Handling & Logging pattern** (lines 117-121):
```javascript
  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return buildJsonResponse("error", "Lỗi xử lý yêu cầu phía server: " + error.message);
  }
}
```

---

### `backend/Tests.js` (test, request-response, event-driven)

**Analog:** `backend/Tests.js`

**Test structure & Assert pattern** (lines 17-42):
```javascript
function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

function runTests() {
  Logger.log("=== BẮT ĐẦU CHẠY KIỂM THỬ BACKEND ===");
  try {
    // ... test cũ ...
    testLinkTelegramChatId();
    testDoPostTelegramWebhook();
    testCheckMaturityAndSendAlerts();
    Logger.log("=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===");
  } catch (error) {
    Logger.log("❌ KIỂM THỬ THẤT BẠI: " + error.toString());
    throw error;
  }
}
```

**Mock spreadsheet & database pattern** (lines 95-157):
```javascript
function createMockSheets() {
  const usersData = []; // Mảng 2 chiều mô phỏng [username, chat_id]
  const depositsData = [];
  
  const usersSheetMock = {
    getLastRow: function() {
      return usersData.length === 0 ? 0 : usersData.length + 1;
    },
    getRange: function(row, col, numRows, numCols) {
      return {
        getValues: function() {
          const result = [];
          for (let i = row - 2; i < row - 2 + numRows; i++) {
            if (usersData[i]) {
              result.push(usersData[i]); // Trả về dòng user mock
            }
          }
          return result;
        },
        setValue: function(value) {
          const rowIndex = row - 2;
          if (usersData[rowIndex]) {
            usersData[rowIndex][col - 1] = value; // Ghi đè chat_id ở cột 2 (col=2)
          }
        }
      };
    },
    appendRow: function(rowArray) {
      usersData.push([...rowArray]);
    }
  };
  // ...
```

## Shared Patterns

### Properties & API Call Credentials
**Source:** `backend/Code.js` (Trực tiếp truy xuất ScriptProperties để lấy token / cấu hình hệ thống)
**Apply to:** Toàn bộ các chức năng liên kết Telegram API (`setupWebhook`, `handleTelegramWebhook`, `sendTelegramApi`, `checkMaturityAndSendAlerts`)
```javascript
const properties = PropertiesService.getScriptProperties();
const botToken = properties.getProperty("TELEGRAM_BOT_TOKEN");
const webhookToken = properties.getProperty("WEBHOOK_TOKEN");
const miniAppUrl = properties.getProperty("MINI_APP_URL");
```

### JSON Response Builder
**Source:** `backend/Code.js` (lines 418-432)
**Apply to:** Tất cả API endpoint trả dữ liệu về frontend và webhook
```javascript
function buildJsonResponse(status, messageOrData) {
  const responseObj = { status: status };
  if (status === "success") {
    responseObj.data = messageOrData;
  } else {
    responseObj.message = messageOrData;
  }
  
  if (typeof ContentService === 'undefined') {
    return responseObj;
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## No Analog Found

Không có file nào không tìm thấy analog. Tất cả thay đổi đều tích hợp trực tiếp vào cấu trúc file hiện tại của dự án (`Code.js`, `Tests.js`).

## Metadata

**Analog search scope:** `backend/`
**Files scanned:** 3
**Pattern extraction date:** 2026-07-10
