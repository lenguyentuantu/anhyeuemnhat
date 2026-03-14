import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, LogOut, User as UserIcon, Clock, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Employee } from '../types';

interface TopHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  notifications: string[]; 
  currentUser: Partial<Employee>;
  onLogout?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ toggleSidebar, isSidebarOpen, notifications, currentUser, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  // ĐÃ SỬA: Bỏ window.confirm để tránh bị trình duyệt chặn popup
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className={`bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 fixed top-0 right-0 z-30 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'}`}>
      
      {/* Left Section: Toggle & Time */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <Clock size={18} className="text-emerald-600" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm text-slate-800">{formatTime(currentTime)}</span>
            <span className="text-[10px] uppercase font-medium text-slate-500">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* Right Section: Notifications & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Notifications (Giữ nguyên của bạn) */}
        <div className="relative" ref={notificationRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-600'}`}>
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border border-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up origin-top-right">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">Thông báo <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{notifications.length}</span></h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                    <CheckCircle2 size={40} className="text-emerald-200 mb-2"/>
                    <p className="text-sm">Hệ thống hoạt động bình thường.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((note, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start group cursor-pointer">
                        <div className="mt-0.5 text-red-500 bg-red-50 p-1.5 rounded-full group-hover:bg-red-100 transition-colors"><AlertTriangle size={16} /></div>
                        <div>
                          <p className="text-sm text-slate-700 font-medium leading-snug">{note}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Vừa cập nhật</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-slate-200"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2">
          {/* ĐÃ THÊM: Cho phép bấm thẳng vào tên để Đăng Xuất luôn cho nhanh */}
          <div 
            className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoutClick}
            title="Nhấn để đăng xuất"
          >
            <p className="text-sm font-bold text-slate-800">{currentUser.fullName}</p>
            <p className="text-xs text-emerald-600 font-medium">{currentUser.role}</p>
          </div>
          
          <div className="relative group">
            <button className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center border-2 border-transparent hover:border-emerald-200 transition-all cursor-pointer">
              <UserIcon size={18} />
            </button>
            
            {/* ĐÃ SỬA: Dùng pt-2 (padding-top) thay vì mt-2 để làm cầu nối vô hình */}
            <div className="absolute right-0 top-full w-48 pt-2 hidden group-hover:block hover:block z-50">
               <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-1">
                 <button 
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold cursor-pointer"
                >
                   <LogOut size={16} />
                   Đăng xuất ngay
                 </button>
               </div>
          </div> {/* 1. Đóng cái cầu nối tàng hình */}
      </div> {/* 2. Đóng cái div "relative group" */}
    </div> {/* 3. Đóng cái khung chứa Tên + Avatar (User Profile Container) */}
  </div> {/* 4. Đóng toàn bộ khu vực bên phải (Right Section) */}
</header>
  );
};

export default TopHeader;
