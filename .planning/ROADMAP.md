# Roadmap: Save Manager

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-07-14)
- ✅ **v2.0 Polish & Analytics** — Phases 6-8 (shipped 2026-08-11)
- 🚧 **v3.0 Mortgage Loan Estimator** — Phases 9-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-07-14</summary>

- [x] **Phase 1: DB & clasp Project Setup** - Setup Google Sheets database schema and local clasp synchronization. (completed 2026-07-10)
- [x] **Phase 2: Backend DB Operations & Calculations** - Build backend CRUD functions, LockService guards, and expected interest calculations. (completed 2026-07-10)
- [x] **Phase 3: Telegram Bot Webhook Integration** - Connect Telegram Bot API webhooks and set up daily maturity alerts cron job. (completed 2026-07-10)
- [x] **Phase 4: Frontend UI (TWA) & Auth** - Create the single-file Vite/TS/Tailwind SPA with Telegram Apps SDK integration and deposit forms. (completed 2026-07-10)
- [x] **Phase 5: Charts & Rollover Mechanics** - Build growth projection timeseries chart and execute rollover transaction workflow. (completed 2026-07-10)

</details>

<details>
<summary>✅ v2.0 Polish & Analytics (Phases 6-8) — SHIPPED 2026-08-11</summary>

- [x] **Phase 6: Security & Whitelist Authentication** - Xác thực HMAC-SHA256 trên GAS backend, kiểm tra auth_date 24h, whitelist chat_id trong GAS Script Properties và hỗ trợ Mock Auth dev mode.
- [x] **Phase 7: Portfolio Analytics & Asset Metrics** - Biểu đồ Doughnut phân bổ tài sản theo ngân hàng/kỳ hạn và thẻ chỉ số lãi suất trung bình gia quyền (WAIR).
- [x] **Phase 8: Deposit Lineage Tree & History** - Duyệt phả hệ 2 chiều khoản gửi tái tục, hiển thị sơ đồ cây timeline tree UI và tổng lãi tích lũy/hệ số tăng trưởng.

</details>

### 🚧 v3.0 Mortgage Loan Estimator (Phases 9-12)

- [ ] **Phase 9: Types & Calculation Engine** - TypeScript domain types và mortgage calculation engine hỗ trợ 2 phương thức trả nợ, lãi suất 2 giai đoạn, ân hạn gốc, integer arithmetic.
- [ ] **Phase 10: Form UI & Bank Presets** - Form nhập tham số khoản vay với progressive disclosure, bank preset selector auto-fill, và localStorage persist.
- [ ] **Phase 11: Charts & Visualization** - Biểu đồ stacked bar phân bổ gốc/lãi, biểu đồ lũy kế area chart, và cảnh báo vách đá lãi suất.
- [ ] **Phase 12: Summary, Schedule & Tab Integration** - Thẻ KPI tổng kết, bảng lịch trả nợ accordion, MortgageTab wrapper và tích hợp tab vào App.tsx.

---

## Phase Details

<details>
<summary>✅ v1.0 & v2.0 Phase Details (Phases 1-8)</summary>

### Phase 1: DB & clasp Project Setup
- **Goal**: Setup Google Sheets database schema and local clasp synchronization.
- **Requirements**: `DB-01`
- **Status**: Complete (2026-07-10)

### Phase 2: Backend DB Operations & Calculations
- **Goal**: Build backend CRUD functions, LockService guards, and expected interest calculations.
- **Requirements**: `DB-02`, `API-01`, `API-02`, `API-03`
- **Status**: Complete (2026-07-10)

### Phase 3: Telegram Bot Webhook Integration
- **Goal**: Connect Telegram Bot API webhooks and set up daily maturity alerts cron job.
- **Requirements**: `BOT-01`, `NOTF-01`
- **Status**: Complete (2026-07-10)

### Phase 4: Frontend UI (TWA) & Auth
- **Goal**: Create the single-file Vite/TS/Tailwind SPA with Telegram Apps SDK integration and deposit forms.
- **Requirements**: `UI-01`, `UI-02`, `UI-03`, `DEP-01`
- **Status**: Complete (2026-07-10)

### Phase 5: Charts & Rollover Mechanics
- **Goal**: Build growth projection timeseries chart and execute rollover transaction workflow.
- **Requirements**: `STAT-01`, `DEP-02`
- **Status**: Complete (2026-07-10)

### Phase 6: Security & Whitelist Authentication
- **Goal**: Bảo mật REST API bằng xác thực HMAC-SHA256 trên GAS backend, chống replay attack qua auth_date 24h, kiểm tra chat_id thuộc whitelist cấu hình trong GAS Script Properties, và duy trì Mock Auth cho môi trường dev desktop.
- **Requirements**: `AUTH-02`
- **Status**: Complete (2026-08-11)

### Phase 7: Portfolio Analytics & Asset Metrics
- **Goal**: Cung cấp bức tranh tổng quan phân bổ danh mục tiết kiệm active theo ngân hàng, nhóm kỳ hạn và đo lường chỉ số lãi suất trung bình gia quyền (WAIR).
- **Requirements**: `STAT-02`
- **Status**: Complete (2026-08-11)

### Phase 8: Deposit Lineage Tree & History
- **Goal**: Trực quan hóa lịch sử dòng tiền qua các chu kỳ tái tục (Rollover), dựng sơ đồ phả hệ cây 2 chiều và đo lường tổng tiền lãi tích lũy cùng hệ số tăng trưởng qua thời gian.
- **Requirements**: `HIST-01`
- **Status**: Complete (2026-08-11)

</details>

### Phase 9: Types & Calculation Engine
- **Goal**: Xây dựng domain types TypeScript và pure calculation engine cho mortgage estimation, hỗ trợ 2 phương thức trả nợ (Dư nợ giảm dần + Annuity), lãi suất 2 giai đoạn (ưu đãi → thả nổi), ân hạn gốc, và integer VND arithmetic.
- **Requirements**: `CALC-01`, `CALC-02`, `CALC-03`, `CALC-04`, `CALC-05`
- **Success Criteria**:
  1. User nhập tham số khoản vay và nhận được bảng lịch trả nợ theo phương thức Dư nợ giảm dần — tiền gốc trả đều, lãi tính trên dư nợ còn lại mỗi tháng.
  2. User chuyển sang phương thức Annuity/PMT và thấy tổng tiền trả cố định hàng tháng (gốc + lãi) với phần gốc tăng dần theo thời gian.
  3. Kết quả tính toán phản ánh chính xác lãi suất 2 giai đoạn: áp dụng lãi ưu đãi cố định trong N tháng đầu, sau đó chuyển sang lãi thả nổi cho phần còn lại.
  4. User thấy tổng lãi phải trả, tổng tiền trả, và tỷ lệ lãi/gốc hiển thị ngay sau khi nhập tham số.
  5. User cấu hình ân hạn gốc và thấy trong giai đoạn ân hạn chỉ phải trả lãi, dư nợ gốc không thay đổi.

### Phase 10: Form UI & Bank Presets
- **Goal**: Xây dựng giao diện form nhập tham số khoản vay với progressive disclosure (3 fields cơ bản hiển thị, phần nâng cao ẩn), bank preset selector auto-fill lãi suất phổ biến, và localStorage persist inputs.
- **Requirements**: `CONF-01`, `CONF-02`, `CONF-03`, `CONF-04`
- **Success Criteria**:
  1. User nhập được 6 tham số khoản vay: tiền vay (VNĐ), thời hạn (năm), lãi suất ưu đãi, thời gian ưu đãi, lãi suất thả nổi, phương thức trả nợ — kết quả tính toán cập nhật realtime.
  2. User chọn preset ngân hàng (Vietcombank, BIDV, Vietinbank, VPBank) và thấy các tham số lãi suất được auto-fill tương ứng.
  3. Form mặc định chỉ hiển thị 3 field cơ bản (tiền vay, thời hạn, lãi suất); phần nâng cao (ân hạn, lãi thả nổi, thời gian ưu đãi) nằm trong expandable section.
  4. User đóng app rồi mở lại — các tham số đã nhập trước đó được khôi phục từ localStorage.

### Phase 11: Charts & Visualization
- **Goal**: Xây dựng biểu đồ stacked bar phân bổ gốc/lãi theo năm (default) với option xem theo tháng, biểu đồ lũy kế lãi vs gốc dạng area/line chart, và cảnh báo trực quan "vách đá lãi suất" khi chuyển từ ưu đãi sang thả nổi.
- **Requirements**: `VIS-03`, `VIS-04`, `VIS-05`
- **Success Criteria**:
  1. User thấy biểu đồ stacked bar hiển thị phần gốc và lãi riêng biệt theo từng năm (view mặc định), có thể chuyển sang xem theo tháng.
  2. User thấy biểu đồ area/line chart hiển thị lũy kế lãi đã trả và lũy kế gốc đã trả theo thời gian.
  3. User thấy cảnh báo trực quan highlight rõ chênh lệch payment khi chuyển từ giai đoạn lãi suất ưu đãi sang thả nổi ("vách đá lãi suất").

### Phase 12: Summary, Schedule & Tab Integration
- **Goal**: Xây dựng thẻ KPI tổng kết, bảng lịch trả nợ chi tiết với accordion gộp theo năm, MortgageTab wrapper component, và tích hợp tab "Vay" vào App.tsx cạnh Analytics.
- **Requirements**: `VIS-01`, `VIS-02`, `INTG-01`
- **Success Criteria**:
  1. User thấy bảng lịch trả nợ chi tiết theo tháng (gốc, lãi, tổng trả, dư nợ còn lại) với accordion gộp theo năm để dễ duyệt.
  2. User thấy thẻ KPI tổng kết hiển thị: tổng lãi phải trả, peak payment tháng đầu, payment tháng đầu khi chuyển sang thả nổi.
  3. User thấy tab "Vay" trên navigation bar cạnh tab Analytics và chuyển đổi được giữa các tab.

---

## Requirements Coverage

All 15 v3.0 requirements mapped to phases:

| Requirement | Phase | Description |
|-------------|-------|-------------|
| CALC-01 | Phase 9 | Dư nợ giảm dần (Equal Principal) |
| CALC-02 | Phase 9 | Trả đều hàng tháng (Annuity/PMT) |
| CALC-03 | Phase 9 | Lãi suất 2 giai đoạn (ưu đãi → thả nổi) |
| CALC-04 | Phase 9 | Tổng lãi, tổng trả, tỷ lệ lãi/gốc |
| CALC-05 | Phase 9 | Ân hạn gốc (Grace Period) |
| CONF-01 | Phase 10 | Form nhập 6 tham số động |
| CONF-02 | Phase 10 | Preset ngân hàng auto-fill |
| CONF-03 | Phase 10 | Progressive disclosure (3 fields + expandable) |
| CONF-04 | Phase 10 | localStorage persist inputs |
| VIS-03 | Phase 11 | Stacked bar gốc/lãi theo năm/tháng |
| VIS-04 | Phase 11 | Lũy kế lãi vs gốc area/line chart |
| VIS-05 | Phase 11 | Cảnh báo vách đá lãi suất |
| VIS-01 | Phase 12 | Bảng lịch trả nợ accordion theo năm |
| VIS-02 | Phase 12 | Thẻ KPI tổng kết |
| INTG-01 | Phase 12 | Tab "Vay" trên navigation cạnh Analytics |

**Coverage: 15/15 requirements mapped (100%) ✅**

---

## Progress

Execution Order:
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. DB & clasp Project Setup | v1.0 | 2/2 | Complete | 2026-07-10 |
| 2. Backend DB Operations & Calculations | v1.0 | 2/2 | Complete | 2026-07-10 |
| 3. Telegram Bot Webhook Integration | v1.0 | 2/2 | Complete | 2026-07-10 |
| 4. Frontend UI (TWA) & Auth | v1.0 | 3/3 | Complete | 2026-07-10 |
| 5. Charts & Rollover Mechanics | v1.0 | 2/2 | Complete | 2026-07-10 |
| 6. Security & Whitelist Authentication | v2.0 | 1/1 | Complete | 2026-08-11 |
| 7. Portfolio Analytics & Asset Metrics | v2.0 | 1/1 | Complete | 2026-08-11 |
| 8. Deposit Lineage Tree & History | v2.0 | 1/1 | Complete | 2026-08-11 |
| 9. Types & Calculation Engine | v3.0 | 0/? | Pending | — |
| 10. Form UI & Bank Presets | v3.0 | 0/? | Pending | — |
| 11. Charts & Visualization | v3.0 | 0/? | Pending | — |
| 12. Summary, Schedule & Tab Integration | v3.0 | 0/? | Pending | — |
