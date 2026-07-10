# Phase 2: Backend DB Operations & Calculations - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 2
**Analogs found:** 1 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/Code.js` | controller, service, model | request-response, CRUD, file-I/O | `backend/Code.js` | exact |
| `backend/Tests.js` | test | request-response, transform | None | no-analog |

---

## Pattern Assignments

### `backend/Code.js` (controller, service, model)

**Analog:** `backend/Code.js` (cấu trúc hiện có) và `02-RESEARCH.md` (mẫu nghiệp vụ và tính toán)

**1. Imports / Configurations Pattern** (lines 1-12 trong `backend/Code.js` hiện tại):
Sử dụng các API Native của Google Apps Script (`PropertiesService`, `SpreadsheetApp`) và chú thích kiểu JSDoc rõ ràng.
```javascript
/**
 * Lấy đối tượng Spreadsheet dựa trên SPREADSHEET_ID cấu hình trong Script Properties.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  const ssId = properties.getProperty('SPREADSHEET_ID');
  if (!ssId) {
    throw new Error('SPREADSHEET_ID not configured in Script Properties');
  }
  return SpreadsheetApp.openById(ssId);
}
```

**2. API Routing Pattern (doPost)**:
Định tuyến tập trung thông qua tham số `action` trong payload JSON của request body. Tách biệt rõ luồng chỉ đọc (Read) và luồng có ghi dữ liệu (Write - cần được bảo vệ bởi `LockService`).
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
    
    // Yêu cầu chỉ đọc: Không sử dụng LockService để tránh nghẽn luồng đọc
    if (action === "get_deposits") {
      const sheets = initializeSheets();
      return executeGetDeposits(sheets, payload);
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
```

**3. Lock Control Pattern**:
Bọc các thao tác ghi dữ liệu bằng `LockService` với thời gian chờ 10 giây, bảo đảm giải phóng khóa trong khối `finally`.
```javascript
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
```

**4. CRUD Operations & Database Interactivity**:
- **Đọc danh sách khoản gửi (get_deposits)**: Lọc các dòng khớp với `user_bankcode` và chuyển về dạng danh sách đối tượng JSON.
- **Thêm khoản gửi mới (add_deposit)**: Tạo ID duy nhất theo dạng `dep-{timestamp}-{random}`, tự động tính tiền lãi, kiểm tra/tạo User tương ứng trong bảng `Users` và ghi thêm dòng mới vào bảng `Deposits`.
- **Tái tục khoản gửi (rollover_deposit)**: Thực hiện cập nhật dòng cũ thành trạng thái `rolled_over` và thêm dòng mới liên kết trong cùng một phiên lock.

```javascript
/**
 * Nghiệp vụ lấy danh sách các khoản gửi của một user cụ thể.
 */
function executeGetDeposits(sheets, payload) {
  const usernameBankcode = payload.username_bankcode;
  if (!usernameBankcode) {
    throw new Error("Thiếu thông tin username_bankcode.");
  }
  
  const depositsSheet = sheets.deposits;
  const lastRow = depositsSheet.getLastRow();
  const result = [];
  
  if (lastRow > 1) {
    const values = depositsSheet.getRange(2, 1, lastRow - 1, 8).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][7] === usernameBankcode) {
        result.push({
          id: values[i][0],
          amount: Number(values[i][1]),
          interest_rate: Number(values[i][2]),
          status: values[i][3],
          expected_interest: Number(values[i][4]),
          created_at: values[i][5],
          maturity_at: values[i][6],
          user_bankcode: values[i][7]
        });
      }
    }
  }
  
  return buildJsonResponse("success", result);
}

/**
 * Nghiệp vụ thêm mới khoản tiết kiệm.
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
  const expectedInterest = Math.round(amount * (interestRate / 100) * (days / 365));
  
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

/**
 * Tìm hoặc tạo người dùng mới trong bảng Users.
 */
function findOrCreateUser(usersSheet, usernameBankcode) {
  const lastRow = usersSheet.getLastRow();
  if (lastRow > 1) {
    const values = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === usernameBankcode) {
        return true;
      }
    }
  }
  usersSheet.appendRow([usernameBankcode]);
  return true;
}

/**
 * Nghiệp vụ tái tục một khoản tiết kiệm.
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
  
  const depositsSheet = sheets.deposits;
  const lastRow = depositsSheet.getLastRow();
  let oldDepositRowIndex = -1;
  let oldDepositData = null;
  
  if (lastRow > 1) {
    const values = depositsSheet.getRange(2, 1, lastRow - 1, 8).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === oldDepositId) {
        oldDepositRowIndex = i + 2; // Offset header và index 0
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
  
  // Cập nhật trạng thái khoản cũ thành 'rolled_over' (Cột status là cột thứ 4)
  depositsSheet.getRange(oldDepositRowIndex, 4).setValue("rolled_over");
  
  // Tạo khoản mới
  const newDays = calculateDaysDifference(createdAt, maturityAt);
  const newExpectedInterest = Math.round(newAmount * (newInterestRate / 100) * (newDays / 365));
  
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

**5. Date Parsing & Calculation Utilities**:
Sử dụng phân tích ngày thủ công cho chuỗi định dạng `DD/MM/YYYY` để tạo các đối tượng ngày an toàn độc lập với múi giờ của server hay client.
```javascript
/**
 * Chuyển đổi chuỗi ngày DD/MM/YYYY thành đối tượng Date (lúc nửa đêm 00:00:00).
 */
function parseDateString(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error('Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY');
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Tháng trong JS tính từ 0-11
  const year = parseInt(parts[2], 10);
  
  const parsedDate = new Date(year, month, day, 0, 0, 0, 0);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Giá trị ngày không hợp lệ: ' + dateStr);
  }
  return parsedDate;
}

/**
 * Tính số ngày chênh lệch thực tế giữa hai chuỗi ngày DD/MM/YYYY.
 */
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

**6. Error Handling & Response Format**:
Sử dụng hàm tạo TextOutput JSON với định dạng mime-type chính xác.
```javascript
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

---

### `backend/Tests.js` (test)

**Analog:** None. (File mới hoàn toàn để thực hiện kiểm thử logic nghiệp vụ cục bộ trên môi trường GAS).

**Core Testing pattern**:
Sử dụng các hàm khẳng định (assertion) thủ công và `Logger.log` trong GAS để chạy test đơn vị nhanh cho các logic tính toán và chuẩn hóa ngày.
```javascript
/**
 * Chạy toàn bộ kiểm thử đơn vị cho backend.
 * Chạy thủ công từ Apps Script Editor.
 */
function runTests() {
  Logger.log("=== BẮT ĐẦU CHẠY KIỂM THỬ BACKEND ===");
  try {
    testParseDateString();
    testCalculateDaysDifference();
    testExpectedInterestCalculation();
    Logger.log("=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===");
  } catch (error) {
    Logger.log("❌ KIỂM THỬ THẤT BẠI: " + error.toString());
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

function testParseDateString() {
  Logger.log("Chạy: testParseDateString");
  const dateObj = parseDateString("15/08/2026");
  assert(dateObj.getDate() === 15, "Ngày phải là 15");
  assert(dateObj.getMonth() === 7, "Tháng phải là 7 (Tháng 8 trong JS)");
  assert(dateObj.getFullYear() === 2026, "Năm phải là 2026");
  
  // Test case sai định dạng
  try {
    parseDateString("2026-08-15");
    assert(false, "Phải quăng lỗi khi định dạng không khớp DD/MM/YYYY");
  } catch (e) {
    assert(e.message.indexOf("Định dạng ngày không hợp lệ") !== -1, "Thông báo lỗi chính xác");
  }
}

function testCalculateDaysDifference() {
  Logger.log("Chạy: testCalculateDaysDifference");
  const days = calculateDaysDifference("10/07/2026", "10/07/2027");
  assert(days === 365, "Chênh lệch 1 năm thường phải là 365 ngày");
  
  const leapDays = calculateDaysDifference("28/02/2028", "01/03/2028");
  assert(leapDays === 2, "Năm nhuận 2028: từ 28/02 đến 01/03 phải là 2 ngày");
  
  try {
    calculateDaysDifference("10/07/2026", "09/07/2026");
    assert(false, "Phải báo lỗi nếu ngày kết thúc trước ngày bắt đầu");
  } catch (e) {
    assert(e.message.indexOf("Ngày đáo hạn phải sau") !== -1, "Thông báo lỗi hợp lệ");
  }
}

function testExpectedInterestCalculation() {
  Logger.log("Chạy: testExpectedInterestCalculation");
  // Test trường hợp số tiền 10,000,000, lãi suất 6.0%, gửi 365 ngày
  const amount = 10000000;
  const rate = 6.0;
  const days = 365;
  const expectedInterest = Math.round(amount * (rate / 100) * (days / 365));
  assert(expectedInterest === 600000, "Tiền lãi kỳ vọng là 600,000 VND");
  
  // Test làm tròn số tiền lẻ
  const rate2 = 6.25;
  const days2 = 180; // ~ nửa năm
  const expectedInterest2 = Math.round(amount * (rate2 / 100) * (days2 / 365));
  assert(expectedInterest2 === 308219, "Tiền lãi 308,219.17 VND làm tròn thành 308,219 VND");
}
```

---

## Shared Patterns

### 1. Concurrency Locking (Khóa ghi đồng thời)
- **Source:** `backend/Code.js` (dòng `handleWriteActionWithLock`)
- **Apply to:** Tất cả các luồng ghi/cập nhật Sheet (`add_deposit`, `rollover_deposit`).
- **Mục tiêu:** Tránh race condition làm sai lệch hoặc ghi đè chồng chéo các dòng dữ liệu.

### 2. Safe Date Normalization (Chuẩn hóa ngày)
- **Source:** `backend/Code.js` (dòng `parseDateString` & `calculateDaysDifference`)
- **Apply to:** Tất cả các logic tính toán thời hạn, lãi suất, hoặc cập nhật trường ngày tháng của khoản gửi.
- **Mục tiêu:** Tránh lỗi múi giờ (Timezone offset / DST) nhảy ngày khi lưu Date Object trực tiếp vào Google Sheets.

### 3. Unified Error Handling & Responses
- **Source:** `backend/Code.js` (dòng `buildJsonResponse` & cấu trúc `try-catch` của `doPost`)
- **Apply to:** Toàn bộ Endpoint Web App API.
- **Mục tiêu:** Đảm bảo client luôn nhận được phản hồi chuẩn JSON, hiển thị rõ ràng lỗi nghiệp vụ để giao diện hiển thị cho người dùng.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/Tests.js` | test | request-response, transform | Hệ thống chưa có sẵn cấu trúc hay tệp tin kiểm thử nào ở backend. |

---

## Metadata

- **Analog search scope:** `/backend`
- **Files scanned:** 2
- **Pattern extraction date:** 2026-07-10
