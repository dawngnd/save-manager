# Phase 5: Charts & Rollover Mechanics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 5-Charts & Rollover Mechanics
**Areas discussed:** Rollover UX, Chart Calculation, Chart UI Placement & Trigger

---

## Rollover UX - Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Chỉ khi đã đáo hạn/quá hạn | Nút chỉ xuất hiện trên thẻ khoản gửi có ngày đáo hạn là hôm nay hoặc đã qua (`diffDays <= 0`). | ✓ |
| 2. Cảnh báo trước 3 ngày | Xuất hiện khi khoản gửi còn ≤ 3 ngày là đáo hạn hoặc đã quá hạn (`diffDays <= 3`). | |
| 3. Luôn hiển thị | Xuất hiện trên tất cả các khoản gửi đang hoạt động (`active`). | |

**User's choice:** Option 1
**Notes:** Nút tái tục chỉ hiển thị khi khoản gửi thực tế đã đáo hạn hoặc quá hạn.

---

## Rollover UX - Prefill Data

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Sao chép gốc + lãi cũ | Gốc mới = Gốc cũ; Lãi suất mới = Lãi suất cũ; Ngày bắt đầu = Ngày đáo hạn cũ; Ngày đáo hạn mới: Để trống. | ✓ (Modified) |
| 2. Chỉ điền sẵn ngày bắt đầu | Ngày bắt đầu = Ngày đáo hạn cũ; Các trường còn lại để trống. | |
| 3. Để trống hoàn toàn | Không điền sẵn trường nào. | |

**User's choice:** Option 1 (Modified)
**Notes:** User requested to default the new maturity date to the old maturity date, but with the year incremented by 1 (e.g. 10/07/2026 -> 10/07/2027) instead of keeping it empty.

---

## Chart Calculation Method

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Dạng bậc thang (Step-wise) | Cộng dồn gốc + lãi dự kiến vào đúng ngày đáo hạn thực tế của mỗi khoản. | ✓ |
| 2. Dạng tích lũy tuyến tính | Tiền lãi được tính cộng dồn tăng dần từng ngày (smooth accrual). | |

**User's choice:** Option 1
**Notes:** Dòng tiền thực tế chính xác hơn vì lãi chỉ nhận được lúc đáo hạn.

---

## Chart Horizon

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Động theo ngày đáo hạn xa nhất | Trục thời gian tự động kéo dài đến ngày đáo hạn xa nhất của các khoản gửi `active` hiện tại. | ✓ |
| 2. Cố định 12 tháng | Trục X luôn hiển thị cố định 12 tháng tới. | |
| 3. Chỉ hiển thị mốc sự kiện | Trục X chỉ hiển thị các ngày đáo hạn thực tế. | |

**User's choice:** Option 1
**Notes:** Động theo chu kỳ thực tế của các khoản tiền gửi.

---

## Chart UI Placement & Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Thẻ thu gọn ở trên cùng | Block thống kê nằm trên đầu danh sách, hỗ trợ đóng/mở. | ✓ (Modified) |
| 2. Chia Tab điều hướng | Chia màn hình làm 2 tab riêng biệt. | |

**User's choice:** Option 1 (Modified)
**Notes:** Hiển thị dạng card thu gọn ở trên cùng, nhưng chỉ hiển thị khi người dùng mở Web App qua command `/chart` (nhận tham số URL `view=chart` hoặc `tgWebAppStartParam=chart`). Khi mở bình thường từ Menu Button, biểu đồ sẽ được ẩn hoàn toàn để giữ danh sách gọn gàng.

---

## the agent's Discretion
- Định dạng và styling màu sắc cho biểu đồ (Chart.js) theo phong cách dark mode và tone màu của Telegram Mini App.

## Deferred Ideas
None — discussion stayed within phase scope.
