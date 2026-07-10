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
      return usersData.length === 0 ? 0 : usersData.length + 1; // 1-indexed for header
    },
    getRange: function(row, col, numRows, numCols) {
      return {
        getValues: function() {
          // Trả về dữ liệu từ usersData, bỏ qua hàng đầu tiên (giả sử row=2, col=1)
          const result = [];
          for (let i = row - 2; i < row - 2 + numRows; i++) {
            if (usersData[i]) {
              result.push([usersData[i]]);
            }
          }
          return result;
        }
      };
    },
    appendRow: function(rowArray) {
      usersData.push(rowArray[0]);
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
  
  const response = executeGetDeposits(sheets, { action: "get_deposits", username_bankcode: "user1_vcb" });
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
  
  const response = executeAddDeposit(sheets, payload);
  assert(response.status === "success", "Thêm khoản gửi thành công");
  assert(response.data.amount === 10000000, "Số tiền khớp");
  assert(response.data.expected_interest === 600000, "Lãi suất tính toán khớp");
  assert(sheets._rawDeposits.length === 1, "Đã lưu vào sheet");
  assert(sheets._rawUsers.includes("user1_vcb"), "Đã tạo user");
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
  
  const response = executeRolloverDeposit(sheets, payload);
  assert(response.status === "success", "Tái tục thành công");
  assert(response.data.old_deposit.id === "dep-1", "ID cũ khớp");
  assert(response.data.old_deposit.status === "rolled_over", "Trạng thái cũ đổi sang rolled_over");
  assert(sheets._rawDeposits[0][3] === "rolled_over", "Trạng thái dòng cũ trong sheet đổi");
  
  assert(response.data.new_deposit.amount === 12000000, "Số tiền mới khớp");
  assert(response.data.new_deposit.status === "active", "Trạng thái mới hoạt động");
  assert(sheets._rawDeposits.length === 2, "Thêm 1 dòng mới vào sheet");
}
