# Phase 1: DB & clasp Project Setup - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase này thực hiện thiết lập môi trường lập trình local đồng bộ clasp với Google Apps Script, tạo cấu trúc cơ sở dữ liệu Google Sheets với 2 bảng `Users` và `Deposits`, cấu hình timezone `Asia/Ho_Chi_Minh` cho toàn bộ dự án.

</domain>

<decisions>
## Implementation Decisions

### Script Type
- **D-01:** Sử dụng loại dự án GAS độc lập (Standalone Script). Dự án phát triển TypeScript ở local, biên dịch và push lên cloud thông qua `clasp`. Code backend quản lý bằng Git độc lập.

### Sheet Init
- **D-02:** Người dùng tạo thủ công Google Sheet và cấu hình ID của Sheet này vào Script Properties trên Apps Script làm biến môi trường. Backend sẽ kết nối qua ID này bằng `SpreadsheetApp.openById(id)`.

### Dir Layout
- **D-03:** Cấu trúc mã nguồn chia làm 2 thư mục riêng biệt tại root:
  - Thư mục `backend/` chứa mã nguồn Google Apps Script (TypeScript, clasp config).
  - Thư mục `frontend/` chứa mã nguồn Vite UI client (TypeScript, Tailwind, Chart.js).

### the agent's Discretion
- Kiến trúc khung Vite + Tailwind CSS và cấu hình các plugin bundler chi tiết cho dự án do agent tự quyết định khi triển khai.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning Docs
- `.planning/PROJECT.md` — Định nghĩa giá trị cốt lõi, phạm vi và ràng buộc dự án.
- `.planning/REQUIREMENTS.md` — Danh sách yêu cầu chi tiết v1 (DB, API, UI).
- `.planning/research/SUMMARY.md` — Tổng hợp nghiên cứu công nghệ và hướng đi cho lộ trình.
- `.planning/research/STACK.md` — Khuyến nghị chi tiết về stack và thư viện (clasp 3.3.0, Vite 8.1.4, @telegram-apps/sdk).
- `.planning/research/PITFALLS.md` — Các lỗi và bẫy công nghệ cần tránh (GAS caching, timezone offset).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Không có (greenfield project).

### Established Patterns
- Không có.

### Integration Points
- Không có.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-DB & clasp Project Setup*
*Context gathered: 2026-07-10*
