---
phase: "07"
plan: "1"
type: "feature"
wave: 1
depends_on: []
files_modified:
  - "frontend/src/components/TermShareChart.tsx"
  - "frontend/src/components/WairKpiCard.tsx"
  - "frontend/src/components/App.tsx"
autonomous: true
requirements:
  - STAT-02
  - STAT-03
  - STAT-04
---

# Phase 07: Portfolio Analytics & Asset Metrics

## Tasks

```xml
<task>
  <read_first>
    - frontend/src/components/BankShareChart.tsx
  </read_first>
  <action>
    Tạo file `frontend/src/components/TermShareChart.tsx`.
    Copy pattern từ `BankShareChart.tsx`.
    Export component `TermShareChart` nhận props chứa mảng `deposits`.
    Lọc các `deposits` có trạng thái `active`.
    Tính toán chênh lệch số tháng giữa `maturity_at` và `created_at` (parse ngày DD/MM/YYYY).
    Nhóm tổng số tiền (amount) vào 4 buckets: `< 3 tháng`, `3 - 6 tháng`, `6 - 12 tháng`, `> 12 tháng`.
    Khởi tạo Chart.js Doughnut chart với các buckets này. Đảm bảo dọn dẹp chart.destroy() trong useEffect khi unmount.
  </action>
  <acceptance_criteria>
    - Source assertion: `frontend/src/components/TermShareChart.tsx` tồn tại và export `TermShareChart`.
    - Behavior assertion: Gọi `chart.destroy()` trong hàm cleanup của `useEffect`.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - frontend/src/types.ts
  </read_first>
  <action>
    Tạo file `frontend/src/components/WairKpiCard.tsx`.
    Export component `WairKpiCard` nhận props chứa mảng `deposits`.
    Lọc các `deposits` có trạng thái `active`.
    Tính Lãi suất trung bình gia quyền (WAIR): `Tổng (amount * interest_rate) / Tổng (amount)`.
    Xử lý trường hợp `Tổng (amount) === 0` (trả về 0 hoặc N/A).
    Render giao diện thẻ hiển thị phần trăm WAIR.
  </action>
  <acceptance_criteria>
    - Source assertion: `frontend/src/components/WairKpiCard.tsx` tồn tại và export `WairKpiCard`.
    - Behavior assertion: WAIR được tính dựa trên `amount` và `interest_rate`.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - frontend/src/components/App.tsx
    - frontend/src/components/BankShareChart.tsx
    - frontend/src/components/TermShareChart.tsx
    - frontend/src/components/WairKpiCard.tsx
  </read_first>
  <action>
    Sửa đổi `frontend/src/components/App.tsx`.
    Cập nhật type `ActiveTab` thêm `'analytics'`.
    Trong UI phần render các tab, thêm một nút "📊 Analytics" gọi `setActiveTab('analytics')`.
    Trong phần nội dung tab, thêm điều kiện render cho tab `'analytics'`.
    Trong tab `'analytics'`, render các components: `WairKpiCard`, `BankShareChart`, và `TermShareChart`.
    Truyền dữ liệu `deposits` vào các component này.
  </action>
  <acceptance_criteria>
    - Source assertion: `ActiveTab` trong `App.tsx` bao gồm `'analytics'`.
    - Source assertion: Nút tab "Analytics" được render.
    - Source assertion: `BankShareChart`, `TermShareChart`, và `WairKpiCard` được import và render bên trong tab analytics.
  </acceptance_criteria>
</task>
```

## Verification

- Tab "Analytics" xuất hiện trong giao diện chính.
- Biểu đồ Doughnut phân bổ tài sản theo ngân hàng và theo kỳ hạn render thành công và không bị duplicate canvas khi chuyển tab.
- Thẻ KPI WAIR hiển thị chính xác Lãi suất trung bình gia quyền.

## Must_haves

truths:
- D-01: Tab riêng "Analytics" — tab thứ 3 bên cạnh Deposits và Gold trong `App.tsx`. `ActiveTab` type thêm `'analytics'`.
- D-02: Kỳ hạn tính bằng `maturity_at - created_at` (parse DD/MM/YYYY). 4 bucket: `<3 tháng`, `3-6 tháng`, `6-12 tháng`, `>12 tháng`.
- D-03: Chỉ 1 thẻ KPI duy nhất — WAIR (%) = `Σ(amount × interest_rate) / Σ(amount)` cho deposits `active`.
- D-04: Reuse pattern BankShareChart — `useRef + useEffect + chart.destroy()`, dark palette cố định.

## Artifacts this phase produces

- `frontend/src/components/TermShareChart.tsx` (File mới)
- `TermShareChart` (React Component)
- `frontend/src/components/WairKpiCard.tsx` (File mới)
- `WairKpiCard` (React Component)
- `ActiveTab` (Type update trong `App.tsx`)
