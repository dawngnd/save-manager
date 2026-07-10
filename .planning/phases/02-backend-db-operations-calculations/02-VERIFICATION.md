---
phase: 02-backend-db-operations-calculations
verified: 2026-07-10T09:47:00+07:00
status: passed
score: 10/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 2: Backend DB Operations & Calculations Verification Report

**Phase Goal:** Develop server-side GAS operations for adding deposits and reading user data with concurrency guards and interest calculation.
**Verified:** 2026-07-10T09:47:00+07:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Hàm `parseDateString` phân tích chính xác chuỗi ngày DD/MM/YYYY thành ngày local nửa đêm (00:00:00) tại múi giờ Việt Nam, độc lập với múi giờ chạy script. | ✓ VERIFIED | Kiểm thử trong `Tests.js#testParseDateString` thành công và spot-check trả về đúng `2026-08-14T17:00:00.000Z` (local midnight GMT+7). |
| 2   | Hàm `calculateDaysDifference` tính chính xác số ngày chênh lệch thực tế giữa hai ngày. | ✓ VERIFIED | Kiểm thử thành công trong `testCalculateDaysDifference` trên năm thường (365 ngày) và năm nhuận 2028 (2 ngày). |
| 3   | Hàm `executeAddDeposit` tự động tính `expected_interest` đúng theo công thức của dự án và làm tròn thành tiền VND. | ✓ VERIFIED | Được xác minh qua `testExpectedInterestCalculation` với việc làm tròn chính xác tiền lẻ VND (ví dụ: `308219.17` thành `308219` VND). |
| 4   | Hàm `executeGetDeposits` lọc và trả về đúng danh sách các khoản gửi của user dựa trên `username_bankcode`. | ✓ VERIFIED | Xác thực qua `testExecuteGetDeposits`, lọc và trả về đúng 1 khoản gửi của `user1_vcb` từ dữ liệu giả lập. |
| 5   | Hàm `executeRolloverDeposit` cập nhật trạng thái khoản cũ thành `rolled_over` và tạo khoản mới chính xác. | ✓ VERIFIED | Kiểm thử tích hợp trong `testExecuteRolloverDeposit` xác nhận thay đổi trạng thái của dòng cũ và thêm dòng mới hoạt động (`active`) thành công. |
| 6   | Bộ test nội bộ trong `backend/Tests.js` chạy thành công tất cả các test case khi được chạy bằng Node.js. | ✓ VERIFIED | Chạy lệnh kiểm thử đơn vị thành công trên local, ghi nhận kết quả `"=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ==="`. |
| 7   | Hàm `doPost` định tuyến chính xác các action: `get_deposits`, `add_deposit`, và `rollover_deposit`. | ✓ VERIFIED | Xác thực qua bộ mock `testDoPostRouting()` với các payload tương ứng và xử lý đúng định tuyến. |
| 8   | Cơ chế `LockService` bảo vệ các action ghi (`add_deposit`, `rollover_deposit`) với `lock.tryLock(10000)` và giải phóng lock an toàn trong khối `finally`. | ✓ VERIFIED | Kiểm thử trong `testLockServiceBehavior()` chứng minh lock được kích hoạt khi ghi, giải phóng khi kết thúc (kể cả khi gặp lỗi nghiệp vụ). |
| 9   | Khi `LockService` timeout (10s), trả về thông báo lỗi dạng JSON với status: `error` và thông điệp Hệ thống đang bận. | ✓ VERIFIED | Xác thực qua `testLockServiceBehavior()` ở chế độ lock thất bại, trả về phản hồi lỗi `"Hệ thống đang bận, vui lòng thử lại."`. |
| 10  | Endpoint `doPost` trả về đúng định dạng JSON MimeType. | ✓ VERIFIED | Hàm helper `buildJsonResponse` gọi `ContentService.createTextOutput` và gán đúng MimeType.JSON. |

**Score:** 10/10 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `backend/Code.js` | Triển khai các hàm nghiệp vụ, định tuyến `doPost` và cơ chế lock | ✓ VERIFIED | Tệp tin đầy đủ (433 dòng), triển khai chi tiết các hàm nghiệp vụ, parse ngày tháng, tính lãi suất và định tuyến POST request. |
| `backend/Tests.js` | Bộ kiểm thử đơn vị và tích hợp chạy trên môi trường Node.js | ✓ VERIFIED | Tệp tin đầy đủ (396 dòng), chứa bộ mock database/Spreadsheet và 8 bài kiểm thử bao phủ toàn bộ chức năng. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `backend/Tests.js` | `backend/Code.js` | Tham chiếu và kiểm thử trực tiếp các hàm logic trong `Code.js` | ✓ VERIFIED | Test suite thực thi trực tiếp trên `Code.js` bằng cách load và eval, chạy thành công 100%. |
| `doPost` | `handleWriteActionWithLock` / Nghiệp vụ | Liên kết `doPost` đến hàm quản lý lock và nghiệp vụ | ✓ VERIFIED | `doPost` định tuyến các hành động ghi đến `handleWriteActionWithLock` để bọc lock an toàn. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `backend/Code.js` | Dữ liệu các khoản gửi (deposits) | Google Sheets (sheet Deposits & Users) | Có | ✓ FLOWING | Dữ liệu được đọc từ sheet Deposits và lọc theo `username_bankcode`, thêm/tái tục được cập nhật trực tiếp qua `appendRow` và `setValue`. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Thực thi toàn bộ unit test suite | `node -e "..."` (chạy Tests.js) | `=== TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG ===` | ✓ PASS |
| Kiểm tra parseDateString và tính toán ngày | `node -e "..."` (thử trực tiếp Code.js) | `Parsed: 2026-08-14T17:00:00.000Z`, `Days difference: 365` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| **DB-02** | `02-02-PLAN.md` | Triển khai cơ chế khóa ghi bằng LockService trên GAS để tránh tranh chấp dữ liệu khi ghi đồng thời. | ✓ SATISFIED | Tích hợp Script Lock trong `handleWriteActionWithLock` với timeout 10 giây và đảm bảo giải phóng trong khối `finally`. |
| **API-01** | `02-01-PLAN.md`, `02-02-PLAN.md` | Cung cấp API endpoint (`doPost`) nhận định dạng JSON để xử lý các yêu cầu từ Frontend (get, add, rollover). | ✓ SATISFIED | Định tuyến thành công qua action trong payload của `doPost` và gọi đúng hàm xử lý nghiệp vụ tương ứng. |
| **API-02** | `02-01-PLAN.md` | Tự động tính toán tiền lãi dự tính (`expected_interest`) khi thêm mới hoặc tái tục. | ✓ SATISFIED | Tính toán chính xác theo công thức làm tròn VND trong `executeAddDeposit` và `executeRolloverDeposit`. |

### Anti-Patterns Found

Không tìm thấy mẫu mã nguồn kém (stubs, debt markers, placeholder, ...) trong các file nguồn `backend/Code.js` và `backend/Tests.js`.

### Human Verification Required

Không yêu cầu kiểm tra thủ công (Tất cả logic đã được tự động kiểm thử cục bộ thành công).

### Gaps Summary

Tất cả các mục tiêu của Phase 2 đã hoàn thành xuất sắc và không phát hiện lỗ hổng hay lỗi triển khai nào.

---
_Verified: 2026-07-10T09:47:00+07:00_
_Verifier: the agent (gsd-verifier)_
