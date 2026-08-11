# Roadmap: Save Manager

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-07-14)
- 🚧 **v2.0 Polish & Analytics** — Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-07-14</summary>

- [x] **Phase 1: DB & clasp Project Setup** - Setup Google Sheets database schema and local clasp synchronization. (completed 2026-07-10)
- [x] **Phase 2: Backend DB Operations & Calculations** - Build backend CRUD functions, LockService guards, and expected interest calculations. (completed 2026-07-10)
- [x] **Phase 3: Telegram Bot Webhook Integration** - Connect Telegram Bot API webhooks and set up daily maturity alerts cron job. (completed 2026-07-10)
- [x] **Phase 4: Frontend UI (TWA) & Auth** - Create the single-file Vite/TS/Tailwind SPA with Telegram Apps SDK integration and deposit forms. (completed 2026-07-10)
- [x] **Phase 5: Charts & Rollover Mechanics** - Build growth projection timeseries chart and execute rollover transaction workflow. (completed 2026-07-10)

</details>

### 🚧 v2.0 Polish & Analytics (Phases 6-8)

- [ ] **Phase 6: Security & Whitelist Authentication** - Xác thực HMAC-SHA256 trên GAS backend, kiểm tra auth_date 24h, whitelist chat_id trong GAS Script Properties và hỗ trợ Mock Auth dev mode.
- [ ] **Phase 7: Portfolio Analytics & Asset Metrics** - Biểu đồ Doughnut phân bổ tài sản theo ngân hàng/kỳ hạn và thẻ chỉ số lãi suất trung bình gia quyền (WAIR).
- [ ] **Phase 8: Deposit Lineage Tree & History** - Duyệt phả hệ 2 chiều khoản gửi tái tục, hiển thị sơ đồ cây timeline tree UI và tổng lãi tích lũy/hệ số tăng trưởng.

---

## Phase Details

### Phase 6: Security & Whitelist Authentication
- **Goal**: Bảo mật REST API bằng xác thực HMAC-SHA256 trên GAS backend, chống replay attack qua auth_date 24h, kiểm tra chat_id thuộc whitelist cấu hình trong GAS Script Properties, và duy trì Mock Auth cho môi trường dev desktop. Sau auth, load toàn bộ deposits không phân quyền theo bankcode.
- **Requirements**: `AUTH-02`, `AUTH-03`, `AUTH-04`, `AUTH-05`
- **Success Criteria**:
  1. Người dùng truy cập ứng dụng qua Telegram Web App được xác thực chữ ký HMAC-SHA256 hợp lệ ở backend GAS trước khi thực hiện các yêu cầu đọc/ghi dữ liệu.
  2. Request chứa `auth_date` hết hạn (>24 giờ) bị từ chối với thông báo lỗi rõ ràng nhằm phòng chống tấn công phát lại (replay attack).
  3. Lập trình viên chạy ứng dụng ở chế độ local dev (`npm run dev`) trên trình duyệt desktop tự động chuyển đổi sang Mock Auth mà không bị gián đoạn hay cần giả lập HMAC.
  4. Chat_id không thuộc whitelist trong GAS Script Properties bị reject với lỗi unauthorized — chỉ chat_id được cấu hình mới truy cập được.

### Phase 7: Portfolio Analytics & Asset Metrics
- **Goal**: Cung cấp bức tranh tổng quan phân bổ danh mục tiết kiệm active theo ngân hàng, nhóm kỳ hạn và đo lường chỉ số lãi suất trung bình gia quyền (WAIR).
- **Requirements**: `STAT-02`, `STAT-03`, `STAT-04`
- **Success Criteria**:
  1. Người dùng xem được biểu đồ Doughnut trực quan hiển thị tỷ trọng phân bổ tổng tài sản tiết kiệm active theo từng ngân hàng.
  2. Người dùng xem được biểu đồ Doughnut phân bổ tài sản active theo các bucket kỳ hạn (<3 tháng, 3-6 tháng, 6-12 tháng, >12 tháng).
  3. Người dùng quan sát được thẻ KPI hiển thị chính xác chỉ số Lãi suất trung bình gia quyền (WAIR - Weighted Average Interest Rate) cho toàn bộ danh mục tiết kiệm đang hoạt động.
  4. Biểu đồ Chart.js tự động giải phóng tài nguyên (destroy canvas) khi unmount và tương thích tốt với giao diện Sáng/Tối (Light/Dark mode) của Telegram.

### Phase 8: Deposit Lineage Tree & History
- **Goal**: Trực quan hóa lịch sử dòng tiền qua các chu kỳ tái tục (Rollover), dựng sơ đồ phả hệ cây 2 chiều và đo lường tổng tiền lãi tích lũy cùng hệ số tăng trưởng qua thời gian.
- **Requirements**: `HIST-01`, `HIST-02`, `HIST-03`
- **Success Criteria**:
  1. Người dùng nhấn nút "Xem phả hệ" trên thẻ khoản gửi và mở được modal hiển thị toàn bộ chuỗi tái tục 2 chiều (`parent_id` ↔ `child_id`) từ khoản gốc ban đầu đến khoản hiện tại.
  2. Sơ đồ cây (lineage tree) hiển thị dưới dạng timeline trực quan bằng CSS/SVG nhẹ, bảo vệ hệ thống khỏi vòng lặp vô hạn khi dữ liệu bị lỗi/chu trình.
  3. Người dùng xem được tổng tiền lãi tích lũy qua tất cả các kỳ tái tục và hệ số tăng trưởng tài sản (ví dụ: x1.15) so với khoản gửi ban đầu.

---

## Progress

Execution Order:
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. DB & clasp Project Setup | v1.0 | 2/2 | Complete | 2026-07-10 |
| 2. Backend DB Operations & Calculations | v1.0 | 2/2 | Complete | 2026-07-10 |
| 3. Telegram Bot Webhook Integration | v1.0 | 2/2 | Complete | 2026-07-10 |
| 4. Frontend UI (TWA) & Auth | v1.0 | 3/3 | Complete | 2026-07-10 |
| 5. Charts & Rollover Mechanics | v1.0 | 2/2 | Complete | 2026-07-10 |
| 6. Security & Whitelist Authentication | v2.0 | 0/0 | Not started | — |
| 7. Portfolio Analytics & Asset Metrics | v2.0 | 0/0 | Not started | — |
| 8. Deposit Lineage Tree & History | v2.0 | 0/0 | Not started | — |
