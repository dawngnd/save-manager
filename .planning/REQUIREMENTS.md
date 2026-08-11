# Requirements: Save Manager

**Defined:** 2026-08-11
**Core Value:** Quản lý chính xác trạng thái các khoản tiết kiệm, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ trực quan ước tính tăng trưởng tổng tài sản theo thời gian.

## v2.0 Requirements

Requirements cho milestone v2.0 Polish & Analytics. Mỗi mục map đến roadmap phase.

### Security & Auth

- [ ] **AUTH-02**: Xác thực chữ ký HMAC-SHA256 trên initData Telegram Web App ở backend GAS
- [ ] **AUTH-03**: Kiểm tra auth_date hết hạn (≤ 24h) để chống replay attack
- [ ] **AUTH-04**: Hỗ trợ Hybrid Auth — fallback mock cho môi trường dev desktop
- [ ] **AUTH-05**: Whitelist chat_id hợp lệ trong GAS Script Properties — reject nếu chat_id không thuộc whitelist

### Analytics

- [ ] **STAT-02**: Biểu đồ Doughnut phân bổ tỷ trọng tài sản theo ngân hàng
- [ ] **STAT-03**: Biểu đồ Doughnut phân bổ tỷ trọng tài sản theo kỳ hạn
- [ ] **STAT-04**: Thẻ chỉ số lãi suất trung bình gia quyền (WAIR)

### Deposit History

- [ ] **HIST-01**: Duyệt phả hệ 2 chiều (parent_id ↔ child_id) từ dữ liệu deposits
- [ ] **HIST-02**: Hiển thị timeline tree UI các thế hệ khoản gửi đã tái tục
- [ ] **HIST-03**: Hiển thị tổng lãi tích lũy và hệ số tăng trưởng qua các kỳ tái tục

## Future Requirements

Deferred — không nằm trong roadmap v2.0.

### UI Polish

- **GAP-01**: Tích hợp UserSelector dropdown vào màn hình bắt đầu của App.tsx (không cần nữa — auth whitelist thay thế)
- **GAP-02**: Hỗ trợ nhập tay bankcode mới khi thêm khoản tiết kiệm trong DepositForm

### Integration Fixes

- **GAP-03**: Tự động liên kết telegram_chat_id vào bảng Users (không cần nữa — whitelist chat_id thay thế)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Session token lưu trên Sheets | Thêm complexity không cần thiết — HMAC stateless đủ cho app cá nhân |
| D3.js / React Flow cho lineage tree | Phình bundle single-file (>250KB), conflict với TWA touch gestures |
| OAuth / đăng nhập mật khẩu | App cá nhân, Telegram auth + whitelist là đủ |
| Đa tiền tệ | Chỉ sử dụng VND cho v2.0 |
| Phân quyền theo bankcode | Load all deposits — app cá nhân không cần phân quyền |
| UserSelector dropdown | Whitelist chat_id thay thế — sau auth load toàn bộ dữ liệu |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 6 | Pending |
| AUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 6 | Pending |
| STAT-02 | Phase 7 | Pending |
| STAT-03 | Phase 7 | Pending |
| STAT-04 | Phase 7 | Pending |
| HIST-01 | Phase 8 | Pending |
| HIST-02 | Phase 8 | Pending |
| HIST-03 | Phase 8 | Pending |

**Coverage:**
- v2.0 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-11*
*Last updated: 2026-08-11 after auth flow clarification (whitelist chat_id)*
