# Phase 8: Deposit Lineage Tree & History - Discussion Log

**Date:** 2026-08-11
**Duration:** ~5 minutes
**Mode:** Standard (interactive)

## Areas Discussed

### 1. Dạng hiển thị phả hệ
**Options presented:**
- Timeline dọc (CSS list + border-left)
- Cây ngang (SVG/Canvas)

**User selected:** Timeline dọc (CSS)
**Notes:** Nhẹ, phù hợp mobile. Mỗi node là card nhỏ. Đường nối bằng border-left.

### 2. Entry point
**Options presented:**
- Tích hợp vào modal chi tiết DepositList
- Modal riêng mới

**User selected:** Tích hợp vào modal chi tiết
**Notes:** Thêm section collapse/expand. Không tạo component modal mới.

### 3. Metrics placement
**Options presented:**
- Header phả hệ (trước timeline)
- Footer phả hệ (sau timeline)

**User selected:** Header phả hệ
**Notes:** Tổng lãi + hệ số x1.xx compact ngay đầu section.

### 4. Data source
**Options presented:**
- Frontend only (deposits array có sẵn)
- Backend API mới

**User selected:** Frontend only
**Notes:** Logic traversal đã có trong DepositList.tsx. Không cần API mới.

## Deferred Ideas

None.

---
*Discussion for Phase 8 — 2026-08-11*
