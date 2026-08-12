import React, { useState } from 'react';
import { MortgageResult } from '../types';

interface AmortizationTableProps {
  result: MortgageResult | null;
}

const formatVND = (val: number): string => {
  return val.toLocaleString('vi-VN') + ' ₫';
};

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ result }) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  if (!result) return null;

  const toggle = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  // Group monthlySchedule by year
  const monthsByYear = new Map<number, typeof result.monthlySchedule>();
  for (const item of result.monthlySchedule) {
    const group = monthsByYear.get(item.year) || [];
    group.push(item);
    monthsByYear.set(item.year, group);
  }

  // Detect rate cliff months — where interestRate changes from previous month
  const rateCliffMonths = new Set<number>();
  for (let i = 1; i < result.monthlySchedule.length; i++) {
    if (result.monthlySchedule[i].interestRate !== result.monthlySchedule[i - 1].interestRate) {
      rateCliffMonths.add(result.monthlySchedule[i].month);
    }
  }

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-[#2b394a] pb-2">
        <span className="text-lg">📋</span>
        <h2 className="text-sm font-bold text-[#f5f5f5]">Lịch trả nợ chi tiết</h2>
      </div>

      {/* Column header row */}
      <div className="grid grid-cols-6 text-[10px] text-[#708499] font-semibold uppercase tracking-wider px-3 py-1.5 bg-[#17212b] rounded-lg sticky top-0 z-10">
        <span>Tháng</span>
        <span>Lãi suất</span>
        <span className="text-right">Gốc</span>
        <span className="text-right">Lãi</span>
        <span className="text-right">Tổng trả</span>
        <span className="text-right">Số dư</span>
      </div>

      {/* Year accordion groups */}
      <div className="space-y-1.5">
        {result.yearlySummary.map(yearSummary => {
          const isExpanded = expandedYears.has(yearSummary.year);
          const months = monthsByYear.get(yearSummary.year) || [];

          return (
            <div key={yearSummary.year}>
              {/* Year header */}
              <button
                onClick={() => toggle(yearSummary.year)}
                className="w-full flex items-center justify-between bg-[#17212b] rounded-lg p-3 cursor-pointer hover:bg-[#1e2d3d] transition"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#708499]">{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-sm font-bold text-[#f5f5f5]">Năm {yearSummary.year}</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="text-[#64b5f6]">
                    Gốc: {formatVND(yearSummary.principalPaid)}
                  </span>
                  <span className="text-[#ef5350]">
                    Lãi: {formatVND(yearSummary.interestPaid)}
                  </span>
                </div>
              </button>

              {/* Month rows */}
              {isExpanded && (
                <div className="mt-1 space-y-0">
                  {months.map(m => {
                    const isRateCliff = rateCliffMonths.has(m.month);
                    return (
                      <div
                        key={m.month}
                        className={`grid grid-cols-6 text-xs px-3 py-2 border-b border-[#2c3847]/30 ${
                          isRateCliff ? 'bg-[#2c3847]/50' : ''
                        }`}
                      >
                        <span className="text-[#f5f5f5]">T{m.month}</span>
                        <span className={`${isRateCliff ? 'text-[#ffb74d] font-bold' : 'text-[#708499]'}`}>
                          {m.interestRate.toFixed(1)}%
                        </span>
                        <span className="text-[#64b5f6] text-right">{formatVND(m.principalPaid)}</span>
                        <span className="text-[#ef5350] text-right">{formatVND(m.interestPaid)}</span>
                        <span className="text-[#f5f5f5] text-right">{formatVND(m.totalPayment)}</span>
                        <span className="text-[#708499] text-right">{formatVND(m.remainingBalance)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
