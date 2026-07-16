---
status: complete
quick_id: "260716-dpa"
title: "Sửa lỗi biểu đồ tăng trưởng trên mobile và thêm sort dropdown cho danh sách tiết kiệm"
date: "2026-07-16"
---

# Summary 260716-dpa: Sửa lỗi biểu đồ tăng trưởng trên mobile và thêm sort dropdown cho danh sách tiết kiệm

## What was done

- **Sửa lỗi biểu đồ tăng trưởng trên mobile**: Thêm `chartWidth` vào mảng dependencies của `useEffect` vẽ chart trong [GrowthChart.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/GrowthChart.tsx). Khi canvas thay đổi kích thước trên mobile, `useEffect` vẽ lại chart sẽ hoạt động, giải quyết lỗi canvas trống.
- **Thêm sort dropdown cho danh sách tiết kiệm**: Bổ sung dropdown sắp xếp (chọn `sortBy`) trong [DepositList.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/DepositList.tsx) để sort theo ngày đáo hạn (tăng dần), số tiền gốc (giảm dần), lãi dự kiến (giảm dần), và lãi thực tế (giảm dần). Sắp xếp hoạt động chính xác và giao diện flex 2 select box được tối ưu cho mobile Telegram.

## Verification

- Chạy `npm run build` tại `frontend/` thành công không có lỗi compile nào.
