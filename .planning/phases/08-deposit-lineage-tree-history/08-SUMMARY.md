# Phase 08 Summary: Deposit Lineage Tree & History

## Plan Information
- **Phase**: 08
- **Plan**: 1
- **Status**: Completed

## Tasks Completed
- Sửa đổi `DepositList.tsx` để tích hợp tính năng phả hệ tái tục (Lineage tree).
- Thêm state `isLineageExpanded` để quản lý trạng thái hiển thị của phần lịch sử tái tục.
- Bổ sung tính toán `accumulatedInterest` (Tổng lãi tích lũy) cho các khoản thuộc chuỗi có trạng thái khác 'active'.
- Bổ sung tính toán `growthFactor` (Hệ số tăng trưởng) hiển thị tỷ lệ tiền hiện tại / tiền gốc.
- Cập nhật UI có thể click để Mở rộng/Thu gọn timeline tái tục.
- Xây dựng phần UI cho Lineage History với timeline dọc (`border-left`) và hai ô metrics bên trên, giữ nguyên cấu trúc design hiện tại.

## Files Modified
- `frontend/src/components/DepositList.tsx`

## Issues/Deviations
- Không có vấn đề hay thay đổi so với plan. Cấu trúc UI được bám sát thiết kế dark-theme bằng Tailwind. Lãi thực tế được hiển thị thông qua helper functions hiện tại. Lệnh build `npm run build` không phát sinh lỗi.
