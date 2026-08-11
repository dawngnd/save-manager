# Feature Research

**Domain:** Personal Finance / Savings Management (Google Apps Script + Google Sheets + Telegram Web App)  
**Researched:** 2026-08-11  
**Confidence:** HIGH  

---

## Overview

Tài liệu này nghiên cứu chuyên sâu về các tính năng mới trong cột mốc **v2.0 Polish & Analytics** cho ứng dụng **Save Manager**:
1. **AUTH-02 & GAP-03**: Xác thực HMAC-SHA256 cho Telegram `initData` & Tự động liên kết Telegram Chat ID (`telegram_chat_id`).
2. **HIST-01**: Trực quan hóa cây phả hệ tái tục khoản gửi (Deposit Lineage Tree) và tổng hợp lãi kép tích lũy.
3. **STAT-02**: Phân tích tỷ trọng tiết kiệm theo Ngân hàng / Kỳ hạn & Lãi suất trung bình gia quyền (Weighted Average Interest Rate - WAIR).
4. **GAP-01 & GAP-02**: Tích hợp `UserSelector` màn hình khởi động và hỗ trợ nhập linh hoạt `bankcode` mới.

---

## Feature Landscape

### Table Stakes (Người dùng mặc định kỳ vọng)

Những tính năng nền tảng cho cột mốc v2.0. Nếu thiếu, trải nghiệm người dùng sẽ gián đoạn hoặc bảo mật không đảm bảo.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Xác thực chữ ký HMAC-SHA256 cho `initData`** (`AUTH-02`) | Ngăn chặn giả mạo request API từ bên ngoài Telegram Mini App. Bảo vệ dữ liệu cá nhân. | LOW | Dùng `Utilities.computeHmacSha256Signature` trong GAS `AuthService`. Kiểm tra thời gian hết hạn `auth_date` (24h). |
| **Tự động liên kết Chat ID khi gửi API** (`GAP-03`) | Người dùng mở Web App từ Telegram Bot thì tự động lưu `telegram_chat_id` vào sheet `Users` mà không cần nhập tay. | LOW | Đọc Telegram `user.id` từ `initData` đã được HMAC xác thực trong API `get_deposits` / `add`. |
| **Phân tích tỷ trọng theo Ngân hàng & Kỳ hạn** (`STAT-02`) | Người dùng cần biết tài sản đang tập trung ở ngân hàng nào và kỳ hạn bao lâu để quản lý rủi ro thanh khoản. | MEDIUM | Chart.js Doughnut chart phân nhóm active deposits theo ngân hàng và theo các nhóm kỳ hạn (<3m, 3-6m, 6-12m, >12m). |
| **Tra cứu phả hệ khoản gửi đã tái tục** (`HIST-01`) | Khi tái tục nhiều lần, người dùng cần xem khoản tiền hiện tại xuất thân từ khoản gốc nào. | MEDIUM | Duyệt cây qua quan hệ `parent_id` và `child_id`. Hiển thị chuỗi lịch sử các thế hệ khoản gửi. |
| **Nhập thủ công mã ngân hàng mới** (`GAP-02`) | Người dùng gửi ở ngân hàng mới chưa có trong danh sách dropdown của UI. | LOW | Toggle chuyển đổi giữa Select bankcode có sẵn và Input nhập tay mã ngân hàng mới trong `DepositForm.tsx`. |
| **UserSelector màn hình khởi động** (`GAP-01`) | Giúp chuyển đổi user dễ dàng khi ở chế độ Mock Desktop Dev hoặc quản lý nhiều tài khoản. | LOW | Tích hợp `UserSelector` vào header/startup view của `App.tsx`. |

---

### Differentiators (Tính năng tạo sự khác biệt)

Các tính năng nâng tầm trải nghiệm ứng dụng so với các bot quản lý tài chính thông thường.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interactive Deposit Lineage Tree & Compound Yield Tracker** | Hiển thị sơ đồ phả hệ trực quan (Tree/Timeline view) của dòng tiền qua các chu kỳ tái tục, tính tổng số tiền lãi đã sinh ra từ khoản gốc ban đầu qua nhiều năm. | MEDIUM | Render giao diện timeline node dạng dọc bằng CSS/SVG nhẹ (tránh thư viện đồ thị nặng). Tính tổng lãi dồn tích qua các thế hệ `rolled_over`. |
| **Chỉ số Sức khỏe Tài sản (Weighted Avg Interest Rate - WAIR)** | Cung cấp chỉ số hiệu quả đầu tư tổng thể: Lãi suất trung bình gia quyền theo quy mô vốn $\sum (Amount_i \times Rate_i) / \sum Amount_i$. | LOW | Tính toán hiển thị dạng KPI Card nổi bật trên đầu dashboard phân tích. |
| **Chế độ Auth Kép (Hybrid Auth with Desktop Fallback)** | Tự động sử dụng HMAC Telegram khi chạy trong WebApp, đồng thời hỗ trợ Mock Auth khi phát triển/test trên trình duyệt Desktop mà không làm hỏng code production. | MEDIUM | Graceful degradation trong `AuthService.js` và `telegram.ts` giúp việc debug cực kỳ thuận tiện. |

---

### Anti-Features (Các tính năng nên tránh)

Các tính năng dễ gây phình scope, làm chậm hệ thống hoặc không phù hợp với kiến trúc GAS + Single-file SPA.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Sử dụng thư viện Đồ thị nặng (D3.js / Vis.js / Cytoscape)** | Để vẽ sơ đồ cây phả hệ linh hoạt có thể kéo thả node. | Phình kích thước bundle single-file HTML thêm 500KB - 1MB, gây lag khi load trên Telegram Webview di động. | Tự thiết kế Component Timeline Tree phẳng bằng Tailwind/CSS flex, tối ưu hoàn toàn cho mobile screens. |
| **Lưu Session Nonce/Token vào Google Sheets** | Lưu token phiên làm việc để invalidate session. | Mỗi lần đọc/ghi token vào Google Sheets làm tăng thời gian phản hồi API thêm 1-2 giây và dễ chạm quota GAS. | Xác thực Stateless dựa trên HMAC chữ ký `initData` của Telegram và check `auth_date` trong vòng 24 giờ. |
| **Tự động quét tỷ giá/lãi suất ngân hàng từ Internet** | Cập nhật tự động bảng lãi suất các ngân hàng Việt Nam. | Các trang web ngân hàng đổi DOM thường xuyên, gọi fetch bên ngoài dễ bị timeout (giới hạn 6 phút của GAS) hoặc block IP. | Người dùng tự nhập `interest_rate` thực tế khi tạo hoặc tái tục khoản gửi (nhanh chóng và chính xác 100%). |

---

## Feature Dependencies

Sơ đồ phụ thuộc giữa các tính năng đã có (v1.0) và các tính năng mới (v2.0):

```
┌────────────────────────────────────────────────────────┐
│                   v1.0 EXISTING CORE                   │
│  [DB-01: Sheets DB] ─── [BOT-01: Telegram Web App]     │
│  [DEP-01: Deposit CRUD] ─ [DEP-02: Rollover Action]    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   v2.0 NEW CAPABILITIES                │
│                                                        │
│  [BOT-01] ─────────────► [AUTH-02: HMAC Auth]          │
│                                 │                      │
│                                 ▼                      │
│                          [GAP-03: Chat ID Auto-link]   │
│                                                        │
│  [DEP-02: Rollover] ───► [HIST-01: Lineage Tree]       │
│                                                        │
│  [DEP-01: CRUD] ───────► [STAT-02: Analytics Charts]   │
│                                 ▲                      │
│                                 │                      │
│  [GAP-02: Custom Bank] ─────────┘                      │
│                                                        │
│  [GAP-01: UserSelector] ── (Desktop Mock Auth)         │
└──────────────────────────┬─────────────────────────────┘
```

### Dependency Notes

- **`AUTH-02` (HMAC Auth) phụ thuộc `BOT-01`**: Backend `AuthService.js` lấy `TELEGRAM_BOT_TOKEN` từ Script Properties để kiểm tra chữ ký HMAC của `initData` truyền lên từ SDK `@telegram-apps/sdk`.
- **`GAP-03` (Chat ID Auto-link) phụ thuộc `AUTH-02`**: Sau khi HMAC được xác thực thành công, Telegram `user.id` được trích xuất tin cậy từ `initData` và ghi nhận vào cột `telegram_chat_id` trong sheet `Users`.
- **`HIST-01` (Lineage Tree) phụ thuộc `DEP-02`**: Cây phả hệ phụ thuộc vào cặp trường dữ liệu `parent_id` và `child_id` được ghi lại trong quá trình thực hiện giao dịch Tái tục (Rollover).
- **`STAT-02` (Portfolio Analytics) phụ thuộc `DEP-01` & `GAP-02`**: Biểu đồ phân tích tỷ trọng nhóm các khoản gửi active theo `user_bankcode` (hỗ trợ bankcode nhập tay mới từ `GAP-02`) và theo khoảng thời gian gửi.

---

## MVP Definition (v2.0 Capabilities Scope)

### Launch With (Cốt lõi cho v2.0)

- [x] **AUTH-02 (HMAC Verification)** — Triển khai thuật toán mã hóa HMAC-SHA256 chuẩn mã nguồn Telegram trong `AuthService.js` và cập nhật handler API backend.
- [x] **GAP-03 (Chat ID Auto-linking)** — Tự động ghi `telegram_chat_id` khi gọi API `get_deposits` có `initData` hợp lệ.
- [x] **HIST-01 (Deposit Lineage Tree UI)** — Modal/View trực quan hóa cây dòng tiền tái tục, hiển thị các nút khoản gửi qua các thế hệ và tính tổng lãi kép thu được.
- [x] **STAT-02 (Portfolio Allocation & WAIR)** — Thêm biểu đồ tròn phân bổ theo kỳ hạn (<3m, 3-6m, 6-12m, >12m) và thẻ hiển thị Lãi suất trung bình gia quyền (WAIR).
- [x] **GAP-01 (UserSelector Startup)** — Đưa component lựa chọn tài khoản lên giao diện chính khi chưa có session Telegram.
- [x] **GAP-02 (Dynamic Bank Code Input)** — Cho phép nhập mã ngân hàng tùy chỉnh trực tiếp trên `DepositForm.tsx`.

### Add After Validation (v2.x)

- [ ] **Xuất hình ảnh Phả hệ khoản gửi** — Tính năng chia sẻ sơ đồ cây phả hệ dưới dạng file ảnh PNG để lưu trữ.
- [ ] **Cảnh báo vượt ngưỡng tập trung tài sản** — Hiển thị cảnh báo nếu tỷ trọng tiền gửi ở 1 ngân hàng vượt quá 50% tổng tài sản.

### Future Consideration (v3.0+)

- [ ] **Tái tục phân nhánh (Split/Merge Rollover)** — Hỗ trợ 1 khoản gửi đáo hạn tách làm 2 khoản mới hoặc gộp 2 khoản thành 1 khoản lớn.
- [ ] **So sánh lãi suất thị trường** — Đánh giá hiệu quả lãi suất khoản gửi so với mặt bằng chung thị trường.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| **Xác thực HMAC-SHA256 (`AUTH-02`)** | HIGH | LOW | P1 |
| **Auto-link Chat ID (`GAP-03`)** | HIGH | LOW | P1 |
| **Phân tích Tỷ trọng & WAIR (`STAT-02`)** | HIGH | MEDIUM | P1 |
| **Cây Phả hệ Tái tục (`HIST-01`)** | HIGH | MEDIUM | P1 |
| **Nhập mã Bank tùy chỉnh (`GAP-02`)** | MEDIUM | LOW | P1 |
| **UserSelector Startup (`GAP-01`)** | MEDIUM | LOW | P1 |
| **Cảnh báo Ngưỡng Tỷ trọng Bank** | LOW | LOW | P2 |
| **Export Ảnh Cây Phả hệ** | LOW | MEDIUM | P3 |

**Priority Key:**
- **P1**: Phải có trong bản phát hành v2.0.
- **P2**: Nên có, sẽ bổ sung ở v2.x.
- **P3**: Ý tưởng cho tương lai.

---

## Competitor Feature Analysis

| Feature | Fin-bot-miniapp | Generic Sheet Tracker | Save Manager v2.0 |
|---------|-----------------|----------------──────-|-------------------|
| **Xác thực WebApp** | Lấy Plain Telegram User ID | Không xác thực | **HMAC-SHA256 2-Step Hash** theo tiêu chuẩn bảo mật Telegram |
| **Theo dõi Tái tục** | Không hỗ trợ | Nhập ghi chú thủ công | **Cây Phả hệ Lineage Tree** tự động kết nối `parent_id` ➔ `child_id` |
| **Phân tích Tài sản** | Chi tiêu đơn thuần | Bảng tính tĩnh | **Phân bổ Ngân hàng + Phân bổ Kỳ hạn + Lãi suất gia quyền (WAIR)** |
| **Trải nghiệm Dev** | Yêu cầu Server Docker | Sửa tay trên Sheets | **Chế độ kép (Hybrid)**: Telegram Mini App real + Browser Desktop Mock |

---

## Technical Specifications & Implementations

### 1. Telegram HMAC-SHA256 Validation Algorithm (`AUTH-02`)

```javascript
// Cấu trúc thuật toán chuẩn Telegram WebApp verification trên Google Apps Script:
// 1. Secret Key = HMAC-SHA256(key="WebAppData", msg=bot_token)
var secretKey = Utilities.computeHmacSha256Signature(botToken, "WebAppData");

// 2. Data Check String = Array of "key=value" sorted alphabetically by key (excluding 'hash'), joined by "\n"
var sortedKeys = Object.keys(params).filter(k => k !== 'hash').sort();
var dataCheckString = sortedKeys.map(k => k + '=' + params[k]).join('\n');

// 3. Calculated Hash = HMAC-SHA256(key=secretKey, msg=dataCheckString) -> converted to hex string
var signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, secretKey);
var calculatedHash = signatureBytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

// 4. Verify calculatedHash === params.hash && (now - auth_date) <= 86400
```

### 2. Deposit Lineage Tree Data Traversal (`HIST-01`)

Đoạn mã thuật toán tìm kiếm cây phả hệ 2 chiều (ngược về khoản đầu tiên & xuôi theo các khoản tái tục tiếp theo):

```typescript
export function buildDepositLineage(targetId: string, allDeposits: Deposit[]): Deposit[] {
  const depositMap = new Map<string, Deposit>(allDeposits.map(d => [d.id, d]));
  const target = depositMap.get(targetId);
  if (!target) return [];

  // 1. Tra cứu ngược về Gốc (Ancestor path)
  const ancestors: Deposit[] = [];
  let curr: Deposit | undefined = target;
  while (curr && curr.parent_id && depositMap.has(curr.parent_id)) {
    curr = depositMap.get(curr.parent_id);
    if (curr) ancestors.unshift(curr); // Thêm vào đầu danh sách
  }

  // 2. Tra cứu xuôi về Con/Cháu (Descendant path)
  const descendants: Deposit[] = [];
  curr = target;
  while (curr && curr.child_id && depositMap.has(curr.child_id)) {
    curr = depositMap.get(curr.child_id);
    if (curr) descendants.push(curr); // Thêm vào cuối danh sách
  }

  // Chuỗi lineage hoàn chỉnh từ Gốc đến Hiện tại và các Con
  return [...ancestors, target, ...descendants];
}
```

---

## Sources

- [Telegram Web Apps Documentation — Validating Data Received via the Mini App](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- [Google Apps Script Utilities Reference — computeHmacSha256Signature](https://developers.google.com/apps-script/reference/utilities/utilities#computehmacsha256signaturevalue,-key)
- [Chart.js Doughnut Documentation](https://www.chartjs.org/docs/latest/charts/doughnut.html)

---
*Feature research completed for: Save Manager v2.0 Polish & Analytics*  
*Researched date: 2026-08-11*
