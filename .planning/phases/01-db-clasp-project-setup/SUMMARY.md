---
phase: 01-db-clasp-project-setup
plan: 01-01
subsystem: database
tags: [google-apps-script, google-sheets]

requires:
  - phase: none
    provides: none
provides:
  - "Google Sheets database schema structures (Users & Deposits)"
  - "Google Apps Script configuration manifest (appsscript.json)"
  - "Auto database initialization script (Code.js)"
  - "Manual installation instructions (SETUP.md)"
affects:
  - 01-02
  - 02-01

tech-stack:
  added:
    - google-apps-script
  patterns:
    - dynamic-sheet-initialization
    - script-properties-relocation

key-files:
  created:
    - backend/appsscript.json
    - backend/Code.js
    - backend/SETUP.md
  modified: []

key-decisions:
  - "Use Script Properties to hold SPREADSHEET_ID instead of hardcoding to allow relocation"
  - "Set timeZone independently in both appsscript.json and Google Sheet to GMT+07:00"

patterns-established:
  - "Startup initialization for sheets and missing headers automatically"

requirements-completed:
  - DB-01
  - API-03

coverage:
  - id: D1
    description: "Create backend/appsscript.json manifest file with timezone, V8 runtime, and Web App execution config"
    requirement: "API-03"
    verification:
      - kind: manual_procedural
        ref: "jq '.' backend/appsscript.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "Implement Code.js database methods: getSpreadsheet and initializeSheets"
    requirement: "DB-01"
    verification:
      - kind: manual_procedural
        ref: "grep verification checks on backend/Code.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "Create SETUP.md manual setup guide"
    verification:
      - kind: manual_procedural
        ref: "grep verification checks on backend/SETUP.md"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-10
status: complete
---

# Phase 01: DB & clasp Project Setup - Plan 01-01 Summary

**Google Sheets database schema setup, appsscript.json configurations with Asia/Ho_Chi_Minh timezone, and SETUP.md installation guide**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-10T09:01:00+07:00
- **Completed:** 2026-07-10T09:01:30+07:00
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- **appsscript.json configured:** Thiết lập file manifest `backend/appsscript.json` với múi giờ `Asia/Ho_Chi_Minh` (GMT+07:00), V8 runtime, và phân quyền thực thi Web App cho bất kỳ ai (ANYONE) chạy dưới danh nghĩa người triển khai (USER_DEPLOYING).
- **Code.js database logic written:** Hiện thực hàm `getSpreadsheet()` để đọc mã `SPREADSHEET_ID` an toàn từ Script Properties của dự án GAS và hàm `initializeSheets()` để tự động kiểm tra và tạo 2 sheet: `Users` (header: `username_bankcode`) và `Deposits` (8 cột headers đúng thiết kế) nếu chưa có hoặc rỗng.
- **SETUP.md instructions drafted:** Hướng dẫn từng bước cách tạo Google Sheets, cấu hình múi giờ (Timezone), lấy ID bảng tính và thiết lập Script Properties thủ công.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tạo file appsscript.json với cấu hình timezone, runtime, và webapp** - `2b27092` (feat)
2. **Task 2: Tạo Code.js với getSpreadsheet() helper và initializeSheets() function** - `c44e62d` (feat)
3. **Task 3: Tạo tài liệu hướng dẫn thiết lập thủ công Google Sheet và Script Properties** - `d8bcc2a` (docs)

## Files Created/Modified
- `backend/appsscript.json` - File manifest cấu hình cho Apps Script
- `backend/Code.js` - Logic kết nối spreadsheet và tạo cấu trúc bảng tự động
- `backend/SETUP.md` - Hướng dẫn đồng bộ timezone và cấu hình thủ công

## Decisions Made
- Sử dụng Script Properties để lưu `SPREADSHEET_ID` nhằm tránh việc fix cứng ID trong mã nguồn, tăng tính bảo mật và thuận tiện cho việc nhân bản/chia sẻ mã nguồn.
- Thiết lập múi giờ độc lập trên cả file manifest và thiết lập của Google Sheet để đảm bảo ngày giờ được xử lý thống nhất (GMT+07).

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
**External services require manual configuration.** See [backend/SETUP.md](./SETUP.md) for:
- Tạo Google Sheet và copy Spreadsheet ID.
- Cấu hình múi giờ GMT+07 cho Google Sheet.
- Thêm thuộc tính `SPREADSHEET_ID` vào mục Script Properties của GAS Project Settings.
- Chạy hàm `initializeSheets()` trên GAS editor để tự động tạo cấu trúc các sheet.

## Next Phase Readiness
- Database schema và các cấu hình múi giờ, quyền chạy của Web App đã được khởi tạo thành công.
- Đã sẵn sàng thực hiện Plan 01-02 để cấu hình clasp đồng bộ mã nguồn cục bộ và kiểm tra API endpoint `doGet` cơ bản.
