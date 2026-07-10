# Phase 4: Frontend UI (TWA) & Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 04-frontend-ui-twa-auth
**Areas discussed:** Hosting & Deployment, Login flow, Giao diện danh sách khoản gửi, Form thêm khoản gửi

---

## Hosting & Deployment

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages | SPA deploy lên GitHub Pages, GAS chỉ làm API | ✓ |
| GAS doGet | Bundle single HTML serve qua doGet() | |

**User's choice:** GitHub Pages
**Notes:** Miễn phí, tốc độ nhanh, CDN.

| Option | Description | Selected |
|--------|-------------|----------|
| Vite `.env` | `VITE_API_URL` build-time inject | ✓ |
| Hardcode | Hardcode trong code | |
| localStorage | User tự cấu hình | |

**User's choice:** Vite `.env`

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions | Auto build+deploy on push to main | ✓ |
| Deploy thủ công | Manual build + push gh-pages | |

**User's choice:** GitHub Actions

| Option | Description | Selected |
|--------|-------------|----------|
| `frontend/` cùng repo | Mono-repo | ✓ |
| Repo riêng | Tách frontend ra repo mới | |

**User's choice:** Mono-repo `frontend/`

---

## Login Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Inline trên trang chính | Input field đầu trang | |
| Trang đăng nhập riêng | Splash/welcome screen riêng | |
| Modal overlay | Popup modal | |

**User's choice:** Không cần login. Admin duy nhất. Chỉ cần xác thực request từ Telegram Bot. Dropdown chọn `username_bankcode` từ sheet Users.
**Notes:** User tự mô tả: "tôi sử dụng cho tôi, với quyền là admin, show toàn bộ thông tin, không cần xác thực và phân quyền"

| Option | Description | Selected |
|--------|-------------|----------|
| Dùng sheet `Users` hiện tại | API `get_users` lấy danh sách dropdown | ✓ |
| Tạo sheet `UserBank` riêng | Sheet riêng cho danh sách tài khoản | |

**User's choice:** Dùng sheet Users hiện tại

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Lưu giữa phiên | |
| Không lưu | Chọn lại mỗi lần mở | ✓ |

**User's choice:** Không lưu session

| Option | Description | Selected |
|--------|-------------|----------|
| HMAC-SHA256 initData | Backend kiểm tra chữ ký Telegram | ✓ |
| Không xác thực | Tin tưởng mọi request | |

**User's choice:** HMAC-SHA256 initData validation

---

## Giao diện danh sách khoản gửi

| Option | Description | Selected |
|--------|-------------|----------|
| Cards | Mỗi khoản gửi 1 card riêng | ✓ |
| Table | Bảng spreadsheet | |
| List đơn giản | 1 dòng mỗi khoản | |

**User's choice:** Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Ngày đáo hạn gần nhất | Ưu tiên khoản sắp đáo hạn | ✓ |
| Số tiền lớn nhất | | |
| Mới nhất (created_at) | | |

**User's choice:** Ngày đáo hạn gần nhất lên đầu

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ `active` mặc định + toggle | Tab xem rolled_over | ✓ → modified |
| Tất cả trạng thái | Gom chung | |

**User's choice:** Chỉ hiển thị khoản cần xử lý (≤ 3 ngày đáo hạn + quá hạn). Không tab "Tất cả".
**Notes:** User yêu cầu cụ thể: "danh sách khoản gửi chỉ bao gồm các khoản gửi sắp đáo hạn trong vòng 3 ngày và các khoản gửi đã đáo hạn nhưng chưa xử lý"

| Option | Description | Selected |
|--------|-------------|----------|
| Summary bar đầu trang | Tổng tiền + tổng lãi | |
| Không summary | Chỉ cards | ✓ |

**User's choice:** Không summary. Dashboard sẽ là tính năng riêng ở milestone sau.

| Option | Description | Selected |
|--------|-------------|----------|
| Compact card | Số tiền, lãi suất, ngày đáo hạn, trạng thái | ✓ |
| Đầy đủ trên card | Tất cả thông tin | |

**User's choice:** Compact card, nhấn vào mở chi tiết.

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet | Slide-up panel | ✓ |
| Trang riêng | Navigate + Back button | |
| Modal | | |

**User's choice:** Bottom sheet cho chi tiết khoản gửi.

---

## Form thêm khoản gửi

| Option | Description | Selected |
|--------|-------------|----------|
| FAB | Nút "+" nổi góc dưới phải | ✓ |
| Nút trên header | | |

**User's choice:** FAB → mở form dạng bottom sheet

| Option | Description | Selected |
|--------|-------------|----------|
| Text mask DD/MM/YYYY | Nhất quán backend | ✓ |
| Native date picker | `<input type="date">` + convert | |

**User's choice:** Text với mask DD/MM/YYYY

| Option | Description | Selected |
|--------|-------------|----------|
| Inline realtime | Validate khi blur, lỗi dưới field | ✓ |
| Validate khi submit | Kiểm tra hết khi gửi | |

**User's choice:** Inline realtime validation

| Option | Description | Selected |
|--------|-------------|----------|
| Preview lãi dự kiến | Tính realtime trên form | ✓ |
| Không preview | Chỉ hiện sau submit | |

**User's choice:** Preview lãi dự kiến realtime

| Option | Description | Selected |
|--------|-------------|----------|
| Đóng form + toast + refresh | | |
| Giữ form mở + toast | Thêm tiếp | ✓ |

**User's choice:** Giữ form mở để thêm tiếp, toast thành công

---

## Agent's Discretion

- Chi tiết cấu trúc HTML/CSS component, tổ chức TypeScript modules
- Cách implement date mask input
- Bottom sheet animation design
- GitHub Actions workflow configuration

## Deferred Ideas

- **Dashboard / Summary bar** — Tổng kết tài sản sẽ là tính năng riêng ở milestone v2 (command `/dashboard`)
- **Tab xem toàn bộ khoản gửi** — Xem tất cả khoản active/rolled_over
