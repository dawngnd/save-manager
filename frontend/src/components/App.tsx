import React, { useState, useEffect } from 'react';
import { UserSelector } from './UserSelector';
import { DepositList } from './DepositList';
import { DepositForm } from './DepositForm';
import { callBackendApi } from '../api';
import { Deposit } from '../types';

export const App: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const fetchDeposits = async (username: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await callBackendApi<Deposit[]>({
        action: 'get_deposits',
        username_bankcode: username,
      });
      setDeposits(data);
    } catch (err: any) {
      console.error('Failed to fetch deposits:', err);
      setError(err.message || 'Không thể tải danh sách khoản tiết kiệm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDeposits(selectedUser);
    } else {
      setDeposits([]);
    }
  }, [selectedUser]);

  const handleSelectUser = (user: string) => {
    setSelectedUser(user);
  };

  const handleLogout = () => {
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    if (selectedUser) {
      fetchDeposits(selectedUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#17212b] text-[#f5f5f5] font-sans pb-24">
      {!selectedUser ? (
        <UserSelector onSelectUser={handleSelectUser} />
      ) : (
        <div className="max-w-md mx-auto p-4 space-y-5 animate-fade-in">
          
          {/* Header */}
          <div className="flex justify-between items-center bg-[#0e1621] border border-[#2b394a] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">👤</span>
              <div>
                <div className="text-xs text-[#708499] uppercase tracking-wider font-semibold">Tài khoản</div>
                <div className="text-sm font-bold text-[#64b5f6]">{selectedUser}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-[#2c3847] hover:bg-[#ff4d4d]/15 hover:text-[#ff4d4d] text-xs font-semibold rounded-xl transition duration-150 cursor-pointer"
            >
              Thoát
            </button>
          </div>

          {/* Active Deposit List Panel */}
          <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#2b394a] pb-3">
              <h2 className="text-lg font-bold text-[#f5f5f5]">
                Khoản đáo hạn cần xử lý
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="text-xs font-medium text-[#64b5f6] hover:text-[#90caf9] active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-7 h-7 border-3 border-[#5288c1] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-[#708499] animate-pulse">Đang truy vấn số dư...</p>
              </div>
            ) : error ? (
              <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] text-center p-4 rounded-xl space-y-2 text-xs">
                <p>{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-1.5 bg-[#ff4d4d]/25 hover:bg-[#ff4d4d]/30 text-white rounded-lg font-semibold transition"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <DepositList deposits={deposits} />
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
            usernameBankcode={selectedUser}
            onSuccess={handleRefresh}
          />
        </div>
      )}
    </div>
  );
};
