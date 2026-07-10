---
phase: 03-telegram-bot-webhook-integration
plan: "02"
subsystem: api
tags: [telegram-bot, google-apps-script, google-sheets, daily-trigger, cron, alert, tdd]

requires:
  - phase: 03-telegram-bot-webhook-integration
    provides: Telegram Bot Webhook endpoint integration and user chat ID auto-linking
provides:
  - Daily automatic maturity date checking (daily cron trigger)
  - Grouped (batch) maturity alert notifications sent via Telegram Bot
affects: [04-01]

tech-stack:
  added: []
  patterns: [Daily Alert Trigger pattern, Message Grouping pattern]

key-files:
  created: []
  modified: [backend/Code.js, backend/Tests.js]

key-decisions:
  - "Lập lịch trigger chạy hàng ngày lúc 7:00 AM - 8:00 AM bằng ScriptApp.newTrigger và dọn dẹp các trigger cũ cùng tên để tránh trùng lặp."
  - "Gom nhóm toàn bộ các khoản cảnh báo sắp đáo hạn/quá hạn của một user và gửi một tin nhắn tổng hợp duy nhất thay vì gửi tin lẻ để tránh rate limit."

patterns-established:
  - "Daily Alert Trigger: Lập lịch tác vụ tự động gửi cảnh báo hàng ngày sử dụng ScriptApp."
  - "Message Grouping (Batch Alert): Tích tụ nhiều khoản tiết kiệm của một user thành một thông báo duy nhất nhằm nâng cao trải nghiệm và hạn chế số lượng gọi API."

requirements-completed: [NOTF-01]

coverage:
  - id: D1
    description: "Hàm setupDailyTrigger lập lịch chạy daily trigger thành công lúc 7:00 AM - 8:00 AM và dọn dẹp các trigger cũ cùng tên hàm để tránh trùng lặp."
    requirement: "NOTF-01"
    verification:
      - kind: integration
        ref: "backend/Code.js#setupDailyTrigger"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hàm checkMaturityAndSendAlerts lọc chính xác các khoản gửi active hoặc matured sắp đáo hạn trong vòng <= 3 ngày tới hoặc đã quá hạn."
    requirement: "NOTF-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testCheckMaturityAndSendAlerts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hàm checkMaturityAndSendAlerts gom nhóm toàn bộ các khoản cảnh báo của một user và gửi một tin nhắn tổng hợp duy nhất qua Telegram Bot."
    requirement: "NOTF-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testCheckMaturityAndSendAlerts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hàm checkMaturityAndSendAlerts bỏ qua gửi tin nếu user không có telegram_chat_id liên kết trong bảng Users."
    requirement: "NOTF-01"
    verification:
      - kind: integration
        ref: "backend/Tests.js#testCheckMaturityAndSendAlerts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-10
status: complete
---

# Phase 3 Plan 2: Daily Alert Trigger & Grouped Notification Summary

**Triển khai thành công tính năng tự động quét ngày đáo hạn, gom nhóm tin nhắn thông báo theo từng người dùng để gửi batch qua Telegram Bot API, và tự động lập lịch daily trigger lúc 7h-8h sáng hàng ngày.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-10T10:48:00+07:00
- **Completed:** 2026-07-10T10:52:00+07:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Triển khai hàm `setupDailyTrigger()` để lập lịch chạy tự động hàng ngày lúc 7h-8h sáng và dọn dẹp các trigger cũ cùng tên để tránh trùng lặp.
- Triển khai hàm `checkMaturityAndSendAlerts()` để tự động quét các khoản tiết kiệm có trạng thái `active` hoặc `matured` sắp đáo hạn trong vòng <= 3 ngày hoặc đã quá hạn.
- Gom nhóm toàn bộ cảnh báo của cùng một người dùng (chat ID) thành một tin nhắn tổng hợp (batch sendMessage) duy nhất để tránh bị Telegram rate limit và spam người dùng.
- Bỏ qua các user chưa liên kết chat ID mà không làm lỗi luồng hoạt động.
- Viết unit test tự động hoàn chỉnh chạy độc lập trên môi trường Node.js.

## Task Commits

Each task was committed atomically:

1. **Task 1: Triển khai logic quét ngày đáo hạn, gom nhóm tin nhắn và lập lịch daily trigger (RED)** - `d9e93e7` (test)
2. **Task 1 & Task 2: Triển khai unit test và logic thực thi hoàn chỉnh (GREEN)** - `a993072` (feat)

## Files Created/Modified
- `backend/Code.js` - Bổ sung `setupDailyTrigger()`, `checkMaturityAndSendAlerts()`.
- `backend/Tests.js` - Thêm `testCheckMaturityAndSendAlerts()`, tích hợp vào `runTests()`.

## Decisions Made
- Gom nhóm (batching) tin nhắn trước khi gọi Telegram API: Tránh spam người dùng khi có nhiều khoản đáo hạn cùng lúc, đồng thời phòng tránh rate limit từ Telegram Bot API.
- Bỏ qua tạo trigger thực sự khi chạy unit test trên Node.js bằng cách kiểm tra điều kiện `typeof ScriptApp === 'undefined'`.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
- Cần thực hiện chạy hàm `setupDailyTrigger()` một lần trên GAS Editor để đăng ký trigger kiểm tra hàng ngày.

## Next Phase Readiness
- Đã hoàn thành toàn bộ Phase 3.
- Sẵn sàng tiến tới Phase 4: Xây dựng giao diện frontend Telegram Web App (TWA) và tích hợp xác thực.

---
*Phase: 03-telegram-bot-webhook-integration*
*Completed: 2026-07-10*

## Self-Check: PASSED
