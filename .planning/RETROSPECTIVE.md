# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-07-14
**Phases:** 5 | **Plans:** 11 | **Sessions:** 12

### What Was Built
- **Database (Google Sheets):** Thiết lập cấu trúc tự động 2 bảng `Users` và `Deposits` với múi giờ Asia/Ho_Chi_Minh.
- **Backend (Apps Script):** Tích hợp doPost JSON API controller, expected interest calculation, và khóa ghi LockService tránh race conditions.
- **Telegram Bot webhook:** Đăng ký webhook Bot, token auth qua query parameter, và trigger quét đáo hạn tự động 7h-8h sáng hàng ngày (batch alert).
- **Frontend SPA (TWA):** Giao diện React SPA đóng gói single-file (`vite-plugin-singlefile`) deploy tự động lên GitHub Pages qua GitHub Actions.
- **Charts & Rollover UI:** Tích hợp biểu đồ tăng trưởng step-wise Chart.js và RolloverForm để tái tục tiết kiệm (parent-child lineage).

### What Worked
- **Local Unit Tests (Node.js):** Việc giả lập database (mock sheets) trong Tests.js giúp chạy thử nghiệm backend trên Node.js cực kỳ nhanh chóng mà không cần đẩy code liên tục lên GAS editor, giảm thời gian debug từ vài phút xuống < 1 giây.
- **Single-File Compilation:** Plugin `vite-plugin-singlefile` đóng gói toàn bộ JS/CSS vào index.html rất hiệu quả, giải quyết triệt để giới hạn phục vụ file của Google Apps Script Web App.
- **Date String Format (Plain Text):** Format chuỗi thô `DD/MM/YYYY` giúp tránh hoàn toàn các lỗi lệch múi giờ giữa máy người dùng (GMT+7) và Google server (UTC).

### What Was Inefficient
- **Integration Check Delay:** Giao diện `UserSelector.tsx` bị cô lập và auto-link Chat ID bị lỗi do thiếu kiểm thử liên thông (E2E) giữa frontend và backend ngay tại thời điểm hoàn thành Phase 4, khiến lỗi chỉ được phát hiện khi chạy audit cuối milestone.
- **Dropdown Onboarding Deadlock:** Việc thiết kế dropdown bankcode trong `DepositForm` mà không có phương án nhập tay ngân hàng mới khiến người dùng mới bị kẹt (deadlock) khi mở app lần đầu nếu database trống.

### Patterns Established
- **Single doPost Action Routing:** Định tuyến API tập trung qua payload `{ action: '...' }` giúp code backend GAS gọn gàng.
- **Lock-protected Writes:** Bọc các tác vụ ghi trong khối `try-catch-finally` cùng LockService để giải phóng lock an toàn 100%.
- **Canvas-ref Chart.js Lifecycle:** Đăng ký thủ công Chart.js và gọi `chartInstance.destroy()` khi unmount để tránh rò rỉ bộ nhớ trong React.

### Key Lessons
1. **Liên tục kiểm thử E2E:** Không chỉ kiểm tra riêng rẽ frontend/backend mà cần chạy các luồng E2E tích hợp (như chọn user -> load list -> thêm khoản mới) ngay khi hoàn thành phase liên quan.
2. **Thiết kế form thân thiện với dữ liệu trống:** Các trường dữ liệu dạng dropdown lấy từ database cần có phương án dự phòng (cho phép gõ tay/thêm mới) để tránh lỗi deadlock khi onboard người dùng mới.

### Cost Observations
- Model mix: 100% Gemini 3.5 Flash (Adaptive effort)
- Sessions: 12 sessions
- Notable: Sử dụng local test runner giúp tiết kiệm đáng kể chi phí token gọi AI đẩy code lên GAS.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 12 | 5 | Khởi tạo baseline mono-repo, đóng gói single-file SPA và mock testing. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 8 | 90% | 0 |

### Top Lessons (Verified Across Milestones)

1. Lưu ngày dạng chuỗi thô `DD/MM/YYYY` trên Google Sheets để triệt tiêu lỗi múi giờ.
2. Luôn bọc lock ghi và release trong khối `finally` để tránh deadlock hệ thống Google Sheets.
