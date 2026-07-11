/**
 * Khởi tạo mock Logger nếu chạy trong môi trường Node.js.
 */
if (typeof Logger === 'undefined') {
  var Logger = {
    log: function(msg) {
      console.log(msg);
    }
  };
}

/**
 * Hàm assert hỗ trợ kiểm tra điều kiện test.
 * @param {boolean} condition 
 * @param {string} message 
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

/**
 * Chạy toàn bộ kiểm thử đơn vị cho backend.
 */
function runTests() {
  Logger.log("=== BẮT ĐẦU CHẠY KIỂM THỬ BACKEND ===");
  try {
    testParseDateString();
    testCalculateDaysDifference();
    testExpectedInterestCalculation();
    testExecuteGetDeposits();
    testExecuteAddDeposit();
    testExecuteRolloverDeposit();
    testDoPostRouting();
    testLockServiceBehavior();
    testLinkTelegramChatId();
    testDoPostTelegramWebhook();
    testCheckMaturityAndSendAlerts();
    Logger.log("=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===");
  } catch (error) {
    Logger.log("❌ KIỂM THỬ THẤT BẠI: " + error.toString());
    throw error;
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
    assert(false, "Phải báo lỗi nếu ngày kết thúc trước hoặc bằng ngày bắt đầu");
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

/**
 * Tạo mock sheet cho mục đích testing.
 */
function createMockSheets() {
  const usersData = [];
  const depositsData = [];
  
  const usersSheetMock = {
    getLastRow: function() {
      return usersData.length === 0 ? 0 : usersData.length + 1;
    },
    getRange: function(row, col, numRows, numCols) {
      const rowIndex = row - 2;
      return {
        getValues: function() {
          const result = [];
          for (let i = rowIndex; i < rowIndex + numRows; i++) {
            if (usersData[i]) {
              const rowValues = usersData[i];
              const cols = [];
              for (let c = col - 1; c < col - 1 + numCols; c++) {
                cols.push(rowValues[c] !== undefined ? rowValues[c] : "");
              }
              result.push(cols);
            }
          }
          return result;
        },
        setValue: function(value) {
          if (usersData[rowIndex]) {
            usersData[rowIndex][col - 1] = value;
          }
        }
      };
    },
    appendRow: function(rowArray) {
      usersData.push([...rowArray]);
    }
  };

  const depositsSheetMock = {
    getLastRow: function() {
      return depositsData.length === 0 ? 0 : depositsData.length + 1;
    },
    getRange: function(row, col, numRows, numCols) {
      const rowIndex = row - 2;
      return {
        getValues: function() {
          const result = [];
          for (let i = rowIndex; i < rowIndex + numRows; i++) {
            if (depositsData[i]) {
              result.push(depositsData[i]);
            }
          }
          return result;
        },
        setValue: function(value) {
          // col 4 tương ứng với status (index 3)
          if (col === 4 && depositsData[rowIndex]) {
            depositsData[rowIndex][3] = value;
          }
        }
      };
    },
    appendRow: function(rowArray) {
      depositsData.push([...rowArray]);
    }
  };

  return {
    users: usersSheetMock,
    deposits: depositsSheetMock,
    _rawUsers: usersData,
    _rawDeposits: depositsData
  };
}

function testExecuteGetDeposits() {
  Logger.log("Chạy: testExecuteGetDeposits");
  const sheets = createMockSheets();
  sheets.deposits.appendRow(["dep-1", 10000000, 6.0, "active", 600000, "10/07/2026", "10/07/2027", "user1_vcb"]);
  sheets.deposits.appendRow(["dep-2", 5000000, 5.0, "active", 250000, "11/07/2026", "11/07/2027", "user2_tcb"]);
  
  const rawResponse = executeGetDeposits(sheets, { action: "get_deposits", username_bankcode: "user1_vcb" });
  const response = getResponseData(rawResponse);
  assert(response.status === "success", "Response status phải là success");
  assert(response.data.length === 1, "Chỉ lấy được 1 khoản gửi");
  assert(response.data[0].id === "dep-1", "ID khoản gửi phải là dep-1");
}

function testExecuteAddDeposit() {
  Logger.log("Chạy: testExecuteAddDeposit");
  const sheets = createMockSheets();
  
  const payload = {
    action: "add_deposit",
    username_bankcode: "user1_vcb",
    data: {
      amount: 10000000,
      interest_rate: 6.0,
      created_at: "10/07/2026",
      maturity_at: "10/07/2027"
    }
  };
  
  const rawResponse = executeAddDeposit(sheets, payload);
  const response = getResponseData(rawResponse);
  assert(response.status === "success", "Thêm khoản gửi thành công");
  assert(response.data.amount === 10000000, "Số tiền khớp");
  assert(response.data.expected_interest === 600000, "Lãi suất tính toán khớp");
  assert(sheets._rawDeposits.length === 1, "Đã lưu vào sheet");
  assert(sheets._rawUsers.some(u => u[0] === "user1_vcb"), "Đã tạo user");
}

function testExecuteRolloverDeposit() {
  Logger.log("Chạy: testExecuteRolloverDeposit");
  const sheets = createMockSheets();
  sheets.deposits.appendRow(["dep-1", 10000000, 6.0, "active", 600000, "10/07/2026", "10/07/2027", "user1_vcb"]);
  
  const payload = {
    action: "rollover_deposit",
    id: "dep-1",
    new_amount: 12000000,
    new_interest_rate: 5.8,
    created_at: "10/07/2027",
    maturity_at: "10/07/2028"
  };
  
  const rawResponse = executeRolloverDeposit(sheets, payload);
  const response = getResponseData(rawResponse);
  assert(response.status === "success", "Tái tục thành công");
  assert(response.data.old_deposit.id === "dep-1", "ID cũ khớp");
  assert(response.data.old_deposit.status === "rolled_over", "Trạng thái cũ đổi sang rolled_over");
  assert(sheets._rawDeposits[0][3] === "rolled_over", "Trạng thái dòng cũ trong sheet đổi");
  
  assert(response.data.new_deposit.amount === 12000000, "Số tiền mới khớp");
  assert(response.data.new_deposit.status === "active", "Trạng thái mới hoạt động");
  assert(sheets._rawDeposits.length === 2, "Thêm 1 dòng mới vào sheet");
}

/**
 * Trích xuất dữ liệu phản hồi JSON bất kể có hay không có ContentService wrapper.
 */
function getResponseData(response) {
  if (response && typeof response.getContent === 'function') {
    return JSON.parse(response.getContent());
  }
  return response;
}

function testDoPostRouting() {
  Logger.log("Chạy: testDoPostRouting");
  
  // Backup
  const originalInitSheets = initializeSheets;
  const mockSheets = createMockSheets();
  initializeSheets = () => mockSheets;
  
  const originalLockService = typeof LockService !== 'undefined' ? LockService : null;
  this.LockService = {
    getScriptLock: () => ({
      tryLock: () => true,
      releaseLock: () => {}
    })
  };
  
  try {
    // 1. Dữ liệu trống
    let response = getResponseData(doPost(null));
    assert(response.status === "error", "Dữ liệu trống phải trả về error");
    assert(response.message.indexOf("Dữ liệu yêu cầu trống") !== -1, "Thông báo lỗi trống");
    
    // 2. Action không hợp lệ
    const invalidEvent = {
      postData: {
        contents: JSON.stringify({ action: "invalid_action" })
      }
    };
    response = getResponseData(doPost(invalidEvent));
    assert(response.status === "error", "Action không hợp lệ phải trả về error");
    assert(response.message.indexOf("không được hỗ trợ") !== -1, "Thông báo lỗi action");
    
    // 3. Action get_deposits
    const getEvent = {
      postData: {
        contents: JSON.stringify({
          action: "get_deposits",
          username_bankcode: "user1_vcb"
        })
      }
    };
    response = getResponseData(doPost(getEvent));
    assert(response.status === "success", "get_deposits phải thành công");
    
    // 4. Action add_deposit
    const addEvent = {
      postData: {
        contents: JSON.stringify({
          action: "add_deposit",
          username_bankcode: "user1_vcb",
          data: { amount: 1000000, interest_rate: 6.0, created_at: "10/07/2026", maturity_at: "10/07/2027" }
        })
      }
    };
    response = getResponseData(doPost(addEvent));
    assert(response.status === "success", "add_deposit phải thành công");
    
    // 5. Action rollover_deposit
    const newDepId = response.data.id;
    const rolloverEvent = {
      postData: {
        contents: JSON.stringify({
          action: "rollover_deposit",
          id: newDepId,
          new_amount: 1200000,
          new_interest_rate: 5.5,
          created_at: "10/07/2027",
          maturity_at: "10/07/2028"
        })
      }
    };
    response = getResponseData(doPost(rolloverEvent));
    assert(response.status === "success", "rollover_deposit phải thành công");
    
  } finally {
    // Restore
    initializeSheets = originalInitSheets;
    if (originalLockService) {
      this.LockService = originalLockService;
    } else {
      delete this.LockService;
    }
  }
}

function testLockServiceBehavior() {
  Logger.log("Chạy: testLockServiceBehavior");
  
  const originalLockService = typeof LockService !== 'undefined' ? LockService : null;
  
  let tryLockResult = true;
  let releaseLockCalled = false;
  let getScriptLockCalled = false;
  
  this.LockService = {
    getScriptLock: function() {
      getScriptLockCalled = true;
      return {
        tryLock: function(timeout) {
          assert(timeout === 10000, "tryLock timeout phải là 10000ms");
          return tryLockResult;
        },
        releaseLock: function() {
          releaseLockCalled = true;
        }
      };
    }
  };
  
  const originalInitSheets = initializeSheets;
  const mockSheets = createMockSheets();
  initializeSheets = () => mockSheets;
  
  try {
    // 1. Chế độ lock thành công
    tryLockResult = true;
    releaseLockCalled = false;
    getScriptLockCalled = false;
    
    const payload = {
      action: "add_deposit",
      username_bankcode: "user1_vcb",
      data: { amount: 1000000, interest_rate: 6.0, created_at: "10/07/2026", maturity_at: "10/07/2027" }
    };
    
    const resSuccess = getResponseData(handleWriteActionWithLock("add_deposit", payload));
    assert(resSuccess.status === "success", "Khi lock thành công, trả về success");
    assert(getScriptLockCalled, "Phải gọi getScriptLock");
    assert(releaseLockCalled, "Phải giải phóng lock khi thành công");
    
    // 2. Chế độ lock thất bại
    tryLockResult = false;
    releaseLockCalled = false;
    getScriptLockCalled = false;
    
    const resFail = getResponseData(handleWriteActionWithLock("add_deposit", payload));
    assert(resFail.status === "error", "Khi lock thất bại, trả về error");
    assert(resFail.message.indexOf("Hệ thống đang bận") !== -1, "Thông điệp bận chính xác");
    assert(getScriptLockCalled, "Phải gọi getScriptLock");
    assert(!releaseLockCalled, "Không được gọi releaseLock nếu tryLock trả về false");
    
    // 3. Chế độ có lỗi nghiệp vụ xảy ra
    tryLockResult = true;
    releaseLockCalled = false;
    
    const badPayload = {
      action: "add_deposit",
      username_bankcode: "user1_vcb",
      data: { amount: -500 }
    };
    
    const resError = getResponseData(handleWriteActionWithLock("add_deposit", badPayload));
    assert(resError.status === "error", "Có lỗi nghiệp vụ, trả về error");
    assert(releaseLockCalled, "Vẫn phải giải phóng lock khi có lỗi xảy ra");
    
  } finally {
    initializeSheets = originalInitSheets;
    if (originalLockService) {
      this.LockService = originalLockService;
    } else {
      delete this.LockService;
    }
  }
}

function testLinkTelegramChatId() {
  Logger.log("Chạy: testLinkTelegramChatId");
  const sheets = createMockSheets();
  
  // Test case 1: User chưa tồn tại, liên kết mới
  linkTelegramChatId(sheets.users, "user1_vcb", "123456789");
  assert(sheets._rawUsers.length === 1, "Thêm 1 user");
  assert(sheets._rawUsers[0][0] === "user1_vcb", "Username chính xác");
  assert(sheets._rawUsers[0][1] === "123456789", "Chat ID chính xác");
  
  // Test case 2: User đã tồn tại, cập nhật Chat ID mới
  linkTelegramChatId(sheets.users, "user1_vcb", "987654321");
  assert(sheets._rawUsers.length === 1, "Vẫn là 1 user");
  assert(sheets._rawUsers[0][1] === "987654321", "Chat ID đã được cập nhật");
  
  // Test case 3: Chat ID không đổi, không cập nhật gì thêm
  linkTelegramChatId(sheets.users, "user1_vcb", "987654321");
  assert(sheets._rawUsers.length === 1, "Vẫn là 1 user");
}

function testDoPostTelegramWebhook() {
  Logger.log("Chạy: testDoPostTelegramWebhook");
  
  // Thiết lập mock
  const originalInitSheets = initializeSheets;
  const mockSheets = createMockSheets();
  initializeSheets = () => mockSheets;
  
  const originalPropertiesService = this.PropertiesService;
  this.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (k) => {
        if (k === 'WEBHOOK_TOKEN') return 'secret_123';
        if (k === 'MINI_APP_URL') return 'https://t.me/myapp';
        if (k === 'TELEGRAM_BOT_TOKEN') return 'bot_token_abc';
        return null;
      }
    })
  };
  
  let fetchCalled = false;
  let fetchUrl = "";
  let fetchOptions = null;
  const originalUrlFetchApp = this.UrlFetchApp;
  this.UrlFetchApp = {
    fetch: (url, options) => {
      fetchCalled = true;
      fetchUrl = url;
      fetchOptions = options;
      return {
        getContentText: () => JSON.stringify({ ok: true })
      };
    }
  };
  
  try {
    // Test case 1: Token hợp lệ, webhook /start từ Telegram
    const validWebhookEvent = {
      parameter: { token: "secret_123" },
      postData: {
        contents: JSON.stringify({
          message: {
            chat: { id: 112233 },
            text: "/start"
          }
        })
      }
    };
    
    const rawRes = doPost(validWebhookEvent);
    const res = getResponseData(rawRes);
    
    assert(res.status === "success", "DoPost webhook Telegram trả về success");
    assert(fetchCalled, "Phải gọi UrlFetchApp.fetch để gửi tin nhắn Telegram");
    assert(fetchUrl.indexOf("sendMessage") !== -1, "Gọi API sendMessage");
    
    const payload = JSON.parse(fetchOptions.payload);
    assert(payload.chat_id === 112233, "Chat ID trong sendMessage khớp");
    assert(payload.reply_markup.inline_keyboard[0][0].web_app.url === "https://t.me/myapp", "Đúng URL Mini App");
    
    // Reset state
    fetchCalled = false;
    
    // Test case 2: Webhook sai token
    const invalidWebhookEvent = {
      parameter: { token: "wrong_token" },
      postData: {
        contents: JSON.stringify({
          message: {
            chat: { id: 112233 },
            text: "/start"
          }
        })
      }
    };
    
    const rawResInvalid = doPost(invalidWebhookEvent);
    const resInvalid = getResponseData(rawResInvalid);
    assert(resInvalid.status === "error", "Sai token phải trả về error");
    assert(resInvalid.message.indexOf("Unauthorized") !== -1, "Thông báo Unauthorized");
    assert(!fetchCalled, "Không được gọi UrlFetchApp.fetch khi sai token");
    
    // Test case 3: API get_deposits có đính kèm telegram_chat_id -> Tự động link
    const getDepositsEvent = {
      parameter: {},
      postData: {
        contents: JSON.stringify({
          action: "get_deposits",
          username_bankcode: "user2_tcb",
          telegram_chat_id: "556677",
          initData: "mock_hash"
        })
      }
    };
    
    const rawResGet = doPost(getDepositsEvent);
    const resGet = getResponseData(rawResGet);
    assert(resGet.status === "success", "get_deposits thành công");
    
    // Kiểm tra user2_tcb đã được link telegram_chat_id
    assert(mockSheets._rawUsers.length === 1, "Thêm 1 user mới qua link");
    assert(mockSheets._rawUsers[0][0] === "user2_tcb", "Username liên kết đúng");
    assert(mockSheets._rawUsers[0][1] === "556677", "Chat ID liên kết đúng");
    
  } finally {
    initializeSheets = originalInitSheets;
    this.PropertiesService = originalPropertiesService;
    if (originalUrlFetchApp) {
      this.UrlFetchApp = originalUrlFetchApp;
    } else {
      delete this.UrlFetchApp;
    }
  }
}

function testCheckMaturityAndSendAlerts() {
  Logger.log("Chạy: testCheckMaturityAndSendAlerts");
  
  const originalInitSheets = initializeSheets;
  const mockSheets = createMockSheets();
  initializeSheets = () => mockSheets;
  
  const originalPropertiesService = this.PropertiesService;
  this.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (k) => {
        if (k === 'TELEGRAM_BOT_TOKEN') return 'bot_token_abc';
        return null;
      }
    })
  };
  
  const sentPayloads = [];
  const originalUrlFetchApp = this.UrlFetchApp;
  this.UrlFetchApp = {
    fetch: (url, options) => {
      sentPayloads.push({
        url: url,
        options: options,
        payload: JSON.parse(options.payload)
      });
      return {
        getContentText: () => JSON.stringify({ ok: true })
      };
    }
  };
  
  try {
    mockSheets.users.appendRow(["userA_vcb", "chat_111"]);
    mockSheets.users.appendRow(["userB_tcb", "chat_222"]);
    mockSheets.users.appendRow(["userC_bidv", ""]);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    const formatDate = (date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };
    
    const dateToday = formatDate(today);
    const dateIn2Days = formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000));
    const dateOverdue1Day = formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000));
    const dateIn30Days = formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
    const dateIn1Day = formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000));
    
    mockSheets.deposits.appendRow(["dep-1", 10000000, 6.0, "active", 600000, dateToday, dateIn2Days, "userA_vcb"]);
    mockSheets.deposits.appendRow(["dep-2", 5000000, 5.0, "active", 250000, dateToday, dateOverdue1Day, "userA_vcb"]);
    mockSheets.deposits.appendRow(["dep-3", 15000000, 5.5, "active", 825000, dateToday, dateIn30Days, "userA_vcb"]);
    mockSheets.deposits.appendRow(["dep-4", 8000000, 6.2, "active", 496000, dateToday, dateToday, "userB_tcb"]);
    mockSheets.deposits.appendRow(["dep-5", 12000000, 6.0, "active", 720000, dateToday, dateIn1Day, "userC_bidv"]);
    mockSheets.deposits.appendRow(["dep-6", 10000000, 6.0, "rolled_over", 600000, dateToday, dateIn1Day, "userA_vcb"]);
    
    checkMaturityAndSendAlerts();
    
    assert(sentPayloads.length === 2, "Chỉ được gửi 2 thông báo Telegram");
    
    const userAMsg = sentPayloads.find(p => p.payload.chat_id === "chat_111" || p.payload.chat_id === 111);
    assert(userAMsg !== undefined, "Phải gửi tin nhắn cho User A (chat_111)");
    assert(userAMsg.url.indexOf("sendMessage") !== -1, "Gọi API sendMessage");
    assert(userAMsg.payload.text.indexOf("dep-1") !== -1, "Tin nhắn phải chứa thông tin dep-1");
    assert(userAMsg.payload.text.indexOf("dep-2") !== -1, "Tin nhắn phải chứa thông tin dep-2");
    assert(userAMsg.payload.text.indexOf("dep-3") === -1, "Tin nhắn không được chứa thông tin dep-3");
    
    const userBMsg = sentPayloads.find(p => p.payload.chat_id === "chat_222" || p.payload.chat_id === 222);
    assert(userBMsg !== undefined, "Phải gửi tin nhắn cho User B (chat_222)");
    assert(userBMsg.payload.text.indexOf("dep-4") !== -1, "Tin nhắn phải chứa thông tin dep-4");
    
  } finally {
    initializeSheets = originalInitSheets;
    this.PropertiesService = originalPropertiesService;
    if (originalUrlFetchApp) {
      this.UrlFetchApp = originalUrlFetchApp;
    } else {
      delete this.UrlFetchApp;
    }
  }
}

