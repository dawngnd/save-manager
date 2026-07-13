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
   * Khởi tạo các sheet Users và Deposits với header tương ứng nếu chưa tồn tại.
   * @returns {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}}
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

    // Khởi tạo sheet Deposits
    let depositsSheet = ss.getSheetByName(SHEET_DEPOSITS);
    if (!depositsSheet) {
      depositsSheet = ss.insertSheet(SHEET_DEPOSITS);
    }
    if (depositsSheet.getLastRow() === 0 || SheetManager.isHeaderEmpty(depositsSheet, DEPOSITS_HEADERS.length)) {
      depositsSheet.getRange(HEADER_ROW, 1, 1, DEPOSITS_HEADERS.length).setValues([DEPOSITS_HEADERS]);
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
  static isHeaderEmpty(sheet, numCols) {
    const values = sheet.getRange(HEADER_ROW, 1, 1, numCols).getValues()[0];
    return values.every(function(val) { return val === '' || val === null || val === undefined; });
  }
}
