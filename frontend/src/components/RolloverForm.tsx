import React, { useState, useEffect } from 'react';
import { callBackendApi } from '../api';
import { formatMaskDate } from '../utils/dateMask';
import { calculateDaysBetween, calculateExpectedInterest } from '../utils/interest';
import { Deposit } from '../types';
import { BottomSheet } from './BottomSheet';

interface RolloverFormProps {
  isOpen: boolean;
  onClose: () => void;
  oldDeposit: Deposit;
  onSuccess: () => void;
}

interface FormErrors {
  amount?: string;
  interestRate?: string;
  createdAt?: string;
  maturityAt?: string;
}

export function getNextYearDateStr(dateStr: string): string {
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  const nextYear = year + 1;
  
  // Leap year case: 29/02 -> 28/02 if next year is not a leap year
  if (day === 29 && month === 2) {
    const isLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
    if (!isLeap) {
      return `28/02/${nextYear}`;
    }
  }
  
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${nextYear}`;
}

export const RolloverForm: React.FC<RolloverFormProps> = ({
  isOpen,
  onClose,
  oldDeposit,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [maturityAt, setMaturityAt] = useState<string>('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize values when open
  useEffect(() => {
    if (isOpen && oldDeposit) {
      setAmount(oldDeposit.amount.toString());
      setInterestRate(oldDeposit.interest_rate.toString());
      setCreatedAt(oldDeposit.maturity_at); // New start date = Old maturity date
      setMaturityAt(getNextYearDateStr(oldDeposit.maturity_at)); // Old maturity date + 1 year
      setErrors({});
      setTouched({});
      setSubmitError(null);
      setSuccessToast(null);
    }
  }, [isOpen, oldDeposit]);

  const isValidDateStr = (dateStr: string): boolean => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    const parts = dateStr.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return dateObj.getDate() === d && dateObj.getMonth() === m && dateObj.getFullYear() === y;
  };

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
      if (!val) nextErrors.createdAt = 'Ngày gửi không được để trống';
      else if (!isValidDateStr(val)) nextErrors.createdAt = 'Ngày không hợp lệ (DD/MM/YYYY)';
      else delete nextErrors.createdAt;
    }

    if (name === 'maturityAt') {
      if (!val) nextErrors.maturityAt = 'Ngày đáo hạn không được để trống';
      else if (!isValidDateStr(val)) nextErrors.maturityAt = 'Ngày không hợp lệ (DD/MM/YYYY)';
      else delete nextErrors.maturityAt;
    }

    if (name === 'maturityAt' || name === 'createdAt') {
      const start = name === 'createdAt' ? val : createdAt;
      const end = name === 'maturityAt' ? val : maturityAt;

      if (start && end && isValidDateStr(start) && isValidDateStr(end)) {
        try {
          const startParts = start.split('/');
          const startDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
          
          const endParts = end.split('/');
          const endDate = new Date(parseInt(endParts[2]), parseInt(endParts[1]) - 1, parseInt(endParts[0]));

          if (endDate.getTime() <= startDate.getTime()) {
            nextErrors.maturityAt = 'Ngày đáo hạn phải sau ngày gửi';
          } else if (name === 'maturityAt' && isValidDateStr(maturityAt)) {
            delete nextErrors.maturityAt;
          }
        } catch {
          // ignore
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
    
    if (touched[field]) {
      validateField(field, formatted);
    }
  };

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
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        action: 'rollover_deposit',
        id: oldDeposit.id,
        new_amount: parseFloat(amount),
        new_interest_rate: parseFloat(interestRate),
        created_at: createdAt,
        maturity_at: maturityAt,
      };

      await callBackendApi(payload);
      
      setSuccessToast('Đã tái tục khoản tiết kiệm thành công!');
      
      onSuccess();

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Lỗi khi thực hiện tái tục. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {successToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-2xl flex items-center space-x-2 font-medium animate-slide-up text-sm">
          <span>✅</span>
          <span>{successToast}</span>
        </div>
      )}

      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Tái tục khoản gửi"
      >
        {submitError && (
          <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] text-xs p-3 rounded-lg mb-4">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Amount */}
          <div className="space-y-1">
            <label htmlFor="rollover-amount" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Số tiền gốc mới (VND)
            </label>
            <input
              id="rollover-amount"
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
            <label htmlFor="rollover-interest-rate" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
              Lãi suất mới (% / năm)
            </label>
            <input
              id="rollover-interest-rate"
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
              <label htmlFor="rollover-created-at" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                Ngày gửi mới
              </label>
              <input
                id="rollover-created-at"
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
              <label htmlFor="rollover-maturity-at" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
                Ngày đáo hạn mới
              </label>
              <input
                id="rollover-maturity-at"
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
                🔍 Xem trước lãi suất mới
              </div>
              <div className="flex justify-between">
                <span className="text-[#708499]">Số ngày gửi dự kiến:</span>
                <span className="text-[#f5f5f5] font-semibold">{previewDays} ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#708499]">Tiền lãi dự tính mới:</span>
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
                  <span>Đang thực hiện tái tục...</span>
                </div>
              ) : (
                'Xác nhận tái tục'
              )}
            </button>
          </div>
        </form>
      </BottomSheet>
    </>
  );
};
