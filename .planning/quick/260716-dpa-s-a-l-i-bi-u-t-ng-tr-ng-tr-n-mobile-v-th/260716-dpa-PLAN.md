---
quick_id: "260716-dpa"
title: "Sửa lỗi biểu đồ tăng trưởng trên mobile và thêm sort dropdown cho danh sách tiết kiệm"
date: "2026-07-16"
files_modified:
  - frontend/src/components/GrowthChart.tsx
  - frontend/src/components/DepositList.tsx
---

# Plan 260716-dpa: Sửa lỗi biểu đồ tăng trưởng trên mobile và thêm sort dropdown cho danh sách tiết kiệm

## Overview

- **Yêu cầu 1**: Biểu đồ tăng trưởng không hiển thị trên mobile. Nguyên nhân do `useEffect` vẽ chart không có `chartWidth` trong danh sách dependencies. Khi `chartWidth` thay đổi làm component re-render, canvas size thay đổi nhưng chart không được vẽ lại dẫn đến canvas trống. Giải pháp: Thêm `chartWidth` vào mảng dependencies của `useEffect` vẽ chart.
- **Yêu cầu 2**: Thêm sort dropdown theo amount / lãi dự kiến / lãi thực tế cho danh sách tiết kiệm (không áp dụng cho tab vàng). Giải pháp: Bổ sung state `sortBy` vào `DepositList.tsx`, cập nhật hàm sort `getFilteredDeposits` và render dropdown select cùng dòng với bank filter.

## Tasks

<task id="260716-dpa-T1">
<objective>Sửa lỗi biểu đồ tăng trưởng không hiển thị trên mobile</objective>
<action>
Cập nhật file `frontend/src/components/GrowthChart.tsx`:
- Tìm dòng `useEffect` vẽ biểu đồ (bắt đầu khoảng dòng 50, kết thúc khoảng dòng 219).
- Thêm `chartWidth` vào mảng dependencies ở cuối `useEffect` (dòng 219).
</action>
<acceptance_criteria>
- File `frontend/src/components/GrowthChart.tsx` có `chartWidth` trong mảng dependencies của `useEffect` vẽ chart.
</acceptance_criteria>
<verify>
Chạy test hoặc build thử để đảm bảo không lỗi cú pháp.
</verify>
</task>

<task id="260716-dpa-T2">
<objective>Thêm sort dropdown cho danh sách tiết kiệm</objective>
<action>
Cập nhật file `frontend/src/components/DepositList.tsx`:
- Khai báo kiểu dữ liệu:
  `type SortOption = 'maturity_at' | 'amount' | 'expected_interest' | 'actual_interest';`
- Thêm state `sortBy` trong component `DepositList`:
  `const [sortBy, setSortBy] = useState<SortOption>('maturity_at');`
- Cập nhật hàm `getFilteredDeposits` để thực hiện sort theo tùy chọn được chọn:
  - `maturity_at`: Sort theo ngày đáo hạn tăng dần (nhỏ -> lớn).
  - `amount`: Sort theo số tiền gốc giảm dần (lớn -> nhỏ).
  - `expected_interest`: Sort theo lãi dự kiến giảm dần (lớn -> nhỏ).
  - `actual_interest`: Sort theo lãi thực tế giảm dần (lớn -> nhỏ) dựa vào kết quả của `getActualInterest(item)`.
- Thêm dropdown select để thay đổi `sortBy`.
  - Đặt dropdown này bên cạnh Bank Filter để hiển thị gọn gàng trên mobile (trong cùng một container flex flex-col sm:flex-row gap-2).
</action>
<acceptance_criteria>
- Dropdown select xuất hiện và hoạt động đúng khi chọn các tiêu chí sort.
- Tab tiết kiệm hiển thị đúng thứ tự sort đã chọn.
</acceptance_criteria>
<verify>
Chạy build thử frontend để đảm bảo không lỗi compile.
</verify>
</task>

## Verification

```bash
# Kiểm tra build frontend
cd frontend && npm run build
```
