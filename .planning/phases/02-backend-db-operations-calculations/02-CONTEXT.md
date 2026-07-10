# Phase 2: Backend DB Operations & Calculations - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase này phát triển các hàm nghiệp vụ phía server trên Google Apps Script (GAS) để xử lý việc đọc dữ liệu tài khoản, thêm mới các khoản gửi, tính toán lãi suất dự kiến, thực hiện nghiệp vụ tái tục (rollover), và cài đặt cơ chế khóa ghi chống tranh chấp `LockService`.

</domain>

<decisions>
## Implementation Decisions

### API Routing
- **D-01:** Phân Tuyến Yêu Cầu (API Routing) sử dụng duy nhất một thuộc tính `action` trong payload JSON gửi tới `doPost`. Ví dụ:
  - Lấy danh sách: `{ "action": "get_deposits", "username_bankcode": "..." }`
  - Thêm mới: `{ "action": "add_deposit", "username_bankcode": "...", "data": { "amount": 10000000, "interest_rate": 6.2, "created_at": "10/07/2026", "maturity_at": "10/07/2027" } }`
  - Tái tục: `{ "action": "rollover_deposit", "id": "dep-...", "new_amount": 12000000, "new_interest_rate": 5.8, "created_at": "10/07/2027", "maturity_at": "10/07/2028" }`

### Date Format
- **D-02:** Định dạng ngày gửi lên API và lưu trữ trên cơ sở dữ liệu Google Sheet là `DD/MM/YYYY` (ví dụ: `10/07/2026`). Server chịu trách nhiệm tự viết hàm tách chuỗi ngày để tạo đối tượng `Date` và thực hiện các tính toán chênh lệch ngày chính xác (tránh lỗi lệch múi giờ).

### Lock Timeout
- **D-03:** Cài đặt cơ chế khóa ghi bằng `LockService.getScriptLock()` với thời gian chờ tối đa (timeout) là 10 giây (`lock.tryLock(10000)`). Nếu không lấy được khóa, API trả về JSON phản hồi lỗi: `{ "status": "error", "message": "Hệ thống đang bận, vui lòng thử lại." }`.

### the agent's Discretion
- Định nghĩa chi tiết cấu trúc JSON trả về khi thành công hoặc gặp lỗi, cũng như cách thức sinh ID duy nhất cho các khoản tiền gửi (`dep-{timestamp}-{random}`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning Docs
- `.planning/PROJECT.md` — Định nghĩa giá trị cốt lõi, phạm vi và ràng buộc dự án.
- `.planning/REQUIREMENTS.md` — Danh sách yêu cầu chi tiết v1 (DB, API, UI).
- `.planning/research/SUMMARY.md` — Tổng hợp nghiên cứu công nghệ và hướng đi cho lộ trình.
- `.planning/phases/01-db-clasp-project-setup/01-CONTEXT.md` — Các quyết định thiết lập dự án GAS độc lập.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js) — Chứa hàm `getSpreadsheet()` và `initializeSheets()` để kết nối spreadsheet và tạo các sheet nếu chưa tồn tại.

### Established Patterns
- Lưu ngày tháng dạng Plain Text trên Sheet để tránh lệch múi giờ.

### Integration Points
- Mã nguồn mới sẽ được bổ sung trực tiếp vào [backend/Code.js](file:///home/dangnd/code/github/save-manager/backend/Code.js) bên dưới các hàm khởi tạo hiện tại.

</code_context>

<specifics>
## Specific Ideas

- Người dùng yêu cầu sử dụng định dạng ngày là `DD/MM/YYYY` cho cả giao diện, API và lưu trữ cơ sở dữ liệu.
- Tính toán tiền lãi dự tính trên server bằng công thức: `expected_interest = amount * (interest_rate / 100) * (days / 365)`. Trong đó, `days` là số ngày chênh lệch thực tế giữa ngày đáo hạn và ngày tạo (được tính bằng cách parse ngày `DD/MM/YYYY` thành các mốc thời gian UTC/local tương ứng).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-Backend DB Operations & Calculations*
*Context gathered: 2026-07-10*
