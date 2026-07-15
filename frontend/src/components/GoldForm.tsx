import React, { useState, useEffect } from 'react';
import { callBackendApi } from '../api';
import { formatMaskDate } from '../utils/dateMask';
import { useUsersCache } from '../hooks/useUsersCache';
import { BottomSheet } from './BottomSheet';

interface GoldFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoldForm: React.FC<GoldFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { users, loading: usersLoading } = useUsersCache();

  // Lọc những user có type === 'gold'
  const goldUsers = users.filter(u => u.type === 'gold');

  const [userBankcode, setUserBankcode]   = useState('');
  const [purchaseDate, setPurchaseDate]   = useState('');
  const [pricePerChi, setPricePerChi]     = useState('');
  const [quantityGram, setQuantityGram]   = useState('100');
  const [provider, setProvider]           = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [successToast, setSuccessToast]   = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dd   = String(today.getDate()).padStart(2, '0');
      const mm   = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setPurchaseDate(`${dd}/${mm}/${yyyy}`);
      setPricePerChi('');
      setQuantityGram('100');
      setProvider('');
      setUserBankcode('');
      setSubmitError(null);
      setSuccessToast(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!userBankcode) { setSubmitError('Vui lòng chọn chủ sở hữu.'); return; }
    if (!purchaseDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(purchaseDate)) {
      setSubmitError('Ngày mua không hợp lệ (DD/MM/YYYY).'); return;
    }
    const price = parseFloat(pricePerChi.replace(/\./g, '').replace(',', '.'));
    const grams = parseFloat(quantityGram);
    if (isNaN(price) || price <= 0) { setSubmitError('Giá mua phải là số dương.'); return; }
    if (isNaN(grams) || grams <= 0) { setSubmitError('Số gram phải là số dương.'); return; }

    try {
      setSubmitting(true);
      await callBackendApi({
        action: 'add_gold',
        data: {
          purchase_date: purchaseDate,
          price_per_chi: price,
          quantity_gram: grams,
          user_bankcode: userBankcode,
          provider: provider.trim(),
        },
      });
      setSuccessToast('Đã thêm bản ghi vàng thành công!');
      setTimeout(() => {
        setSuccessToast(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Đã xảy ra lỗi khi lưu.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#17212b] border border-[#2c3847] rounded-xl text-sm text-[#f5f5f5] outline-none focus:border-[#f5a623]/60 transition placeholder-[#708499]';
  const labelClass = 'block text-xs text-[#708499] font-semibold mb-1';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Thêm bản ghi vàng">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chủ sở hữu */}
        <div>
          <label className={labelClass}>Chủ sở hữu</label>
          {usersLoading ? (
            <div className="h-11 bg-[#2c3847] rounded-xl animate-pulse" />
          ) : (
            <select
              value={userBankcode}
              onChange={e => setUserBankcode(e.target.value)}
              className={inputClass + ' cursor-pointer appearance-none'}
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23708499\'%3e%3cpath d=\'M7 10l5 5 5-5z\'/%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '32px',
              }}
            >
              <option value="">Chọn chủ sở hữu...</option>
              {(goldUsers.length > 0 ? goldUsers : users).map(u => (
                <option key={u.username_bankcode} value={u.username_bankcode}>{u.username_bankcode}</option>
              ))}
            </select>
          )}
        </div>

        {/* Ngày mua */}
        <div>
          <label className={labelClass}>Ngày mua</label>
          <input
            type="text"
            inputMode="numeric"
            value={purchaseDate}
            onChange={e => setPurchaseDate(formatMaskDate(e.target.value, purchaseDate))}
            placeholder="DD/MM/YYYY"
            maxLength={10}
            className={inputClass}
          />
        </div>

        {/* Giá mua 1 chỉ */}
        <div>
          <label className={labelClass}>Giá mua 1 chỉ (100g) — VNĐ</label>
          <input
            type="text"
            inputMode="numeric"
            value={pricePerChi}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              setPricePerChi(raw ? Number(raw).toLocaleString('vi-VN') : '');
            }}
            placeholder="Ví dụ: 8.900.000"
            className={inputClass}
          />
        </div>

        {/* Số gram */}
        <div>
          <label className={labelClass}>Số gram (mặc định 100g = 1 chỉ)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={quantityGram}
            onChange={e => setQuantityGram(e.target.value)}
            placeholder="100"
            className={inputClass}
          />
          <div className="text-[10px] text-[#708499] mt-1 pl-1">
            = {quantityGram ? (parseFloat(quantityGram) / 100).toFixed(2) : '0'} chỉ
          </div>
        </div>

        {/* Nhà cung cấp */}
        <div>
          <label className={labelClass}>Nhà cung cấp (tuỳ chọn)</label>
          <input
            type="text"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            placeholder="Ví dụ: SJC, PNJ, DOJI..."
            className={inputClass}
          />
        </div>

        {/* Tóm tắt */}
        {pricePerChi && quantityGram && (
          <div className="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#708499]">Tổng giá trị mua:</span>
              <span className="text-[#f5a623] font-bold">
                {(
                  (parseFloat(pricePerChi.replace(/\./g, '').replace(',', '.')) || 0) *
                  (parseFloat(quantityGram) / 100)
                ).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        )}

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
            {submitError}
          </div>
        )}

        {successToast && (
          <div className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs p-3 rounded-xl text-center">
            ✓ {successToast}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#2c3847] hover:bg-[#374657] text-[#f5f5f5] font-semibold rounded-xl transition cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-[#f5a623] hover:bg-[#e09520] disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            {submitting ? 'Đang lưu...' : '🥇 Lưu'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
