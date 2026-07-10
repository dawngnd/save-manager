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
