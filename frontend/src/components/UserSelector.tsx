import React, { useEffect, useState } from 'react';
import { callBackendApi } from '../api';

interface UserSelectorProps {
  onSelectUser: (username: string) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ onSelectUser }) => {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const data = await callBackendApi<string[]>({ action: 'get_users' });
        setUsers(data);
        if (data.length > 0) {
          setSelectedUser(data[0]);
        }
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setError(err.message || 'Không thể tải danh sách tài khoản.');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onSelectUser(selectedUser);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-[#0e1621] border border-[#2b394a] rounded-2xl p-6 shadow-2xl space-y-6 animate-slide-up">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🔑</div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">
            Xác thực tài khoản
          </h2>
          <p className="text-sm text-[#708499]">
            Vui lòng chọn tài khoản tiết kiệm của bạn để tiếp tục
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-8 h-8 border-4 border-[#5288c1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-[#708499] animate-pulse">Đang tải danh sách tài khoản...</p>
          </div>
        ) : error ? (
          <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm text-[#ff4d4d]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#ff4d4d]/20 hover:bg-[#ff4d4d]/30 text-[#ff4d4d] rounded-lg text-xs font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="user-select" className="text-xs font-semibold text-[#708499] uppercase tracking-wider block">
                Tài khoản ngân hàng (Username)
              </label>
              <div className="relative">
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-sm text-[#f5f5f5] appearance-none focus:outline-none transition cursor-pointer"
                >
                  {users.map((username) => (
                    <option key={username} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#708499]">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedUser}
              className="w-full py-3.5 px-4 bg-[#5288c1] hover:bg-[#4678ad] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-[#ffffff] font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              Truy cập dữ liệu
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
