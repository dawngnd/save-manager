# Phase 11 Discussion Log: Charts & Visualization
**Date:** 2026-08-12
**Duration:** ~18 min

## Areas Discussed

### 1. Stacked Bar Chart
**Options presented:** Năm + toggle tháng scroll | Chỉ năm | Click drill-down
**User selected:** Năm + toggle tháng scroll ngang (`.chart-scroll`)
**Notes:** `yearlySummary[]` mặc định, `monthlySchedule[]` khi toggle

### 2. Area/Line Chart Lũy Kế
**Options presented:** Filled area (overlap) | 2 line đơn giản | Stacked area
**User selected:** Filled area chart (2 vùng chồng, opacity)
**Notes:** Cumulative sum từ monthlySchedule[], tooltip hover số tiền + tháng

### 3. Vách Đá Lãi Suất
**Options presented:** Card cảnh báo riêng | Annotation trên chart | Cả hai
**User selected:** Annotation trực tiếp trên stacked bar chart
**Notes:** Vertical line + label chênh lệch. Không hiện nếu rates bằng nhau.

### 4. Chart Layout & Responsive
**Options presented:** 2 charts xếp dọc | Tab switcher | Collapsible sections
**User selected:** Tab switcher ("Phân bổ gốc/lãi" | "Lũy kế")
**Notes:** 1 chart hiện tại 1 thời điểm, tiết kiệm space mobile

## Deferred Ideas
(None)
