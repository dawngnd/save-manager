---
status: testing
phase: 04-frontend-ui-twa-auth
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: "2026-07-10T16:57:00+07:00"
updated: "2026-07-10T16:57:00+07:00"
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Chạy `cd frontend && npm run build` từ đầu. Build hoàn tất không lỗi.
  Thư mục `dist/` chỉ chứa đúng 1 file `index.html` duy nhất (không có file JS/CSS riêng lẻ).
  Chạy `npm run dev` — dev server khởi động thành công, không lỗi TypeScript hay Tailwind.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Chạy `cd frontend && npm run build` từ đầu. Build hoàn tất không lỗi. Thư mục `dist/` chỉ chứa đúng 1 file `index.html` duy nhất. Chạy `npm run dev` — dev server khởi động thành công.
result: pass
source: automated

### 2. Single-File Bundle Verification
expected: Sau khi build, file `dist/index.html` chứa toàn bộ CSS và JS inline bên trong — không có thẻ `<link>` hay `<script src>` trỏ tới file ngoài.
result: pass
source: automated

### 3. GitHub Actions CI/CD Workflow
expected: File `.github/workflows/deploy.yml` tồn tại, cấu hình đúng trigger on push to main với path filter `frontend/`, dùng `JamesIves/github-pages-deploy-action@v4`.
result: pass
source: automated

### 4. Backend HMAC Verification
expected: Backend `Code.js` chứa hàm `verifyTelegramWebAppData` thực hiện xác thực HMAC-SHA256 và kiểm tra thời hạn 24h cho `auth_date`.
result: pass
source: automated

### 5. User Account Selector
expected: Mở app trong Telegram (hoặc mock mode trên browser). Dropdown hiện danh sách `username_bankcode` từ sheet Users. Chọn tài khoản → chuyển sang màn hình chính hiện danh sách khoản gửi.
result: [pending]

### 6. Deposit List Filter
expected: Danh sách chỉ hiện các khoản gửi active/matured có ngày đáo hạn còn ≤ 3 ngày hoặc đã quá hạn. Sắp xếp theo ngày đáo hạn gần nhất lên đầu. Các khoản còn xa hoặc đã rolled_over không xuất hiện.
result: [pending]

### 7. Deposit Card & Detail Bottom Sheet
expected: Mỗi khoản gửi hiện dạng card compact (số tiền VND, lãi suất %, ngày đáo hạn, trạng thái). Nhấn vào card → bottom sheet trượt lên hiện chi tiết đầy đủ (ID, gốc, lãi suất, trạng thái, lãi dự kiến, ngày tạo, ngày đáo hạn, số ngày gửi).
result: [pending]

### 8. Add Deposit — FAB & Date Mask
expected: Nút FAB "+" nổi góc dưới phải. Nhấn → bottom sheet form mở. Nhập ngày tự động format DD/MM/YYYY khi gõ (ví dụ gõ "01072026" → hiện "01/07/2026"). Không dùng datepicker.
result: [pending]

### 9. Add Deposit — Inline Validation
expected: Khi blur khỏi field: số tiền ≤ 0 hiện lỗi đỏ, lãi suất < 0 hiện lỗi đỏ, ngày không hợp lệ hiện lỗi, ngày đáo hạn trước ngày tạo hiện lỗi. Mỗi lỗi hiện ngay dưới field tương ứng.
result: [pending]

### 10. Add Deposit — Interest Preview
expected: Khi nhập đủ số tiền + lãi suất + ngày tạo + ngày đáo hạn hợp lệ → hiện preview số ngày gửi thực tế và tiền lãi dự kiến realtime ngay trước nút submit.
result: [pending]

### 11. Add Deposit — Post-Submit Behavior
expected: Submit thành công → toast thông báo hiện, form giữ mở để nhập tiếp, danh sách phía sau tự động refresh hiện khoản mới vừa thêm.
result: [pending]

## Summary

total: 11
passed: 4
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps

[none yet]
