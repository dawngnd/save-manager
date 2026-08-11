# Phase 7: Portfolio Analytics & Asset Metrics - Discussion Log

**Date:** 2026-08-11
**Duration:** ~10 minutes
**Mode:** Standard (interactive)

## Areas Discussed

### 1. Vị trí hiển thị biểu đồ
**Options presented:**
- Tab riêng "Analytics" (tab thứ 3)
- Section trong tab Deposits
- Thay thế charts hiện tại

**User selected:** Tab riêng "Analytics"
**Notes:** Sạch sẽ, không làm nặng tab hiện tại. Thêm tab thứ 3 bên cạnh Deposits và Gold.

### 2. Bucket kỳ hạn
**Options presented:**
- Tính từ maturity_at - created_at (dùng fields có sẵn)
- Thêm field term_months vào DB

**User selected:** Tính từ maturity_at - created_at
**Notes:** Parse DD/MM/YYYY, tính số tháng. Không cần thêm field mới, tránh migration.

### 3. WAIR card metrics
**Options presented:**
- Chỉ WAIR (1 thẻ KPI)
- WAIR + Tổng tài sản + Số khoản (3 thẻ)
- WAIR + Tổng tài sản (2 thẻ)

**User selected:** Chỉ WAIR — 1 thẻ KPI duy nhất
**Notes:** Minimal, tập trung vào chỉ số quan trọng nhất.

### 4. Chart.js destroy/theme
**Options presented:**
- Reuse pattern BankShareChart (dark palette cố định)
- Reuse + Telegram theme detect

**User selected:** Reuse pattern BankShareChart
**Notes:** Nhất quán với code cũ. useRef + useEffect cleanup + chart.destroy(). Không detect theme.

## Deferred Ideas

None.

---
*Discussion for Phase 7 — 2026-08-11*
