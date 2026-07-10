---
phase: 03-telegram-bot-webhook-integration
plan: "01"
subsystem: api
tags: [telegram-bot, google-apps-script, google-sheets, webhook, tdd]

requires:
  - phase: 02-backend-db-operations-calculations
    provides: Backend DB operations and unit test framework
provides:
  - Telegram Bot Webhook endpoint integration
  - Auto user Chat ID linking functionality on get_deposits API call
  - setupWebhook tool function to configure Webhook with Telegram Bot API
affects: [03-02, 04-01]

tech-stack:
  added: []
  patterns: [Webhook Token Authentication pattern, Chat ID auto-linking pattern]

key-files:
  created: []
  modified: [backend/Code.js, backend/Tests.js]

key-decisions:
  - "Sử dụng query parameter token trên URL Webhook để xác thực nguồn gửi từ Telegram do giới hạn không đọc được HTTP headers trên GAS."
  - "Tự động cập nhật telegram_chat_id của user trong bảng Users khi frontend gọi API get_deposits có đính kèm telegram_chat_id."

patterns-established:
  - "Webhook Token Authentication: Kiểm tra tham số token trên query parameter để xác thực webhook."
  - "Chat ID Auto-Linking: Tự động ghi nhận/cập nhật chat ID của người dùng vào cơ sở dữ liệu khi tương tác với Mini App."

requirements-completed: [BOT-01]

coverage:
  - id: D1
    description: "Tích hợp endpoint webhook của Telegram và xác thực bằng token trên query parameter"
    requirement: "BOT-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testDoPostTelegramWebhook"
        status: pass
    human_judgment: false
  - id: D2
    description: "Liên kết tự động Telegram Chat ID của người dùng vào bảng Users"
    requirement: "BOT-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testLinkTelegramChatId"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-10
status: complete
---

# Phase 3 Plan 1: Telegram Webhook Integration & User Link Summary

**Tích hợp thành công Webhook Telegram Bot vào Google Apps Script với cơ chế xác thực Token trên query parameter và tự động liên kết Chat ID của người dùng.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-10T03:44:53Z
- **Completed:** 2026-07-10T03:59:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Cập nhật cấu trúc bảng `Users` có thêm cột `telegram_chat_id` để sẵn sàng lưu thông tin liên kết.
- Triển khai hàm `setupWebhook()` để tự động đăng ký Webhook URL với Telegram Bot API.
- Triển khai xác thực webhook Telegram qua tham số `?token=WEBHOOK_TOKEN` để bù đắp giới hạn thiếu header của Apps Script.
- Xử lý tin nhắn `/start` từ Bot bằng phản hồi Inline Keyboard loại `web_app` trỏ đến `MINI_APP_URL`.
- Tự động liên kết Chat ID của người dùng từ Mini App khi thực hiện API request `get_deposits`.
- Viết bộ unit test TDD bao quát tất cả các trường hợp liên kết Chat ID, xác thực webhook thành công/thất bại, và định tuyến API get_deposits.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cập nhật cấu trúc bảng Users và bổ sung các hàm xử lý Webhook Telegram (RED)** - `95f8295` (test)
2. **Task 1 & Task 2: Triển khai logic Webhook Telegram và liên kết Chat ID (GREEN)** - `2b69330` (feat)

## Files Created/Modified
- `backend/Code.js` - Cập nhật `initializeSheets()`, `doPost()`, `findOrCreateUser()`, triển khai `linkTelegramChatId()`, `setupWebhook()`, `sendTelegramApi()`, `handleTelegramWebhook()`.
- `backend/Tests.js` - Thêm `testLinkTelegramChatId()`, `testDoPostTelegramWebhook()`, tích hợp vào `runTests()`, nâng cấp mock `usersSheetMock`.

## Decisions Made
- Sử dụng query parameter `token` làm khóa xác thực webhook cho Telegram Bot, vì Google Apps Script không cho phép đọc headers HTTP từ bên ngoài trực tiếp trong `doPost(e)`.
- Thực hiện liên kết Chat ID tự động khi Mini App gọi API thay vì bắt buộc người dùng đăng ký thủ công nhằm tối ưu trải nghiệm.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Mock `usersSheetMock` cũ trong `Tests.js` chỉ hỗ trợ một cột duy nhất là `username_bankcode`. Khi thêm cột `telegram_chat_id`, test case `testExecuteAddDeposit` cũ bị lỗi so khớp do mock trả về mảng 1D thay vì 2D. Đã sửa mock `usersSheetMock` và assert trong `testExecuteAddDeposit` để hỗ trợ mảng 2D cho sheet Users, giữ cho toàn bộ hệ thống test cũ/mới chạy hoàn hảo.

## User Setup Required
None - no external service configuration required at this stage.

## Next Phase Readiness
- Hạ tầng bot webhook và liên kết chat ID đã sẵn sàng.
- Sẵn sàng thực hiện Plan 03-02: triển khai Daily Alert Trigger để định kỳ quét đáo hạn và gửi thông báo batch cho người dùng qua Telegram.

---
*Phase: 03-telegram-bot-webhook-integration*
*Completed: 2026-07-10*

## Self-Check: PASSED
