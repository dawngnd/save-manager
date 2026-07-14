import React, { useState } from 'react';
import { GoldRecord, GoldPrice } from '../types';
import { BottomSheet } from './BottomSheet';

interface GoldListProps {
  golds: GoldRecord[];
  goldPrice: GoldPrice | null;
  priceLoading: boolean;
  onRefreshPrice: () => void;
}

export const GoldList: React.FC<GoldListProps> = ({ golds, goldPrice }) => {
  const [selected, setSelected] = useState<GoldRecord | null>(null);

  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' ₫';
  const formatGram    = (g: number) => `${g}g (${(g / 100).toFixed(2)} chỉ)`;

  /** Tính lãi/lỗ dựa trên giá hiện tại */
  const calcPnL = (record: GoldRecord): number | null => {
    if (!goldPrice) return null;
    const currentValuePerGram = goldPrice.price_per_chi / 100; // giá 1 gram hiện tại
    const purchaseValuePerGram = record.price_per_chi / 100;   // giá 1 gram khi mua
    return Math.round((currentValuePerGram - purchaseValuePerGram) * record.quantity_gram);
  };

  const formatPnL = (pnl: number | null) => {
    if (pnl === null) return { text: '—', cls: 'text-[#708499]' };
    if (pnl > 0)  return { text: `+${formatCurrency(pnl)}`, cls: 'text-emerald-400' };
    if (pnl < 0)  return { text: formatCurrency(pnl), cls: 'text-red-400' };
    return { text: '0 ₫', cls: 'text-[#708499]' };
  };

  const selectedPnL = selected ? calcPnL(selected) : null;
  const selectedPnLFmt = formatPnL(selectedPnL);

  const totalCurrentValue = goldPrice
    ? golds.reduce((sum, g) => sum + Math.round((goldPrice.price_per_chi / 100) * g.quantity_gram), 0)
    : null;

  const totalPurchaseValue = golds.reduce((sum, g) => sum + Math.round((g.price_per_chi / 100) * g.quantity_gram), 0);

  return (
    <div className="space-y-4">
      {/* Tổng hợp */}
      <div className="bg-[#0e1621] border border-[#f5a623]/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#708499]">Tổng giá trị mua vào:</span>
          <span className="text-sm font-bold text-[#f5f5f5]">{formatCurrency(totalPurchaseValue)}</span>
        </div>
        {totalCurrentValue !== null && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#708499]">Giá trị hiện tại:</span>
              <span className="text-sm font-bold text-[#f5a623]">{formatCurrency(totalCurrentValue)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#2c3847] pt-2">
              <span className="text-xs text-[#708499]">Lãi / Lỗ tổng:</span>
              {(() => {
                const totalPnL = totalCurrentValue - totalPurchaseValue;
                const { text, cls } = formatPnL(totalPnL);
                return <span className={`text-sm font-bold ${cls}`}>{text}</span>;
              })()}
            </div>
          </>
        )}
      </div>

      {golds.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <span className="text-5xl block">🥇</span>
          <p className="text-sm text-[#708499]">Chưa có bản ghi vàng nào.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {golds.map(gold => {
            const pnl = calcPnL(gold);
            const { text: pnlText, cls: pnlCls } = formatPnL(pnl);
            return (
              <button
                key={gold.id}
                type="button"
                onClick={() => setSelected(gold)}
                className="w-full text-left bg-[#17212b] border border-[#2c3847] hover:border-[#f5a623]/30 rounded-xl p-4 transition cursor-pointer space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-semibold text-[#f5a623]">{gold.user_bankcode}</div>
                    {gold.provider && (
                      <div className="text-[10px] text-[#708499]">{gold.provider}</div>
                    )}
                  </div>
                  <span className={`text-xs font-bold ${pnlCls}`}>{pnlText}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#708499]">{gold.quantity_gram}g · {gold.purchase_date}</span>
                  <span className="text-[#f5f5f5] font-semibold">{formatCurrency(gold.price_per_chi)}/chỉ</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Bottom Sheet */}
      <BottomSheet isOpen={selected !== null} onClose={() => setSelected(null)} title="Chi tiết vàng">
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="bg-[#17212b] border border-[#2c3847] rounded-xl p-4 space-y-3 font-mono">
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Chủ sở hữu:</span>
                <span className="text-[#f5a623] font-bold">{selected.user_bankcode}</span>
              </div>
              {selected.provider && (
                <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                  <span className="text-[#708499]">Nhà cung cấp:</span>
                  <span className="text-[#f5f5f5]">{selected.provider}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Ngày mua:</span>
                <span className="text-[#f5f5f5]">{selected.purchase_date}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Số lượng:</span>
                <span className="text-[#f5f5f5]">{formatGram(selected.quantity_gram)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Giá mua (1 chỉ):</span>
                <span className="text-[#f5f5f5] font-bold">{formatCurrency(selected.price_per_chi)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                <span className="text-[#708499]">Tổng tiền mua:</span>
                <span className="text-[#f5f5f5] font-bold">
                  {formatCurrency(Math.round((selected.price_per_chi / 100) * selected.quantity_gram))}
                </span>
              </div>

              {goldPrice ? (
                <>
                  <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                    <span className="text-[#708499]">Giá hiện tại (1 chỉ):</span>
                    <span className="text-[#f5a623] font-bold">{formatCurrency(goldPrice.price_per_chi)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2c3847]/40 pb-2">
                    <span className="text-[#708499]">Giá trị hiện tại:</span>
                    <span className="text-[#f5a623] font-bold">
                      {formatCurrency(Math.round((goldPrice.price_per_chi / 100) * selected.quantity_gram))}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[#708499]">Lãi / Lỗ:</span>
                    <span className={`font-bold text-base ${selectedPnLFmt.cls}`}>
                      {selectedPnLFmt.text}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#708499] italic text-center py-2">
                  Cập nhật giá vàng để xem lãi/lỗ
                </div>
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full py-3 bg-[#2c3847] hover:bg-[#374657] text-[#f5f5f5] font-semibold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
