/**
 * DepositRepository.js — CRUD operations và business logic cho bảng Deposits.
 */

class DepositRepository {
  /**
   * Sinh ID ngẫu nhiên cho khoản gửi: dep-{timestamp}-{random}
   * @returns {string}
   */
  static generateId() {
    var randomStr = Math.random().toString(36).substring(2, 8);
    return 'dep-' + Date.now() + '-' + randomStr;
  }

  /**
   * Tính lãi dự kiến.
   * @param {number} amount Số tiền gửi
   * @param {number} interestRate Lãi suất (%/năm)
   * @param {number} days Số ngày gửi
   * @returns {number}
   */
  static calculateExpectedInterest(amount, interestRate, days) {
    return Math.round(amount * (interestRate / 100) * (days / DAYS_IN_YEAR));
  }

  /**
   * Lấy danh sách tất cả khoản gửi.
   * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @param {object} payload
   * @param {string|null} authenticatedChatId
   * @returns {GoogleAppsScript.Content.TextOutput|object}
   */
  static getAll(sheets, payload, authenticatedChatId) {
    var depositsSheet = sheets.deposits;
    var lastRow = depositsSheet.getLastRow();
    var result = [];

    if (lastRow > HEADER_ROW) {
      var values = depositsSheet.getRange(DATA_START_ROW, 1, lastRow - 1, DEP_TOTAL_COLUMNS).getValues();
      for (var i = 0; i < values.length; i++) {
        result.push({
          id: values[i][DEP_COL_ID],
          amount: Number(values[i][DEP_COL_AMOUNT]),
          interest_rate: Number(values[i][DEP_COL_INTEREST_RATE]),
          status: values[i][DEP_COL_STATUS],
          expected_interest: Number(values[i][DEP_COL_EXPECTED_INTEREST]),
          created_at: values[i][DEP_COL_CREATED_AT],
          maturity_at: values[i][DEP_COL_MATURITY_AT],
          user_bankcode: values[i][DEP_COL_USER_BANKCODE],
          parent_id: values[i][DEP_COL_PARENT_ID] || '',
          child_id: values[i][DEP_COL_CHILD_ID] || ''
        });
      }
    }

    return ResponseHelper.json('success', result);
  }

  /**
   * Thêm mới khoản tiết kiệm.
   * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @param {object} payload
   * @returns {GoogleAppsScript.Content.TextOutput|object}
   */
  static add(sheets, payload) {
    var usernameBankcode = payload.username_bankcode;
    var data = payload.data;

    if (!usernameBankcode) {
      throw new Error('Thiếu thông tin username_bankcode.');
    }
    if (!data || data.amount === undefined || data.interest_rate === undefined || !data.created_at || !data.maturity_at) {
      throw new Error('Thiếu dữ liệu khoản gửi mới.');
    }

    var amount = Number(data.amount);
    var interestRate = Number(data.interest_rate);

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Số tiền gửi phải là số dương.');
    }
    if (isNaN(interestRate) || interestRate < 0) {
      throw new Error('Lãi suất gửi phải lớn hơn hoặc bằng 0.');
    }

    // Tính số ngày gửi thực tế dựa trên ngày gửi dạng DD/MM/YYYY
    var days = DateUtils.daysDifference(data.created_at, data.maturity_at);
    var expectedInterest = DepositRepository.calculateExpectedInterest(amount, interestRate, days);

    UserRepository.findOrCreate(sheets.users, usernameBankcode);

    var depositId = DepositRepository.generateId();

    var newRow = [
      depositId, amount, interestRate, STATUS_ACTIVE, expectedInterest,
      data.created_at, data.maturity_at, usernameBankcode,
      '', // parent_id
      ''  // child_id
    ];

    var newLastRow = sheets.deposits.getLastRow() + 1;
    var newRange = sheets.deposits.getRange(newLastRow, 1, 1, DEP_TOTAL_COLUMNS);
    sheets.deposits.getRange(newLastRow, DEP_SHEET_COL_CREATED_AT, 1, 2).setNumberFormat('@');
    newRange.setValues([newRow]);

    return ResponseHelper.json('success', {
      id: depositId,
      amount: amount,
      interest_rate: interestRate,
      status: STATUS_ACTIVE,
      expected_interest: expectedInterest,
      created_at: data.created_at,
      maturity_at: data.maturity_at,
      user_bankcode: usernameBankcode,
      parent_id: '',
      child_id: ''
    });
  }

  /**
   * Tái tục một khoản tiết kiệm.
   * @param {{users: GoogleAppsScript.Spreadsheet.Sheet, deposits: GoogleAppsScript.Spreadsheet.Sheet}} sheets
   * @param {object} payload
   * @param {string|null} authenticatedChatId
   * @returns {GoogleAppsScript.Content.TextOutput|object}
   */
  static rollover(sheets, payload, authenticatedChatId) {
    var oldDepositId = payload.id;
    var newAmount = Number(payload.new_amount);
    var newInterestRate = Number(payload.new_interest_rate);
    var createdAt = payload.created_at;
    var maturityAt = payload.maturity_at;

    if (!oldDepositId) {
      throw new Error('Thiếu ID của khoản gửi cũ cần tái tục.');
    }
    if (isNaN(newAmount) || newAmount <= 0) {
      throw new Error('Số tiền gửi mới phải là số dương.');
    }
    if (isNaN(newInterestRate) || newInterestRate < 0) {
      throw new Error('Lãi suất mới phải lớn hơn hoặc bằng 0.');
    }

    var depositsSheet = sheets.deposits;
    var lastRow = depositsSheet.getLastRow();
    var oldDepositRowIndex = -1;
    var oldDepositData = null;

    if (lastRow > HEADER_ROW) {
      var values = depositsSheet.getRange(DATA_START_ROW, 1, lastRow - 1, DEP_COL_USER_BANKCODE + 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][DEP_COL_ID] === oldDepositId) {
          oldDepositRowIndex = i + DATA_START_ROW; // Offset header và index 0
          oldDepositData = {
            id: values[i][DEP_COL_ID],
            status: values[i][DEP_COL_STATUS],
            user_bankcode: values[i][DEP_COL_USER_BANKCODE]
          };
          break;
        }
      }
    }

    if (oldDepositRowIndex === -1) {
      throw new Error('Không tìm thấy khoản tiết kiệm cũ với ID đã cung cấp.');
    }
    if (oldDepositData.status !== STATUS_ACTIVE) {
      throw new Error('Khoản gửi cũ không ở trạng thái hoạt động (active), không thể tái tục.');
    }

    // Cập nhật trạng thái khoản cũ thành 'rolled_over'
    depositsSheet.getRange(oldDepositRowIndex, DEP_SHEET_COL_STATUS, 1, 1).setValue(STATUS_ROLLED_OVER);

    // Tạo khoản mới
    var newDays = DateUtils.daysDifference(createdAt, maturityAt);
    var newExpectedInterest = DepositRepository.calculateExpectedInterest(newAmount, newInterestRate, newDays);
    var newDepositId = DepositRepository.generateId();

    // Gán child_id cho bản ghi cha
    Logger.log('Rollover: Ghi child_id=' + newDepositId + ' vào row=' + oldDepositRowIndex + ', col=' + DEP_SHEET_COL_CHILD_ID);
    depositsSheet.getRange(oldDepositRowIndex, DEP_SHEET_COL_CHILD_ID, 1, 1).setValue(newDepositId);

    // Flush ngay lập tức để GAS commit thay đổi trước khi ghi dòng mới
    if (typeof SpreadsheetApp !== 'undefined') {
      SpreadsheetApp.flush();
    }

    var newRow = [
      newDepositId, newAmount, newInterestRate, STATUS_ACTIVE, newExpectedInterest,
      createdAt, maturityAt, oldDepositData.user_bankcode,
      oldDepositId, // parent_id
      ''            // child_id (chưa có)
    ];

    var newLastRow = depositsSheet.getLastRow() + 1;
    Logger.log('Rollover: Ghi khoản mới vào row=' + newLastRow);
    var newRange = depositsSheet.getRange(newLastRow, 1, 1, DEP_TOTAL_COLUMNS);
    depositsSheet.getRange(newLastRow, DEP_SHEET_COL_CREATED_AT, 1, 2).setNumberFormat('@');
    newRange.setValues([newRow]);

    // Verify child_id đã được lưu thực sự
    if (typeof SpreadsheetApp !== 'undefined') {
      SpreadsheetApp.flush();
      var savedChildId = depositsSheet.getRange(oldDepositRowIndex, DEP_SHEET_COL_CHILD_ID, 1, 1).getValue();
      Logger.log('Rollover: Verify child_id sau flush = ' + savedChildId);
      if (savedChildId !== newDepositId) {
        Logger.log('⚠️ Rollover: child_id KHÔNG khớp! expected=' + newDepositId + ', got=' + savedChildId);
      }
    }

    return ResponseHelper.json('success', {
      old_deposit: {
        id: oldDepositId,
        status: STATUS_ROLLED_OVER,
        child_id: newDepositId
      },
      new_deposit: {
        id: newDepositId,
        amount: newAmount,
        interest_rate: newInterestRate,
        status: STATUS_ACTIVE,
        expected_interest: newExpectedInterest,
        created_at: createdAt,
        maturity_at: maturityAt,
        user_bankcode: oldDepositData.user_bankcode,
        parent_id: oldDepositId,
        child_id: ''
      }
    });
  }

  /**
   * Migration: Backfill cột child_id dựa trên parent_id đã tồn tại.
   * Chạy MỘT LẦN bằng tay từ Apps Script Editor.
   */
  static migrateChildId() {
    var sheets = SheetManager.initializeSheets();
    var depositsSheet = sheets.deposits;
    var lastRow = depositsSheet.getLastRow();

    if (lastRow <= HEADER_ROW) {
      Logger.log('Không có dữ liệu để migrate.');
      return;
    }

    var values = depositsSheet.getRange(DATA_START_ROW, 1, lastRow - 1, DEP_TOTAL_COLUMNS).getValues();

    // Tạo map id → row index (1-based, offset header)
    var idToRow = {};
    for (var i = 0; i < values.length; i++) {
      idToRow[values[i][DEP_COL_ID]] = i + DATA_START_ROW;
    }

    var migratedCount = 0;

    for (var i = 0; i < values.length; i++) {
      var parentId = values[i][DEP_COL_PARENT_ID];
      var myId = values[i][DEP_COL_ID];

      if (parentId && idToRow[parentId]) {
        var parentRow = idToRow[parentId];
        depositsSheet.getRange(parentRow, DEP_SHEET_COL_CHILD_ID, 1, 1).setValue(myId);
        migratedCount++;
        Logger.log('Migrated: parent ' + parentId + ' → child_id = ' + myId);
      }
    }

    Logger.log('Migration hoàn tất. Đã cập nhật ' + migratedCount + ' bản ghi.');
  }
}
