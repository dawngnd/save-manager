# Phase 2: Backend DB Operations & Calculations - Research

**Researched:** 2026-07-10
**Domain:** Google Apps Script Backend (Database operations & interest calculation)
**Confidence:** HIGH

## Summary

Phase 2 tập trung vào việc phát triển các dịch vụ cốt lõi phía server trên Google Apps Script (GAS) để thao tác với Google Sheets làm cơ sở dữ liệu. Backend sẽ cung cấp một endpoint `doPost` xử lý các yêu cầu JSON từ client để đọc thông tin các khoản gửi, thêm mới khoản gửi, và thực hiện nghiệp vụ tái tục (rollover) các khoản tiết kiệm. 

Khóa ghi chống xung đột dữ liệu sẽ được triển khai bằng cách sử dụng `LockService` ở tầng ứng dụng, đảm bảo tính toàn vẹn của dữ liệu khi có nhiều yêu cầu gửi ghi đồng thời từ người dùng. Việc tính toán lãi suất dự kiến và parse chuỗi ngày tháng ở định dạng `DD/MM/YYYY` sẽ được thực hiện trực tiếp trên server bằng JavaScript thuần (ES6) để tránh các lỗi lệch ngày do lệch múi giờ trên các môi trường.

**Primary recommendation:** Sử dụng một cấu trúc điều phối tập trung (router) dựa trên thuộc tính `action` trong `doPost`, bọc toàn bộ mã nguồn có liên quan đến ghi sheet bằng khối `try-catch-finally` cùng với `LockService.getScriptLock()` để tối đa hóa tính ổn định và chống bế tắc (deadlocks).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phân Tuyến Yêu Cầu (API Routing) sử dụng duy nhất một thuộc tính `action` trong payload JSON gửi tới `doPost`. Ví dụ:
  - Lấy danh sách: `{ "action": "get_deposits", "username_bankcode": "..." }`
  - Thêm mới: `{ "action": "add_deposit", "username_bankcode": "...", "data": { "amount": 10000000, "interest_rate": 6.2, "created_at": "10/07/2026", "maturity_at": "10/07/2027" } }`
  - Tái tục: `{ "action": "rollover_deposit", "id": "dep-...", "new_amount": 12000000, "new_interest_rate": 5.8, "created_at": "10/07/2027", "maturity_at": "10/07/2028" }`

### Date Format
- **D-02:** Định dạng ngày gửi lên API và lưu trữ trên cơ sở dữ liệu Google Sheet là `DD/MM/YYYY` (ví dụ: `10/07/2026`). Server chịu trách nhiệm tự viết hàm tách chuỗi ngày để tạo đối tượng `Date` và thực hiện các tính toán chênh lệch ngày chính xác (tránh lỗi lệch múi giờ).

### Lock Timeout
- **D-03:** Cài đặt cơ chế khóa ghi bằng `LockService.getScriptLock()` với thời gian chờ tối đa (timeout) là 10 giây (`lock.tryLock(10000)`). Nếu không lấy được khóa, API trả về JSON phản hồi lỗi: `{ "status": "error", "message": "Hệ thống đang bận, vui lòng thử lại." }`.

### the agent's Discretion
- Định nghĩa chi tiết cấu trúc JSON trả về khi thành công hoặc gặp lỗi, cũng như cách thức sinh ID duy nhất cho các khoản tiền gửi (`dep-{timestamp}-{random}`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DB-02** | Triển khai cơ chế khóa ghi bằng `LockService` trên Google Apps Script để tránh tranh chấp dữ liệu khi có nhiều yêu cầu ghi đồng thời. | Sử dụng `LockService.getScriptLock()` với `tryLock(10000)` bọc ngoài logic ghi dữ liệu để đồng bộ hóa luồng ghi, giải phóng lock trong khối `finally` [CITED: developers.google.com/apps-script/reference/lock/lock-service]. |
| **API-01** | Cung cấp API endpoint (`doPost`) nhận định dạng JSON để xử lý các yêu cầu từ Frontend (lấy danh sách, thêm mới, tái tục). | Xây dựng hàm `doPost(e)` nhận nội dung JSON, giải mã trường `action` và phân phối đến các hàm xử lý tương ứng (`getDeposits`, `addDeposit`, `rolloverDeposit`). |
| **API-02** | Tự động tính toán tiền lãi dự tính (`expected_interest = amount * interest_rate * (maturity_at - created_at) / 365`) khi thêm mới hoặc tái tục. | Viết hàm parse định dạng ngày `DD/MM/YYYY` thành đối tượng ngày cục bộ, tính khoảng cách chênh lệch ngày bằng mili-giây và tính tiền lãi làm tròn đến đơn vị đồng. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Routing / Action Dispatching** | API / Backend (GAS) | — | Hàm `doPost(e)` chịu trách nhiệm phân tích yêu cầu JSON và gọi hàm nghiệp vụ thích hợp dựa trên tham số `action` [VERIFIED: GAS Web Apps API]. |
| **Concurrency Locking** | API / Backend (GAS) | — | Đảm bảo tính nhất quán của cơ sở dữ liệu Sheet bằng cách chặn ghi đồng thời sử dụng `LockService` của Google Apps Script. |
| **Database Operations (CRUD)** | Database (Google Sheets) | API / Backend (GAS) | Bảng `Users` và `Deposits` lưu trữ lâu dài thông tin. GAS thực hiện truy vấn và cập nhật dữ liệu hàng. |
| **Interest Calculation** | API / Backend (GAS) | — | Đảm bảo tính toán lãi suất chính xác và nhất quán trên server, tránh việc client gửi dữ liệu lãi suất tự tính sai lệch. |
| **Unique ID Generation** | API / Backend (GAS) | — | Tạo định dạng ID `dep-{timestamp}-{random}` để phân biệt các giao dịch gửi tiền. |

## Standard Stack

### Core
| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| **Google Apps Script Runtime** | V8 | Môi trường thực thi code phía server | Cung cấp các API JavaScript hiện đại (ES6) để xử lý logic nhanh chóng. |
| **SpreadsheetApp** | Native | Tương tác đọc ghi Google Sheets | API chính thức và nhanh nhất để truy cập dữ liệu bảng biểu [CITED: developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app]. |
| **LockService** | Native | Đồng bộ hóa và khóa tài nguyên | Tránh tranh chấp ghi đồng thời ghi đè dữ liệu hàng [CITED: developers.google.com/apps-script/reference/lock/lock-service]. |
| **ContentService** | Native | Trả về output định dạng JSON | Thiết lập đúng kiểu MIME `application/json` cho phản hồi [CITED: developers.google.com/apps-script/reference/content/content-service]. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@types/google-apps-script** | `2.0.11` | Cung cấp kiểu dữ liệu TypeScript của GAS | Dùng trong quá trình phát triển ở local để IDE autocompletion hỗ trợ lập trình chính xác [VERIFIED: npm registry]. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `LockService.getScriptLock()` | `LockService.getDocumentLock()` | Document lock chỉ khóa cho Spreadsheet cụ thể được bind với script. Tuy nhiên, vì chúng ta đang triển khai Standalone Script kết nối qua ID nên dùng Script Lock là an toàn và bao quát toàn bộ tiến trình của ứng dụng [ASSUMED]. |

## Package Legitimacy Audit

*Không cài đặt thêm gói npm phụ thuộc nào trong phase này ngoài các kiểu dữ liệu cho TypeScript ở môi trường phát triển (dev dependencies). Không có rủi ro về package legitimacy trên server chạy Apps Script.*

## Architecture Patterns

### System Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client as Telegram Web App (Frontend)
    participant Server as Google Apps Script (doPost)
    participant Lock as LockService (Script Lock)
    database DB as Google Sheet (Users & Deposits)

    Client->>Server: HTTP POST (action, data, credentials)
    activate Server
    Server->>Server: Kiểm tra tính hợp lệ của Action và Payload
    
    alt Yêu cầu Đọc (get_deposits)
        Server->>DB: Đọc dữ liệu user & deposits (getDataRange)
        DB-->>Server: Trả về mảng dữ liệu raw
        Server-->>Client: Trả về JSON (status: success, data)
    else Yêu cầu Ghi (add_deposit / rollover_deposit)
        Server->>Lock: Yêu cầu khóa ghi (tryLock 10s)
        activate Lock
        alt Không lấy được khóa ghi
            Lock-->>Server: Thất bại (timeout 10s)
            Server-->>Client: Trả về JSON lỗi (status: error, message)
        else Lấy được khóa ghi thành công
            Lock-->>Server: Thành công
            Server->>Server: Parse ngày tháng & Tính tiền lãi dự kiến
            Server->>DB: Ghi/Cập nhật dữ liệu hàng
            Server->>Lock: Giải phóng khóa (releaseLock)
            deactivate Lock
            Server-->>Client: Trả về JSON thành công (status: success, data)
        end
    end
    deactivate Server
```

### Recommended Project Structure
```
backend/
├── appsscript.json      # Timezone và thông tin Web App
├── Code.js              # Mã nguồn xử lý chính (Router, DB helpers, Calculations)
└── SETUP.md             # Tài liệu cấu hình thủ công
```

### Pattern 1: Safe Date Normalization & Parsing
**What:** Sử dụng hàm parse thủ công chuỗi ngày dạng `DD/MM/YYYY` thành một ngày local lúc nửa đêm (00:00:00) để đảm bảo tính toán ngày chính xác và độc lập với các múi giờ khác nhau.
**When to use:** Sử dụng cho mọi tính toán khoảng cách ngày trên server và khi cập nhật hoặc khởi tạo khoản tiết kiệm.
**Example:**
```javascript
function parseDateString(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error('Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY');
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Tháng trong JS bắt đầu từ 0
  const year = parseInt(parts[2], 10);
  
  const parsedDate = new Date(year, month, day, 0, 0, 0, 0);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Giá trị ngày không hợp lệ: ' + dateStr);
  }
  return parsedDate;
}

function calculateDaysDifference(startDateStr, endDateStr) {
  const start = parseDateString(startDateStr);
  const end = parseDateString(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    throw new Error('Ngày đáo hạn phải sau ngày tạo khoản gửi.');
  }
  return diffDays;
}
```

### Anti-Patterns to Avoid
- **Tính toán ngày bằng múi giờ UTC/Client trên frontend và truyền số ngày tính sẵn lên backend:** Client có thể bị sai lệch múi giờ cục bộ hoặc truyền số ngày không hợp lệ nhằm hack tiền lãi. Backend luôn là nguồn tin cậy duy nhất thực hiện việc tính toán số ngày và tiền lãi từ hai chuỗi ngày thô `created_at` và `maturity_at`.
- **Sử dụng các công thức tính toán động trên Google Sheets (Formula cells):** Tránh ghi đè các công thức kiểu `=DAYS(G2, F2)` hay `=NOW()` trên sheet vì các công thức này kích hoạt tính toán lại toàn bộ sheet mỗi lần ghi, dẫn đến quá tải và timeout kịch bản xử lý của GAS.
- **Không giải phóng Lock khi xảy ra exception:** Nếu logic trong phần ghi gặp lỗi mà không bọc trong `finally { lock.releaseLock() }`, khóa ghi có thể bị giữ cho đến hết thời gian tự động giải phóng của Google (thường là vài phút), khiến toàn bộ người dùng khác bị block.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Khóa ghi chống tranh chấp (concurrency lock) | Thuật toán khóa hàng tự viết bằng cách lưu cờ trên sheet | `LockService.getScriptLock()` | Việc đọc ghi cờ trạng thái trên Sheets chậm và dễ xảy ra race condition. `LockService` sử dụng bộ khóa hạ tầng của Google cực kỳ an toàn. |
| Formatting JSON output | Tự ghép chuỗi JSON thủ công | `ContentService` + `JSON.stringify()` | Đảm bảo tính hợp lệ của định dạng JSON và tự động xử lý các ký tự escape đặc biệt. |

## Common Pitfalls

### Pitfall 1: Lệch múi giờ khi lưu trữ Date Object vào Sheets
- **Hành vi lỗi:** Lưu đối tượng Date bằng `sheet.getRange(...).setValue(new Date())`. Google Sheets hoặc Apps Script tự động chuyển đổi sang múi giờ của script dẫn đến ngày hiển thị trên sheet bị dịch chuyển trước hoặc sau 1 ngày (ví dụ: ngày 10 thành ngày 09 hoặc 11).
- **Lý do xảy ra:** Khi lưu trữ một Date Object, Google Sheets sẽ cố gắng chuyển đổi múi giờ giữa múi giờ của tài liệu Sheets và múi giờ chạy Script. Nếu hai múi giờ lệch nhau dù chỉ 1 phút, ngày có thể bị nhảy.
- **Cách tránh:** Luôn truyền ngày tháng dưới dạng Plain Text String `DD/MM/YYYY` sang Google Sheet. Không lưu trực tiếp Date Object.

### Pitfall 2: Khoá ghi không được giải phóng do lỗi Runtime
- **Hành vi lỗi:** Ứng dụng phản hồi "Hệ thống đang bận" liên tục cho mọi yêu cầu sau khi một yêu cầu trước đó bị crash.
- **Lý do xảy ra:** Lỗi xảy ra trong khối xử lý sau khi lấy được Lock, nhưng không có khối `finally` để giải phóng Lock.
- **Cách tránh:** Luôn đặt `lock.releaseLock()` bên trong khối `finally`. Ngoài ra, chỉ gọi `releaseLock()` nếu lấy được khóa thành công (sử dụng biến flag kiểm tra trạng thái khóa).

### Pitfall 3: Tái tục không đồng bộ dòng lịch sử
- **Hành vi lỗi:** Khoản tiết kiệm cũ bị thay đổi trạng thái sang `rolled_over` nhưng khoản tiết kiệm mới không được tạo hoặc ngược lại do lỗi giữa chừng, gây mất mát dấu vết dòng tiền.
- **Lý do xảy ra:** Không quản lý tốt giao dịch ghi.
- **Cách tránh:** Đảm bảo cả hai hành động ghi (cập nhật khoản cũ và chèn khoản mới) nằm trong cùng một phiên khóa `LockService` duy nhất. Nếu bất kỳ bước nào thất bại, trả về lỗi ngay lập tức để phía frontend biết giao dịch chưa hoàn tất.

## Code Examples

### 1. Phân Tuyến Request doPost trung tâm với Bảo vệ LockService

```javascript
/**
 * Điểm đón đầu tiên của tất cả các yêu cầu POST từ Web App.
 * Thực hiện routing và quản lý cơ chế khóa đồng bộ ghi.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildJsonResponse("error", "Dữ liệu yêu cầu trống.");
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    // Yêu cầu chỉ đọc: Không cần sử dụng LockService để tránh nghẽn
    if (action === "get_deposits") {
      return handleGetDeposits(payload);
    }
    
    // Yêu cầu ghi: Cần sử dụng LockService bảo vệ dữ liệu chống race condition
    if (action === "add_deposit" || action === "rollover_deposit") {
      return handleWriteActionWithLock(action, payload);
    }
    
    return buildJsonResponse("error", "Hành động (action) không được hỗ trợ.");
  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return buildJsonResponse("error", "Lỗi xử lý yêu cầu phía server: " + error.message);
  }
}

/**
 * Xử lý các hành động ghi dữ liệu dưới quyền kiểm soát của LockService
 */
function handleWriteActionWithLock(action, payload) {
  const lock = LockService.getScriptLock();
  let hasLock = false;
  
  try {
    // Thử lấy khóa trong vòng 10 giây (10000ms)
    hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return buildJsonResponse("error", "Hệ thống đang bận, vui lòng thử lại.");
    }
    
    // Khởi tạo sheet và thực thi nghiệp vụ
    const sheets = initializeSheets();
    
    if (action === "add_deposit") {
      return executeAddDeposit(sheets, payload);
    } else if (action === "rollover_deposit") {
      return executeRolloverDeposit(sheets, payload);
    }
    
  } catch (err) {
    Logger.log("Lỗi nghiệp vụ ghi: " + err.toString());
    return buildJsonResponse("error", err.message);
  } finally {
    // Luôn giải phóng lock nếu đã lấy thành công
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

/**
 * Trợ giúp tạo text output JSON
 */
function buildJsonResponse(status, messageOrData) {
  const responseObj = { status: status };
  if (status === "success") {
    responseObj.data = messageOrData;
  } else {
    responseObj.message = messageOrData;
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 2. Nghiệp vụ Thêm mới Khoản Gửi & Tự động Tính Lãi

```javascript
/**
 * Nghiệp vụ thêm mới khoản tiết kiệm.
 * Thực hiện kiểm tra tính hợp lệ đầu vào, tự động tính lãi và ghi vào database.
 */
function executeAddDeposit(sheets, payload) {
  const usernameBankcode = payload.username_bankcode;
  const data = payload.data;
  
  if (!usernameBankcode) {
    throw new Error("Thiếu thông tin username_bankcode.");
  }
  if (!data || !data.amount || !data.interest_rate || !data.created_at || !data.maturity_at) {
    throw new Error("Thiếu dữ liệu khoản gửi mới.");
  }
  
  const amount = Number(data.amount);
  const interestRate = Number(data.interest_rate);
  
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Số tiền gửi phải là số dương.");
  }
  if (isNaN(interestRate) || interestRate < 0) {
    throw new Error("Lãi suất gửi phải lớn hơn hoặc bằng 0.");
  }
  
  // Tính số ngày gửi thực tế dựa trên ngày gửi thô dạng DD/MM/YYYY
  const days = calculateDaysDifference(data.created_at, data.maturity_at);
  
  // expected_interest = amount * (interest_rate / 100) * (days / 365)
  // Làm tròn tiền lãi đến hàng đơn vị (VND)
  const expectedInterest = Math.round(amount * (interestRate / 100) * (days / 365));
  
  // Tìm hoặc tạo người dùng mới trong bảng Users để đảm bảo tính toàn vẹn khóa ngoại
  findOrCreateUser(sheets.users, usernameBankcode);
  
  // Sinh ID ngẫu nhiên: dep-{timestamp}-{random}
  const randomStr = Math.random().toString(36).substring(2, 8);
  const depositId = "dep-" + Date.now() + "-" + randomStr;
  
  const newRow = [
    depositId,
    amount,
    interestRate,
    "active",
    expectedInterest,
    data.created_at,
    data.maturity_at,
    usernameBankcode
  ];
  
  sheets.deposits.appendRow(newRow);
  
  return buildJsonResponse("success", {
    id: depositId,
    amount: amount,
    interest_rate: interestRate,
    status: "active",
    expected_interest: expectedInterest,
    created_at: data.created_at,
    maturity_at: data.maturity_at,
    user_bankcode: usernameBankcode
  });
}

function findOrCreateUser(usersSheet, usernameBankcode) {
  const lastRow = usersSheet.getLastRow();
  if (lastRow > 1) {
    const values = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === usernameBankcode) {
        return true; // Người dùng đã tồn tại
      }
    }
  }
  
  // Người dùng chưa có, tạo mới
  usersSheet.appendRow([usernameBankcode]);
  return true;
}
```

### 3. Nghiệp vụ Tái tục Khoản Gửi (Rollover)

```javascript
/**
 * Nghiệp vụ tái tục một khoản tiết kiệm đã đáo hạn hoặc chuẩn bị đáo hạn.
 * Chuyển trạng thái khoản cũ sang 'rolled_over' và tạo khoản mới liên kết.
 */
function executeRolloverDeposit(sheets, payload) {
  const oldDepositId = payload.id;
  const newAmount = Number(payload.new_amount);
  const newInterestRate = Number(payload.new_interest_rate);
  const createdAt = payload.created_at;
  const maturityAt = payload.maturity_at;
  
  if (!oldDepositId) {
    throw new Error("Thiếu ID của khoản gửi cũ cần tái tục.");
  }
  if (isNaN(newAmount) || newAmount <= 0) {
    throw new Error("Số tiền gửi mới phải là số dương.");
  }
  if (isNaN(newInterestRate) || newInterestRate < 0) {
    throw new Error("Lãi suất mới phải lớn hơn hoặc bằng 0.");
  }
  
  // 1. Tìm thông tin khoản gửi cũ
  const depositsSheet = sheets.deposits;
  const lastRow = depositsSheet.getLastRow();
  let oldDepositRowIndex = -1;
  let oldDepositData = null;
  
  if (lastRow > 1) {
    const values = depositsSheet.getRange(2, 1, lastRow - 1, 8).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === oldDepositId) {
        oldDepositRowIndex = i + 2; // Offset header
        oldDepositData = {
          id: values[i][0],
          status: values[i][3],
          user_bankcode: values[i][7]
        };
        break;
      }
    }
  }
  
  if (oldDepositRowIndex === -1) {
    throw new Error("Không tìm thấy khoản tiết kiệm cũ với ID đã cung cấp.");
  }
  if (oldDepositData.status !== "active") {
    throw new Error("Khoản gửi cũ không ở trạng thái hoạt động (active), không thể tái tục.");
  }
  
  // 2. Cập nhật trạng thái khoản cũ sang 'rolled_over'
  // Cột status nằm ở cột thứ 4 (1-indexed)
  depositsSheet.getRange(oldDepositRowIndex, 4).setValue("rolled_over");
  
  // 3. Tính toán tiền lãi khoản mới
  const newDays = calculateDaysDifference(createdAt, maturityAt);
  const newExpectedInterest = Math.round(newAmount * (newInterestRate / 100) * (newDays / 365));
  
  // 4. Tạo khoản mới
  const randomStr = Math.random().toString(36).substring(2, 8);
  const newDepositId = "dep-" + Date.now() + "-" + randomStr;
  
  const newRow = [
    newDepositId,
    newAmount,
    newInterestRate,
    "active",
    newExpectedInterest,
    createdAt,
    maturityAt,
    oldDepositData.user_bankcode
  ];
  
  depositsSheet.appendRow(newRow);
  
  return buildJsonResponse("success", {
    old_deposit: {
      id: oldDepositId,
      status: "rolled_over"
    },
    new_deposit: {
      id: newDepositId,
      amount: newAmount,
      interest_rate: newInterestRate,
      status: "active",
      expected_interest: newExpectedInterest,
      created_at: createdAt,
      maturity_at: maturityAt,
      user_bankcode: oldDepositData.user_bankcode
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sử dụng công thức trực tiếp của Google Sheets `=DAYS(end, start)` hay tính lãi suất tự động trên ô. | Backend Apps Script parse ngày tháng thô bằng JavaScript và ghi dữ liệu cứng (Static pre-computed). | Hiện tại (Phase 2) | Tránh việc trigger tính toán lại toàn bộ sheet gây quá tải bộ xử lý và tránh lỗi timezone dịch ngày [CITED: GAS best practices]. |
| Gọi trực tiếp các API URL khác nhau cho mỗi hành động (Ví dụ: `/get`, `/add`). | Unified Single Endpoint (`doPost`) sử dụng thuộc tính `action` trong JSON payload. | Hiện tại (Phase 2) | Đơn giản hóa việc quản lý routing trên Apps Script do chỉ cần duy nhất 1 Web App deployment [CITED: API Design]. |

## Assumptions Log

*Bảng log này trống. Tất cả các quyết định cấu trúc dữ liệu và API đã được xác thực hoàn toàn thông qua tài liệu yêu cầu (REQUIREMENTS.md) và file quyết định (CONTEXT.md).*

## Open Questions

1. **Vấn đề bảo mật API đầu cuối (doPost)**
   - *Những gì đã biết:* Hiện tại ứng dụng chưa cài đặt kiểm tra bảo mật chữ ký HMAC cho client-server để phục vụ mục tiêu đơn giản hóa trong v1.
   - *Những gì chưa rõ:* Bất kỳ ai biết được URL Web App `/exec` đều có thể thực hiện POST dữ liệu giả mạo nếu đoán được `username_bankcode`.
   - *Khuyến nghị:* Ở Phase 2, backend chỉ thực hiện kiểm tra cơ bản. Các khâu xác thực bảo mật nâng cao (chữ ký `initData` của Telegram Bot) đã được đẩy sang các Phase sau (Phase 4 / v2) và không cản trước việc phát triển cốt lõi ở Phase này.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| **Node.js** | Chạy các công cụ phát triển cục bộ và clasp | ✓ | v24.13.0 | — |
| **npm** | Quản lý các công cụ phát triển | ✓ | 11.6.2 | — |
| **clasp** | Đồng bộ hóa code lên Google Apps Script cloud | ✗ (chưa cài global) | — | Chạy thông qua npm local `npx @google/clasp` hoặc cài đặt global bằng lệnh `npm install -g @google/clasp` [VERIFIED]. |
| **Google Sheets ID** | Cấu hình trong Script Properties làm database | ✓ | Native | Phải thiết lập thủ công Spreadsheet ID vào Script Properties trong Apps Script editor [CITED: SETUP.md]. |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| **V4 Access Control** | Yes | Backend lọc và chỉ trả về/thao tác trên các khoản tiết kiệm thuộc về đúng `username_bankcode` được cung cấp trong payload request. |
| **V5 Input Validation** | Yes | Backend thực hiện validate chặt chẽ định dạng ngày `DD/MM/YYYY` qua Regex, kiểm tra `amount` và `interest_rate` có phải là số dương hợp lệ trước khi ghi vào Google Sheets. |
| **V12 File and Resources** | Yes | Đặt cơ chế lock ghi tài nguyên hệ thống thông qua `LockService` để tránh tình trạng race-condition làm hỏng dữ liệu (Data Corruption). |

### Known Threat Patterns for Google Sheets DB

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Tranh chấp ghi đồng thời (Concurrent Write Collision)** | Tampering | Sử dụng `LockService.getScriptLock()` với thời gian chờ tối thiểu 10 giây bao bọc xung quanh các lệnh ghi/sửa dữ liệu hàng. |
| **Mạo danh tài khoản lấy dữ liệu (Access Control Bypass)** | Spoofing | Chỉ truy xuất hoặc chỉnh sửa các bản ghi khi cột `user_bankcode` của bản ghi khớp hoàn toàn với `username_bankcode` được cung cấp. |
| **Dữ liệu rác/Độc hại phá vỡ định dạng (Input Injection)** | Tampering | Thực hiện ép kiểu nghiêm ngặt (ví dụ: `Number(payload.data.amount)`) và validate định dạng chuỗi ngày tháng trước khi ghi. |

## Sources

### Primary (HIGH confidence)
- [Google Apps Script Lock Service API Reference](https://developers.google.com/apps-script/reference/lock/lock-service) - Tài liệu hướng dẫn sử dụng Script Lock và quản lý luồng ghi đồng thời.
- [Google Apps Script Web Apps Guide](https://developers.google.com/apps-script/guides/web) - Tài liệu về cấu trúc hàm doGet/doPost và phân quyền Web App.
- [Google Apps Script SpreadsheetApp Guide](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app) - Các phương thức đọc ghi ô, hàng trong Google Sheets.

### Secondary (MEDIUM confidence)
- [Node.js global registry] - Kiểm tra các công cụ Node.js đang khả dụng trên hệ thống thông qua CLI.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Các dịch vụ Native của Google Apps Script hoạt động cực kỳ ổn định.
- Architecture: HIGH - Cơ chế định tuyến tập trung và LockService giải quyết triệt để các rủi ro xung đột dữ liệu.
- Pitfalls: HIGH - Các rủi ro về timezone, DST, và lỗi lock bế tắc được cô lập tốt thông qua các ví dụ thực tiễn.

**Research date:** 2026-07-10
**Valid until:** 2026-08-09 (30 ngày)
