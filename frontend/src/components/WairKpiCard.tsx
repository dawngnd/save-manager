import React from 'react';
import { Deposit } from '../types';

interface WairKpiCardProps {
  deposits: Deposit[];
}

export const WairKpiCard: React.FC<WairKpiCardProps> = ({ deposits }) => {
  const activeDeposits = deposits.filter(d => d.status === 'active');
  const totalAmount = activeDeposits.reduce((s, d) => s + d.amount, 0);
  const totalWeightedInterest = activeDeposits.reduce((s, d) => s + (d.amount * d.interest_rate), 0);
  
  const wair = totalAmount > 0 ? (totalWeightedInterest / totalAmount) : 0;
  
  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col justify-center items-center">
      <div className="text-[#708499] text-xs font-semibold uppercase tracking-wider mb-2">Lãi suất trung bình (WAIR)</div>
      {totalAmount > 0 ? (
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold text-[#4caf50]">{wair.toFixed(2)}</span>
          <span className="text-lg text-[#4caf50]">%</span>
          <span className="text-xs text-[#708499] ml-1">/ năm</span>
        </div>
      ) : (
        <div className="text-lg font-bold text-[#f5f5f5]">N/A</div>
      )}
      <div className="text-[10px] text-[#708499] mt-2 italic text-center">
        Trung bình gia quyền theo số tiền gửi
      </div>
    </div>
  );
};
