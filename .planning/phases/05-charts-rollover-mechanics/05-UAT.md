---
status: testing
phase: 05-charts-rollover-mechanics
source:
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
started: 2026-07-10T13:52:10Z
updated: 2026-07-10T13:52:10Z
---

## Current Test

number: 1
name: Details CTA and Prefilling Check
expected: |
  1. Mở ứng dụng và chọn một khoản gửi đã đến hạn hoặc quá hạn (diffDays <= 0).
  2. Xác nhận nút "Tái tục" hiển thị trong panel chi tiết.
  3. Bấm "Tái tục" và kiểm tra Form Tái tục mở ra ở dạng Bottom Sheet, tự động điền các thông tin:
     - Số tiền gốc mới = số tiền cũ.
     - Lãi suất mới = lãi suất cũ.
     - Ngày gửi mới = ngày đáo hạn cũ.
     - Ngày đáo hạn mới = ngày đáo hạn cũ + 1 năm (ví dụ: ngày 29/02/2024 sẽ chuyển thành 28/02/2025).
awaiting: user response

## Tests

### 1. Details CTA and Prefilling Check
expected: |
  1. Chọn khoản gửi đã đến hạn (diffDays <= 0) và thấy nút "Tái tục".
  2. Form Tái tục hiển thị và điền sẵn chính xác thông tin: số tiền gốc cũ, lãi suất cũ, ngày gửi mới là ngày đáo hạn cũ, ngày đáo hạn mới cộng thêm 1 năm (có xử lý năm nhuận).
result: [pending]

### 2. Step-wise Projection Chart Check
expected: |
  1. Mở ứng dụng với tham số "?view=chart" trong URL.
  2. Đồ thị GrowthChart hiển thị ở phía trên cùng màn hình.
  3. Rê chuột hoặc tương tác với các điểm trên đồ thị để kiểm tra các mức tăng trưởng (tính lãi tại ngày đáo hạn của mỗi khoản gửi).
  4. Bấm "Ẩn biểu đồ" để thu gọn và bấm lại để hiển thị đầy đủ.
result: [pending]

### 3. Telegram Bot Command Routing Check
expected: |
  1. Gửi lệnh /chart đến Telegram Bot.
  2. Bot phản hồi tin nhắn kèm nút bấm "📈 Xem biểu đồ".
  3. Bấm vào nút và xác nhận Web App mở trực tiếp tới giao diện có hiển thị biểu đồ GrowthChart.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
