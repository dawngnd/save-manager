# Phase 1: DB & clasp Project Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 1-DB & clasp Project Setup
**Areas discussed:** Script Type, Sheet Init, Dir Layout

---

## Script Type

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone (Recommended) | Dễ phát triển local với clasp, quản lý mã nguồn độc lập qua Git. | ✓ |
| Container-bound | Gắn trực tiếp vào Google Sheet cụ thể, tiện xem code trên trình duyệt. | |

**User's choice:** Standalone (Recommended)
**Notes:** Dễ phát triển local và đồng bộ mã nguồn qua Git.

---

## Sheet Init

| Option | Description | Selected |
|--------|-------------|----------|
| Manual ID (Recommended) | Tự tạo Google Sheet, nhập ID vào Script Properties. Sạch và ổn định. | ✓ |
| Auto Create | Tự động tạo Spreadsheet mới nếu chưa cấu hình ID. Tiện lợi nhưng dễ sinh trùng lặp. | |

**User's choice:** Manual ID (Recommended)
**Notes:** Tiết kiệm cấu hình và kiểm soát bảng tính tốt hơn.

---

## Dir Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Separate folders (Recommended) | backend/ cho GAS backend, frontend/ cho Vite client. Rõ ràng, độc lập. | ✓ |
| Unified root | Tất cả đặt tại thư mục gốc. Ít phân cấp thư mục hơn. | |

**User's choice:** Separate folders (Recommended)
**Notes:** Tách biệt mã nguồn backend GAS và frontend Vite.

---

## the agent's Discretion

- Quyết định chi tiết các plugin đóng gói mã nguồn Vite + Tailwind và cấu trúc dự án con.

## Deferred Ideas

- Không có.
