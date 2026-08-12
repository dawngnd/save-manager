import React, { useState, useEffect } from 'react';
import { LoanInputs, MortgageResult, RepaymentMethod } from '../types';
import { calculateMortgage } from '../utils/mortgage';
import { BankPresetSelector } from './BankPresetSelector';
import { MortgageKpiCards } from './MortgageKpiCards';
import { MortgageCharts } from './MortgageCharts';
import { AmortizationTable } from './AmortizationTable';
import { BankPreset } from '../data/bankPresets';

const STORAGE_KEY = 'mortgage_form_inputs';

const DEFAULT_INPUTS = {
  loanAmount: '1000000000', // 1 tỷ VNĐ
  tenureYears: '20',       // 20 năm
  promoRate: '9.6',        // 9.6%/năm
  promoMonths: '12',       // 12 tháng
  floatingRate: '12.5',    // 12.5%/năm
  repaymentMethod: 'reducing_balance' as RepaymentMethod,
  gracePeriodMonths: '0',  // 0 tháng
  earlySettlementMonth: '', // rỗng = tất toán đúng hạn
};

interface MortgageFormProps {
  onResultChange?: (result: MortgageResult | null) => void;
}

export const MortgageForm: React.FC<MortgageFormProps> = ({ onResultChange }) => {
  // Field States (D-04: 4 basic + 3 advanced)
  const [loanAmount, setLoanAmount] = useState<string>(DEFAULT_INPUTS.loanAmount);
  const [tenureYears, setTenureYears] = useState<string>(DEFAULT_INPUTS.tenureYears);
  const [promoRate, setPromoRate] = useState<string>(DEFAULT_INPUTS.promoRate);
  const [promoMonths, setPromoMonths] = useState<string>(DEFAULT_INPUTS.promoMonths);
  const [floatingRate, setFloatingRate] = useState<string>(DEFAULT_INPUTS.floatingRate);
  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>(DEFAULT_INPUTS.repaymentMethod);
  const [gracePeriodMonths, setGracePeriodMonths] = useState<string>(DEFAULT_INPUTS.gracePeriodMonths);
  const [earlySettlementMonth, setEarlySettlementMonth] = useState<string>(DEFAULT_INPUTS.earlySettlementMonth);

  // Selector & UI States
  const [selectedPresetId, setSelectedPresetId] = useState<string>('vietcombank');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [mortgageResult, setMortgageResult] = useState<MortgageResult | null>(null);

  // Restore from localStorage on mount (CONF-04) with try-catch safety
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.loanAmount !== undefined) setLoanAmount(String(parsed.loanAmount));
        if (parsed.tenureYears !== undefined) setTenureYears(String(parsed.tenureYears));
        if (parsed.promoRate !== undefined) setPromoRate(String(parsed.promoRate));
        if (parsed.promoMonths !== undefined) setPromoMonths(String(parsed.promoMonths));
        if (parsed.floatingRate !== undefined) setFloatingRate(String(parsed.floatingRate));
        if (parsed.repaymentMethod !== undefined) setRepaymentMethod(parsed.repaymentMethod);
        if (parsed.gracePeriodMonths !== undefined) setGracePeriodMonths(String(parsed.gracePeriodMonths));
        if (parsed.earlySettlementMonth !== undefined) setEarlySettlementMonth(String(parsed.earlySettlementMonth || ''));
        if (parsed.selectedPresetId !== undefined) setSelectedPresetId(parsed.selectedPresetId);
      }
    } catch (e) {
      console.warn('Failed to parse saved mortgage inputs from localStorage', e);
    }
  }, []);

  // Save to localStorage when inputs change (CONF-04)
  useEffect(() => {
    const payload = {
      loanAmount: parseFloat(loanAmount) || 0,
      tenureYears: parseFloat(tenureYears) || 0,
      promoRate: parseFloat(promoRate) || 0,
      promoMonths: parseFloat(promoMonths) || 0,
      floatingRate: parseFloat(floatingRate) || 0,
      repaymentMethod,
      gracePeriodMonths: parseFloat(gracePeriodMonths) || 0,
      earlySettlementMonth: earlySettlementMonth,
      selectedPresetId,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save mortgage inputs to localStorage', e);
    }
  }, [loanAmount, tenureYears, promoRate, promoMonths, floatingRate, repaymentMethod, gracePeriodMonths, earlySettlementMonth, selectedPresetId]);

  // Handle Preset Select (D-01: Chỉ fill 3 trường lãi suất)
  const handleSelectPreset = (preset: BankPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setPromoRate(String(preset.promoRate));
      setPromoMonths(String(preset.promoMonths));
      setFloatingRate(String(preset.floatingRate));
    }
  };

  // Debounced Calculation (D-07: 300ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const parsedAmount = parseFloat(loanAmount);
      const parsedTenure = parseFloat(tenureYears);
      const parsedPromoRate = parseFloat(promoRate);
      const parsedPromoMonths = parseFloat(promoMonths);
      const parsedFloatingRate = parseFloat(floatingRate);
      const parsedGrace = parseFloat(gracePeriodMonths) || 0;
      const totalMonths = parsedTenure * 12;
      const parsedSettlement = earlySettlementMonth ? parseInt(earlySettlementMonth) : totalMonths;

      // Validation: skip calculation if inputs are invalid
      if (
        !parsedAmount || parsedAmount <= 0 ||
        !parsedTenure || parsedTenure <= 0 ||
        isNaN(parsedPromoRate) || parsedPromoRate < 0 ||
        isNaN(parsedPromoMonths) || parsedPromoMonths < 0 ||
        isNaN(parsedFloatingRate) || parsedFloatingRate < 0 ||
        parsedGrace >= parsedTenure * 12 ||
        parsedSettlement <= 0 || parsedSettlement > totalMonths
      ) {
        setMortgageResult(null);
        return;
      }

      const inputs: LoanInputs = {
        loanAmount: parsedAmount,
        tenureYears: parsedTenure,
        promoRate: parsedPromoRate,
        promoMonths: parsedPromoMonths,
        floatingRate: parsedFloatingRate,
        repaymentMethod,
        gracePeriodMonths: parsedGrace,
        earlySettlementMonth: parsedSettlement,
      };

      try {
        const res = calculateMortgage(inputs);
        setMortgageResult(res);
      } catch (err) {
        console.error('Mortgage calculation error:', err);
        setMortgageResult(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [loanAmount, tenureYears, promoRate, promoMonths, floatingRate, repaymentMethod, gracePeriodMonths, earlySettlementMonth]);

  // Notify parent of result changes (for MortgageTab or other wrappers)
  useEffect(() => {
    onResultChange?.(mortgageResult);
  }, [mortgageResult, onResultChange]);

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl space-y-5 text-sm text-[#f5f5f5]">
      <div className="flex justify-between items-center border-b border-[#2c3847] pb-3">
        <h2 className="text-lg font-bold text-[#f5f5f5]">Tính toán khoản vay mua nhà</h2>
        <span className="text-xs text-[#708499] bg-[#17212b] px-2.5 py-1 rounded-lg border border-[#2c3847]">
          v3.0 Engine
        </span>
      </div>

      {/* Preset Selector Component */}
      <BankPresetSelector
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
      />

      {/* Form Basic Fields (D-04: 4 fields luôn hiện) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Số tiền vay */}
        <div className="space-y-1">
          <label htmlFor="loan-amount" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
            Số tiền vay (VNĐ)
          </label>
          <input
            id="loan-amount"
            type="number"
            inputMode="decimal"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
            placeholder="Ví dụ: 1000000000"
          />
        </div>

        {/* Thời hạn vay (năm) */}
        <div className="space-y-1">
          <label htmlFor="tenure-years" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
            Thời hạn vay (năm)
          </label>
          <input
            id="tenure-years"
            type="number"
            inputMode="numeric"
            value={tenureYears}
            onChange={(e) => setTenureYears(e.target.value)}
            className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
            placeholder="Ví dụ: 20"
          />
        </div>

        {/* Lãi suất ưu đãi */}
        <div className="space-y-1">
          <label htmlFor="promo-rate" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
            Lãi suất ưu đãi (%/năm)
          </label>
          <input
            id="promo-rate"
            type="number"
            step="any"
            inputMode="decimal"
            value={promoRate}
            onChange={(e) => {
              setPromoRate(e.target.value);
              setSelectedPresetId('custom');
            }}
            className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
          />
        </div>

        {/* Phương thức trả nợ */}
        <div className="space-y-1">
          <label htmlFor="repayment-method" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
            Phương thức trả nợ
          </label>
          <select
            id="repayment-method"
            value={repaymentMethod}
            onChange={(e) => setRepaymentMethod(e.target.value as RepaymentMethod)}
            className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition appearance-none cursor-pointer"
          >
            <option value="reducing_balance">Dư nợ giảm dần (Equal Principal)</option>
            <option value="annuity">Trả đều hàng tháng (Annuity)</option>
          </select>
        </div>
      </div>

      {/* Progressive Disclosure Toggle Button (D-05) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[#64b5f6] hover:text-[#90caf9] font-semibold flex items-center space-x-1 transition cursor-pointer"
        >
          <span>{showAdvanced ? '▼ Thu gọn tùy chọn' : '► Tùy chọn nâng cao'}</span>
        </button>
      </div>

      {/* Expandable Section (D-04/D-05/D-06: Ân hạn, Lãi thả nổi, Thời gian ưu đãi) */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#17212b]/60 border border-[#2c3847]/60 p-4 rounded-xl animate-fade-in">
          {/* Thời gian ưu đãi (tháng) */}
          <div className="space-y-1">
            <label htmlFor="promo-months" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Thời gian ưu đãi (tháng)
            </label>
            <input
              id="promo-months"
              type="number"
              value={promoMonths}
              onChange={(e) => {
                setPromoMonths(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none"
            />
          </div>

          {/* Lãi thả nổi (%/năm) */}
          <div className="space-y-1">
            <label htmlFor="floating-rate" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Lãi suất thả nổi (%/năm)
            </label>
            <input
              id="floating-rate"
              type="number"
              step="any"
              value={floatingRate}
              onChange={(e) => {
                setFloatingRate(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none"
            />
          </div>

          {/* Ân hạn gốc (tháng) */}
          <div className="space-y-1">
            <label htmlFor="grace-period" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Ân hạn gốc (tháng)
            </label>
            <input
              id="grace-period"
              type="number"
              value={gracePeriodMonths}
              onChange={(e) => setGracePeriodMonths(e.target.value)}
              className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none"
            />
          </div>

          {/* Tất toán trước hạn (tháng) */}
          <div className="space-y-1">
            <label htmlFor="early-settlement" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Tất toán sau (tháng)
            </label>
            <input
              id="early-settlement"
              type="number"
              value={earlySettlementMonth}
              onChange={(e) => setEarlySettlementMonth(e.target.value)}
              placeholder={`${parseInt(tenureYears) * 12 || 240}`}
              className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none placeholder-[#4a5568]"
            />
          </div>
        </div>
      )}

      {/* KPI Cards Summary Section (D-08) */}
      <MortgageKpiCards
        result={mortgageResult}
        loanAmount={parseFloat(loanAmount) || 0}
      />

      {/* Charts Visualization Section (Phase 11) */}
      <MortgageCharts
        result={mortgageResult}
        promoMonths={parseInt(promoMonths) || 12}
      />

      {/* Amortization Schedule Table (Phase 12) */}
      <AmortizationTable result={mortgageResult} />
    </div>
  );
};
