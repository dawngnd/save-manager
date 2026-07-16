import React from 'react';
import { Deposit } from '../types';
import { calculateDaysBetween } from '../utils/interest';

interface DepositCardProps {
  deposit: Deposit;
  actualInterest?: number | null; // amount - parent amount
  onClick: () => void;
}

export const DepositCard: React.FC<DepositCardProps> = ({ deposit, actualInterest, onClick }) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  // Calculate remaining days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  
  let diffDays = 0;
  let statusText = '';
  let statusColorClass = '';
  
  try {
    diffDays = calculateDaysBetween(todayStr, deposit.maturity_at);
    if (diffDays < 0) {
      statusText = `Quá hạn ${Math.abs(diffDays)} ngày`;
      statusColorClass = 'bg-[#ff4d4d]/15 text-[#ff4d4d] border-[#ff4d4d]/30';
    } else if (diffDays === 0) {
      statusText = 'Đáo hạn hôm nay';
      statusColorClass = 'bg-[#ff9f1a]/15 text-[#ff9f1a] border-[#ff9f1a]/30 animate-pulse';
    } else {
      statusText = `Còn ${diffDays} ngày`;
      statusColorClass = 'bg-[#5288c1]/15 text-[#64b5f6] border-[#5288c1]/30';
    }
  } catch (e) {
    statusText = 'Không rõ';
    statusColorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }

  return (
    <div
      onClick={onClick}
      className={`bg-[#17212b] hover:bg-[#202b36] border border-[#2c3847] hover:border-[#5288c1]/50 rounded-xl p-4 transition duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-lg active:scale-[0.99]`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-xs text-[#708499] font-medium uppercase tracking-wider">{deposit.user_bankcode}</div>
          <div className="text-lg font-bold text-[#f5f5f5]">{formatCurrency(deposit.amount)}</div>
          {deposit.status === 'active' ? (
            <div className="text-xs font-semibold text-[#ff9f1a]">
              +{formatCurrency(deposit.expected_interest)} dự kiến
            </div>
          ) : (
            actualInterest != null && (
              <div className={`text-xs font-semibold ${actualInterest >= 0 ? 'text-emerald-400' : 'text-[#ff4d4d]'}`}>
                {actualInterest >= 0 ? '+' : ''}{formatCurrency(actualInterest)} lãi thực
              </div>
            )
          )}
        </div>
        <div className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${statusColorClass}`}>
          {statusText}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-[#708499] border-t border-[#2c3847]/50 pt-2.5">
        <div>
          Lãi suất: <span className="font-semibold text-emerald-400">{deposit.interest_rate}%</span>
        </div>
        <div>
          Đáo hạn: <span className="font-semibold text-[#f5f5f5]">{deposit.maturity_at}</span>
        </div>
      </div>
    </div>
  );
};
