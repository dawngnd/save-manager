import React from 'react';
import { MortgageResult } from '../types';

interface MortgageKpiCardsProps {
  result: MortgageResult | null;
  loanAmount: number;
}

export const MortgageKpiCards: React.FC<MortgageKpiCardsProps> = ({ result, loanAmount }) => {
  if (!result || loanAmount <= 0) {
    return null;
  }

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + ' ₫';
  const ratioPercent = (result.interestToLoanRatio * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {/* Tổng trả cả gốc & lãi */}
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-xl p-4 flex flex-col justify-between">
        <div className="text-[#708499] text-[11px] font-semibold uppercase tracking-wider mb-1">
          Tổng tiền thanh toán
        </div>
        <div className="text-lg font-bold text-[#64b5f6]">
          {formatCurrency(result.totalPayment)}
        </div>
      </div>

      {/* Tổng tiền lãi */}
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-xl p-4 flex flex-col justify-between">
        <div className="text-[#708499] text-[11px] font-semibold uppercase tracking-wider mb-1">
          Tổng lãi phải trả
        </div>
        <div className="text-lg font-bold text-[#ff4d4d]">
          {formatCurrency(result.totalInterest)}
        </div>
      </div>

      {/* Tỷ lệ lãi / gốc */}
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-xl p-4 flex flex-col justify-between">
        <div className="text-[#708499] text-[11px] font-semibold uppercase tracking-wider mb-1">
          Tỷ lệ Lãi / Gốc
        </div>
        <div className="text-lg font-bold text-amber-400">
          {ratioPercent}%
        </div>
      </div>

      {/* Tháng trả nhiều nhất (Peak) */}
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-xl p-4 flex flex-col justify-between">
        <div className="text-[#708499] text-[11px] font-semibold uppercase tracking-wider mb-1">
          Tháng trả cao nhất
        </div>
        <div className="text-lg font-bold text-emerald-400">
          {formatCurrency(result.peakPayment)}
        </div>
      </div>
    </div>
  );
};
