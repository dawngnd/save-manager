/**
 * Tests.js — Kiểm thử đơn vị cho backend Save Manager.
 * Sử dụng các class OOP đã refactor: DateUtils, ResponseHelper, SheetManager,
 * UserRepository, DepositRepository, AuthService, TelegramService.
 */

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
    throw new Error('Assertion failed: ' + message);
  }
}

/**
 * Chạy toàn bộ kiểm thử đơn vị cho backend.
 */
function runTests() {
  Logger.log('=== BẮT ĐẦU CHẠY KIỂM THỬ BACKEND ===');
  try {
    testDateUtilsParse();
    testDateUtilsDaysDifference();
    testExpectedInterestCalculation();
    testDepositRepositoryGetAll();
    testDepositRepositoryAdd();
    testDepositRepositoryRollover();
    testDoPostRouting();
    testLockServiceBehavior();
    testUserRepositoryLinkChatId();
    testDoPostTelegramWebhook();
    testCheckMaturityAndSendAlerts();
    Logger.log('=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===');
  } catch (error) {
    Logger.log('❌ KIỂM THỬ THẤT BẠI: ' + error.toString());
    throw error;
  }
}

// ============================================================
// Mock helpers
// ============================================================

/**
 * Tạo mock sheet cho mục đích testing.
 * Mock hỗ trợ đầy đủ: getValues, setValue, setValues, setNumberFormat, appendRow.
 */
function createMockSheets() {
  var usersData = [];
  var depositsData = [];

  function createSheetMock(data) {
    return {
      getLastRow: function() {
        return data.length === 0 ? HEADER_ROW : data.length + HEADER_ROW;
      },
      getRange: function(row, col, numRows, numCols) {
        var rowIndex = row - DATA_START_ROW;
        return {
          getValues: function() {
            var result = [];
            var rCount = numRows || 1;
            var cCount = numCols || 1;
            for (var i = rowIndex; i < rowIndex + rCount; i++) {
              if (i >= 0 && i < data.length) {
                var rowData = [];
                for (var c = col - 1; c < col - 1 + cCount; c++) {
                  rowData.push(data[i] && data[i][c] !== undefined ? data[i][c] : '');
                }
                result.push(rowData);
              }
            }
            return result;
          },
          setValue: function(value) {
            if (rowIndex >= 0 && rowIndex < data.length) {
              data[rowIndex][col - 1] = value;
            }
          },
          setValues: function(rows) {
            for (var r = 0; r < rows.length; r++) {
              var targetIndex = rowIndex + r;
              if (targetIndex >= 0) {
                while (data.length <= targetIndex) {
                  data.push([]);
                }
                data[targetIndex] = rows[r].slice();
              }
            }
          },
          setNumberFormat: function() { /* no-op for mock */ }
        };
      },
      appendRow: function(rowArray) {
        data.push(rowArray.slice());
      }
    };
  }

  return {
    users: createSheetMock(usersData),
    deposits: createSheetMock(depositsData),
    _rawUsers: usersData,
    _rawDeposits: depositsData
  };
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

// ============================================================
// Test cases
// ============================================================

function testDateUtilsParse() {
  Logger.log('Chạy: testDateUtilsParse');
  var dateObj = DateUtils.parse('15/08/2026');
  assert(dateObj.getDate() === 15, 'Ngày phải là 15');
  assert(dateObj.getMonth() === 7, 'Tháng phải là 7 (Tháng 8 trong JS)');
  assert(dateObj.getFullYear() === 2026, 'Năm phải là 2026');

  // Test case sai định dạng
  try {
    DateUtils.parse('2026-08-15');
    assert(false, 'Phải quăng lỗi khi định dạng không khớp DD/MM/YYYY');
  } catch (e) {
    assert(e.message.indexOf('Định dạng ngày không hợp lệ') !== -1, 'Thông báo lỗi chính xác');
  }
}

function testDateUtilsDaysDifference() {
  Logger.log('Chạy: testDateUtilsDaysDifference');
  var days = DateUtils.daysDifference('10/07/2026', '10/07/2027');
  assert(days === 365, 'Chênh lệch 1 năm thường phải là 365 ngày');

  var leapDays = DateUtils.daysDifference('28/02/2028', '01/03/2028');
  assert(leapDays === 2, 'Năm nhuận 2028: từ 28/02 đến 01/03 phải là 2 ngày');

  try {
    DateUtils.daysDifference('10/07/2026', '09/07/2026');
    assert(false, 'Phải báo lỗi nếu ngày kết thúc trước hoặc bằng ngày bắt đầu');
  } catch (e) {
    assert(e.message.indexOf('Ngày đáo hạn phải sau') !== -1, 'Thông báo lỗi hợp lệ');
  }
}

function testExpectedInterestCalculation() {
  Logger.log('Chạy: testExpectedInterestCalculation');
  // Test trường hợp số tiền 10,000,000, lãi suất 6.0%, gửi 365 ngày
  var amount = 10000000;
  var rate = 6.0;
  var days = 365;
  var expectedInterest = DepositRepository.calculateExpectedInterest(amount, rate, days);
  assert(expectedInterest === 600000, 'Tiền lãi kỳ vọng là 600,000 VND');

  // Test làm tròn số tiền lẻ
  var rate2 = 6.25;
  var days2 = 180; // ~ nửa năm
  var expectedInterest2 = DepositRepository.calculateExpectedInterest(amount, rate2, days2);
  assert(expectedInterest2 === 308219, 'Tiền lãi 308,219.17 VND làm tròn thành 308,219 VND');
}

function testDepositRepositoryGetAll() {
  Logger.log('Chạy: testDepositRepositoryGetAll');
  var sheets = createMockSheets();
  sheets.deposits.appendRow(['dep-1', 10000000, 6.0, STATUS_ACTIVE, 600000, '10/07/2026', '10/07/2027', 'user1_vcb', '', '']);
  sheets.deposits.appendRow(['dep-2', 5000000, 5.0, STATUS_ACTIVE, 250000, '11/07/2026', '11/07/2027', 'user2_tcb', '', '']);

  var rawResponse = DepositRepository.getAll(sheets, {}, null);
  var response = getResponseData(rawResponse);
  assert(response.status === 'success', 'Response status phải là success');
  assert(response.data.length === 2, 'Lấy được tất cả 2 khoản gửi');
  assert(response.data[0].id === 'dep-1', 'ID khoản gửi đầu tiên phải là dep-1');
  assert(response.data[1].id === 'dep-2', 'ID khoản gửi thứ hai phải là dep-2');
}

function testDepositRepositoryAdd() {
  Logger.log('Chạy: testDepositRepositoryAdd');
  var sheets = createMockSheets();

  var payload = {
    action: 'add_deposit',
    username_bankcode: 'user1_vcb',
    data: {
      amount: 10000000,
      interest_rate: 6.0,
      created_at: '10/07/2026',
      maturity_at: '10/07/2027'
    }
  };

  var rawResponse = DepositRepository.add(sheets, payload);
  var response = getResponseData(rawResponse);
  assert(response.status === 'success', 'Thêm khoản gửi thành công');
  assert(response.data.amount === 10000000, 'Số tiền khớp');
  assert(response.data.expected_interest === 600000, 'Lãi suất tính toán khớp');
  assert(sheets._rawDeposits.length === 1, 'Đã lưu vào sheet');
  assert(sheets._rawUsers.some(function(u) { return u[USER_COL_BANKCODE] === 'user1_vcb'; }), 'Đã tạo user');
}

function testDepositRepositoryRollover() {
  Logger.log('Chạy: testDepositRepositoryRollover');
  var sheets = createMockSheets();
  sheets.deposits.appendRow(['dep-1', 10000000, 6.0, STATUS_ACTIVE, 600000, '10/07/2026', '10/07/2027', 'user1_vcb', '', '']);

  var payload = {
    action: 'rollover_deposit',
    id: 'dep-1',
    new_amount: 12000000,
    new_interest_rate: 5.8,
    created_at: '10/07/2027',
    maturity_at: '10/07/2028'
  };

  var rawResponse = DepositRepository.rollover(sheets, payload, null);
  var response = getResponseData(rawResponse);
  assert(response.status === 'success', 'Tái tục thành công');
  assert(response.data.old_deposit.id === 'dep-1', 'ID cũ khớp');
  assert(response.data.old_deposit.status === STATUS_ROLLED_OVER, 'Trạng thái cũ đổi sang rolled_over');
  assert(sheets._rawDeposits[0][DEP_COL_STATUS] === STATUS_ROLLED_OVER, 'Trạng thái dòng cũ trong sheet đổi');

  // Kiểm tra child_id được lưu cho bản ghi cha (bug gốc: mock cũ chỉ handle col 4 → bỏ qua col 10)
  assert(sheets._rawDeposits[0][DEP_COL_CHILD_ID] === response.data.new_deposit.id,
    'child_id phải được lưu cho bản ghi cha. Got: ' + sheets._rawDeposits[0][DEP_COL_CHILD_ID]);
  assert(response.data.old_deposit.child_id === response.data.new_deposit.id,
    'Response phải chứa child_id trong old_deposit');

  assert(response.data.new_deposit.amount === 12000000, 'Số tiền mới khớp');
  assert(response.data.new_deposit.status === STATUS_ACTIVE, 'Trạng thái mới hoạt động');
  assert(response.data.new_deposit.parent_id === 'dep-1', 'parent_id của khoản mới phải trỏ về khoản cũ');
  assert(sheets._rawDeposits.length === 2, 'Thêm 1 dòng mới vào sheet');
}

function testDoPostRouting() {
  Logger.log('Chạy: testDoPostRouting');

  // Mock SheetManager.initializeSheets
  var originalInitSheets = SheetManager.initializeSheets;
  var mockSheets = createMockSheets();
  SheetManager.initializeSheets = function() { return mockSheets; };

  var originalLockService = typeof LockService !== 'undefined' ? LockService : null;
  this.LockService = {
    getScriptLock: function() {
      return {
        tryLock: function() { return true; },
        releaseLock: function() {}
      };
    }
  };

  // Mock PropertiesService — bypass auth via _serverSecret
  var originalPropertiesService = typeof PropertiesService !== 'undefined' ? PropertiesService : undefined;
  this.PropertiesService = {
    getScriptProperties: function() {
      return {
        getProperty: function(k) {
          if (k === PROP_WORKER_SECRET) return 'test_worker_secret';
          return null;
        }
      };
    }
  };

  try {
    // 1. Dữ liệu trống
    var response = getResponseData(doPost(null));
    assert(response.status === 'error', 'Dữ liệu trống phải trả về error');
    assert(response.message.indexOf('Dữ liệu yêu cầu trống') !== -1, 'Thông báo lỗi trống');

    // 2. Action không hợp lệ
    var invalidEvent = {
      postData: {
        contents: JSON.stringify({ action: 'invalid_action', _serverSecret: 'test_worker_secret' })
      }
    };
    response = getResponseData(doPost(invalidEvent));
    assert(response.status === 'error', 'Action không hợp lệ phải trả về error');
    assert(response.message.indexOf('không được hỗ trợ') !== -1, 'Thông báo lỗi action');

    // 3. Action get_deposits
    var getEvent = {
      postData: {
        contents: JSON.stringify({
          action: 'get_deposits',
          username_bankcode: 'user1_vcb',
          _serverSecret: 'test_worker_secret'
        })
      }
    };
    response = getResponseData(doPost(getEvent));
    assert(response.status === 'success', 'get_deposits phải thành công');

    // 4. Action add_deposit
    var addEvent = {
      postData: {
        contents: JSON.stringify({
          action: 'add_deposit',
          username_bankcode: 'user1_vcb',
          data: { amount: 1000000, interest_rate: 6.0, created_at: '10/07/2026', maturity_at: '10/07/2027' },
          _serverSecret: 'test_worker_secret'
        })
      }
    };
    response = getResponseData(doPost(addEvent));
    assert(response.status === 'success', 'add_deposit phải thành công');

    // 5. Action rollover_deposit
    var newDepId = response.data.id;
    var rolloverEvent = {
      postData: {
        contents: JSON.stringify({
          action: 'rollover_deposit',
          id: newDepId,
          new_amount: 1200000,
          new_interest_rate: 5.5,
          created_at: '10/07/2027',
          maturity_at: '10/07/2028',
          _serverSecret: 'test_worker_secret'
        })
      }
    };
    response = getResponseData(doPost(rolloverEvent));
    assert(response.status === 'success', 'rollover_deposit phải thành công');

  } finally {
    SheetManager.initializeSheets = originalInitSheets;
    if (originalLockService) {
      this.LockService = originalLockService;
    } else {
      delete this.LockService;
    }
    if (originalPropertiesService !== undefined) {
      this.PropertiesService = originalPropertiesService;
    } else {
      delete this.PropertiesService;
    }
  }
}

function testLockServiceBehavior() {
  Logger.log('Chạy: testLockServiceBehavior');

  var originalLockService = typeof LockService !== 'undefined' ? LockService : null;

  var tryLockResult = true;
  var releaseLockCalled = false;
  var getScriptLockCalled = false;

  this.LockService = {
    getScriptLock: function() {
      getScriptLockCalled = true;
      return {
        tryLock: function(timeout) {
          assert(timeout === LOCK_TIMEOUT_MS, 'tryLock timeout phải là ' + LOCK_TIMEOUT_MS + 'ms');
          return tryLockResult;
        },
        releaseLock: function() {
          releaseLockCalled = true;
        }
      };
    }
  };

  var originalInitSheets = SheetManager.initializeSheets;
  var mockSheets = createMockSheets();
  SheetManager.initializeSheets = function() { return mockSheets; };

  try {
    // 1. Chế độ lock thành công
    tryLockResult = true;
    releaseLockCalled = false;
    getScriptLockCalled = false;

    var payload = {
      action: 'add_deposit',
      username_bankcode: 'user1_vcb',
      data: { amount: 1000000, interest_rate: 6.0, created_at: '10/07/2026', maturity_at: '10/07/2027' }
    };

    var resSuccess = getResponseData(handleWriteActionWithLock('add_deposit', payload));
    assert(resSuccess.status === 'success', 'Khi lock thành công, trả về success');
    assert(getScriptLockCalled, 'Phải gọi getScriptLock');
    assert(releaseLockCalled, 'Phải giải phóng lock khi thành công');

    // 2. Chế độ lock thất bại
    tryLockResult = false;
    releaseLockCalled = false;
    getScriptLockCalled = false;

    var resFail = getResponseData(handleWriteActionWithLock('add_deposit', payload));
    assert(resFail.status === 'error', 'Khi lock thất bại, trả về error');
    assert(resFail.message.indexOf('Hệ thống đang bận') !== -1, 'Thông điệp bận chính xác');
    assert(getScriptLockCalled, 'Phải gọi getScriptLock');
    assert(!releaseLockCalled, 'Không được gọi releaseLock nếu tryLock trả về false');

    // 3. Chế độ có lỗi nghiệp vụ xảy ra
    tryLockResult = true;
    releaseLockCalled = false;

    var badPayload = {
      action: 'add_deposit',
      username_bankcode: 'user1_vcb',
      data: { amount: -500 }
    };

    var resError = getResponseData(handleWriteActionWithLock('add_deposit', badPayload));
    assert(resError.status === 'error', 'Có lỗi nghiệp vụ, trả về error');
    assert(releaseLockCalled, 'Vẫn phải giải phóng lock khi có lỗi xảy ra');

  } finally {
    SheetManager.initializeSheets = originalInitSheets;
    if (originalLockService) {
      this.LockService = originalLockService;
    } else {
      delete this.LockService;
    }
  }
}

function testUserRepositoryLinkChatId() {
  Logger.log('Chạy: testUserRepositoryLinkChatId');
  var sheets = createMockSheets();

  // Test case 1: User chưa tồn tại, liên kết mới
  UserRepository.linkChatId(sheets.users, 'user1_vcb', '123456789');
  assert(sheets._rawUsers.length === 1, 'Thêm 1 user');
  assert(sheets._rawUsers[0][USER_COL_BANKCODE] === 'user1_vcb', 'Username chính xác');
  assert(sheets._rawUsers[0][USER_COL_CHAT_ID] === '123456789', 'Chat ID chính xác');

  // Test case 2: User đã tồn tại, cập nhật Chat ID mới
  UserRepository.linkChatId(sheets.users, 'user1_vcb', '987654321');
  assert(sheets._rawUsers.length === 1, 'Vẫn là 1 user');
  assert(sheets._rawUsers[0][USER_COL_CHAT_ID] === '987654321', 'Chat ID đã được cập nhật');

  // Test case 3: Chat ID không đổi, không cập nhật gì thêm
  UserRepository.linkChatId(sheets.users, 'user1_vcb', '987654321');
  assert(sheets._rawUsers.length === 1, 'Vẫn là 1 user');
}

function testDoPostTelegramWebhook() {
  Logger.log('Chạy: testDoPostTelegramWebhook');

  // Thiết lập mock
  var originalInitSheets = SheetManager.initializeSheets;
  var mockSheets = createMockSheets();
  SheetManager.initializeSheets = function() { return mockSheets; };

  var originalPropertiesService = typeof PropertiesService !== 'undefined' ? PropertiesService : undefined;
  this.PropertiesService = {
    getScriptProperties: function() {
      return {
        getProperty: function(k) {
          if (k === PROP_WEBHOOK_TOKEN) return 'secret_123';
          if (k === PROP_MINI_APP_URL) return 'https://t.me/myapp';
          if (k === PROP_TELEGRAM_BOT_TOKEN) return 'bot_token_abc';
          if (k === PROP_WORKER_SECRET) return 'test_worker_secret';
          return null;
        }
      };
    }
  };

  var fetchCalled = false;
  var fetchUrl = '';
  var fetchOptions = null;
  var originalUrlFetchApp = typeof UrlFetchApp !== 'undefined' ? UrlFetchApp : undefined;
  this.UrlFetchApp = {
    fetch: function(url, options) {
      fetchCalled = true;
      fetchUrl = url;
      fetchOptions = options;
      return {
        getContentText: function() { return JSON.stringify({ ok: true }); }
      };
    }
  };

  try {
    // Test case 1: Token hợp lệ, webhook /start từ Telegram
    var validWebhookEvent = {
      parameter: { token: 'secret_123' },
      postData: {
        contents: JSON.stringify({
          message: {
            chat: { id: 112233 },
            text: '/start'
          }
        })
      }
    };

    var rawRes = doPost(validWebhookEvent);
    var res = getResponseData(rawRes);

    assert(res.status === 'success', 'DoPost webhook Telegram trả về success');
    assert(fetchCalled, 'Phải gọi UrlFetchApp.fetch để gửi tin nhắn Telegram');
    assert(fetchUrl.indexOf('sendMessage') !== -1, 'Gọi API sendMessage');

    var telegramPayload = JSON.parse(fetchOptions.payload);
    assert(telegramPayload.chat_id === 112233, 'Chat ID trong sendMessage khớp');
    assert(telegramPayload.reply_markup.inline_keyboard[0][0].web_app.url === 'https://t.me/myapp', 'Đúng URL Mini App');

    // Reset state
    fetchCalled = false;

    // Test case 2: Webhook sai token
    var invalidWebhookEvent = {
      parameter: { token: 'wrong_token' },
      postData: {
        contents: JSON.stringify({
          message: {
            chat: { id: 112233 },
            text: '/start'
          }
        })
      }
    };

    var rawResInvalid = doPost(invalidWebhookEvent);
    var resInvalid = getResponseData(rawResInvalid);
    assert(resInvalid.status === 'error', 'Sai token phải trả về error');
    assert(resInvalid.message.indexOf('Unauthorized') !== -1, 'Thông báo Unauthorized');
    assert(!fetchCalled, 'Không được gọi UrlFetchApp.fetch khi sai token');

    // Test case 3: API get_deposits có đính kèm telegram_chat_id → Tự động link
    // Bypass auth via _serverSecret, gửi initData chứa user ID cho auto-link
    var getDepositsEvent = {
      parameter: {},
      postData: {
        contents: JSON.stringify({
          action: 'get_deposits',
          username_bankcode: 'user2_tcb',
          telegram_chat_id: '556677',
          _serverSecret: 'test_worker_secret',
          initData: 'user=' + encodeURIComponent(JSON.stringify({ id: 556677 }))
        })
      }
    };

    var rawResGet = doPost(getDepositsEvent);
    var resGet = getResponseData(rawResGet);
    assert(resGet.status === 'success', 'get_deposits thành công');

    // Kiểm tra user2_tcb đã được link telegram_chat_id
    assert(mockSheets._rawUsers.length === 1, 'Thêm 1 user mới qua link');
    assert(mockSheets._rawUsers[0][USER_COL_BANKCODE] === 'user2_tcb', 'Username liên kết đúng');
    assert(mockSheets._rawUsers[0][USER_COL_CHAT_ID] === '556677', 'Chat ID liên kết đúng');

  } finally {
    SheetManager.initializeSheets = originalInitSheets;
    if (originalPropertiesService !== undefined) {
      this.PropertiesService = originalPropertiesService;
    } else {
      delete this.PropertiesService;
    }
    if (originalUrlFetchApp !== undefined) {
      this.UrlFetchApp = originalUrlFetchApp;
    } else {
      delete this.UrlFetchApp;
    }
  }
}

function testCheckMaturityAndSendAlerts() {
  Logger.log('Chạy: testCheckMaturityAndSendAlerts');

  var originalInitSheets = SheetManager.initializeSheets;
  var mockSheets = createMockSheets();
  SheetManager.initializeSheets = function() { return mockSheets; };

  var originalPropertiesService = typeof PropertiesService !== 'undefined' ? PropertiesService : undefined;
  this.PropertiesService = {
    getScriptProperties: function() {
      return {
        getProperty: function(k) {
          if (k === PROP_TELEGRAM_BOT_TOKEN) return 'bot_token_abc';
          return null;
        }
      };
    }
  };

  var sentPayloads = [];
  var originalUrlFetchApp = typeof UrlFetchApp !== 'undefined' ? UrlFetchApp : undefined;
  this.UrlFetchApp = {
    fetch: function(url, options) {
      sentPayloads.push({
        url: url,
        options: options,
        payload: JSON.parse(options.payload)
      });
      return {
        getContentText: function() { return JSON.stringify({ ok: true }); }
      };
    }
  };

  try {
    mockSheets.users.appendRow(['userA_vcb', 'chat_111']);
    mockSheets.users.appendRow(['userB_tcb', 'chat_222']);
    mockSheets.users.appendRow(['userC_bidv', '']);

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    var formatDate = function(date) {
      var d = String(date.getDate()).padStart(2, '0');
      var m = String(date.getMonth() + 1).padStart(2, '0');
      var y = date.getFullYear();
      return d + '/' + m + '/' + y;
    };

    var dateToday = formatDate(today);
    var dateIn2Days = formatDate(new Date(today.getTime() + 2 * MS_PER_DAY));
    var dateOverdue1Day = formatDate(new Date(today.getTime() - 1 * MS_PER_DAY));
    var dateIn30Days = formatDate(new Date(today.getTime() + 30 * MS_PER_DAY));
    var dateIn1Day = formatDate(new Date(today.getTime() + 1 * MS_PER_DAY));

    // dep-1: sắp đáo hạn (2 ngày nữa) → alert cho userA
    mockSheets.deposits.appendRow(['dep-1', 10000000, 6.0, STATUS_ACTIVE, 600000, dateToday, dateIn2Days, 'userA_vcb', '', '']);
    // dep-2: quá hạn 1 ngày → alert cho userA
    mockSheets.deposits.appendRow(['dep-2', 5000000, 5.0, STATUS_ACTIVE, 250000, dateToday, dateOverdue1Day, 'userA_vcb', '', '']);
    // dep-3: còn 30 ngày → KHÔNG alert
    mockSheets.deposits.appendRow(['dep-3', 15000000, 5.5, STATUS_ACTIVE, 825000, dateToday, dateIn30Days, 'userA_vcb', '', '']);
    // dep-4: đáo hạn hôm nay → alert cho userB
    mockSheets.deposits.appendRow(['dep-4', 8000000, 6.2, STATUS_ACTIVE, 496000, dateToday, dateToday, 'userB_tcb', '', '']);
    // dep-5: 1 ngày nữa nhưng userC không có chat ID → bỏ qua
    mockSheets.deposits.appendRow(['dep-5', 12000000, 6.0, STATUS_ACTIVE, 720000, dateToday, dateIn1Day, 'userC_bidv', '', '']);
    // dep-6: rolled_over → bỏ qua (chỉ quét active/matured)
    mockSheets.deposits.appendRow(['dep-6', 10000000, 6.0, STATUS_ROLLED_OVER, 600000, dateToday, dateIn1Day, 'userA_vcb', '', '']);

    checkMaturityAndSendAlerts();

    assert(sentPayloads.length === 2, 'Chỉ được gửi 2 thông báo Telegram');

    var userAMsg = sentPayloads.find(function(p) {
      return p.payload.chat_id === 'chat_111' || p.payload.chat_id === 111;
    });
    assert(userAMsg !== undefined, 'Phải gửi tin nhắn cho User A (chat_111)');
    assert(userAMsg.url.indexOf('sendMessage') !== -1, 'Gọi API sendMessage');
    assert(userAMsg.payload.text.indexOf('dep-1') !== -1, 'Tin nhắn phải chứa thông tin dep-1');
    assert(userAMsg.payload.text.indexOf('dep-2') !== -1, 'Tin nhắn phải chứa thông tin dep-2');
    assert(userAMsg.payload.text.indexOf('dep-3') === -1, 'Tin nhắn không được chứa thông tin dep-3');

    var userBMsg = sentPayloads.find(function(p) {
      return p.payload.chat_id === 'chat_222' || p.payload.chat_id === 222;
    });
    assert(userBMsg !== undefined, 'Phải gửi tin nhắn cho User B (chat_222)');
    assert(userBMsg.payload.text.indexOf('dep-4') !== -1, 'Tin nhắn phải chứa thông tin dep-4');

  } finally {
    SheetManager.initializeSheets = originalInitSheets;
    if (originalPropertiesService !== undefined) {
      this.PropertiesService = originalPropertiesService;
    } else {
      delete this.PropertiesService;
    }
    if (originalUrlFetchApp !== undefined) {
      this.UrlFetchApp = originalUrlFetchApp;
    } else {
      delete this.UrlFetchApp;
    }
  }
}
