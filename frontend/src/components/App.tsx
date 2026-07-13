import React, { useState, useEffect } from 'react';
import { DepositList } from './DepositList';
import { DepositForm } from './DepositForm';
import { RolloverForm } from './RolloverForm';
import { GrowthChart } from './GrowthChart';
import { BankSummaryChart } from './BankSummaryChart';
import { InterestRateChart } from './InterestRateChart';
import { BankShareChart } from './BankShareChart';
import { UserShareChart } from './UserShareChart';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { Deposit } from '../types';
import { useDepositsCache } from '../hooks/useDepositsCache';

export const App: React.FC = () => {
  const { deposits, loading, error, refresh } = useDepositsCache();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState<boolean>(false);
  const [rolloverDeposit, setRolloverDeposit] = useState<Deposit | null>(null);
  const [showChart, setShowChart] = useState<boolean>(false);
  const [showBankSummary, setShowBankSummary] = useState<boolean>(false);
  const [showRateChart, setShowRateChart] = useState<boolean>(false);
  const [showDeposits, setShowDeposits] = useState<boolean>(true);
  const [showUserShare, setShowUserShare] = useState<boolean>(false);
  const [showUserShareChart, setShowUserShareChart] = useState<boolean>(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view');
    
    let startParam: string | undefined;
    try {
      const lp = retrieveLaunchParams() as any;
      startParam = lp.initData?.startParam;
    } catch (err) {
      console.warn("Không thể lấy Telegram start param:", err);
    }

    if (viewParam === 'chart' || startParam === 'chart') {
      setShowChart(true);
    }
  }, []);

  const handleTriggerRollover = (deposit: Deposit) => {
    setRolloverDeposit(deposit);
    setIsRolloverOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#17212b] text-[#f5f5f5] font-sans pb-24">
      <div className="max-w-md mx-auto p-4 space-y-5 animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-xs text-[#708499] uppercase tracking-wider font-semibold">Save Manager</div>
              <div className="text-sm font-bold text-[#64b5f6]">Quản lý tiết kiệm</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 bg-[#2c3847] hover:bg-[#374657] text-xs font-semibold rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
              title="Lấy danh sách mới từ server"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            <button
              onClick={() => setShowChart(!showChart)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${showChart ? 'bg-[#5288c1]/20 text-[#64b5f6]' : 'bg-[#2c3847] hover:bg-[#5288c1]/20 hover:text-[#64b5f6]'}`}
            >
              📈
            </button>
            <button
              onClick={() => setShowBankSummary(!showBankSummary)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${showBankSummary ? 'bg-[#4caf50]/20 text-[#4caf50]' : 'bg-[#2c3847] hover:bg-[#4caf50]/20 hover:text-[#4caf50]'}`}
            >
              🏦
            </button>
            <button
              onClick={() => setShowRateChart(!showRateChart)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${showRateChart ? 'bg-[#e91e63]/20 text-[#e91e63]' : 'bg-[#2c3847] hover:bg-[#e91e63]/20 hover:text-[#e91e63]'}`}
            >
              📉
            </button>
            <button
              onClick={() => setShowUserShare(!showUserShare)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${showUserShare ? 'bg-[#9c27b0]/20 text-[#ce93d8]' : 'bg-[#2c3847] hover:bg-[#9c27b0]/20 hover:text-[#ce93d8]'}`}
            >
              🧩
            </button>
            <button
              onClick={() => setShowUserShareChart(!showUserShareChart)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${showUserShareChart ? 'bg-[#64b5f6]/20 text-[#64b5f6]' : 'bg-[#2c3847] hover:bg-[#64b5f6]/20 hover:text-[#64b5f6]'}`}
            >
              👥
            </button>
          </div>
        </div>

        {/* Biểu đồ tăng trưởng */}
        {showChart && <GrowthChart deposits={deposits} />}

        {/* Tổng hợp theo tài khoản */}
        {showBankSummary && <BankSummaryChart deposits={deposits} />}

        {/* Lãi suất theo ngân hàng */}
        {showRateChart && <InterestRateChart deposits={deposits} />}

        {/* Tỷ trọng theo tài khoản */}
        {showUserShare && <BankShareChart deposits={deposits} />}

        {/* Tỷ trọng theo người dùng */}
        {showUserShareChart && <UserShareChart deposits={deposits} />}

        {/* Deposit List Panel */}
        <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#2b394a] pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📋</span>
              <h2 className="text-lg font-bold text-[#f5f5f5]">
                Tất cả khoản tiết kiệm
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-[10px] text-[#708499]">
                {deposits.length} khoản
              </div>
              <button
                onClick={() => setShowDeposits(!showDeposits)}
                className="px-2.5 py-1 text-xs font-semibold bg-[#2c3847] hover:bg-[#374657] text-[#64b5f6] rounded-lg transition duration-150 cursor-pointer"
              >
                {showDeposits ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {showDeposits && (
            <>
              {loading && deposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-7 h-7 border-3 border-[#5288c1] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-[#708499] animate-pulse">Đang truy vấn dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] text-center p-4 rounded-xl space-y-2 text-xs">
                  <p>{error}</p>
                  <button
                    onClick={refresh}
                    className="px-4 py-1.5 bg-[#ff4d4d]/25 hover:bg-[#ff4d4d]/30 text-white rounded-lg font-semibold transition"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <DepositList deposits={deposits} onTriggerRollover={handleTriggerRollover} />
              )}
            </>
          )}
        </div>

        {/* FAB Floating Action Button */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#5288c1] hover:bg-[#4678ad] active:scale-[0.92] text-[#ffffff] rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all duration-200 z-30 cursor-pointer"
          title="Thêm khoản gửi mới"
        >
          <span className="text-3xl font-bold">+</span>
        </button>

        {/* New Deposit Form Bottom Sheet */}
        <DepositForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={refresh}
        />

        {/* Rollover Form Bottom Sheet */}
        {rolloverDeposit && (
          <RolloverForm
            isOpen={isRolloverOpen}
            onClose={() => {
              setIsRolloverOpen(false);
              setRolloverDeposit(null);
            }}
            oldDeposit={rolloverDeposit}
            onSuccess={refresh}
          />
        )}
      </div>
    </div>
  );
};
