import React, { useState, useEffect } from 'react';
import { callBackendApi } from '../api';
import { formatMaskDate } from '../utils/dateMask';
import { calculateDaysBetween, calculateExpectedInterest } from '../utils/interest';

interface DepositFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  amount?: string;
  interestRate?: string;
  createdAt?: string;
  maturityAt?: string;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [userBankcode, setUserBankcode] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [maturityAt, setMaturityAt] = useState<string>('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-set created_at to today's date on load
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setCreatedAt(`${dd}/${mm}/${yyyy}`);
      
      // Reset form states
      setAmount('');
      setInterestRate('');
      setMaturityAt('');
      setErrors({});
      setTouched({});
      setSubmitError(null);
      setSuccessToast(null);
    }
  }, [isOpen]);

  // Date validation helper
  const isValidDateStr = (dateStr: string): boolean => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    const parts = dateStr.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return dateObj.getDate() === d && dateObj.getMonth() === m && dateObj.getFullYear() === y;
  };

  // Run validation
  const validateField = (name: string, val: string) => {
    const nextErrors = { ...errors };

    if (name === 'amount') {
      const num = parseFloat(val);
      if (!val) nextErrors.amount = 'Số tiền gốc không được để trống';
      else if (isNaN(num) || num <= 0) nextErrors.amount = 'Số tiền phải là số lớn hơn 0';
      else delete nextErrors.amount;
    }

    if (name === 'interestRate') {
      const num = parseFloat(val);
      if (!val) nextErrors.interestRate = 'Lãi suất không được để trống';
      else if (isNaN(num) || num < 0) nextErrors.interestRate = 'Lãi suất không được là số âm';
      else delete nextErrors.interestRate;
    }

    if (name === 'createdAt') {
      if (!val) nextErrors.createdAt = 'Ngày tạo không được để trống';
      else if (!isValidDateStr(val)) nextErrors.createdAt = 'Ngày không hợp lệ (DD/MM/YYYY)';
      else delete nextErrors.createdAt;
    }

    if (name === 'maturityAt') {
      if (!val) nextErrors.maturityAt = 'Ngày đáo hạn không được để trống';
      else if (!isValidDateStr(val)) nextErrors.maturityAt = 'Ngày không hợp lệ (DD/MM/YYYY)';
      else delete nextErrors.maturityAt;
    }

    // Cross-date validation: maturity_at must be after created_at
    if (
      name === 'maturityAt' || 
      name === 'createdAt'
    ) {
      const start = name === 'createdAt' ? val : createdAt;
      const end = name === 'maturityAt' ? val : maturityAt;

      if (start && end && isValidDateStr(start) && isValidDateStr(end)) {
        try {
          const startParts = start.split('/');
          const startDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
          
          const endParts = end.split('/');
          const endDate = new Date(parseInt(endParts[2]), parseInt(endParts[1]) - 1, parseInt(endParts[0]));

          if (endDate.getTime() <= startDate.getTime()) {
            nextErrors.maturityAt = 'Ngày đáo hạn phải sau ngày tạo';
          } else if (name === 'maturityAt' && isValidDateStr(maturityAt)) {
            // Clear if previously blocked by cross-date check
            delete nextErrors.maturityAt;
          }
        } catch {
          // ignore parsing error here
        }
      }
    }

    setErrors(nextErrors);
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    let val = '';
    if (field === 'amount') val = amount;
    if (field === 'interestRate') val = interestRate;
    if (field === 'createdAt') val = createdAt;
    if (field === 'maturityAt') val = maturityAt;

    validateField(field, val);
  };

  const handleDateChange = (value: string, setter: (v: string) => void, field: string) => {
    const formatted = formatMaskDate(value, field === 'createdAt' ? createdAt : maturityAt);
    setter(formatted);
    
    // Validate on type if already touched
    if (touched[field]) {
      validateField(field, formatted);
    }
  };

  // Preview calculations
  const isFormValid =
    amount &&
    interestRate &&
    createdAt &&
    maturityAt &&
    Object.keys(errors).length === 0;

  let previewDays = 0;
  let previewInterest = 0;

  if (isFormValid && isValidDateStr(createdAt) && isValidDateStr(maturityAt)) {
    try {
      previewDays = calculateDaysBetween(createdAt, maturityAt);
      previewInterest = calculateExpectedInterest(
        parseFloat(amount),
        parseFloat(interestRate),
        createdAt,
        maturityAt
      );
    } catch {
      // ignore calculation error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched = { amount: true, interestRate: true, createdAt: true, maturityAt: true };
    setTouched(allTouched);

    validateField('amount', amount);
    validateField('interestRate', interestRate);
    validateField('createdAt', createdAt);
    validateField('maturityAt', maturityAt);

    if (Object.keys(errors).length > 0 || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const payload = {
        action: 'add_deposit',
        username_bankcode: userBankcode,
        data: {
          amount: parseFloat(amount),
          interest_rate: parseFloat(interestRate),
          created_at: createdAt,
          maturity_at: maturityAt
        }
      };

      await callBackendApi(payload);
      
      // Show success
      setSuccessToast('Đã lưu khoản tiết kiệm thành công!');
      
      // Trigger list refresh
      onSuccess();

      // Reset form but keep open for next input
      setAmount('');
      setInterestRate('');
      setMaturityAt('');
      setTouched({});
      setErrors({});
      
      // Clear success toast after 3 seconds
      setTimeout(() => {
        setSuccessToast(null);
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Lỗi khi lưu khoản gửi mới. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-2xl flex items-center space-x-2 font-medium animate-slide-up text-sm">
          <span>✅</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Form Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#0e1621] border-t border-[#2b394a] rounded-t-2xl z-50 transition-transform duration-300 transform shadow-2xl overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-12 h-1.5 bg-[#2c3847] rounded-full mx-auto my-3 cursor-pointer" onClick={onClose} />
        
        <div className="px-5 pb-8 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#f5f5f5]">Thêm khoản gửi mới</h3>
            <button
              className="text-[#708499] hover:text-[#f5f5f5] text-2xl font-semibold transition cursor-pointer"
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          {submitError && (
            <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] text-xs p-3 rounded-lg">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* User Bankcode */}
            <div className="space-y-1">
              <label htmlFor="user-bankcode" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                Tài khoản (user_bankcode)
              </label>
              <input
                id="user-bankcode"
                type="text"
                value={userBankcode}
                placeholder="Ví dụ: dangnd_VCB"
                onChange={(e) => setUserBankcode(e.target.value)}
                className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
              />
            </div>
            {/* Amount */}
            <div className="space-y-1">
              <label htmlFor="amount" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                Số tiền gốc (VND)
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                value={amount}
                placeholder="Ví dụ: 10000000"
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => handleBlur('amount')}
                className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
              />
              {touched.amount && errors.amount && (
                <p className="text-xs text-[#ff4d4d]">{errors.amount}</p>
              )}
            </div>

            {/* Interest Rate */}
            <div className="space-y-1">
              <label htmlFor="interest-rate" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                Lãi suất (% / năm)
              </label>
              <input
                id="interest-rate"
                type="number"
                step="any"
                inputMode="decimal"
                value={interestRate}
                placeholder="Ví dụ: 6.2"
                onChange={(e) => setInterestRate(e.target.value)}
                onBlur={() => handleBlur('interestRate')}
                className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition"
              />
              {touched.interestRate && errors.interestRate && (
                <p className="text-xs text-[#ff4d4d]">{errors.interestRate}</p>
              )}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Created At */}
              <div className="space-y-1">
                <label htmlFor="created-at" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                  Ngày gửi
                </label>
                <input
                  id="created-at"
                  type="text"
                  inputMode="numeric"
                  value={createdAt}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => handleDateChange(e.target.value, setCreatedAt, 'createdAt')}
                  onBlur={() => handleBlur('createdAt')}
                  className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition text-center"
                />
                {touched.createdAt && errors.createdAt && (
                  <p className="text-xs text-[#ff4d4d]">{errors.createdAt}</p>
                )}
              </div>

              {/* Maturity At */}
              <div className="space-y-1">
                <label htmlFor="maturity-at" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                  Ngày đáo hạn
                </label>
                <input
                  id="maturity-at"
                  type="text"
                  inputMode="numeric"
                  value={maturityAt}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => handleDateChange(e.target.value, setMaturityAt, 'maturityAt')}
                  onBlur={() => handleBlur('maturityAt')}
                  className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition text-center"
                />
                {touched.maturityAt && errors.maturityAt && (
                  <p className="text-xs text-[#ff4d4d]">{errors.maturityAt}</p>
                )}
              </div>
            </div>

            {/* Interest Preview Block */}
            {isFormValid && (
              <div className="bg-[#17212b] border border-emerald-500/25 rounded-xl p-4 space-y-2 animate-fade-in font-mono text-xs">
                <div className="text-emerald-400 font-semibold uppercase tracking-wider border-b border-[#2c3847]/40 pb-1.5 mb-1.5">
                  🔍 Xem trước lãi suất
                </div>
                <div className="flex justify-between">
                  <span className="text-[#708499]">Số ngày gửi thực tế:</span>
                  <span className="text-[#f5f5f5] font-semibold">{previewDays} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#708499]">Tiền lãi dự tính:</span>
                  <span className="text-emerald-400 font-bold">+{previewInterest.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-[#5288c1] hover:bg-[#4678ad] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-[#ffffff] font-semibold rounded-xl transition shadow-lg shadow-blue-500/10 cursor-pointer text-center"
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </div>
                ) : (
                  'Lưu khoản tiết kiệm'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
