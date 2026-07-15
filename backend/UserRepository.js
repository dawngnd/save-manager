/**
 * UserRepository.js — CRUD operations cho bảng Users.
 */

class UserRepository {
  /**
   * Tìm hoặc tạo người dùng mới trong bảng Users.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
   * @param {string} usernameBankcode
   * @returns {boolean}
   */
  static findOrCreate(usersSheet, usernameBankcode) {
    var lastRow = usersSheet.getLastRow();
    if (lastRow > HEADER_ROW) {
      var values = usersSheet.getRange(DATA_START_ROW, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][USER_COL_BANKCODE] === usernameBankcode) {
          return true;
        }
      }
    }
    usersSheet.appendRow([usernameBankcode, '']);
    return true;
  }

  /**
   * Liên kết hoặc cập nhật telegram_chat_id cho người dùng.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
   * @param {string} usernameBankcode
   * @param {string|number} telegramChatId
   */
  static linkChatId(usersSheet, usernameBankcode, telegramChatId) {
    if (!usernameBankcode || !telegramChatId) return;

    var lastRow = usersSheet.getLastRow();
    var userRowIndex = -1;

    if (lastRow > HEADER_ROW) {
      var values = usersSheet.getRange(DATA_START_ROW, 1, lastRow - 1, USER_TOTAL_COLUMNS).getValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][USER_COL_BANKCODE] === usernameBankcode) {
          userRowIndex = i + DATA_START_ROW;
          // Nếu chat_id đã khớp thì không cần cập nhật
          if (values[i][USER_COL_CHAT_ID] === telegramChatId || String(values[i][USER_COL_CHAT_ID]) === String(telegramChatId)) {
            return;
          }
          break;
        }
      }
    }

    if (userRowIndex !== -1) {
      // Cập nhật chat ID
      usersSheet.getRange(userRowIndex, USER_SHEET_COL_CHAT_ID).setValue(telegramChatId);
      Logger.log('Đã cập nhật telegram_chat_id cho user: ' + usernameBankcode);
    } else {
      // Tạo mới user và liên kết chat ID
      usersSheet.appendRow([usernameBankcode, telegramChatId]);
      Logger.log('Đã tạo mới user và liên kết chat_id: ' + usernameBankcode);
    }
  }

  /**
   * Lấy danh sách users phục vụ hiển thị dropdown ở Frontend.
   * @param {{users: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @returns {GoogleAppsScript.Content.TextOutput}
   */
  static getAll(sheets) {
    var usersSheet = sheets.users;
    var lastRow = usersSheet.getLastRow();
    var result = [];

    if (lastRow > HEADER_ROW) {
      var values = usersSheet.getRange(DATA_START_ROW, 1, lastRow - 1, USER_TOTAL_COLUMNS).getValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][USER_COL_BANKCODE]) {
          result.push({
            username_bankcode: values[i][USER_COL_BANKCODE],
            telegram_chat_id: values[i][USER_COL_CHAT_ID] || '',
            type: values[i][USER_COL_TYPE] || '',
            statics: values[i][USER_COL_STATICS] !== '' ? Number(values[i][USER_COL_STATICS]) : 1
          });
        }
      }
    }
    return ResponseHelper.json('success', result);
  }

  /**
   * Tạo map tra cứu chat_id từ bảng Users (dùng cho gửi alert batch).
   * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
   * @returns {Object.<string, string>}
   */
  static buildChatIdMap(usersSheet) {
    var userChatMap = {};
    var usersLastRow = usersSheet.getLastRow();
    if (usersLastRow > HEADER_ROW) {
      var usersData = usersSheet.getRange(DATA_START_ROW, 1, usersLastRow - 1, USER_TOTAL_COLUMNS).getValues();
      for (var i = 0; i < usersData.length; i++) {
        var username = usersData[i][USER_COL_BANKCODE];
        var chatId = usersData[i][USER_COL_CHAT_ID];
        if (username && chatId) {
          userChatMap[username] = chatId;
        }
      }
    }
    return userChatMap;
  }
}
