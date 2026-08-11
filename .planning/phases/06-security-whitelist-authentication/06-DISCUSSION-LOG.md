# Phase 6: Security & Whitelist Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-11
**Phase:** 06-Security & Whitelist Authentication
**Areas discussed:** Whitelist chat_id, Mock Auth backend, Auth error UX, Cloudflare Worker auth flow

---

## Whitelist chat_id

### Q1: Format lưu trữ whitelist

| Option | Description | Selected |
|--------|-------------|----------|
| Chuỗi phẳng | Ngăn cách dấu phẩy (ví dụ: "123456789,987654321") — đơn giản, split-and-check | |
| JSON array | Ví dụ: "[123456789,987654321]" — linh hoạt hơn nếu mở rộng metadata | ✓ |
| Agent quyết định | | |

**User's choice:** JSON array
**Notes:** Dù chỉ 1-2 chat_id, chọn JSON array cho tương lai.

### Q2: Vị trí check whitelist trong doPost flow

| Option | Description | Selected |
|--------|-------------|----------|
| Ngay sau HMAC verify | 1 chỗ duy nhất trong doPost(), trước routing action | ✓ |
| Trong từng action handler | Linh hoạt hơn nếu có action không cần whitelist | |
| Agent quyết định | | |

**User's choice:** Ngay sau HMAC verify, trước routing — 1 gate duy nhất.

### Q3: Error message khi bị reject

| Option | Description | Selected |
|--------|-------------|----------|
| "Unauthorized" chung | Không tiết lộ lý do cụ thể | ✓ |
| Thông báo rõ ràng | Phân biệt HMAC fail vs whitelist fail | |
| Agent quyết định | | |

**User's choice:** "Unauthorized" chung cho mọi auth failure.

### Q4: Tên Script Property key

| Option | Description | Selected |
|--------|-------------|----------|
| WHITELIST_CHAT_IDS | | |
| ALLOWED_CHAT_IDS | | ✓ |
| Agent quyết định | | |

**User's choice:** ALLOWED_CHAT_IDS

---

## Mock Auth backend

### Q1: Backend có cần mock/bypass auth cho dev mode?

| Option | Description | Selected |
|--------|-------------|----------|
| Không cần | Backend luôn verify, frontend mock initData là đủ | ✓ |
| Cần DEV_MODE flag | Thêm flag trong Script Properties, skip HMAC + whitelist | |
| Chọn lọc | Skip HMAC nhưng vẫn check whitelist | |
| Agent quyết định | | |

**User's choice:** Không cần — backend luôn verify nghiêm ngặt.

### Q2: Giữ bypass offline hiện tại?

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ bypass | `!initData && !botToken → pass` cho unit test offline | |
| Xóa bypass | Buộc mọi request có initData hợp lệ hoặc Worker secret | ✓ |
| Agent quyết định | | |

**User's choice:** Xóa bypass — nghiêm ngặt hơn.

### Q3: Unit test xác thực bằng cách nào?

| Option | Description | Selected |
|--------|-------------|----------|
| Mock initData với HMAC hợp lệ | Tạo từ test bot token, test như thật | ✓ |
| Dùng Worker secret path | Gửi `_serverSecret` giả lập, skip HMAC | |
| Agent quyết định | | |

**User's choice:** Mock initData với HMAC hợp lệ từ test bot token.

---

## Auth error UX

### Q1: Frontend hiển thị gì khi auth fail?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-page error screen | Icon khóa + "Không có quyền truy cập" + nút đóng TWA | ✓ |
| Toast/snackbar + redirect | Thông báo nhỏ góc dưới + redirect về màn hình trống | |
| Agent quyết định | | |

**User's choice:** Full-page error screen.

### Q2: Thời điểm phát hiện auth fail?

| Option | Description | Selected |
|--------|-------------|----------|
| Lần gọi API đầu tiên | get_deposits khi App mount — nếu fail thì error ngay | ✓ |
| Route verify_auth riêng | Gọi trước, check auth trước, mới load data | |
| Agent quyết định | | |

**User's choice:** Tại lần gọi API đầu tiên — không cần route riêng.

---

## Cloudflare Worker auth flow

### Q1: Giữ hay thay đổi dual-auth?

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ dual-auth hiện tại | Worker HMAC → inject secret → GAS trust. Whitelist check ở GAS. | ✓ |
| Worker cũng thêm whitelist | Reject sớm hơn, nhưng cần hardcode chat_id ở Worker | |
| Bỏ Worker auth | GAS luôn tự verify, Worker chỉ proxy | |

**User's choice:** Giữ dual-auth. Whitelist check luôn chạy ở GAS.

### Q2: Worker có thêm whitelist check?

| Option | Description | Selected |
|--------|-------------|----------|
| Không | Worker chỉ verify HMAC, whitelist để GAS | ✓ |
| Có | Worker cũng check, reject sớm | |

**User's choice:** Không — whitelist là trách nhiệm GAS duy nhất.

### Q3: Scope sửa Worker trong phase 6?

| Option | Description | Selected |
|--------|-------------|----------|
| Không sửa Worker | Chỉ sửa GAS backend + frontend | ✓ |
| Có thể sửa nhỏ | Thêm log, cải tiến error message | |
| Agent quyết định | | |

**User's choice:** Không sửa `cloudflare.js` — phase 6 scope = GAS + frontend only.

---

## Agent's Discretion

Không có — user quyết định tất cả các gray areas.

## Deferred Ideas

None — discussion stayed within phase scope.
