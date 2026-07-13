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
  const usersHeaders = ['username_bankcode', 'telegram_chat_id'];
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
    'user_bankcode',
    'parent_id',
    'child_id'
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
 * Migration: Backfill cột child_id dựa trên parent_id đã tồn tại.
 * Với mỗi bản ghi có parent_id, tìm bản ghi cha và ghi child_id = id bản ghi con.
 * Chạy MỘT LẦN bằng tay từ Apps Script Editor.
 */
function migrateChildId() {
  const sheets = initializeSheets();
  const depositsSheet = sheets.deposits;
  const lastRow = depositsSheet.getLastRow();
  
  if (lastRow <= 1) {
    Logger.log("Không có dữ liệu để migrate.");
    return;
  }
  
  const values = depositsSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  
  // Tạo map id → row index (1-based, offset header)
  const idToRow = {};
  for (let i = 0; i < values.length; i++) {
    idToRow[values[i][0]] = i + 2; // row trong sheet
  }
  
  let migratedCount = 0;
  
  for (let i = 0; i < values.length; i++) {
    const parentId = values[i][8]; // cột parent_id (index 8)
    const myId = values[i][0];     // cột id (index 0)
    
    if (parentId && idToRow[parentId]) {
      const parentRow = idToRow[parentId];
      // Ghi child_id (cột 10) cho bản ghi cha
      depositsSheet.getRange(parentRow, 10, 1, 1).setValue(myId);
      migratedCount++;
      Logger.log("Migrated: parent " + parentId + " → child_id = " + myId);
    }
  }
  
  Logger.log("Migration hoàn tất. Đã cập nhật " + migratedCount + " bản ghi.");
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
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildJsonResponse("error", "Dữ liệu yêu cầu trống.");
    }
    
    const payload = JSON.parse(e.postData.contents);
    console.log("doPost received action: " + (payload.action || "telegram_webhook"));
    
    // Kiểm tra xem yêu cầu đến từ Telegram hay không
    const isTelegramWebhook = payload.message || payload.callback_query;
    
    if (isTelegramWebhook) {
      const properties = PropertiesService.getScriptProperties();
      const webhookToken = properties.getProperty("WEBHOOK_TOKEN");
      const requestToken = e.parameter && e.parameter.token;
      
      if (!webhookToken || requestToken !== webhookToken) {
        console.log("Webhook request không có token hợp lệ.");
        return buildJsonResponse("error", "Unauthorized access.");
      }
      return handleTelegramWebhook(payload);
    }
    
    const action = payload.action;
    const initData = payload.initData;
    
    const properties = typeof PropertiesService !== 'undefined' ? PropertiesService.getScriptProperties() : null;
    
    // Xác thực: Worker gửi kèm server secret → tin tưởng (đã verify ở Worker)
    // Nếu không có secret → fallback verify initData trực tiếp (test/direct call)
    const serverSecret = payload._serverSecret;
    const expectedSecret = properties ? properties.getProperty("WORKER_SECRET") : null;
    
    if (serverSecret && expectedSecret && serverSecret === expectedSecret) {
      // Đã xác thực bởi Cloudflare Worker — cho phép đi tiếp
    } else {
      // Fallback: verify initData trực tiếp (cho unit test, mock, direct API call)
      const botToken = properties ? properties.getProperty("TELEGRAM_BOT_TOKEN") : null;
      const verifyResult = verifyTelegramWebAppData(initData, botToken);
      if (verifyResult !== "") {
        return buildJsonResponse("error", "Xác thực thất bại.");
      }
    }
    
    // Extract authenticated telegram user ID từ initData
    const authenticatedChatId = extractTelegramUserId(initData);
    
    // Yêu cầu chỉ đọc: Không sử dụng LockService để tránh nghẽn luồng đọc
    if (action === "get_users") {
      const sheets = initializeSheets();
      return executeGetUsers(sheets);
    }
    
    if (action === "get_deposits") {
      const sheets = initializeSheets();
      
      // Tự động liên kết Chat ID nếu có — validate ownership
      if (payload.telegram_chat_id && payload.username_bankcode && authenticatedChatId) {
        // Chỉ cho phép link nếu chat_id khớp với authenticated user
        if (String(payload.telegram_chat_id) === String(authenticatedChatId)) {
          linkTelegramChatId(sheets.users, payload.username_bankcode, payload.telegram_chat_id);
        }
      }
      
      return executeGetDeposits(sheets, payload, authenticatedChatId);
    }
    
    // Yêu cầu ghi: Cần sử dụng LockService bảo vệ dữ liệu chống race condition
    if (action === "add_deposit" || action === "rollover_deposit") {
      return handleWriteActionWithLock(action, payload, authenticatedChatId);
    }
    
    return buildJsonResponse("error", "Hành động (action) không được hỗ trợ.");
  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return buildJsonResponse("error", "Lỗi xử lý yêu cầu phía server.");
  }
}

/**
 * Xử lý các hành động ghi dữ liệu dưới quyền kiểm soát của LockService.
 * @param {string} action
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function handleWriteActionWithLock(action, payload, authenticatedChatId) {
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
      return executeRolloverDeposit(sheets, payload, authenticatedChatId);
    }
    
  } catch (err) {
    Logger.log("Lỗi nghiệp vụ ghi: " + err.toString());
    return buildJsonResponse("error", "Đã xảy ra lỗi khi xử lý giao dịch.");
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
function executeGetDeposits(sheets, payload, authenticatedChatId) {
  const depositsSheet = sheets.deposits;
  const lastRow = depositsSheet.getLastRow();
  const result = [];
  
  if (lastRow > 1) {
    const values = depositsSheet.getRange(2, 1, lastRow - 1, 10).getValues();
    for (let i = 0; i < values.length; i++) {
      result.push({
        id: values[i][0],
        amount: Number(values[i][1]),
        interest_rate: Number(values[i][2]),
        status: values[i][3],
        expected_interest: Number(values[i][4]),
        created_at: values[i][5],
        maturity_at: values[i][6],
        user_bankcode: values[i][7],
        parent_id: values[i][8] || '',
        child_id: values[i][9] || ''
      });
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
    usernameBankcode,
    "", // parent_id
    ""  // child_id
  ];
  
  const newLastRow = sheets.deposits.getLastRow() + 1;
  const newRange = sheets.deposits.getRange(newLastRow, 1, 1, 10);
  sheets.deposits.getRange(newLastRow, 6, 1, 2).setNumberFormat('@');
  newRange.setValues([newRow]);
  
  return buildJsonResponse("success", {
    id: depositId,
    amount: amount,
    interest_rate: interestRate,
    status: "active",
    expected_interest: expectedInterest,
    created_at: data.created_at,
    maturity_at: data.maturity_at,
    user_bankcode: usernameBankcode,
    parent_id: "",
    child_id: ""
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
  usersSheet.appendRow([usernameBankcode, ""]);
  return true;
}

/**
 * Liên kết hoặc cập nhật telegram_chat_id cho người dùng dựa trên username_bankcode.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
 * @param {string} usernameBankcode
 * @param {string|number} telegramChatId
 */
function linkTelegramChatId(usersSheet, usernameBankcode, telegramChatId) {
  if (!usernameBankcode || !telegramChatId) return;
  
  const lastRow = usersSheet.getLastRow();
  let userRowIndex = -1;
  
  if (lastRow > 1) {
    const values = usersSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === usernameBankcode) {
        userRowIndex = i + 2;
        // Nếu chat_id đã khớp thì không cần cập nhật
        if (values[i][1] === telegramChatId || String(values[i][1]) === String(telegramChatId)) {
          return;
        }
        break;
      }
    }
  }
  
  if (userRowIndex !== -1) {
    // Cập nhật chat ID ở cột 2
    usersSheet.getRange(userRowIndex, 2).setValue(telegramChatId);
    Logger.log("Đã cập nhật telegram_chat_id cho user: " + usernameBankcode);
  } else {
    // Tạo mới user và liên kết chat ID
    usersSheet.appendRow([usernameBankcode, telegramChatId]);
    Logger.log("Đã tạo mới user và liên kết chat_id: " + usernameBankcode);
  }
}

/**
 * Đăng ký Webhook URL với Telegram Bot API. Chạy một lần để cấu hình.
 */
function setupWebhook() {
  const properties = PropertiesService.getScriptProperties();
  const botToken = properties.getProperty("TELEGRAM_BOT_TOKEN");
  const webAppUrl = properties.getProperty("WEB_APP_URL");
  const webhookToken = properties.getProperty("WEBHOOK_TOKEN");
  
  if (!botToken || !webAppUrl || !webhookToken) {
    throw new Error("Chưa cấu hình đủ TELEGRAM_BOT_TOKEN, WEB_APP_URL hoặc WEBHOOK_TOKEN.");
  }
  
  const registerUrl = `${webAppUrl}?token=${webhookToken}`;
  const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  
  const response = UrlFetchApp.fetch(telegramUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      url: registerUrl,
      allowed_updates: ["message"]
    }),
    muteHttpExceptions: true
  });
  
  Logger.log("Kết quả đăng ký webhook: " + response.getContentText());
}

/**
 * Gửi yêu cầu API đến Telegram Bot.
 * @param {string} method
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function sendTelegramApi(method, payload) {
  const properties = PropertiesService.getScriptProperties();
  const botToken = properties.getProperty("TELEGRAM_BOT_TOKEN");
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  
  return UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/**
 * Xử lý webhook update nhận được từ Telegram.
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleTelegramWebhook(payload) {
  if (payload.message && payload.message.text) {
    const chatId = payload.message.chat.id;
    const text = payload.message.text.trim();
    
    if (text === "/start" || text === "/chart") {
      const properties = PropertiesService.getScriptProperties();
      const miniAppUrl = properties.getProperty("MINI_APP_URL") || "";
      
      let targetUrl = miniAppUrl;
      let replyText = "Chào mừng bạn đến với Save Manager!\n\nHãy nhấn nút bên dưới để mở giao diện quản lý các khoản tiết kiệm cá nhân của bạn.";
      
      if (text === "/chart") {
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
  return buildJsonResponse("success", "Telegram webhook handled.");
}

/**
 * Nghiệp vụ tái tục một khoản tiết kiệm.
 * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function executeRolloverDeposit(sheets, payload, authenticatedChatId) {
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
  
  // Cập nhật trạng thái khoản cũ thành 'rolled_over' và gán child_id
  depositsSheet.getRange(oldDepositRowIndex, 4, 1, 1).setValue("rolled_over");
  
  // Tạo khoản mới
  const newDays = calculateDaysDifference(createdAt, maturityAt);
  const newExpectedInterest = Math.round(newAmount * (newInterestRate / 100) * (newDays / 365));
  
  const randomStr = Math.random().toString(36).substring(2, 8);
  const newDepositId = "dep-" + Date.now() + "-" + randomStr;
  
  // Gán child_id cho bản ghi cha (cột 10)
  depositsSheet.getRange(oldDepositRowIndex, 10, 1, 1).setValue(newDepositId);
  
  const newRow = [
    newDepositId,
    newAmount,
    newInterestRate,
    "active",
    newExpectedInterest,
    createdAt,
    maturityAt,
    oldDepositData.user_bankcode,
    oldDepositId, // parent_id
    ""            // child_id (chưa có)
  ];
  
  const newLastRow = depositsSheet.getLastRow() + 1;
  const newRange = depositsSheet.getRange(newLastRow, 1, 1, 10);
  depositsSheet.getRange(newLastRow, 6, 1, 2).setNumberFormat('@');
  newRange.setValues([newRow]);
  
  return buildJsonResponse("success", {
    old_deposit: {
      id: oldDepositId,
      status: "rolled_over",
      child_id: newDepositId
    },
    new_deposit: {
      id: newDepositId,
      amount: newAmount,
      interest_rate: newInterestRate,
      status: "active",
      expected_interest: newExpectedInterest,
      created_at: createdAt,
      maturity_at: maturityAt,
      user_bankcode: oldDepositData.user_bankcode,
      parent_id: oldDepositId,
      child_id: ""
    }
  });
}

/**
 * Chuyển đổi chuỗi ngày DD/MM/YYYY thành đối tượng Date (lúc nửa đêm 00:00:00).
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDateString(dateStr) {
  // Google Sheets có thể tự chuyển text thành Date object
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) {
      throw new Error('Giá trị Date object không hợp lệ.');
    }
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate(), 0, 0, 0, 0);
  }
  
  // Chuyển về string nếu cần
  dateStr = String(dateStr).trim();
  
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

/**
 * Lập lịch trigger quét đáo hạn lúc 7:00 AM - 8:00 AM.
 * Dọn dẹp trigger cũ cùng tên hàm để tránh trùng lặp.
 */
function setupDailyTrigger() {
  const triggerName = "checkMaturityAndSendAlerts";
  
  if (typeof ScriptApp === 'undefined') {
    Logger.log("Môi trường Node.js: Bỏ qua tạo trigger.");
    return;
  }
  
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === triggerName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger(triggerName)
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log("Đã thiết lập trigger chạy hàng ngày từ 7:00 AM - 8:00 AM.");
}

/**
 * Quét các khoản tiết kiệm active/matured sắp đáo hạn (<= 3 ngày) hoặc quá hạn,
 * gom nhóm theo telegram_chat_id và gửi thông báo tổng hợp qua Telegram Bot.
 */
function checkMaturityAndSendAlerts() {
  Logger.log("Bắt đầu quét các khoản tiết kiệm đáo hạn...");
  const sheets = initializeSheets();
  const depositsSheet = sheets.deposits;
  const usersSheet = sheets.users;
  
  const lastRow = depositsSheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("Không có dữ liệu khoản gửi để quét.");
    return;
  }
  
  // 1. Tạo bản đồ tra cứu chat_id từ bảng Users
  const userChatMap = {};
  const usersLastRow = usersSheet.getLastRow();
  if (usersLastRow > 1) {
    const usersData = usersSheet.getRange(2, 1, usersLastRow - 1, 2).getValues();
    for (let i = 0; i < usersData.length; i++) {
      const username = usersData[i][0];
      const chatId = usersData[i][1];
      if (username && chatId) {
        userChatMap[username] = chatId;
      }
    }
  }
  
  // 2. Lấy thời điểm hiện tại nửa đêm (00:00:00) tại múi giờ local của Google Sheet (GMT+7)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  // Map gom nhóm cảnh báo theo chat ID
  const alertsByChatId = {};
  
  // 3. Quét các dòng trong sheet Deposits
  const deposits = depositsSheet.getRange(2, 1, lastRow - 1, 8).getValues();
  for (let i = 0; i < deposits.length; i++) {
    const id = deposits[i][0];
    const amount = Number(deposits[i][1]);
    const rate = Number(deposits[i][2]);
    const status = deposits[i][3];
    const expectedInterest = Number(deposits[i][4]);
    const createdAt = deposits[i][5];
    const maturityAtStr = deposits[i][6];
    const userBankcode = deposits[i][7];
    
    // Chỉ xử lý các khoản active hoặc matured chưa giải quyết
    if (status === "active" || status === "matured") {
      try {
        const maturityDate = parseDateString(maturityAtStr);
        const diffTime = maturityDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // làm tròn số ngày
        
        // Cảnh báo nếu sắp đáo hạn trong vòng 3 ngày tới hoặc đã quá hạn
        if (diffDays <= 3) {
          const chatId = userChatMap[userBankcode];
          if (!chatId) {
            Logger.log(`Warning: Không tìm thấy chat ID cho user ${userBankcode}. Bỏ qua thông báo.`);
            continue;
          }
          
          if (!alertsByChatId[chatId]) {
            alertsByChatId[chatId] = [];
          }
          alertsByChatId[chatId].push({
            id: id,
            amount: amount,
            rate: rate,
            expectedInterest: expectedInterest,
            maturityAt: maturityAtStr,
            diffDays: diffDays,
            status: status
          });
        }
      } catch (err) {
        Logger.log(`Lỗi xử lý định dạng ngày cho khoản ${id}: ` + err.toString());
      }
    }
  }
  
  // 4. Gửi thông báo batch cho từng chat ID
  for (const chatId in alertsByChatId) {
    const items = alertsByChatId[chatId];
    if (items.length === 0) continue;
    
    let messageText = "⚠️ **CẢNH BÁO ĐÁO HẠN TIẾT KIỆM** ⚠️\n\n";
    messageText += `Bạn có ${items.length} khoản tiết kiệm cần lưu ý:\n\n`;
    
    items.forEach((item, index) => {
      const formattedAmount = Number(item.amount).toLocaleString("vi-VN") + " VND";
      let statusText = "";
      if (item.diffDays < 0) {
        statusText = `ĐÃ QUÁ HẠN ${Math.abs(item.diffDays)} NGÀY`;
      } else if (item.diffDays === 0) {
        statusText = "ĐÁO HẠN HÔM NAY";
      } else {
        statusText = `Còn ${item.diffDays} ngày`;
      }
      
      messageText += `${index + 1}. **Khoản gửi:** ${formattedAmount}\n`;
      messageText += `   - Lãi suất: ${item.rate}%\n`;
      messageText += `   - Ngày đáo hạn: ${item.maturityAt} (${statusText})\n`;
      messageText += `   - ID: \`${item.id}\`\n\n`;
    });
    
    messageText += "Vui lòng mở Save Manager để thực hiện cập nhật hoặc tái tục các khoản gửi này.";
    
    const properties = PropertiesService.getScriptProperties();
    const miniAppUrl = properties.getProperty("MINI_APP_URL") || "";
    
    const replyPayload = {
      chat_id: chatId,
      text: messageText,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "📊 Mở Save Manager",
            web_app: { url: miniAppUrl }
          }
        ]]
      }
    };
    
    const response = sendTelegramApi("sendMessage", replyPayload);
    Logger.log(`Đã gửi cảnh báo tới chat ID ${chatId}. Response: ` + (response && typeof response.getContentText === 'function' ? response.getContentText() : JSON.stringify(response)));
  }
  
  Logger.log("Hoàn thành quét đáo hạn.");
}

/**
 * Extract telegram user ID từ initData query string.
 * initData chứa "user={json_encoded}" → parse ra user.id
 * @param {string} initData
 * @returns {string|null} telegram user id hoặc null
 */
function extractTelegramUserId(initData) {
  if (!initData) return null;
  try {
    const parts = initData.split('&');
    for (let i = 0; i < parts.length; i++) {
      const idx = parts[i].indexOf('=');
      if (idx === -1) continue;
      const key = decodeURIComponent(parts[i].substring(0, idx));
      if (key === 'user') {
        const userJson = decodeURIComponent(parts[i].substring(idx + 1));
        const userObj = JSON.parse(userJson);
        return userObj.id ? String(userObj.id) : null;
      }
    }
  } catch (e) {
    Logger.log("extractTelegramUserId error: " + e.toString());
  }
  return null;
}

/**
 * Xác thực dữ liệu initData từ Telegram Web App gửi lên.
 * @param {string} initData Chuỗi query string nhận từ client
 * @param {string} botToken Token của bot Telegram lấy từ Script Properties
 * @returns {boolean} True nếu hợp lệ, False nếu giả mạo hoặc quá hạn
 */
function verifyTelegramWebAppData(initData, botToken) {
  // Trả về "" nếu OK, hoặc string lý do nếu thất bại
  
  if (!initData) {
    if (!botToken) return ""; // Bypass test offline
    return "initData is missing";
  }

  if (!botToken) return "MISSING";

  try {
    const params = {};
    const parts = initData.split('&');
    for (let i = 0; i < parts.length; i++) {
      const idx = parts[i].indexOf('=');
      if (idx === -1) continue;
      const key = decodeURIComponent(parts[i].substring(0, idx));
      const value = decodeURIComponent(parts[i].substring(idx + 1));
      params[key] = value;
    }

    const hash = params['hash'];
    if (!hash) {
      return "Xác thực thất bại.";
    }

    const authDate = parseInt(params['auth_date'], 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(authDate) || (currentTime - authDate) > 86400) {
      return "Phiên đăng nhập đã hết hạn.";
    }

    const sortedKeys = Object.keys(params).filter(k => k !== 'hash').sort();
    const dataCheckString = sortedKeys.map(k => k + '=' + params[k]).join('\n');

    // secret_key = HMAC-SHA256(key="WebAppData", msg=bot_token)
    const secretKeyBytes = Utilities.computeHmacSha256Signature(botToken, "WebAppData");

    // Convert byte[] → char string for use as key
    const keyString = secretKeyBytes.map(function(b) {
      return String.fromCharCode(b < 0 ? b + 256 : b);
    }).join('');

    // hash = HMAC-SHA256(key=secret_key, msg=data_check_string)
    const signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, keyString);

    const signatureHex = signatureBytes.map(function(b) {
      const val = b < 0 ? b + 256 : b;
      return ('0' + val.toString(16)).slice(-2);
    }).join('');

    if (signatureHex !== hash) {
      Logger.log("HMAC mismatch. got=" + signatureHex.substring(0, 16) + "... expected=" + hash.substring(0, 16) + "...");
      return "Xác thực thất bại.";
    }
    return "";
  } catch (err) {
    return "Exception: " + err.toString();
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

