import React, { useState } from 'react';
import { MortgageResult } from '../types';
import { PaymentBreakdownChart } from './PaymentBreakdownChart';
import { CumulativeChart } from './CumulativeChart';

interface MortgageChartsProps {
  result: MortgageResult | null;
  promoMonths: number;
}

export const MortgageCharts: React.FC<MortgageChartsProps> = ({ result, promoMonths }) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'cumulative'>('breakdown');

  if (!result) return null;

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📊</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Biểu đồ phân tích</h2>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'breakdown'
              ? 'bg-[#64b5f6] text-[#0e1621]'
              : 'bg-[#2c3847] text-[#708499] hover:bg-[#374657]'
          }`}
        >
          Phân bổ gốc/lãi
        </button>
        <button
          onClick={() => setActiveTab('cumulative')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'cumulative'
              ? 'bg-[#64b5f6] text-[#0e1621]'
              : 'bg-[#2c3847] text-[#708499] hover:bg-[#374657]'
          }`}
        >
          Lũy kế
        </button>
      </div>

      {/* Chart Content */}
      {activeTab === 'breakdown' ? (
        <PaymentBreakdownChart result={result} promoMonths={promoMonths} />
      ) : (
        <CumulativeChart result={result} />
      )}
    </div>
  );
};
