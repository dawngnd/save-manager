import React, { useState } from 'react';
import { Deposit } from '../types';
import { DepositCard } from './DepositCard';
import { BottomSheet } from './BottomSheet';
import { calculateDaysBetween, parseClientDateString } from '../utils/interest';

interface DepositListProps {
  deposits: Deposit[];
  onTriggerRollover: (deposit: Deposit) => void;
}

export const DepositList: React.FC<DepositListProps> = ({ deposits, onTriggerRollover }) => {
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  /** Lãi thực tế = amount hiện tại - amount parent */
  const getActualInterest = (deposit: Deposit): number | null => {
    if (!deposit.parent_id) return null;
    const parent = deposits.find(d => d.id === deposit.parent_id);
    if (!parent) return null;
    return deposit.amount - parent.amount;
  };

  const getDaysCount = (start: string, end: string) => {
    try {
      return calculateDaysBetween(start, end);
    } catch {
      return 0;
    }
  };

  const isMaturedOrOverdue = (item: Deposit) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const diffDays = calculateDaysBetween(todayStr, item.maturity_at);
      return diffDays <= 0;
    } catch {
      return false;
    }
  };

  /**
   * Truy vết chuỗi tái tục: đi ngược về gốc rồi đi xuôi về cuối
   */
  const getRolloverChain = (deposit: Deposit): Deposit[] => {
    // Tìm gốc (khoản không có parent_id)
    let origin = deposit;
    const visited = new Set<string>();
    while (origin.parent_id && !visited.has(origin.parent_id)) {
      visited.add(origin.id);
      const parent = deposits.find(d => d.id === origin.parent_id);
      if (!parent) break;
      origin = parent;
    }

    // Đi xuôi từ gốc: tìm tất cả con cháu
    const chain: Deposit[] = [origin];
    let current = origin;
    const usedIds = new Set<string>([origin.id]);
    
    while (true) {
      const child = deposits.find(d => d.parent_id === current.id && !usedIds.has(d.id));
      if (!child) break;
      chain.push(child);
      usedIds.add(child.id);
      current = child;
    }

    return chain;
  };

  // Filter and sort deposits
  type StatusFilter = 'active' | 'matured' | 'rolled_over' | 'all';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const getFilteredDeposits = (items: Deposit[]) => {
    return items
      .filter((item) => {
        if (statusFilter === 'all') return true;
        return item.status === statusFilter;
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

  const filteredDeposits = getFilteredDeposits(deposits);
  const rolloverChain = selectedDeposit ? getRolloverChain(selectedDeposit) : [];

  const statusLabels: Record<StatusFilter, string> = {
    active: 'Đang hoạt động',
    matured: 'Đã đáo hạn',
    rolled_over: 'Đã tái tục',
    all: 'Tất cả',
  };

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(statusLabels) as StatusFilter[]).map((key) => {
          const count = key === 'all' ? deposits.length : deposits.filter(d => d.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition cursor-pointer ${
                statusFilter === key
                  ? 'bg-[#5288c1]/20 text-[#64b5f6] border-[#5288c1]/40'
                  : 'bg-[#17212b] text-[#708499] border-[#2c3847] hover:border-[#5288c1]/30'
              }`}
            >
              {statusLabels[key]} ({count})
            </button>
          );
        })}
      </div>

      {filteredDeposits.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#0e1621] border border-[#2b394a] rounded-2xl space-y-3">
          <span className="text-5xl block">📭</span>
          <h3 className="text-base font-semibold text-[#f5f5f5]">Không có khoản nào</h3>
          <p className="text-xs text-[#708499] max-w-xs mx-auto">
            Không tìm thấy khoản tiết kiệm nào với trạng thái "{statusLabels[statusFilter]}".
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredDeposits.map((deposit) => (
            <DepositCard
              key={deposit.id}
              deposit={deposit}
              actualInterest={getActualInterest(deposit)}
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
                <span className="text-[#708499]">Tài khoản:</span>
                <span className="text-[#f5f5f5] font-semibold">{selectedDeposit.user_bankcode}</span>
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
              {(() => {
                const ai = getActualInterest(selectedDeposit);
                return ai != null ? (
                  <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                    <span className="text-[#708499]">Lãi thực tế:</span>
                    <span className={`font-bold ${ai >= 0 ? 'text-emerald-400' : 'text-[#ff4d4d]'}`}>
                      {ai >= 0 ? '+' : ''}{formatCurrency(ai)}
                    </span>
                  </div>
                ) : null;
              })()}
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
                  selectedDeposit.status === 'rolled_over'
                    ? 'bg-[#708499]/10 text-[#708499] border-[#708499]/20'
                    : selectedDeposit.status === 'matured' 
                      ? 'bg-[#ff9f1a]/10 text-[#ff9f1a] border-[#ff9f1a]/20' 
                      : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                }`}>
                  {selectedDeposit.status === 'active' ? 'Đang hoạt động' : selectedDeposit.status === 'rolled_over' ? 'Đã tái tục' : 'Đã đáo hạn'}
                </span>
              </div>
            </div>

            {/* Rollover Lineage Chain */}
            {rolloverChain.length > 1 && (
              <div className="bg-[#17212b] border border-[#2c3847] rounded-xl p-4 space-y-3">
                <div className="text-xs text-[#708499] font-semibold uppercase tracking-wider">
                  🔗 Lịch sử tái tục ({rolloverChain.length} kỳ)
                </div>
                <div className="relative pl-5 space-y-0">
                  {rolloverChain.map((dep, idx) => {
                    const isSelected = dep.id === selectedDeposit.id;
                    const isLast = idx === rolloverChain.length - 1;
                    return (
                      <div key={dep.id} className="relative">
                        {/* Vertical line */}
                        {!isLast && (
                          <div className="absolute left-[-12px] top-5 w-[2px] h-full bg-[#2c3847]" />
                        )}
                        {/* Dot */}
                        <div className={`absolute left-[-16px] top-1.5 w-[10px] h-[10px] rounded-full border-2 ${
                          isSelected
                            ? 'bg-[#64b5f6] border-[#64b5f6]'
                            : dep.status === 'rolled_over'
                              ? 'bg-[#2c3847] border-[#708499]'
                              : 'bg-emerald-400 border-emerald-400'
                        }`} />
                        {/* Content */}
                        <button
                          type="button"
                          onClick={() => setSelectedDeposit(dep)}
                          className={`w-full text-left pb-4 pl-1 transition cursor-pointer ${
                            isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                          }`}
                        >
                          <div className="text-xs font-semibold text-[#f5f5f5]">
                            Kỳ {idx + 1}: {formatCurrency(dep.amount)}
                            {idx === 0 && <span className="text-[#708499] ml-1">(gốc)</span>}
                            {idx > 0 && (() => {
                              const ai = getActualInterest(dep);
                              return ai != null ? (
                                <span className={`ml-1 ${ai >= 0 ? 'text-emerald-400' : 'text-[#ff4d4d]'}`}>
                                  ({ai >= 0 ? '+' : ''}{ai.toLocaleString('vi-VN')} ₫)
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="text-[10px] text-[#708499]">
                            {dep.created_at} → {dep.maturity_at} · {dep.interest_rate}%
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="flex-1 py-3 bg-[#2c3847] hover:bg-[#374657] text-[#f5f5f5] font-semibold rounded-xl transition cursor-pointer text-center"
              >
                Đóng
              </button>
              {isMaturedOrOverdue(selectedDeposit) && (
                <button
                  onClick={() => {
                    const depToRollover = selectedDeposit;
                    setSelectedDeposit(null);
                    onTriggerRollover(depToRollover);
                  }}
                  className="flex-1 py-3 bg-[#5288c1] hover:bg-[#4678ad] text-white font-semibold rounded-xl transition cursor-pointer text-center"
                >
                  Tái tục
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
