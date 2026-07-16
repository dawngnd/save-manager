---
status: complete
quick_id: "260716-dx5"
title: "Hiển thị lãi dự kiến màu vàng cho khoản tiết kiệm active trên card"
date: "2026-07-16"
---

# Summary 260716-dx5: Hiển thị lãi dự kiến màu vàng cho khoản tiết kiệm active trên card

## What was done

- **Cập nhật hiển thị lãi cho khoản tiết kiệm active**: Thay đổi logic render lãi trong file [DepositCard.tsx](file:///home/dangnd/code/github/save-manager/frontend/src/components/DepositCard.tsx). Khi khoản gửi ở trạng thái `active`, hiển thị lãi dự kiến (`+expected_interest` kèm chữ "dự kiến") với font màu vàng (`text-[#ff9f1a]`).
- **Giữ nguyên lãi thực tế**: Đối với các trạng thái khác (`matured` hoặc `rolled_over`), tiếp tục hiển thị lãi thực tế (`actualInterest` kèm chữ "lãi thực") với màu xanh/đỏ như cũ.

## Verification

- Chạy `npm run build` tại `frontend/` thành công không có lỗi compile nào.
