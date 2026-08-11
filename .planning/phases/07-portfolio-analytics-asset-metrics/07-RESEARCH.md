# Phase 07 Research: Portfolio Analytics & Asset Metrics

## 1. Mục tiêu (Goal)
- Bổ sung tab **Analytics** vào giao diện chính.
- Triển khai 3 thành phần phân tích dữ liệu cho các khoản tiết kiệm đang hoạt động (`status === 'active'`):
  1. Biểu đồ phân bổ theo ngân hàng.
  2. Biểu đồ phân bổ theo nhóm kỳ hạn.
  3. Thẻ KPI hiển thị Lãi suất trung bình gia quyền (WAIR).
- Không yêu cầu thay đổi phía backend (`types.ts` giữ nguyên).

## 2. Vị trí tích hợp (Integration Points)
- **`frontend/src/components/App.tsx`**:
  - Cập nhật kiểu `ActiveTab`: Thêm `'analytics'`.
  - Thêm nút chuyển tab "📊 Analytics" cạnh "💰 Tiết kiệm" và "🥇 Vàng".
  - Chuyển `BankShareChart` vào tab này hoặc render mới. Truyền dữ liệu `deposits` từ `useDepositsCache`.
- **`frontend/src/components/TermShareChart.tsx` (Mới)**:
  - Copy pattern hoàn toàn từ `BankShareChart.tsx` (đăng ký `chart.js`, dùng `centerTextPlugin`, `useRef`, dọn dẹp `destroy()`).
- **`frontend/src/components/WairKpiCard.tsx` (Mới)**:
  - Component hiển thị con số phần trăm WAIR.

## 3. Chi tiết triển khai (Implementation Details)

### 3.1. Tính toán nhóm kỳ hạn (Maturity Buckets)
- Cần hàm parse ngày từ `DD/MM/YYYY` sang object `Date`.
- Công thức tính số tháng: `(year2 - year1) * 12 + (month2 - month1)`. Có thể làm tròn hoặc phân loại thô dựa trên chênh lệch ngày.
- 4 nhóm Bucket:
  - `< 3 tháng`
  - `3 - 6 tháng`
  - `6 - 12 tháng`
  - `> 12 tháng`

### 3.2. Tính toán WAIR (Weighted Average Interest Rate)
- Lọc danh sách: `activeDeposits = deposits.filter(d => d.status === 'active')`
- Công thức: `totalWeightedInterest = sum(d.amount * d.interest_rate)`, `totalAmount = sum(d.amount)`
- `WAIR = totalWeightedInterest / totalAmount` (đơn vị %).
- Xử lý chia cho 0 nếu `totalAmount === 0`.

### 3.3. Tái sử dụng Pattern Biểu đồ
- **Plugin Text ở giữa**: Tái sử dụng `centerTextPlugin` từ `BankShareChart.tsx` để hiển thị chữ "Tổng tài sản" và giá trị tiền.
- **Màu sắc**: Sử dụng lại mảng `userColors` hoặc định nghĩa mảng màu mới hợp với nền dark theme `#0e1621`.

## 4. Rủi ro & Lưu ý (Risks & Notes)
- Việc tính số tháng chênh lệch giữa 2 ngày (created_at và maturity_at) cần chính xác để tránh rơi sai bucket, tốt nhất tính theo số ngày `diffDays / 30`.
- Chú ý dọn dẹp chart.js instance (`chart.destroy()`) khi unmount tab Analytics để tránh memory leak và lỗi canvas.

## RESEARCH COMPLETE
