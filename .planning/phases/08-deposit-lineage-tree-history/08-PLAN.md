---
phase: "08"
plan: "1"
type: "feature"
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/DepositList.tsx
autonomous: false
requirements:
  - HIST-01
  - HIST-02
  - HIST-03
---

# Phase 08 Plan: Deposit Lineage Tree & History

## Tasks

<task>
<read_first>
- frontend/src/components/DepositList.tsx (lines 59-85, 331-384)
- frontend/src/types.ts
</read_first>
<action>
Sửa đổi `frontend/src/components/DepositList.tsx` để bổ sung hiển thị các chỉ số (metrics) và tính năng thu gọn/mở rộng (collapse/expand) cho phần Lịch sử tái tục:
1. Thêm `useState` để quản lý trạng thái hiển thị của phần phả hệ, ví dụ: `const [isLineageExpanded, setIsLineageExpanded] = useState(false);` (khi mở modal sẽ reset hoặc mặc định theo logic).
2. Khi `rolloverChain.length > 1`, tính toán:
   - `accumulatedInterest`: Tổng `expected_interest` của các khoản trong `rolloverChain` có `status !== 'active'` (đã thực hiện).
   - `growthFactor`: Tỉ lệ giữa số tiền khoản hiện tại (`selectedDeposit.amount`) chia cho số tiền khoản gốc (`rolloverChain[0].amount`), hiển thị dạng `x1.xx` (ví dụ `x1.15`).
3. Cập nhật phần UI Lịch sử tái tục (🔗 Lịch sử tái tục):
   - Header sẽ bao gồm tiêu đề, kèm theo hai chỉ số (Tổng lãi tích lũy và Hệ số tăng trưởng).
   - Có thể click vào header để toggle trạng thái `isLineageExpanded`.
   - Nếu `isLineageExpanded` là true, hiển thị danh sách dòng thời gian dọc ở bên dưới.
</action>
<acceptance_criteria>
- Hàm tính `accumulatedInterest` tính đúng tổng của `expected_interest` cho các khoản có `status !== 'active'`.
- Hàm tính `growthFactor` hiển thị định dạng `x1.xx` chính xác.
- Phần hiển thị chuỗi tái tục có thể toggle bằng `isLineageExpanded`.
- UI vẫn giữ nguyên cấu trúc timeline dọc bằng CSS (`border-left`) không làm hỏng layout hiện tại.
</acceptance_criteria>
</task>

## Verification
- [ ] Việc duyệt phả hệ ngược/xuôi (`parent_id` ↔ `child_id`) hoạt động ổn định nhờ code có sẵn (HIST-01).
- [ ] Giao diện lịch sử hiển thị dưới dạng biểu đồ timeline cây dọc bằng CSS/HTML (HIST-02).
- [ ] Phần header lịch sử tái tục hiển thị đầy đủ tổng lãi tích lũy và hệ số tăng trưởng (HIST-03).

## Must Haves
- [ ] D-01: Timeline dọc CSS (Không sử dụng thư viện biểu đồ hay SVG).
- [ ] D-02: Tích hợp vào modal chi tiết của DepositList, hỗ trợ collapse/expand.
- [ ] D-03: Header phả hệ hiển thị tổng lãi tích lũy và hệ số tăng trưởng (x1.xx).
- [ ] D-04: Tất cả tính toán ở frontend, dùng dữ liệu `deposits` hiện có.

## Artifacts this phase produces
- Không có component hoặc định dạng (symbol) mới được tạo, chỉ sửa đổi `DepositList` có sẵn.
