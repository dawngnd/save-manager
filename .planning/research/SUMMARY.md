# Project Research Summary

**Project:** Save Manager (v2.0 Polish & Analytics)  
**Domain:** Google Apps Script + Google Sheets DB + Vite/React SPA + Telegram Web App SDK  
**Researched:** 2026-08-11  
**Confidence:** HIGH  

## Executive Summary

Save Manager là ứng dụng quản lý tiết kiệm cá nhân chạy dưới dạng Single-Page Application (React/Vite) được đóng gói thành một file HTML duy nhất (`vite-plugin-singlefile`) served qua Telegram Mini App / GitHub Pages, sử dụng Google Apps Script (GAS) `doPost` REST endpoints và Google Sheets làm cơ sở dữ liệu. Cột mốc **v2.0 Polish & Analytics** tập trung bổ sung 3 nhóm tính năng chính: Xác thực chữ ký HMAC-SHA256 (`AUTH-02`), trực quan hóa phả hệ khoản gửi tái tục (`HIST-01`), phân tích tỷ trọng danh mục tài sản & lãi suất gia quyền (`STAT-02`), cùng các cải tiến trải nghiệm người dùng (`GAP-01`, `GAP-02`, `GAP-03`).

Giải pháp kiến trúc đề xuất duy trì nguyên vẹn mô hình v1.0 đã được chứng minh hiệu quả: Xử lý toàn bộ logic phân tích và duyệt đồ thị cây phả hệ ở phía client (React SPA) nhằm giảm tải cho GAS server và tránh timeout (6s); áp dụng xác thực mã hóa HMAC-SHA256 không trạng thái (stateless) 2 bước ở phía backend (`AuthService.js`) bằng phương thức native `Utilities.computeHmacSha256Signature()`; sử dụng bộ icon siêu nhẹ `lucide-react` dựng UI timeline/tree trực quan bằng CSS Flexbox/SVG để giữ kích thước file bundle dưới 1.5MB.

Các rủi ro kỹ thuật cốt lõi đã được nhận diện và đề ra phương án phòng ngừa cụ thể: (1) Tránh lỗi đảo ngược tham số `(value, key)` và biến đổi UTF-16 làm hỏng chuỗi byte key trong GAS HMAC; (2) Tránh lặp vô tận (infinite recursion) khi duyệt cây phả hệ do dữ liệu Sheets chứa tham chiếu vòng bằng thuật toán phát hiện chu trình `Set<string>`; (3) Tránh rò rỉ bộ nhớ canvas và lỗi màu chữ Chart.js khi đổi giao diện Telegram Light/Dark mode bằng việc quản lý lifecycle với React `useRef` và lắng nghe sự kiện `themeChanged`.

---

## Key Findings

### Recommended Stack

Bổ sung tối giản thư viện mới nhằm bảo toàn kiến trúc Single-file HTML bundle siêu nhẹ:

**Core technologies:**
- **lucide-react (`^1.31.0`)**: Bộ icon UI dạng SVG hỗ trợ tree-shaking (`GitCommit`, `RotateCw`, `Building2`, `PieChart`, `Layers`) giúp minh họa các node phả hệ và biểu đồ phân tích mà không làm tăng đáng kể dung lượng bundle.
- **Google Apps Script `Utilities` (Native)**: Xử lý tính toán chữ ký HMAC-SHA256 xác thực `initData` phía GAS backend không cần phụ thuộc thư viện mã hóa npm ngoài (`crypto-js`).
- **Chart.js (`^4.5.1`)**: Tận dụng thư viện Chart.js đã tích hợp từ v1.0 để vẽ biểu đồ tròn/bánh quy (Doughnut/Pie) phân bổ tài sản theo ngân hàng và nhóm kỳ hạn.
- **@telegram-apps/sdk (`^3.11.8`)**: Trích xuất chuỗi `initData` chứa tham số `auth_date`, `user`, `hash` truyền lên backend.
- **Vite + vite-plugin-singlefile (`^6.1.0` / `^2.3.3`)**: Đóng gói toàn bộ mã nguồn frontend thành single-file `index.html` duy nhất để deploy lên GitHub Pages / GAS.

### Expected Features

**Must have (table stakes - Cốt lõi v2.0):**
- **Xác thực chữ ký HMAC-SHA256 (`AUTH-02`)**: Ngăn chặn giả mạo API request bên ngoài Telegram Mini App bằng thuật toán HMAC chuẩn Telegram.
- **Tự động liên kết Chat ID (`GAP-03`)**: Tự động lưu `telegram_chat_id` từ `initData` vào sheet `Users` khi gọi API `get_deposits`.
- **Tra cứu Phả hệ Khoản gửi (`HIST-01`)**: Modal xem cây phả hệ các thế hệ khoản gửi đã tái tục qua quan hệ `parent_id` và `child_id`.
- **Phân tích Tỷ trọng & WAIR (`STAT-02`)**: Biểu đồ phân bổ khoản gửi active theo nhóm kỳ hạn (<3M, 3-6M, 6-12M, >12M) và thẻ KPI Lãi suất trung bình gia quyền (Weighted Average Interest Rate).
- **UserSelector màn hình khởi động (`GAP-01`)**: Tích hợp `UserSelector` dropdown ở header/start view cho chế độ Mock Dev trên Desktop.
- **Nhập tay mã Ngân hàng mới (`GAP-02`)**: Toggle chuyển đổi giữa Select dropdown và Input nhập tay mã ngân hàng trong `DepositForm`.

**Should have (competitive - Differentiators):**
- **Interactive Deposit Lineage Tree & Compound Yield Tracker**: Timeline trực quan hóa chuỗi tái tục và tính tổng lãi kép thu được từ khoản gốc ban đầu qua nhiều chu kỳ.
- **Chế độ Auth Kép (Hybrid Auth with Desktop Fallback)**: Tự động xác thực HMAC khi chạy trong TWA, hỗ trợ Mock Auth linh hoạt khi test local desktop browser (`npm run dev`).

**Defer (v2+ / Future):**
- **Xuất hình ảnh Phả hệ khoản gửi**: Export sơ đồ cây ra file ảnh PNG.
- **Cảnh báo vượt ngưỡng tập trung tài sản**: Cảnh báo tự động khi 1 ngân hàng chiếm >50% tổng tài sản.
- **Tái tục phân nhánh (Split/Merge Rollover)**: Tách 1 khoản đáo hạn thành 2 khoản mới hoặc gộp 2 khoản thành 1.

### Architecture Approach

Kiến trúc v2.0 giữ nguyên mô hình phân tách Frontend SPA ↔ GAS Backend ↔ Google Sheets DB, bổ sung lớp Interceptor kiểm tra an ninh và các module tiện ích xử lý dữ liệu in-memory phía client.

**Major components:**
1. **`AuthService.js` (GAS Backend Interceptor)**: Kiểm tra tính hợp lệ của chữ ký HMAC-SHA256 và thời hạn 24h của `initData` trước khi cho phép router `Code.js` thực thi các hành động ghi/đọc dữ liệu.
2. **Lineage Tree Engine (`utils/lineage.ts` + `DepositLineageModal.tsx`)**: Module TypeScript thuần duyệt đồ thị 2 chiều (ngược về Gốc, xuôi về Con) từ danh sách deposit phẳng cached ở client để dựng UI timeline.
3. **Portfolio Analytics Engine (`utils/analytics.ts` + `TermShareChart.tsx`)**: Module phân loại khoản gửi active vào các bucket kỳ hạn (<3M, 3-6M, 6-12M, >12M) và tính toán các chỉ số tài chính (WAIR, tổng lãi dự kiến).
4. **`UserRepository.js` & `api.ts`**: Tự động liên kết `telegram_chat_id` được xác thực với người dùng hiện tại trong cơ sở dữ liệu Google Sheets.

### Critical Pitfalls

1. **Lỗi thứ tự tham số và biến đổi Byte Key trong GAS HMAC (`AUTH-02`)**: GAS `Utilities.computeHmacSha256Signature(value, key)` có thứ tự tham số ngược với Node.js `(data, key)`. Ngoài ra, key trung gian `secret_key` phải giữ nguyên dạng `Byte[]` truyền vào lần gọi HMAC thứ 2, tránh chuyển sang chuỗi UTF-16 gây sai lệch mã hóa byte.
2. **Vòng lặp vô hạn và vỡ UI do dữ liệu hỏng (`HIST-01`)**: Dữ liệu Sheets bị chỉnh sửa thủ công tạo tham chiếu vòng (`parent_id`) hoặc trỏ tới node gốc bị xóa. Cần sử dụng thuật toán phát hiện chu trình `visited: Set<string>` và render fallback "Khoản gốc N/A" để tránh crash React app.
3. **Chart.js Rò rỉ Canvas & Tàng hình chữ khi đổi Theme Telegram (`STAT-02`)**: Canvas re-render không destroy Chart cũ sẽ quăng lỗi console. Cần cleanup trong `useEffect` qua `chartRef.current.destroy()` và lắng nghe sự kiện `themeChanged` của Telegram SDK để cập nhật màu chữ theo Light/Dark theme.
4. **Tính trùng tiền tài sản cũ `rolled_over` vào Analytics (`STAT-02`)**: Bảng tổng hợp phân bổ ngân hàng/kỳ hạn bắt buộc phải filter `status === 'active'` (hoặc `'matured'`), tránh cộng dồn tiền gốc của các khoản gửi lịch sử đã được tái tục.
5. **Phình kích thước Bundle HTML Single-file & Lỗi kéo vuốt TWA (`HIST-01`)**: Sử dụng thư viện đồ thị nặng (D3/React Flow) làm phình bundle `index.html` >2MB. Cần tự dựng tree component bằng CSS/SVG nhẹ và gọi `expandViewport()` để ngăn gesture swipe-down đóng TWA khi cuộn sơ đồ cây.

---

## Implications for Roadmap

Cấu trúc các Phase đề xuất cho cột mốc v2.0 dựa trên thứ tự phụ thuộc kiến trúc và giảm thiểu rủi ro:

### Phase 1: Security & Auth Integration (AUTH-02, GAP-03)
**Rationale:** Xác thực an ninh và tự động liên kết ID là nền tảng bảo mật cho toàn bộ hệ thống. Cần hoàn thiện trước khi mở rộng UI.  
**Delivers:** Class `AuthService.js` xử lý HMAC-SHA256 trên GAS, cập nhật `Code.js` router kiểm tra auth, tự động cập nhật `telegram_chat_id` trong `UserRepository.js`, và cơ chế fallback mock dev ở client `api.ts`.  
**Addresses:** `AUTH-02`, `GAP-03`.  
**Avoids:** Đảo ngược tham số GAS HMAC, biến đổi UTF-16 byte key, và lỗi lockout môi trường dev local.

### Phase 2: Portfolio Analytics & Asset Metrics (STAT-02)
**Rationale:** Phân tích tài sản hoạt động trên mảng khoản gửi active sẵn có ở client, mang lại giá trị trực quan ngay mà không cần thay đổi schema backend.  
**Delivers:** Utility `utils/analytics.ts` phân loại kỳ hạn & tính WAIR, component `TermShareChart.tsx` (Chart.js Doughnut), và `PortfolioAnalyticsModal.tsx`.  
**Addresses:** `STAT-02`.  
**Uses:** Chart.js `doughnut` controller, React `useRef` lifecycle.  
**Implements:** Client-side active deposits filter loại bỏ tính trùng tài sản.  
**Avoids:** Canvas reuse leaks, lỗi màu chữ theme Telegram, và tính trùng tiền lịch sử.

### Phase 3: Deposit Lineage Tree & Rollover History (HIST-01)
**Rationale:** Duyệt cây phả hệ dựa trên 2 trường `parent_id` và `child_id` đã có từ v1.0. Tách biệt utility module `lineage.ts` giúp test thuật toán độc lập trước khi gắn UI modal.  
**Delivers:** `utils/lineage.ts` (tra cứu 2 chiều + cycle detection), `DepositLineageModal.tsx` (dựng timeline vertical node bằng CSS/SVG), và nút "Xem phả hệ" trên `DepositCard.tsx`.  
**Addresses:** `HIST-01`.  
**Uses:** Icons `lucide-react` (`GitCommit`, `RotateCw`, `ChevronRight`).  
**Avoids:** Stack overflow do lặp vô hạn (nhờ `Set<string>`), phình bundle single-file >1.5MB.

### Phase 4: UI Polish & Form Gap Fixes (GAP-01, GAP-02)
**Rationale:** Hoàn thiện các góc khuất giao diện và trải nghiệm nhập liệu người dùng để sẵn sàng release v2.0.  
**Delivers:** `UserSelector.tsx` dropdown tích hợp vào header/startup view `App.tsx`, toggle nhập mã ngân hàng thủ công trong `DepositForm.tsx`, và kiểm tra build single-file bundle cuối cùng.  
**Addresses:** `GAP-01`, `GAP-02`.

### Phase Ordering Rationale

- **Luồng Phụ thuộc:** Bảo mật backend (Phase 1) ➔ Phân tích tài sản client (Phase 2) ➔ Tra cứu phả hệ (Phase 3) ➔ UI Polish & Form Fix (Phase 4).
- **Cô lập Rủi ro:** Đưa mã hóa GAS HMAC lên Phase 1 để verify sớm trên môi trường thực tế Telegram trước khi đụng vào giao diện nâng cao.
- **Tối ưu Bundle:** Đảm bảo không nạp thêm thư viện đồ thị nặng trong Phase 3 để Phase 4 đóng gói single-file diễn ra trơn tru.

### Research Flags

Các phase có mẫu thiết kế chuẩn (không cần phase nghiên cứu sâu thêm):
- **Phase 1 (AUTH-02, GAP-03):** Thuật toán HMAC Telegram và `Utilities.computeHmacSha256Signature` của GAS đã được nghiên cứu kỹ với code snippet kiểm chứng.
- **Phase 2 (STAT-02):** Tích hợp Chart.js canvas ref và công thức WAIR đã được xác minh hoàn chỉnh.
- **Phase 3 (HIST-01):** Thuật toán duyệt danh sách liên kết 2 chiều và phát hiện chu trình đã chuẩn hóa.
- **Phase 4 (GAP-01, GAP-02):** Form toggle và dropdown React state tuân thủ pattern chuẩn của codebase.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `lucide-react`, `Chart.js`, `@telegram-apps/sdk` và GAS `Utilities` đều đã kiểm tra tính tương thích với React 19 / Vite 6. |
| Features | HIGH | Phạm vi các tính năng table stakes và differentiators bám sát yêu cầu v2.0, loại bỏ tính năng phình scope. |
| Architecture | HIGH | Mô hình Single-file SPA + GAS REST API + Sheets DB đã được kiểm chứng hoạt động tốt từ v1.0 production. |
| Pitfalls | HIGH | Các bẫy kỹ thuật về mã hóa GAS HMAC, rò rỉ canvas, tính trùng tài sản và lặp cây đã có giải pháp phòng tránh cụ thể. |

**Overall confidence:** HIGH

### Gaps to Address

- **Kiểm thử thực tế HMAC trên GAS V8 Runtime:** Mặc dù logic mã thuật toán đã chuẩn xác, cần test trực tiếp `AuthService.verifyWebAppData` trên GAS backend với payload Telegram thật qua `clasp push` ở Phase 1.
- **Lắng nghe sự kiện Theme Telegram:** Đảm bảo sự kiện `themeChanged` từ Telegram SDK cập nhật mượt mà bảng màu Chart.js trên cả thiết bị iOS và Android trong Phase 2.

---

## Sources

### Primary (HIGH confidence)
- [Telegram Web Apps Documentation — Validating Data Received via the Mini App](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) — HMAC-SHA256 initData validation specification.
- [Google Apps Script Utilities Reference — computeHmacSha256Signature](https://developers.google.com/apps-script/reference/utilities/utilities#computehmacsha256signaturevalue,-key) — GAS cryptographic API syntax.
- [Chart.js Documentation — Integration & Lifecycle](https://www.chartjs.org/docs/latest/getting-started/integration.html) — React canvas cleanup & chart options.
- [`Save Manager codebase & PROJECT.md`](file:///home/dangnd/code/github/save-manager/.planning/PROJECT.md) — Kiến trúc v1.0, backend repositories và cấu hình build.

---
*Research completed: 2026-08-11*  
*Ready for roadmap: yes*  
