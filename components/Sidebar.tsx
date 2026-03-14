import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, Settings, Pill, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const { currentUser } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'sales', label: 'Bán Hàng (POS)', icon: ShoppingCart },
    { id: 'products', label: 'Sản Phẩm & Thuốc', icon: Pill },
    { id: 'inventory', label: 'Kho & Lô Hàng', icon: Package, requireManager: true },
    { id: 'reports', label: 'Báo Cáo & Thuế', icon: PieChart, requireManager: true }, // NEW
    { id: 'customers', label: 'Khách Hàng', icon: Users },
    { id: 'suppliers', label: 'Nhà Cung Cấp', icon: Truck, requireManager: true },
    { id: 'employees', label: 'Nhân Viên', icon: Settings, requireManager: true },
  ];

  // Custom Logo Component for Sidebar
  const SidebarLogo = () => (
    <svg width={28} height={28} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="16" stroke="#FFD700" strokeWidth="4" fill="transparent" />
      <rect x="14" y="16" width="6" height="12" rx="1" fill="#FF4444" />
      <line x1="17" y1="12" x2="17" y2="32" stroke="#FF4444" strokeWidth="3" strokeLinecap="round"/>
      <rect x="26" y="20" width="6" height="12" rx="1" fill="#00C851" />
      <line x1="29" y1="16" x2="29" y2="36" stroke="#00C851" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div 
      className={`bg-[#0047AB] text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-xl transition-all duration-300 ${
        isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
      }`}
    >
      <div className="p-6 border-b border-[#1E5FD6] flex items-center gap-3 h-20 bg-[#0047AB]">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
          <SidebarLogo />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-xl font-bold tracking-tight whitespace-nowrap text-white font-serif">BabyPharma</h1>
          <p className="text-[10px] text-[#FFD700] whitespace-nowrap opacity-90 font-medium">Sapphire Edition</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          // Kiểm tra quyền: Nếu mục yêu cầu Quản lý mà user không phải Quản lý thì ẩn đi
          if (item.requireManager && currentUser?.role !== 'QUAN_LY') {
            return null;
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-[#1E5FD6] text-white shadow-lg shadow-[#003380]/40 font-bold border-l-4 border-[#FFD700]'
                  : 'text-blue-100 hover:bg-[#1E5FD6]/30 hover:text-white'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? 'text-[#FFD700]' : 'group-hover:text-blue-200'}`} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#1E5FD6] text-center text-xs text-blue-200/80">
        v2.1.0 - Sapphire Premium
      </div>
    </div>
  );
};

export default Sidebar;
