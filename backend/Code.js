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

/**
 * Khởi tạo các sheet Users và Deposits với các header tương ứng nếu chưa tồn tại.
 * @returns {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}}
 */
function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Khởi tạo sheet Users
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
  }
  
  // Kiểm tra và set headers cho Users
  const usersHeaders = ['username_bankcode'];
  if (usersSheet.getLastRow() === 0 || isHeaderEmpty(usersSheet, usersHeaders.length)) {
    usersSheet.getRange(1, 1, 1, usersHeaders.length).setValues([usersHeaders]);
  }
  
  // Khởi tạo sheet Deposits
  let depositsSheet = ss.getSheetByName('Deposits');
  if (!depositsSheet) {
    depositsSheet = ss.insertSheet('Deposits');
  }
  
  // Kiểm tra và set headers cho Deposits
  const depositsHeaders = [
    'id',
    'amount',
    'interest_rate',
    'status',
    'expected_interest',
    'created_at',
    'maturity_at',
    'user_bankcode'
  ];
  if (depositsSheet.getLastRow() === 0 || isHeaderEmpty(depositsSheet, depositsHeaders.length)) {
    depositsSheet.getRange(1, 1, 1, depositsHeaders.length).setValues([depositsHeaders]);
  }
  
  Logger.log('Initialization of sheets completed successfully.');
  return {
    users: usersSheet,
    deposits: depositsSheet
  };
}

/**
 * Kiểm tra xem hàng đầu tiên (header) của sheet có trống hay không.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} numCols
 * @returns {boolean}
 */
function isHeaderEmpty(sheet, numCols) {
  const values = sheet.getRange(1, 1, 1, numCols).getValues()[0];
  return values.every(val => val === '' || val === null || val === undefined);
}

/**
 * Xử lý yêu cầu HTTP GET gửi tới Web App.
 * Trả về thông tin trạng thái hệ thống dưới dạng JSON.
 * @param {GoogleAppsScript.Events.DoGet} e đối tượng event của GET request
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  const response = {
    status: "ok",
    message: "Save Manager backend is running",
    timestamp: new Date().toISOString(),
    timezone: Session.getScriptTimeZone()
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Điểm đón đầu tiên của tất cả các yêu cầu POST từ Web App.
 * Thực hiện routing và quản lý cơ chế khóa đồng bộ ghi.
 * @param {GoogleAppsScript.Events.DoPost} e đối tượng event của POST request
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  throw new Error("TDD RED Phase");
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

/**
 * Xử lý các hành động ghi dữ liệu dưới quyền kiểm soát của LockService.
 * @param {string} action
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function handleWriteActionWithLock(action, payload) {
  const hasLockService = typeof LockService !== 'undefined';
  const lock = hasLockService ? LockService.getScriptLock() : null;
  let hasLock = false;
  
  try {
    if (hasLockService && lock) {
      // Thử lấy khóa trong vòng 10 giây (10000ms)
      hasLock = lock.tryLock(10000);
      if (!hasLock) {
        return buildJsonResponse("error", "Hệ thống đang bận, vui lòng thử lại.");
      }
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
    if (hasLock && lock) {
      lock.releaseLock();
    }
  }
}

/**
 * Nghiệp vụ lấy danh sách các khoản gửi của một user cụ thể.
 * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
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
 * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function executeAddDeposit(sheets, payload) {
  const usernameBankcode = payload.username_bankcode;
  const data = payload.data;
  
  if (!usernameBankcode) {
    throw new Error("Thiếu thông tin username_bankcode.");
  }
  if (!data || data.amount === undefined || data.interest_rate === undefined || !data.created_at || !data.maturity_at) {
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
 * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
 * @param {string} usernameBankcode
 * @returns {boolean}
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
 * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
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
  depositsSheet.getRange(oldDepositRowIndex, 4, 1, 1).setValue("rolled_over");
  
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

/**
 * Chuyển đổi chuỗi ngày DD/MM/YYYY thành đối tượng Date (lúc nửa đêm 00:00:00).
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDateString(dateStr) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    throw new Error('Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY');
  }
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Tháng trong JS tính từ 0-11
  const year = parseInt(parts[2], 10);
  
  const parsedDate = new Date(year, month, day, 0, 0, 0, 0);
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month || parsedDate.getDate() !== day) {
    throw new Error('Giá trị ngày không hợp lệ: ' + dateStr);
  }
  return parsedDate;
}

/**
 * Tính số ngày chênh lệch thực tế giữa hai chuỗi ngày DD/MM/YYYY.
 * @param {string} startDateStr
 * @param {string} endDateStr
 * @returns {number}
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

/**
 * Trợ giúp tạo text output JSON
 * @param {string} status
 * @param {any} messageOrData
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
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
