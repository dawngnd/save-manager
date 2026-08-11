# Phase 8: Deposit Lineage Tree & History - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Trực quan hóa lịch sử dòng tiền qua các chu kỳ tái tục (Rollover) — dựng sơ đồ phả hệ cây 2 chiều và đo lường tổng tiền lãi tích lũy cùng hệ số tăng trưởng. Tất cả tính toán và hiển thị ở frontend, không cần backend API mới.

**Scope chỉ bao gồm:** Frontend (section phả hệ trong modal DepositList, timeline CSS, metrics header). **KHÔNG** sửa backend.

</domain>

<decisions>
## Implementation Decisions

### Dạng hiển thị phả hệ
- **D-01:** **Timeline dọc CSS** — danh sách từ trên xuống: khoản gốc → tái tục 1 → tái tục 2 → hiện tại. Mỗi node là card nhỏ với số tiền, ngày, lãi suất. Đường nối bằng `border-left`. Nhẹ, phù hợp mobile Telegram. Không dùng SVG/Canvas.

### Entry point
- **D-02:** **Tích hợp vào modal chi tiết DepositList** — thêm section "Phả hệ tái tục" bên trong modal hiện tại. Collapse/expand. Không tạo component modal mới riêng.

### Metrics placement
- **D-03:** **Header phả hệ** — tổng lãi tích lũy + hệ số tăng trưởng (x1.xx) hiển thị ngay trên đầu section phả hệ, trước timeline. Compact, dễ thấy ngay.

### Data source
- **D-04:** **Frontend only** — dùng `deposits` array có sẵn từ `useDepositsCache`. Duyệt `parent_id`/`child_id` để dựng chuỗi lineage. Logic traversal đã có sẵn trong `DepositList.tsx` (lines 59-75) kèm cycle guard (`visited` set). Không cần API backend mới.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lineage Logic (CRITICAL — already implemented)
- `frontend/src/components/DepositList.tsx` — Lines 59-75: logic tìm origin (duyệt ngược parent_id), lines 75-85: duyệt xuôi child_id, cycle guard với `visited` Set. Lines 22-30: tìm child deposit. Lines 86-103: status filter logic cho rolled_over.

### Data Types
- `frontend/src/types.ts` — Deposit interface: `parent_id` (ID khoản gốc), `child_id` (ID khoản con đã tái tục), `status` (active/matured/rolled_over/withdrawn), `amount`, `interest_rate`, `expected_interest`, `created_at`, `maturity_at`.

### Rollover Form
- `frontend/src/components/RolloverForm.tsx` — Form tái tục hiện tại, tham khảo flow rollover.

### App Entry
- `frontend/src/components/App.tsx` — Tab navigation, deposit data flow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Lineage traversal** (DepositList.tsx:59-75): Tìm origin bằng while loop + parent_id, cycle protection bằng `visited` Set. Duyệt xuôi bằng child_id (lines 75-85).
- **Child finder** (DepositList.tsx:22-30): `getActualInterest()` tìm child qua `child_id` ưu tiên, fallback scan `parent_id`.
- **Modal chi tiết deposit**: Đã có trong DepositList — overlay modal hiển thị thông tin deposit. Thêm section mới vào modal này.
- **Dark theme palette**: Consistent dark bg `#0e1621`, text `#f5f5f5`, accent colors.

### Established Patterns
- **Collapse/expand**: Dùng `useState<boolean>` toggle + conditional render.
- **Card nhỏ**: Pattern card với `bg-[#0e1621] border border-[#2b394a] rounded-xl`.
- **Timeline**: `border-left` CSS cho đường nối dọc giữa các node.

### Integration Points
- Modal chi tiết trong DepositList.tsx → thêm section "Phả hệ" sau thông tin deposit, trước nút action.
- `deposits` prop đã có sẵn trong DepositList component.

### Metrics Calculation
- Tổng lãi tích lũy = `Σ(expected_interest)` cho tất cả deposits trong chuỗi lineage (status !== 'active' — tức đã realized).
- Hệ số tăng trưởng = `khoản hiện tại amount / khoản gốc amount` (ví dụ: 115M/100M = x1.15).

</code_context>

<specifics>
## Specific Ideas

- Node hiện tại trong timeline nên được highlight (border accent khác hoặc background sáng hơn) để user biết mình đang xem khoản nào.
- Chỉ hiển thị section phả hệ khi deposit có parent_id hoặc child_id (tức thuộc chuỗi tái tục, không phải khoản đơn lẻ).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 8-Deposit Lineage Tree & History*
*Context gathered: 2026-08-11*
