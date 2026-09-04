import React, { useState } from 'react';
import { Deposit } from '../types';
import { parseClientDateString } from '../utils/interest';

interface YearlyInterestSummaryProps {
  deposits: Deposit[];
}

interface YearlyData {
  year: number;
  totalInterest: number;
  count: number;
}

export const YearlyInterestSummary: React.FC<YearlyInterestSummaryProps> = ({ deposits }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Lọc các deposit đã đáo hạn (matured hoặc rolled_over)
  const maturedDeposits = deposits.filter(
    d => d.status === 'matured' || d.status === 'rolled_over'
  );

  // Nhóm theo năm đáo hạn, tính tổng lãi
  const yearlyData: YearlyData[] = (() => {
    const map = new Map<number, { totalInterest: number; count: number }>();

    maturedDeposits.forEach(d => {
      try {
        const maturityDate = parseClientDateString(d.maturity_at);
        const year = maturityDate.getFullYear();
        const existing = map.get(year) || { totalInterest: 0, count: 0 };
        existing.totalInterest += d.expected_interest;
        existing.count += 1;
        map.set(year, existing);
      } catch {
        // Bỏ qua bản ghi có ngày không hợp lệ
      }
    });

    return Array.from(map.entries())
      .map(([year, data]) => ({
        year,
        totalInterest: data.totalInterest,
        count: data.count,
      }))
      .sort((a, b) => b.year - a.year); // Mới nhất lên đầu
  })();

  const grandTotal = yearlyData.reduce((s, d) => s + d.totalInterest, 0);

  if (yearlyData.length === 0) {
    return (
      <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center py-8">
        <h3 className="text-sm font-bold text-[#f5f5f5] mb-1">Chưa có dữ liệu lãi</h3>
        <p className="text-xs text-[#708499]">Chưa có khoản gửi nào đáo hạn.</p>
      </div>
    );
  }

  const formatAmount = (value: number) => value.toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2b394a] pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">💵</span>
          <h2 className="text-sm font-bold text-[#f5f5f5]">Tổng lãi theo năm</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2.5 py-1 text-xs font-semibold bg-[#2c3847] hover:bg-[#374657] text-[#64b5f6] rounded-lg transition duration-150 cursor-pointer"
        >
          {isCollapsed ? 'Hiện' : 'Ẩn'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Grand total */}
          <div className="flex justify-between items-center text-xs border-b border-[#2b394a]/50 pb-2">
            <div>
              <div className="text-[#708499]">Tổng lãi tất cả các năm</div>
              <div className="font-bold text-[#4caf50] text-base">{formatAmount(grandTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-[#708499]">Số khoản đáo hạn</div>
              <div className="font-bold text-[#64b5f6]">{maturedDeposits.length}</div>
            </div>
          </div>

          {/* Bảng theo năm */}
          <div className="space-y-2">
            {yearlyData.map(data => (
              <div
                key={data.year}
                className="flex items-center justify-between bg-[#17212b] border border-[#2b394a]/50 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-[#64b5f6]">{data.year}</span>
                  <span className="text-[10px] text-[#708499]">({data.count} khoản)</span>
                </div>
                <span className="text-sm font-bold text-[#4caf50] font-mono">
                  +{formatAmount(data.totalInterest)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
