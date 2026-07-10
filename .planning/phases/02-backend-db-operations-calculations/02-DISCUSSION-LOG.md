# Phase 2: Backend DB Operations & Calculations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 2-Backend DB Operations & Calculations
**Areas discussed:** API Routing, Date Format, Lock Timeout

---

## API Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Single JSON Action (Recommended) | Tuyến được xác định bởi thuộc tính "action" trong JSON body. Gọn gàng và đồng bộ. | ✓ |
| URL Query Param | Tuyến được xác định qua query param (ví dụ: ?action=add). Tách biệt URL và body. | |

**User's choice:** Single JSON Action (Recommended)
**Notes:** Giúp backend GAS Web App tiếp nhận và phân chia tuyến xử lý một cách chuẩn mực.

---

## Date Format

| Option | Description | Selected |
|--------|-------------|----------|
| YYYY-MM-DD (Recommended) | Chuỗi ngày ngắn gọn, lưu Plain Text trên Sheet. Tránh lệch múi giờ. | |
| Full ISO | Chuỗi ISO đầy đủ kèm múi giờ. Server parse và xử lý phức tạp hơn. | |

**User's choice:** DD/MM/YYYY
**Notes:** Người dùng yêu cầu lưu trữ và trao đổi ngày theo định dạng `DD/MM/YYYY`. Server sẽ thực hiện parse thủ công khi tính toán chênh lệch ngày.

---

## Lock Timeout

| Option | Description | Selected |
|--------|-------------|----------|
| 10 seconds (Recommended) | Phù hợp cho ứng dụng cá nhân, phản hồi nhanh khi xảy ra xung đột. | ✓ |
| 30 seconds | Thời gian chờ lâu hơn, giảm tỷ lệ fail khi có tải lớn. | |

**User's choice:** 10 seconds (Recommended)
**Notes:** 10 giây là tối ưu cho việc sử dụng cá nhân và phản hồi nhanh trên UI.

---

## the agent's Discretion

- Định nghĩa chi tiết cấu trúc JSON phản hồi và cách sinh ID ngẫu nhiên cho các khoản gửi.

## Deferred Ideas

- Không có.
