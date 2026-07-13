/**
 * Code.js — Điểm vào (entry points) cho Google Apps Script Web App.
 * Mọi logic nghiệp vụ được ủy thác cho các class tương ứng.
 */

/**
 * Xử lý yêu cầu HTTP GET gửi tới Web App.
 * Trả về thông tin trạng thái hệ thống dưới dạng JSON.
 * @param {GoogleAppsScript.Events.DoGet} e đối tượng event của GET request
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  var response = {
    status: 'ok',
    message: 'Save Manager backend is running',
    timestamp: new Date().toISOString(),
    timezone: Session.getScriptTimeZone()
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Điểm đón đầu tiên của tất cả các yêu cầu POST từ Web App.
 * Thực hiện routing và quản lý xác thực.
 * @param {GoogleAppsScript.Events.DoPost} e đối tượng event của POST request
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ResponseHelper.json('error', 'Dữ liệu yêu cầu trống.');
    }

    var payload = JSON.parse(e.postData.contents);
    console.log('doPost received action: ' + (payload.action || 'telegram_webhook'));

    // Kiểm tra xem yêu cầu đến từ Telegram hay không
    var isTelegramWebhook = payload.message || payload.callback_query;

    if (isTelegramWebhook) {
      var properties = PropertiesService.getScriptProperties();
      var webhookToken = properties.getProperty(PROP_WEBHOOK_TOKEN);
      var requestToken = e.parameter && e.parameter.token;

      if (!webhookToken || requestToken !== webhookToken) {
        console.log('Webhook request không có token hợp lệ.');
        return ResponseHelper.json('error', 'Unauthorized access.');
      }
      return TelegramService.handleWebhook(payload);
    }

    var action = payload.action;
    var initData = payload.initData;

    var properties = typeof PropertiesService !== 'undefined' ? PropertiesService.getScriptProperties() : null;

    // Xác thực: Worker gửi kèm server secret → tin tưởng (đã verify ở Worker)
    // Nếu không có secret → fallback verify initData trực tiếp (test/direct call)
    var serverSecret = payload._serverSecret;
    var expectedSecret = properties ? properties.getProperty(PROP_WORKER_SECRET) : null;

    if (serverSecret && expectedSecret && serverSecret === expectedSecret) {
      // Đã xác thực bởi Cloudflare Worker — cho phép đi tiếp
    } else {
      // Fallback: verify initData trực tiếp (cho unit test, mock, direct API call)
      var botToken = properties ? properties.getProperty(PROP_TELEGRAM_BOT_TOKEN) : null;
      var verifyResult = AuthService.verifyWebAppData(initData, botToken);
      if (verifyResult !== '') {
        return ResponseHelper.json('error', 'Xác thực thất bại.');
      }
    }

    // Extract authenticated telegram user ID từ initData
    var authenticatedChatId = AuthService.extractUserId(initData);

    // Yêu cầu chỉ đọc: Không sử dụng LockService để tránh nghẽn luồng đọc
    if (action === 'get_users') {
      var sheets = SheetManager.initializeSheets();
      return UserRepository.getAll(sheets);
    }

    if (action === 'get_deposits') {
      var sheets = SheetManager.initializeSheets();

      // Tự động liên kết Chat ID nếu có — validate ownership
      if (payload.telegram_chat_id && payload.username_bankcode && authenticatedChatId) {
        if (String(payload.telegram_chat_id) === String(authenticatedChatId)) {
          UserRepository.linkChatId(sheets.users, payload.username_bankcode, payload.telegram_chat_id);
        }
      }

      return DepositRepository.getAll(sheets, payload, authenticatedChatId);
    }

    // Yêu cầu ghi: Cần sử dụng LockService bảo vệ dữ liệu chống race condition
    if (action === 'add_deposit' || action === 'rollover_deposit') {
      return handleWriteActionWithLock(action, payload, authenticatedChatId);
    }

    return ResponseHelper.json('error', 'Hành động (action) không được hỗ trợ.');
  } catch (error) {
    Logger.log('Lỗi doPost: ' + error.toString());
    return ResponseHelper.json('error', 'Lỗi xử lý yêu cầu phía server.');
  }
}

/**
 * Xử lý các hành động ghi dữ liệu dưới quyền kiểm soát của LockService.
 * @param {string} action
 * @param {object} payload
 * @param {string|null} authenticatedChatId
 * @returns {GoogleAppsScript.Content.TextOutput|object}
 */
function handleWriteActionWithLock(action, payload, authenticatedChatId) {
  var hasLockService = typeof LockService !== 'undefined';
  var lock = hasLockService ? LockService.getScriptLock() : null;
  var hasLock = false;

  try {
    if (hasLockService && lock) {
      // Thử lấy khóa trong vòng 10 giây
      hasLock = lock.tryLock(LOCK_TIMEOUT_MS);
      if (!hasLock) {
        return ResponseHelper.json('error', 'Hệ thống đang bận, vui lòng thử lại.');
      }
    }

    // Khởi tạo sheet và thực thi nghiệp vụ
    var sheets = SheetManager.initializeSheets();

    if (action === 'add_deposit') {
      return DepositRepository.add(sheets, payload);
    } else if (action === 'rollover_deposit') {
      return DepositRepository.rollover(sheets, payload, authenticatedChatId);
    }

  } catch (err) {
    Logger.log('Lỗi nghiệp vụ ghi: ' + err.toString());
    return ResponseHelper.json('error', 'Đã xảy ra lỗi khi xử lý giao dịch.');
  } finally {
    // Luôn giải phóng lock nếu đã lấy thành công
    if (hasLock && lock) {
      lock.releaseLock();
    }
  }
}

// === GLOBAL WRAPPERS cho GAS Triggers ===
// Các hàm global cần thiết để GAS trigger/menu gọi theo tên.

/** Wrapper cho trigger quét đáo hạn hàng ngày. */
function checkMaturityAndSendAlerts() {
  TelegramService.checkMaturityAndSendAlerts();
}

/** Wrapper thiết lập trigger. */
function setupDailyTrigger() {
  TelegramService.setupDailyTrigger();
}

/** Wrapper đăng ký webhook Telegram. */
function setupWebhook() {
  TelegramService.setupWebhook();
}

/** Wrapper khởi tạo sheets (chạy tay từ Editor). */
function initializeSheets() {
  return SheetManager.initializeSheets();
}

/** Wrapper migration (chạy một lần). */
function migrateChildId() {
  DepositRepository.migrateChildId();
}
