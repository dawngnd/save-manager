---
phase: 12
plan: 1
type: feature
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/AmortizationTable.tsx
  - frontend/src/components/MortgageForm.tsx
  - frontend/src/components/MortgageTab.tsx
  - frontend/src/components/App.tsx
autonomous: true
requirements:
  - VIS-01
  - VIS-02
  - INTG-01
---

# Kế hoạch Phase 12: Summary, Schedule & Tab Integration

Mục tiêu: Xây dựng bảng lịch trả nợ accordion (gộp năm, 6 cột), tạo MortgageTab wrapper, và tích hợp tab "Vay" vào App.tsx.

## must_haves
- D-01: Accordion gộp theo năm, header năm hiển thị tổng gốc + tổng lãi
- D-02: 6 cột: Tháng, Lãi suất, Gốc, Lãi, Tổng trả, Số dư
- D-03: Cột lãi suất giúp thấy rate cliff
- D-04: Format tiền `toLocaleString('vi-VN')` + ` ₫`
- D-05: Mặc định tất cả năm collapse
- D-06: [informational] VIS-02 đã covered bởi Phase 10 MortgageKpiCards
- D-07: Thêm `'mortgage'` vào ActiveTab type
- D-08: Tab "Vay" ở vị trí thứ 4 (cuối)
- D-09: Icon tab: 🏠
- D-10: MortgageTab wrapper chứa MortgageForm + AmortizationTable
- D-11: File mới: AmortizationTable.tsx, MortgageTab.tsx
- D-12: Sửa file: App.tsx, MortgageForm.tsx
- VIS-01: Bảng lịch trả nợ chi tiết theo tháng với accordion gộp theo năm
- VIS-02: Thẻ tổng kết KPI (đã covered Phase 10)
- INTG-01: Tab riêng "Vay" đặt cạnh Analytics trong App.tsx

## Tasks

<task>
<type>file_creation</type>
<files>
- frontend/src/components/AmortizationTable.tsx
</files>
<read_first>
- frontend/src/types.ts
- frontend/src/components/UserShareChart.tsx (dark theme pattern reference)
- .planning/phases/12-summary-schedule-tab-integration/12-CONTEXT.md
- .planning/phases/12-summary-schedule-tab-integration/12-RESEARCH.md
</read_first>
<action>
Tạo file `frontend/src/components/AmortizationTable.tsx`.
1. Props: `result: MortgageResult | null`.
2. Nếu `result === null` → return null.
3. State: `expandedYears: Set<number>` (default empty — tất cả collapse).
4. Group `result.monthlySchedule[]` theo `year` field. Dùng `result.yearlySummary[]` cho header data.
5. Render container: `bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl`.
6. Header section: icon 📋 + "Lịch trả nợ chi tiết".
7. Column header row (sticky): Tháng | Lãi suất | Gốc | Lãi | Tổng trả | Số dư. Dùng `grid grid-cols-6` text-xs.
8. Cho mỗi năm:
   - Year header (clickable): `bg-[#17212b] rounded-lg p-3 cursor-pointer`, hiện "Năm {year}" + tổng gốc/lãi năm đó + chevron ▶/▼.
   - Nếu expanded: render mỗi tháng trong năm đó thành 1 row grid-cols-6.
   - Highlight dòng có `interestRate` thay đổi (rate cliff) bằng `bg-[#2c3847]/50`.
9. Format tiền: helper `formatVND(val)` = `val.toLocaleString('vi-VN')` + ` ₫`.
10. Lãi suất format: `interestRate.toFixed(1)%`.
</action>
<acceptance_criteria>
- Component render bảng accordion từ MortgageResult.
- Click year header expand/collapse.
- 6 cột hiển thị đúng data.
- Rate cliff row highlighted.
- Dark theme styling nhất quán.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_modification</type>
<files>
- frontend/src/components/MortgageForm.tsx
</files>
<read_first>
- frontend/src/components/MortgageForm.tsx
- frontend/src/components/AmortizationTable.tsx
</read_first>
<action>
Sửa file `frontend/src/components/MortgageForm.tsx`:
1. Import `AmortizationTable` from `./AmortizationTable`.
2. Sau `<MortgageCharts>`, thêm `<AmortizationTable result={mortgageResult} />`.
3. Thêm callback prop `onResultChange?: (result: MortgageResult | null) => void` vào component.
4. Trong useEffect khi `mortgageResult` thay đổi, gọi `onResultChange?.(mortgageResult)`.

Lý do thêm callback: MortgageTab cần biết result để có thể pass cho các component tương lai nếu cần (mặc dù hiện tại AmortizationTable nằm trong MortgageForm).
</action>
<acceptance_criteria>
- AmortizationTable được render sau charts.
- Props onResultChange hoạt động (optional).
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_creation</type>
<files>
- frontend/src/components/MortgageTab.tsx
</files>
<read_first>
- frontend/src/components/MortgageForm.tsx
</read_first>
<action>
Tạo file `frontend/src/components/MortgageTab.tsx`.
1. Simple wrapper component — render `<MortgageForm />` bên trong.
2. Container div với spacing phù hợp.
3. Export `MortgageTab`.

Mục đích: tách biệt tab content khỏi App.tsx, consistent với pattern các tab khác.
</action>
<acceptance_criteria>
- MortgageTab render MortgageForm.
- Component export đúng.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi.
</verify>
</task>

<task>
<type>file_modification</type>
<files>
- frontend/src/components/App.tsx
</files>
<read_first>
- frontend/src/components/App.tsx
- frontend/src/components/MortgageTab.tsx
</read_first>
<action>
Sửa file `frontend/src/components/App.tsx`:
1. Import `MortgageTab` from `./MortgageTab`.
2. Thay đổi type ActiveTab: `'deposits' | 'gold' | 'analytics' | 'mortgage'`.
3. Thêm tab button thứ 4 sau Analytics (line ~270):
   ```tsx
   <button
     onClick={() => setActiveTab('mortgage')}
     className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
       activeTab === 'mortgage'
         ? 'bg-[#ef5350] text-white shadow'
         : 'text-[#708499] hover:text-[#f5f5f5]'
     }`}
   >
     🏠 Vay
   </button>
   ```
4. Thêm conditional rendering cho mortgage tab (sau analytics section):
   ```tsx
   {activeTab === 'mortgage' && <MortgageTab />}
   ```
5. Cập nhật header title: khi `activeTab === 'mortgage'` hiện 'Ước tính vay'.
6. Cập nhật header icon: khi `activeTab === 'mortgage'` hiện '🏠'.
</action>
<acceptance_criteria>
- Tab "Vay" hiện trong bottom bar ở vị trí cuối.
- Click tab "Vay" hiện MortgageTab content.
- Active state styling đúng (bg-[#ef5350] cho mortgage).
- Header title/icon thay đổi theo tab.
</acceptance_criteria>
<verify>
tsc --noEmit không lỗi. npm run build thành công.
</verify>
</task>

## Verification

1. Kiểm tra build: `tsc --noEmit` và `npm run build` trong frontend/.
2. Kiểm tra Tab: Mở app, xác nhận 4 tabs hiển thị đúng thứ tự.
3. Kiểm tra AmortizationTable: Nhập form, xác nhận bảng accordion hiện đúng dữ liệu.
4. Kiểm tra Accordion: Click year header, xác nhận expand/collapse.
5. Kiểm tra Rate Cliff: Xác nhận dòng chuyển lãi suất được highlight.
