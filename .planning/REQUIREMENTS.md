# Requirements: Save Manager

**Defined:** 2026-08-12
**Core Value:** Quản lý chính xác trạng thái các khoản tiết kiệm, hỗ trợ tái tục linh hoạt và hiển thị biểu đồ trực quan ước tính tăng trưởng tổng tài sản theo thời gian.

## v3.0 Requirements

Requirements for Mortgage Loan Estimator module. Each maps to roadmap phases.

### Calculation Engine

- [ ] **CALC-01**: User có thể ước tính khoản vay theo phương thức Dư nợ giảm dần (Equal Principal) — tiền gốc trả đều, lãi tính trên dư nợ còn lại
- [ ] **CALC-02**: User có thể ước tính khoản vay theo phương thức Trả đều hàng tháng (Annuity/PMT) — tổng trả cố định hàng tháng
- [ ] **CALC-03**: User có thể cấu hình lãi suất 2 giai đoạn: ưu đãi cố định (6-36 tháng) → thả nổi cho phần còn lại
- [ ] **CALC-04**: User thấy tổng lãi phải trả, tổng tiền trả, và tỷ lệ lãi/gốc sau khi nhập tham số
- [ ] **CALC-05**: User có thể cấu hình ân hạn gốc (Grace Period) — giai đoạn chỉ trả lãi, chưa trả gốc

### Visualization

- [ ] **VIS-01**: User thấy bảng lịch trả nợ chi tiết theo tháng với accordion gộp theo năm
- [ ] **VIS-02**: User thấy thẻ tổng kết KPI hiển thị: tổng lãi, peak payment tháng đầu, payment tháng đầu thả nổi
- [ ] **VIS-03**: User thấy biểu đồ stacked bar phân bổ gốc/lãi theo năm (default) với option xem theo tháng
- [ ] **VIS-04**: User thấy biểu đồ lũy kế lãi vs gốc đã trả dạng area/line chart
- [ ] **VIS-05**: User thấy cảnh báo "vách đá lãi suất" highlight chênh lệch payment khi chuyển từ ưu đãi sang thả nổi

### Configuration

- [x] **CONF-01**: User nhập tham số động: tiền vay (VNĐ), thời hạn (năm), lãi suất ưu đãi (%/năm), thời gian ưu đãi (tháng), lãi suất thả nổi (%/năm), phương thức trả nợ
- [x] **CONF-02**: User chọn preset ngân hàng (Vietcombank, BIDV, Vietinbank, VPBank) để auto-fill tham số lãi suất phổ biến
- [x] **CONF-03**: Form hiển thị 3 field cơ bản (tiền vay, thời hạn, lãi suất), phần nâng cao ẩn trong expandable section
- [x] **CONF-04**: Tham số nhập được lưu vào localStorage và khôi phục khi mở lại app

### Integration

- [ ] **INTG-01**: Module Mortgage Estimator hiển thị trên tab riêng "Vay" đặt cạnh tab Analytics trong App.tsx

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Comparison

- **COMP-01**: So sánh 2 kịch bản side-by-side (VD: 15 năm vs 25 năm, hoặc giảm dần vs annuity)

### Advanced Features

- **ADV-01**: Trả nợ trước hạn (Prepayment Simulation) — thêm khoản trả gốc sớm tại tháng X
- **ADV-02**: Tích hợp tiết kiệm ↔ vay — rút tiết kiệm trả trước, tính tiết kiệm bao nhiêu lãi
- **ADV-03**: Export PDF lịch trả nợ
- **ADV-04**: Multi-stage floating rate — nhiều mức lãi suất thả nổi cho các khoảng thời gian khác nhau

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Tự động crawl lãi suất ngân hàng | DOM đổi liên tục, GAS timeout, lãi suất tùy từng KH |
| Backend GAS cho tính toán vay | Tăng latency không cần thiết, module chỉ cần estimation |
| Tích hợp CIC (Trung tâm Tín dụng) | API không public, phức tạp pháp lý |
| Hỗ trợ lãi kép (Compound Interest) | VN dùng lãi đơn trên dư nợ giảm dần, lãi kép sai thực tế |
| D3.js hoặc charting library nặng | Phình bundle 500KB+, Chart.js đủ dùng |
| big.js/decimal.js | VND không có phần lẻ, integer arithmetic đủ chính xác |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CALC-01 | Phase 9 | Pending |
| CALC-02 | Phase 9 | Pending |
| CALC-03 | Phase 9 | Pending |
| CALC-04 | Phase 9 | Pending |
| CALC-05 | Phase 9 | Pending |
| CONF-01 | Phase 10 | Complete |
| CONF-02 | Phase 10 | Complete |
| CONF-03 | Phase 10 | Complete |
| CONF-04 | Phase 10 | Complete |
| VIS-03 | Phase 11 | Pending |
| VIS-04 | Phase 11 | Pending |
| VIS-05 | Phase 11 | Pending |
| VIS-01 | Phase 12 | Pending |
| VIS-02 | Phase 12 | Pending |
| INTG-01 | Phase 12 | Pending |

**Coverage:**

- v3.0 requirements: 15 total
- Mapped to phases: 15 ✅
- Unmapped: 0

---
*Requirements defined: 2026-08-12*
*Last updated: 2026-08-12 after roadmap creation*
