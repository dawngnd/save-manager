# Phase 9: Types & Calculation Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-12
**Phase:** 9-Types & Calculation Engine
**Areas discussed:** Grace Period Model, Type File Organization, Output Granularity

---

## Grace Period Model

### Q1: Ân hạn gốc nằm trong hay ngoài giai đoạn ưu đãi?

| Option | Description | Selected |
|--------|-------------|----------|
| Ân hạn TRONG ưu đãi | 24 tháng ưu đãi, 12 đầu ân hạn, 12 sau trả gốc+lãi, rồi thả nổi. Đúng thực tế VN. | ✓ |
| Ân hạn độc lập | 12 ân hạn + 24 ưu đãi = 36 tháng trước thả nổi. Linh hoạt hơn nhưng không sát thực tế. | |
| Agent quyết định | | |

**User's choice:** Ân hạn TRONG ưu đãi (recommended)
**Notes:** Đúng mô hình ngân hàng Việt Nam

### Q2: Edge case ân hạn > thời gian ưu đãi?

| Option | Description | Selected |
|--------|-------------|----------|
| Validate | Ân hạn ≤ ưu đãi, báo lỗi nếu vượt | ✓ |
| Clamp | Tự cắt về bằng thời gian ưu đãi | |
| Agent quyết định | | |

**User's choice:** Validate — reject nếu vượt

### Q3: Lãi trong ân hạn tính trên gốc nào?

| Option | Description | Selected |
|--------|-------------|----------|
| Toàn bộ dư nợ gốc ban đầu | Gốc không giảm vì chưa trả gốc. Đúng thực tế VN | ✓ |
| Compound (cộng lãi vào gốc) | Sai thực tế VN | |
| Agent quyết định | | |

**User's choice:** Toàn bộ dư nợ gốc ban đầu

---

## Type File Organization

### Q4: Mortgage types đặt ở đâu?

| Option | Description | Selected |
|--------|-------------|----------|
| Thêm vào types.ts hiện tại | Giữ 1 flat file, app nhỏ không cần tách | ✓ |
| Tạo types/mortgage.ts riêng | Tách domain, cần refactor types.ts thành thư mục | |
| Agent quyết định | | |

**User's choice:** Thêm vào types.ts hiện tại (recommended)

### Q5: Calculation engine file location?

| Option | Description | Selected |
|--------|-------------|----------|
| utils/mortgage.ts riêng | Tách hẳn khỏi interest.ts, formula hoàn toàn khác | ✓ |
| Mở rộng interest.ts | Gộp chung 1 file calc | |
| Agent quyết định | | |

**User's choice:** utils/mortgage.ts riêng (recommended)

---

## Output Granularity

### Q6: Engine trả về full schedule hay tách functions?

| Option | Description | Selected |
|--------|-------------|----------|
| Single function → MortgageResult | Full monthly schedule + summary KPI trong 1 object, useMemo cache | ✓ |
| 2 functions tách | calculateSummary() + calculateSchedule() riêng | |
| Agent quyết định | | |

**User's choice:** Single function (recommended)

### Q7: Yearly aggregation tính sẵn hay để component tự tính?

| Option | Description | Selected |
|--------|-------------|----------|
| Tính sẵn trong engine | yearlySummary trong MortgageResult, Phase 11 dùng trực tiếp | ✓ |
| Component tự aggregate | Engine chỉ trả monthly | |
| Agent quyết định | | |

**User's choice:** Tính sẵn trong engine (recommended)

### Q8: Summary KPI cụ thể nào cần tính sẵn?

| Option | Description | Selected |
|--------|-------------|----------|
| Full KPI set | totalInterest, totalPayment, interestToLoanRatio, firstMonthPayment, peakPayment, rateCliffPaymentBefore/After | ✓ |
| Chỉ basic (monthly + yearly) | KPI tính trong component | |
| Agent quyết định | | |

**User's choice:** Full KPI set (recommended)

---

## Agent's Discretion

None — user provided clear decisions for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
