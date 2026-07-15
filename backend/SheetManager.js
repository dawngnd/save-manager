/**
 * SheetManager.js — Quản lý kết nối Spreadsheet và khởi tạo cấu trúc sheets.
 */

class SheetManager {
  /**
   * Lấy đối tượng Spreadsheet dựa trên SPREADSHEET_ID cấu hình trong Script Properties.
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  static getSpreadsheet() {
    const properties = PropertiesService.getScriptProperties();
    const ssId = properties.getProperty(PROP_SPREADSHEET_ID);
    if (!ssId) {
      throw new Error('SPREADSHEET_ID not configured in Script Properties');
    }
    return SpreadsheetApp.openById(ssId);
  }

  /**
   * Khởi tạo các sheet Users, Deposits và Gold với header tương ứng nếu chưa tồn tại.
   * @returns {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet, gold: GoogleAppsScript.Spreadsheet.Sheet}}
   */
  static initializeSheets() {
    const ss = SheetManager.getSpreadsheet();

    // Khởi tạo sheet Users
    let usersSheet = ss.getSheetByName(SHEET_USERS);
    if (!usersSheet) {
      usersSheet = ss.insertSheet(SHEET_USERS);
    }
    if (usersSheet.getLastRow() === 0 || SheetManager.isHeaderEmpty(usersSheet, USERS_HEADERS.length)) {
      usersSheet.getRange(HEADER_ROW, 1, 1, USERS_HEADERS.length).setValues([USERS_HEADERS]);
    }

    // Seed bản ghi vàng mặc định nếu chưa có
    SheetManager.seedGoldUsers(usersSheet);

    // Khởi tạo sheet Deposits
    let depositsSheet = ss.getSheetByName(SHEET_DEPOSITS);
    if (!depositsSheet) {
      depositsSheet = ss.insertSheet(SHEET_DEPOSITS);
    }
    if (depositsSheet.getLastRow() === 0 || SheetManager.isHeaderEmpty(depositsSheet, DEPOSITS_HEADERS.length)) {
      depositsSheet.getRange(HEADER_ROW, 1, 1, DEPOSITS_HEADERS.length).setValues([DEPOSITS_HEADERS]);
    }

    // Khởi tạo sheet Gold
    let goldSheet = ss.getSheetByName(SHEET_GOLD);
    if (!goldSheet) {
      goldSheet = ss.insertSheet(SHEET_GOLD);
    }
    if (goldSheet.getLastRow() === 0 || SheetManager.isHeaderEmpty(goldSheet, GOLD_HEADERS.length)) {
      goldSheet.getRange(HEADER_ROW, 1, 1, GOLD_HEADERS.length).setValues([GOLD_HEADERS]);
    }

    Logger.log('Initialization of sheets completed successfully.');
    return {
      users: usersSheet,
      deposits: depositsSheet,
      gold: goldSheet
    };
  }

  /**
   * Seed bản ghi vàng mặc định vào bảng Users nếu chưa tồn tại.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
   */
  static seedGoldUsers(usersSheet) {
    const goldUsers = [
      ['Dang-Gold', '', 'gold', 1],
      ['Nam-Gold',  '', 'gold', 0],
    ];

    const lastRow = usersSheet.getLastRow();
    var existingBankcodes = [];
    if (lastRow > HEADER_ROW) {
      const vals = usersSheet.getRange(DATA_START_ROW, 1, lastRow - 1, 1).getValues();
      existingBankcodes = vals.map(function(r) { return r[0]; });
    }

    goldUsers.forEach(function(row) {
      if (existingBankcodes.indexOf(row[0]) === -1) {
        usersSheet.appendRow(row);
        Logger.log('Seeded gold user: ' + row[0]);
      }
    });
  }

  /**
   * Kiểm tra xem hàng đầu tiên (header) của sheet có trống hay không.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {number} numCols
   * @returns {boolean}
   */
  static isHeaderEmpty(sheet, numCols) {
    const values = sheet.getRange(HEADER_ROW, 1, 1, numCols).getValues()[0];
    return values.every(function(val) { return val === '' || val === null || val === undefined; });
  }
}
