import React, { useState } from 'react';
import { Deposit } from '../types';
import { DepositCard } from './DepositCard';
import { BottomSheet } from './BottomSheet';
import { calculateDaysBetween, parseClientDateString } from '../utils/interest';

interface DepositListProps {
  deposits: Deposit[];
}

export const DepositList: React.FC<DepositListProps> = ({ deposits }) => {
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  const getDaysCount = (start: string, end: string) => {
    try {
      return calculateDaysBetween(start, end);
    } catch {
      return 0;
    }
  };

  // Filter and sort deposits
  const getActionRequiredDeposits = (items: Deposit[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    return items
      .filter((item) => item.status === 'active' || item.status === 'matured')
      .filter((item) => {
        try {
          const diffDays = calculateDaysBetween(todayStr, item.maturity_at);
          return diffDays <= 3; // Overdue (< 0) or <= 3 days remaining
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseClientDateString(a.maturity_at).getTime();
          const dateB = parseClientDateString(b.maturity_at).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });
  };

  const filteredDeposits = getActionRequiredDeposits(deposits);

  return (
    <div className="space-y-4">
      {filteredDeposits.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#0e1621] border border-[#2b394a] rounded-2xl space-y-3">
          <span className="text-5xl block">🎉</span>
          <h3 className="text-base font-semibold text-[#f5f5f5]">Không có khoản đáo hạn</h3>
          <p className="text-xs text-[#708499] max-w-xs mx-auto">
            Tất cả các khoản tiết kiệm của bạn đều an toàn và chưa đến kỳ hạn cần xử lý (hạn còn &gt; 3 ngày).
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredDeposits.map((deposit) => (
            <DepositCard
              key={deposit.id}
              deposit={deposit}
              onClick={() => setSelectedDeposit(deposit)}
            />
          ))}
        </div>
      )}

      {/* Details Bottom Sheet */}
      <BottomSheet
        isOpen={selectedDeposit !== null}
        onClose={() => setSelectedDeposit(null)}
        title="Chi tiết khoản gửi"
      >
        {selectedDeposit && (
          <div className="space-y-5 text-sm">
            <div className="bg-[#17212b] border border-[#2c3847] rounded-xl p-4 space-y-3 font-mono">
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Mã khoản:</span>
                <span className="text-[#64b5f6] font-semibold">{selectedDeposit.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Số tiền gốc:</span>
                <span className="text-[#f5f5f5] font-bold">{formatCurrency(selectedDeposit.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Lãi suất:</span>
                <span className="text-emerald-400 font-bold">{selectedDeposit.interest_rate}% / năm</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Lãi dự kiến:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(selectedDeposit.expected_interest)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Ngày gửi:</span>
                <span className="text-[#f5f5f5]">{selectedDeposit.created_at}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Ngày đáo hạn:</span>
                <span className="text-[#f5f5f5]">{selectedDeposit.maturity_at}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Kỳ hạn thực tế:</span>
                <span className="text-[#f5f5f5]">{getDaysCount(selectedDeposit.created_at, selectedDeposit.maturity_at)} ngày</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-[#708499]">Trạng thái:</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                  selectedDeposit.status === 'matured' 
                    ? 'bg-[#ff9f1a]/10 text-[#ff9f1a] border-[#ff9f1a]/20' 
                    : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                }`}>
                  {selectedDeposit.status === 'active' ? 'Đang hoạt động' : 'Đã đáo hạn'}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedDeposit(null)}
              className="w-full py-3 bg-[#2c3847] hover:bg-[#374657] text-[#f5f5f5] font-semibold rounded-xl transition cursor-pointer"
            >
              Đóng panel
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
