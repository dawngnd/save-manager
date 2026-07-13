/**
 * TelegramService.js — Tích hợp Telegram Bot: webhook, gửi tin nhắn, cảnh báo đáo hạn.
 */

class TelegramService {
  /**
   * Gửi yêu cầu API đến Telegram Bot.
   * @param {string} method Tên method API (vd: 'sendMessage')
   * @param {object} payload Body request
   * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
   */
  static sendApi(method, payload) {
    var properties = PropertiesService.getScriptProperties();
    var botToken = properties.getProperty(PROP_TELEGRAM_BOT_TOKEN);
    var url = TELEGRAM_API_BASE + botToken + '/' + method;

    return UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }

  /**
   * Đăng ký Webhook URL với Telegram Bot API. Chạy một lần để cấu hình.
   */
  static setupWebhook() {
    var properties = PropertiesService.getScriptProperties();
    var botToken = properties.getProperty(PROP_TELEGRAM_BOT_TOKEN);
    var webAppUrl = properties.getProperty(PROP_WEB_APP_URL);
    var webhookToken = properties.getProperty(PROP_WEBHOOK_TOKEN);

    if (!botToken || !webAppUrl || !webhookToken) {
      throw new Error('Chưa cấu hình đủ TELEGRAM_BOT_TOKEN, WEB_APP_URL hoặc WEBHOOK_TOKEN.');
    }

    var registerUrl = webAppUrl + '?token=' + webhookToken;
    var telegramUrl = TELEGRAM_API_BASE + botToken + '/setWebhook';

    var response = UrlFetchApp.fetch(telegramUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: registerUrl,
        allowed_updates: ['message']
      }),
      muteHttpExceptions: true
    });

    Logger.log('Kết quả đăng ký webhook: ' + response.getContentText());
  }

  /**
   * Xử lý webhook update nhận được từ Telegram.
   * @param {object} payload
   * @returns {GoogleAppsScript.Content.TextOutput}
   */
  static handleWebhook(payload) {
    if (payload.message && payload.message.text) {
      var chatId = payload.message.chat.id;
      var text = payload.message.text.trim();

      if (text === '/start' || text === '/chart') {
        var properties = PropertiesService.getScriptProperties();
        var miniAppUrl = properties.getProperty(PROP_MINI_APP_URL) || '';

        var targetUrl = miniAppUrl;
        var replyText = 'Chào mừng bạn đến với Save Manager!\n\nHãy nhấn nút bên dưới để mở giao diện quản lý các khoản tiết kiệm cá nhân của bạn.';

        if (text === '/chart') {
          targetUrl = miniAppUrl.indexOf('?') !== -1
            ? miniAppUrl + '&view=chart'
            : miniAppUrl + '?view=chart';
          replyText = 'Nhấn nút dưới đây để xem biểu đồ dự phóng tăng trưởng tài sản của bạn:';
        }

        var replyPayload = {
          chat_id: chatId,
          text: replyText,
          reply_markup: {
            inline_keyboard: [[{
              text: text === '/chart' ? '📈 Xem biểu đồ' : 'Mở Save Manager',
              web_app: { url: targetUrl }
            }]]
          }
        };

        TelegramService.sendApi('sendMessage', replyPayload);
      }
    }
    return ResponseHelper.json('success', 'Telegram webhook handled.');
  }

  /**
   * Lập lịch trigger quét đáo hạn lúc 7:00 AM - 8:00 AM.
   * Dọn dẹp trigger cũ cùng tên hàm để tránh trùng lặp.
   */
  static setupDailyTrigger() {
    var triggerName = 'checkMaturityAndSendAlerts';

    if (typeof ScriptApp === 'undefined') {
      Logger.log('Môi trường Node.js: Bỏ qua tạo trigger.');
      return;
    }

    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === triggerName) {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }

    ScriptApp.newTrigger(triggerName)
      .timeBased()
      .everyDays(1)
      .atHour(7)
      .create();
    Logger.log('Đã thiết lập trigger chạy hàng ngày từ 7:00 AM - 8:00 AM.');
  }

  /**
   * Quét các khoản tiết kiệm active/matured sắp đáo hạn (<= 3 ngày) hoặc quá hạn,
   * gom nhóm theo telegram_chat_id và gửi thông báo tổng hợp qua Telegram Bot.
   */
  static checkMaturityAndSendAlerts() {
    Logger.log('Bắt đầu quét các khoản tiết kiệm đáo hạn...');
    var sheets = SheetManager.initializeSheets();
    var depositsSheet = sheets.deposits;
    var usersSheet = sheets.users;

    var lastRow = depositsSheet.getLastRow();
    if (lastRow <= HEADER_ROW) {
      Logger.log('Không có dữ liệu khoản gửi để quét.');
      return;
    }

    // 1. Tạo bản đồ tra cứu chat_id từ bảng Users
    var userChatMap = UserRepository.buildChatIdMap(usersSheet);

    // 2. Lấy thời điểm hiện tại nửa đêm (00:00:00) tại múi giờ local
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Map gom nhóm cảnh báo theo chat ID
    var alertsByChatId = {};

    // 3. Quét các dòng trong sheet Deposits
    var deposits = depositsSheet.getRange(DATA_START_ROW, 1, lastRow - 1, DEP_COL_USER_BANKCODE + 1).getValues();
    for (var i = 0; i < deposits.length; i++) {
      var id = deposits[i][DEP_COL_ID];
      var amount = Number(deposits[i][DEP_COL_AMOUNT]);
      var rate = Number(deposits[i][DEP_COL_INTEREST_RATE]);
      var status = deposits[i][DEP_COL_STATUS];
      var expectedInterest = Number(deposits[i][DEP_COL_EXPECTED_INTEREST]);
      var maturityAtStr = deposits[i][DEP_COL_MATURITY_AT];
      var userBankcode = deposits[i][DEP_COL_USER_BANKCODE];

      // Chỉ xử lý các khoản active hoặc matured chưa giải quyết
      if (status === STATUS_ACTIVE || status === STATUS_MATURED) {
        try {
          var maturityDate = DateUtils.parse(maturityAtStr);
          var diffTime = maturityDate.getTime() - today.getTime();
          var diffDays = Math.round(diffTime / MS_PER_DAY);

          // Cảnh báo nếu sắp đáo hạn trong vòng 3 ngày tới hoặc đã quá hạn
          if (diffDays <= MATURITY_ALERT_DAYS) {
            var chatId = userChatMap[userBankcode];
            if (!chatId) {
              Logger.log('Warning: Không tìm thấy chat ID cho user ' + userBankcode + '. Bỏ qua thông báo.');
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
          Logger.log('Lỗi xử lý định dạng ngày cho khoản ' + id + ': ' + err.toString());
        }
      }
    }

    // 4. Gửi thông báo batch cho từng chat ID
    for (var chatId in alertsByChatId) {
      var items = alertsByChatId[chatId];
      if (items.length === 0) continue;

      var messageText = '⚠️ **CẢNH BÁO ĐÁO HẠN TIẾT KIỆM** ⚠️\n\n';
      messageText += 'Bạn có ' + items.length + ' khoản tiết kiệm cần lưu ý:\n\n';

      items.forEach(function(item, index) {
        var formattedAmount = Number(item.amount).toLocaleString('vi-VN') + ' VND';
        var statusText = '';
        if (item.diffDays < 0) {
          statusText = 'ĐÃ QUÁ HẠN ' + Math.abs(item.diffDays) + ' NGÀY';
        } else if (item.diffDays === 0) {
          statusText = 'ĐÁO HẠN HÔM NAY';
        } else {
          statusText = 'Còn ' + item.diffDays + ' ngày';
        }

        messageText += (index + 1) + '. **Khoản gửi:** ' + formattedAmount + '\n';
        messageText += '   - Lãi suất: ' + item.rate + '%\n';
        messageText += '   - Ngày đáo hạn: ' + item.maturityAt + ' (' + statusText + ')\n';
        messageText += '   - ID: `' + item.id + '`\n\n';
      });

      messageText += 'Vui lòng mở Save Manager để thực hiện cập nhật hoặc tái tục các khoản gửi này.';

      var properties = PropertiesService.getScriptProperties();
      var miniAppUrl = properties.getProperty(PROP_MINI_APP_URL) || '';

      var replyPayload = {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '📊 Mở Save Manager',
            web_app: { url: miniAppUrl }
          }]]
        }
      };

      var response = TelegramService.sendApi('sendMessage', replyPayload);
      Logger.log('Đã gửi cảnh báo tới chat ID ' + chatId + '. Response: ' + (response && typeof response.getContentText === 'function' ? response.getContentText() : JSON.stringify(response)));
    }

    Logger.log('Hoàn thành quét đáo hạn.');
  }
}
