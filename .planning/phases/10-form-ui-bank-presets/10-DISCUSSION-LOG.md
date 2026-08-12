# Phase 10: Form UI & Bank Presets - Discussion Log

**Date:** 2026-08-12
**Duration:** ~7 minutes (4 areas)

## Areas Discussed

### 1. Bank Preset Behavior
**Options presented:**
- Chỉ fill lãi suất (promoRate, promoMonths, floatingRate) ← **Selected**
- Fill toàn bộ (gồm cả thời hạn, ân hạn mặc định)

**Options presented (edit sau preset):**
- Có, user tự do edit lại ← **Selected**
- Không, lock các field lãi suất

**Options presented (data source):**
- Hardcode trong file TypeScript ← **Selected**
- Lấy từ Google Sheets qua API

### 2. Progressive Disclosure
**Options presented (3 fields cơ bản):**
- Tiền vay + Thời hạn + Lãi suất ưu đãi (+ Phương thức trả nợ = 4 fields) ← **Selected**
- Tiền vay + Thời hạn + Phương thức trả nợ

**Options presented (expandable):**
- Click toggle button ← **Selected**
- Auto-expand khi chọn "Tùy chỉnh"

**Options presented (default values):**
- Ân hạn = 0, Lãi thả nổi = 8.5%, Thời gian ưu đãi = 12 tháng ← **Selected**
- Giá trị rỗng cho đến khi chọn preset

### 3. Realtime Calculation Trigger
**Options presented (trigger):**
- Realtime mỗi onChange
- Debounce 300ms ← **Selected**

**Options presented (vị trí kết quả):**
- Inline ngay dưới form ← **Selected**
- Side panel (split view)

### 4. File Organization
**Options presented (components):**
- 1 file MortgageForm.tsx chứa toàn bộ
- Tách nhỏ: MortgageForm + BankPresetSelector + MortgageKpiCards ← **Selected**

**Options presented (presets data):**
- `frontend/src/data/bankPresets.ts` ← **Selected**
- `frontend/src/utils/bankPresets.ts`

## Deferred Ideas
None

## Agent Discretion
None — all decisions made by user
