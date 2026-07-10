import React, { useState } from 'react';
import { UserSelector } from './UserSelector';

export const App: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleSelectUser = (user: string) => {
    setSelectedUser(user);
  };

  const handleLogout = () => {
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-[#17212b] text-[#f5f5f5] font-sans">
      {!selectedUser ? (
        <UserSelector onSelectUser={handleSelectUser} />
      ) : (
        <div className="max-w-md mx-auto p-4 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#0e1621] border border-[#2b394a] rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">👤</span>
              <div>
                <div className="text-xs text-[#708499] uppercase tracking-wider font-semibold">Tài khoản</div>
                <div className="text-sm font-bold text-[#64b5f6]">{selectedUser}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-[#2c3847] hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Thoát
            </button>
          </div>

          {/* Placeholder for list & form */}
          <div className="bg-[#0e1621] border border-[#2b394a] rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold border-b border-[#2b394a] pb-3 text-[#f5f5f5]">
              Danh sách khoản gửi
            </h2>
            <div className="text-center py-12 text-[#708499] space-y-2">
              <span className="text-4xl block animate-pulse">⏳</span>
              <p className="text-sm">Danh sách khoản gửi và biểu mẫu sẽ xuất hiện ở Wave tiếp theo.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
