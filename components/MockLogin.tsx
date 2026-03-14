import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const MockLogin: React.FC = () => {
  const { currentUser, login, logout } = useAuth();

  return (
    <div className="p-4 bg-yellow-50 border-b border-yellow-200 flex justify-between items-center relative z-50">
      <div>
        <span className="font-bold mr-2 text-gray-700">Trạng thái Test Role:</span>
        {currentUser ? (
          <span className={`px-2 py-1 rounded text-white text-sm font-semibold ${currentUser.role === 'QUAN_LY' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            {currentUser.name} ({currentUser.role})
          </span>
        ) : (
          <span className="text-gray-500 italic">Chưa đăng nhập</span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => login('admin', '123')} className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-sm font-medium">
          Dùng thử tư cách Quản lý
        </button>
        <button onClick={() => login('nhanvien', '123')} className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-sm font-medium">
          Dùng thử tư cách Nhân viên
        </button>
        {currentUser && (
          <button onClick={logout} className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium">
            Thoát
          </button>
        )}
      </div>
    </div>
  );
};