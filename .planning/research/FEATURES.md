# Mortgage Loan Feature Research (v3.0)

**Domain:** Personal Finance / Mortgage Loan Estimation — Vietnamese Banking Context
**Researched:** 2026-08-12
**Confidence:** HIGH
**Banks Analyzed:** Vietinbank, BIDV, Vietcombank, VPBank

---

## Loan Structure Research

### Cấu trúc lãi suất 2 giai đoạn (Two-Stage Interest Rate)

Tất cả ngân hàng lớn tại Việt Nam đều áp dụng mô hình **lãi suất cố định ưu đãi → lãi suất thả nổi** cho các khoản vay mua nhà:

| Giai đoạn | Mô tả | Lãi suất phổ biến (2026) |
|-----------|-------|-----------------------------|
| **Ưu đãi (Fixed)** | Cố định trong 6–36 tháng đầu, tùy gói sản phẩm | 6%–11%/năm |
| **Thả nổi (Floating)** | Sau ưu đãi, điều chỉnh định kỳ 3/6/12 tháng | 12%–15%/năm |

### Công thức lãi suất thả nổi

```
Lãi suất thả nổi = Lãi suất tham chiếu + Biên độ cố định
```

- **Lãi suất tham chiếu**: Thường là lãi suất huy động kỳ hạn 12/13/24 tháng của ngân hàng đó (biến động theo thị trường).
- **Biên độ**: Cố định suốt thời gian vay, thường 3.0%–4.0%/năm.
- **Tần suất điều chỉnh**: 3 tháng, 6 tháng, hoặc 12 tháng/lần (theo hợp đồng).

### So sánh theo ngân hàng

| Ngân hàng | Thời gian ưu đãi | Lãi suất ưu đãi | Biên độ thả nổi | Thời hạn tối đa | LTV tối đa | Điểm nổi bật |
|-----------|-------------------|------------------|-----------------|------------------|------------|--------------|
| **Vietcombank** | 6–24 tháng | 9.6%–13.9% | Thấp, ổn định | 30–35 năm | 70%–100% | Minh bạch, biên độ thấp nhất nhóm Big 4 |
| **BIDV** | 6–18 tháng | 9.7%–13.5% | ~3.5% | 30–40 năm | 70%–100% | Kỳ hạn dài nhất, ưu đãi dự án liên kết |
| **Vietinbank** | Lên đến 36 tháng | ~10% | ~3.5% | 30–35 năm | 70%–100% | Ưu đãi dài nhất, đa mục đích |
| **VPBank** | Linh hoạt | Cạnh tranh | Cao hơn Big 3 | 25 năm | Lên đến 100% | Duyệt nhanh số hóa, LTV cao |

---

## Repayment Methods

### Phương thức 1: Dư nợ giảm dần (Equal Principal / Diminishing Balance)

Phương thức phổ biến nhất tại các ngân hàng Việt Nam. Tiền gốc trả đều hàng tháng, lãi tính trên dư nợ còn lại.

**Công thức:**
```
Gốc mỗi tháng = Tổng tiền vay / Tổng số tháng vay
Lãi tháng i    = Dư nợ còn lại(i) × (Lãi suất năm / 12)
Tổng trả tháng = Gốc mỗi tháng + Lãi tháng tương ứng
```

**Đặc điểm:**
- Tổng tiền trả **giảm dần** theo thời gian
- Áp lực tài chính **cao ở đầu kỳ**, giảm dần về cuối
- Tổng lãi phải trả **thấp hơn** phương thức annuity
- Phù hợp người có thu nhập ổn định và dồi dào

### Phương thức 2: Trả đều hàng tháng (Annuity / Equal Installment)

Tổng tiền trả mỗi tháng (gốc + lãi) cố định trong suốt kỳ hạn.

**Công thức:**
```
A = P × r(1+r)^n / ((1+r)^n - 1)

Trong đó:
  A = Số tiền trả hàng tháng (cố định)
  P = Tổng tiền vay gốc
  r = Lãi suất tháng (Lãi suất năm / 12)
  n = Tổng số tháng vay
```

**Đặc điểm:**
- Số tiền trả **cố định** → dễ lập ngân sách
- Tỷ trọng gốc/lãi thay đổi: đầu kỳ ~70-80% là lãi
- Tổng lãi phải trả **cao hơn** phương thức giảm dần
- Phù hợp người muốn ổn định dòng tiền

### Bảng so sánh 2 phương thức

| Tiêu chí | Dư nợ giảm dần | Trả đều (Annuity) |
|----------|----------------|---------------------|
| Tổng trả hàng tháng | Giảm dần | Cố định |
| Cách tính lãi | Trên dư nợ còn lại | Trên dư nợ còn lại |
| Áp lực đầu kỳ | Cao | Vừa phải |
| Tổng lãi toàn kỳ | Thấp hơn | Cao hơn |
| Mức phổ biến tại VN | ★★★★★ | ★★★☆☆ |

---

## Key Parameters

### Tham số cấu hình khoản vay

| Tham số | Giá trị phổ biến | Ghi chú |
|---------|-------------------|---------|
| **Tổng tiền vay (P)** | Tùy nhập | Đơn vị triệu VNĐ |
| **Giá trị BĐS** | Tùy nhập | Dùng tính LTV |
| **LTV (Loan-to-Value)** | 70%–100% | Tùy ngân hàng và dự án |
| **Thời hạn vay** | 5–35 năm | VPBank max 25y, Big 3 max 30–35y |
| **Lãi suất ưu đãi** | 6%–11%/năm | Cố định giai đoạn 1 |
| **Thời gian ưu đãi** | 6/12/18/24/36 tháng | Tùy gói sản phẩm |
| **Lãi suất thả nổi** | 12%–15%/năm | Giai đoạn 2, biến động |
| **Biên độ thả nổi** | 3.0%–4.0%/năm | Cố định suốt hợp đồng |
| **Phí trả trước hạn** | 1%–3% | Áp dụng 3–5 năm đầu, giảm dần |
| **Ân hạn gốc** | 0–24 tháng | Chỉ trả lãi, chưa trả gốc |
| **Phương thức trả nợ** | Giảm dần / Annuity | Người dùng chọn |

### Interest Calculation Mechanics

**Nguyên tắc tính lãi vay mua nhà tại VN:**

1. **Lãi đơn trên dư nợ giảm dần** — KHÔNG phải lãi kép. Tiền lãi tính trên dư nợ gốc thực tế còn lại, không cộng dồn lãi vào gốc.
2. **Lãi tháng = Dư nợ × (Lãi suất năm / 12)** — Chia đều 12 tháng, không tính theo ngày thực tế.
3. **Khi lãi suất thay đổi**: Lãi suất mới áp dụng cho dư nợ còn lại tại thời điểm điều chỉnh, lịch trả nợ được tính lại.

---

## Feature Categories

### 🟢 Table Stakes (Bắt buộc phải có)

| Feature | Mô tả | Complexity | Dependencies |
|---------|--------|------------|--------------|
| **Nhập tham số khoản vay** | Form nhập: tiền vay, thời hạn, lãi suất, phương thức trả | LOW | Không |
| **Hỗ trợ 2 phương thức trả nợ** | Chuyển đổi giữa Giảm dần vs Annuity | MEDIUM | Cần 2 engine tính toán riêng |
| **Bảng lịch trả nợ chi tiết** | Hiển thị tháng-by-tháng: gốc, lãi, tổng trả, dư nợ còn lại | MEDIUM | Phụ thuộc engine tính toán |
| **Lãi suất 2 giai đoạn** | Nhập lãi suất ưu đãi + thời gian + lãi suất thả nổi | MEDIUM | Tính lại amortization khi rate change |
| **Tổng kết khoản vay** | Hiển thị: tổng lãi, tổng tiền trả, lãi/gốc ratio | LOW | Aggregation từ bảng trả nợ |
| **Tab riêng trên giao diện** | Tab "Vay" bên cạnh deposits/gold/analytics | LOW | Mở rộng `ActiveTab` type |

### 🔵 Differentiators (Tạo sự khác biệt)

| Feature | Giá trị | Complexity | Dependencies |
|---------|---------|------------|--------------|
| **Biểu đồ phân bổ Gốc/Lãi** (Stacked Bar) | Trực quan hóa cấu trúc thanh toán | MEDIUM | Chart.js (đã có) |
| **Biểu đồ lũy kế lãi vs gốc** (Area/Line) | Thấy tổng lãi tích lũy, nhận diện "điểm hòa vốn" | MEDIUM | Chart.js |
| **So sánh 2 kịch bản side-by-side** | So sánh 15 năm vs 25 năm, hoặc giảm dần vs annuity | HIGH | State 2 bộ tham số song song |
| **Hỗ trợ ân hạn gốc (Grace Period)** | Giai đoạn đầu chỉ trả lãi | MEDIUM | Thêm giai đoạn thứ 3 vào engine |
| **Dự báo "vách đá lãi suất"** | Highlight chuyển từ ưu đãi sang thả nổi | LOW | So sánh tháng cuối ưu đãi vs đầu thả nổi |

### 🟡 Nice-to-Have (Tương lai)

| Feature | Mô tả | Complexity |
|---------|--------|------------|
| **Preset ngân hàng** | Dropdown chọn VCB/BIDV/VTB/VPB → auto-fill tham số | LOW |
| **So sánh nhiều ngân hàng** | Bảng so sánh side-by-side | MEDIUM |
| **Tích hợp tiết kiệm ↔ vay** | Rút tiết kiệm trả trước → tiết kiệm bao nhiêu lãi? | HIGH |
| **Export PDF lịch trả nợ** | Xuất bảng amortization dạng PDF | MEDIUM |

### 🔴 Anti-Features (Nên tránh)

| Feature | Tại sao nên tránh | Thay thế |
|---------|---------------------|----------|
| **Tự động crawl lãi suất** | DOM đổi, GAS timeout, lãi suất theo từng KH | Người dùng tự nhập |
| **Backend GAS cho tính toán** | Tăng latency, quota GAS không cần thiết | 100% frontend |
| **Tích hợp CIC** | API không public, phức tạp pháp lý | Disclaimer tham khảo |
| **Hỗ trợ lãi kép** | VN dùng lãi đơn trên dư nợ giảm dần | Simple interest only |
| **D3.js** | Phình bundle 500KB+ | Chart.js đủ dùng |

---

## Feature Dependencies

- **LOAN-05 → Tab System**: Mở rộng `ActiveTab` trong `App.tsx`. Không ảnh hưởng tab hiện tại.
- **LOAN-02 → Không phụ thuộc backend**: Toàn bộ tính toán chạy frontend.
- **LOAN-03 → Chart.js**: Tái sử dụng Chart.js đã bundle. Thêm BarController nếu chưa register.
- **LOAN-04 → LOAN-02**: Form tham số feed trực tiếp vào engine.

---
*Feature research completed for: Save Manager v3.0 Mortgage Loan Estimator*
*Researched: 2026-08-12*
