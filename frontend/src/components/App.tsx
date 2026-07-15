import React, { useState, useEffect } from 'react';
import { DepositList } from './DepositList';
import { DepositForm } from './DepositForm';
import { RolloverForm } from './RolloverForm';
import { GrowthChart } from './GrowthChart';
import { BankSummaryChart } from './BankSummaryChart';
import { InterestRateChart } from './InterestRateChart';
import { BankShareChart } from './BankShareChart';
import { UserShareChart } from './UserShareChart';
import { GoldForm } from './GoldForm';
import { GoldList } from './GoldList';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { Deposit, GoldPrice } from '../types';
import { useDepositsCache } from '../hooks/useDepositsCache';
import { useGoldsCache } from '../hooks/useGoldsCache';
import { getGoldPrice } from '../api';

type ActiveTab = 'deposits' | 'gold';

export const App: React.FC = () => {
  const { deposits, loading, error, refresh } = useDepositsCache();
  const { golds, loading: goldsLoading, error: goldsError, refresh: refreshGolds } = useGoldsCache();

  const [activeTab, setActiveTab]           = useState<ActiveTab>('deposits');
  const [isFormOpen, setIsFormOpen]         = useState<boolean>(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState<boolean>(false);
  const [rolloverDeposit, setRolloverDeposit] = useState<Deposit | null>(null);
  const [isGoldFormOpen, setIsGoldFormOpen] = useState<boolean>(false);

  // Chart toggles (chỉ hiển thị ở tab tiết kiệm)
  const [showChart, setShowChart]             = useState<boolean>(false);
  const [showBankSummary, setShowBankSummary] = useState<boolean>(false);
  const [showRateChart, setShowRateChart]     = useState<boolean>(false);
  const [showDeposits, setShowDeposits]       = useState<boolean>(true);
  const [showUserShare, setShowUserShare]     = useState<boolean>(false);
  const [showUserShareChart, setShowUserShareChart] = useState<boolean>(false);

  // Giá vàng
  const [goldPrice, setGoldPrice]         = useState<GoldPrice | null>(null);
  const [goldPriceLoading, setGoldPriceLoading] = useState(false);
  const [goldPriceError, setGoldPriceError]     = useState<string | null>(null);

  const GOLD_PRICE_CACHE_KEY = 'save_manager_gold_price_cache';
  const GOLD_PRICE_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 ngày

  const readGoldPriceCache = (): GoldPrice | null => {
    try {
      const raw = localStorage.getItem(GOLD_PRICE_CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (Date.now() - new Date(cached.updated_at).getTime() > GOLD_PRICE_CACHE_TTL) {
        localStorage.removeItem(GOLD_PRICE_CACHE_KEY);
        return null;
      }
      return cached;
    } catch {
      return null;
    }
  };

  const writeGoldPriceCache = (price: GoldPrice) => {
    localStorage.setItem(GOLD_PRICE_CACHE_KEY, JSON.stringify(price));
  };

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

  const handleRefreshGoldPrice = async (forceRefresh = true) => {
    setGoldPriceLoading(true);
    setGoldPriceError(null);
    try {
      const data = await getGoldPrice(forceRefresh);
      setGoldPrice(data as GoldPrice);
      writeGoldPriceCache(data as GoldPrice);
    } catch (err: any) {
      setGoldPriceError(err.message || 'Không thể lấy giá vàng.');
    } finally {
      setGoldPriceLoading(false);
    }
  };

  // Auto-load giá vàng khi chuyển sang tab Vàng (ưu tiên cache)
  useEffect(() => {
    if (activeTab === 'gold' && !goldPrice && !goldPriceLoading) {
      const cached = readGoldPriceCache();
      if (cached) {
        setGoldPrice(cached);
      } else {
        handleRefreshGoldPrice(false);
      }
    }
  }, [activeTab]);

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
            <span className="text-3xl">{activeTab === 'gold' ? '🥇' : '💰'}</span>
            <div>
              <div className="text-xs text-[#708499] uppercase tracking-wider font-semibold">Save Manager</div>
              <div className="text-sm font-bold text-[#64b5f6]">
                {activeTab === 'gold' ? 'Quản lý vàng' : 'Quản lý tiết kiệm'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {activeTab === 'deposits' ? (
              <>
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
              </>
            ) : (
              <button
                onClick={refreshGolds}
                disabled={goldsLoading}
                className="px-3 py-2 bg-[#2c3847] hover:bg-[#374657] text-xs font-semibold rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
                title="Tải lại danh sách vàng"
              >
                {goldsLoading ? '⏳' : '🔄'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-[#0e1621] border border-[#2b394a] rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-[#5288c1] text-white shadow'
                : 'text-[#708499] hover:text-[#f5f5f5]'
            }`}
          >
            💰 Tiết kiệm
          </button>
          <button
            onClick={() => setActiveTab('gold')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'gold'
                ? 'bg-[#f5a623] text-white shadow'
                : 'text-[#708499] hover:text-[#f5f5f5]'
            }`}
          >
            🥇 Vàng
          </button>
        </div>

        {/* ══════════ TAB: TIẾT KIỆM ══════════ */}
        {activeTab === 'deposits' && (
          <>
            {showChart && <GrowthChart deposits={deposits} />}
            {showBankSummary && <BankSummaryChart deposits={deposits} />}
            {showRateChart && <InterestRateChart deposits={deposits} />}
            {showUserShare && <BankShareChart deposits={deposits} />}
            {showUserShareChart && <UserShareChart deposits={deposits} />}

            <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#2b394a] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📋</span>
                  <h2 className="text-lg font-bold text-[#f5f5f5]">Tất cả khoản tiết kiệm</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-[10px] text-[#708499]">{deposits.length} khoản</div>
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
                      <button onClick={refresh} className="px-4 py-1.5 bg-[#ff4d4d]/25 hover:bg-[#ff4d4d]/30 text-white rounded-lg font-semibold transition">
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    <DepositList deposits={deposits} onTriggerRollover={handleTriggerRollover} />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ══════════ TAB: VÀNG ══════════ */}
        {activeTab === 'gold' && (
          <>
            {/* Banner giá vàng */}
            <div className="bg-[#0e1621] border border-[#f5a623]/20 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-[#708499] uppercase tracking-wider font-semibold">Giá vàng BTMH (1 chỉ)</div>
                  {goldPrice ? (
                    <div className="text-xl font-bold text-[#f5a623]">
                      {goldPrice.price_per_chi.toLocaleString('vi-VN')} ₫
                    </div>
                  ) : goldPriceLoading ? (
                    <div className="h-7 w-40 bg-[#2c3847] rounded animate-pulse mt-1" />
                  ) : (
                    <div className="text-sm text-[#708499] italic">Chưa có giá</div>
                  )}
                  {goldPrice && (
                    <div className="text-[10px] text-[#708499] mt-0.5">
                      Cập nhật: {new Date(goldPrice.updated_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRefreshGoldPrice(true)}
                  disabled={goldPriceLoading}
                  className="px-4 py-2 bg-[#f5a623]/15 hover:bg-[#f5a623]/25 text-[#f5a623] text-xs font-bold rounded-xl border border-[#f5a623]/30 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {goldPriceLoading ? '⏳' : '🔃 Cập nhật'}
                </button>
              </div>
              {goldPriceError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  {goldPriceError}
                </div>
              )}
            </div>

            {/* Danh sách vàng */}
            <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#2b394a] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🥇</span>
                  <h2 className="text-lg font-bold text-[#f5f5f5]">Danh sách vàng</h2>
                </div>
                <div className="text-[10px] text-[#708499]">{golds.length} bản ghi</div>
              </div>

              {goldsLoading && golds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-7 h-7 border-3 border-[#f5a623] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-[#708499] animate-pulse">Đang tải...</p>
                </div>
              ) : goldsError ? (
                <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] text-center p-4 rounded-xl space-y-2 text-xs">
                  <p>{goldsError}</p>
                  <button onClick={refreshGolds} className="px-4 py-1.5 bg-[#ff4d4d]/25 hover:bg-[#ff4d4d]/30 text-white rounded-lg font-semibold transition">
                    Thử lại
                  </button>
                </div>
              ) : (
                <GoldList
                  golds={golds}
                  goldPrice={goldPrice}
                  priceLoading={goldPriceLoading}
                  onRefreshPrice={() => handleRefreshGoldPrice(true)}
                />
              )}
            </div>
          </>
        )}

        {/* FAB — hiển thị theo tab */}
        {activeTab === 'deposits' && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#5288c1] hover:bg-[#4678ad] active:scale-[0.92] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all duration-200 z-30 cursor-pointer"
            title="Thêm khoản gửi mới"
          >
            <span className="text-3xl font-bold">+</span>
          </button>
        )}
        {activeTab === 'gold' && (
          <button
            onClick={() => setIsGoldFormOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#f5a623] hover:bg-[#e09520] active:scale-[0.92] text-white rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/20 transition-all duration-200 z-30 cursor-pointer"
            title="Thêm bản ghi vàng"
          >
            <span className="text-2xl">🥇</span>
          </button>
        )}

        {/* Forms */}
        <DepositForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={refresh} />

        {rolloverDeposit && (
          <RolloverForm
            isOpen={isRolloverOpen}
            onClose={() => { setIsRolloverOpen(false); setRolloverDeposit(null); }}
            oldDeposit={rolloverDeposit}
            onSuccess={refresh}
          />
        )}

        <GoldForm
          isOpen={isGoldFormOpen}
          onClose={() => setIsGoldFormOpen(false)}
          onSuccess={refreshGolds}
        />
      </div>
    </div>
  );
};
