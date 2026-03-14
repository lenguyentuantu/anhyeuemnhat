
import React, { useState, useMemo } from 'react';
import { AppData, Customer } from '../types';
import { Search, User, MapPin, Activity, Users, Phone, CalendarClock, Gift, PhoneCall, UserPlus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface Props {
  data: AppData;
  setData?: React.Dispatch<React.SetStateAction<AppData>>;
}

const CustomerList: React.FC<Props> = ({ data, setData }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'reminders'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', age: '', address: '', medicalHistory: '' });

  // Styles (Sapphire & Gold)
  const inputClassName = "w-full border border-blue-200 bg-blue-50/50 p-3 rounded-xl text-[#0047AB] placeholder-blue-300 font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] outline-none transition-all shadow-inner";
  const labelClassName = "text-sm font-bold text-[#0047AB] mb-1 block";

  // List View Filter
  const filtered = data.customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // Reminder Logic
  const reminders = useMemo(() => {
    return data.customers.filter(c => {
      if (!c.medicalHistory) return false;
      if (!c.lastPurchaseDate) return true;

      const [day, month, year] = c.lastPurchaseDate.split('/').map(Number);
      const lastBuy = new Date(year, month - 1, day);
      const now = new Date();
      
      const diffTime = Math.abs(now.getTime() - lastBuy.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 25;
    }).map(c => {
       const [day, month, year] = (c.lastPurchaseDate || "").split('/').map(Number);
       const lastBuy = c.lastPurchaseDate ? new Date(year, month - 1, day) : new Date(0);
       const diffDays = c.lastPurchaseDate ? Math.ceil(Math.abs(new Date().getTime() - lastBuy.getTime()) / (1000 * 60 * 60 * 24)) : 999;
       return { ...c, daysSinceLastBuy: diffDays };
    }).sort((a,b) => b.daysSinceLastBuy - a.daysSinceLastBuy);
  }, [data.customers]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.fullName || !newCustomer.phone) {
      alert("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    const customer: Customer = {
      id: `KH${Date.now()}`,
      fullName: newCustomer.fullName,
      phone: newCustomer.phone,
      age: parseInt(newCustomer.age) || 0,
      address: newCustomer.address || 'Chưa cập nhật',
      loyaltyPoints: 0,
      medicalHistory: newCustomer.medicalHistory || '',
      relativeInfo: ''
    };

    if (setData) {
        // 1. Update Local
        setData(prev => ({
          ...prev,
          customers: [...prev.customers, customer]
        }));
    }

    // 2. Update Cloud (Supabase)
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').insert(customer);
        if (error) {
            console.error("Lỗi khi tạo khách hàng trên Supabase:", error.message);
            alert(`Không thể lưu khách hàng online. ${error.message}`);
        } else {
            console.log("Khách hàng mới đã được lưu vào Supabase");
        }
    } else {
        console.log("Chế độ Offline: Khách hàng mới được lưu cục bộ.");
    }

    setShowModal(false);
    setNewCustomer({ fullName: '', phone: '', age: '', address: '', medicalHistory: '' });
    alert("Thêm khách hàng thành công!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Chăm Sóc Khách Hàng (CRM)</h2>
            <p className="text-slate-500 text-sm">Quản lý hồ sơ và lịch tái khám của bệnh nhân</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Danh sách Khách hàng
          </button>
           <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'reminders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarClock size={16}/> Nhắc lịch Mua lại 
            {reminders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{reminders.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0047AB]" size={18} />
              <input 
                type="text" 
                placeholder="Tìm theo tên hoặc số điện thoại..." 
                className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl bg-blue-50/30 text-[#0047AB] placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} /> Thêm Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(cust => (
              <div key={cust.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{cust.fullName}</h3>
                    <p className="text-sm text-slate-500">{cust.id} • {cust.age} tuổi</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Gift size={12} /> {cust.loyaltyPoints} điểm
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-5"><Phone size={16} /></span>
                    <span className="font-medium text-slate-700">{cust.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-5"><MapPin size={16} /></span>
                    <span className="text-slate-600">{cust.address}</span>
                  </div>
                  {cust.medicalHistory && (
                    <div className="flex gap-2 mt-2 bg-red-50 p-2 rounded border border-red-100">
                      <span className="text-red-500 w-5"><Activity size={16} /></span>
                      <span className="text-red-700 font-medium">Tiền sử: {cust.medicalHistory}</span>
                    </div>
                  )}
                  {cust.relativeInfo && (
                    <div className="flex gap-2 mt-1">
                      <span className="text-slate-400 w-5"><Users size={16} /></span>
                      <span className="text-slate-600 italic">Nhân thân: {cust.relativeInfo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reminders' && (
         <div className="animate-fade-in space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
               <CalendarClock className="text-blue-500 shrink-0" />
               <div>
                  <h3 className="font-bold text-blue-800">Khách hàng cần mua lại thuốc (Định kỳ)</h3>
                  <p className="text-sm text-blue-700/80">
                     Danh sách khách hàng có tiền sử bệnh mãn tính và chưa phát sinh giao dịch trong 30 ngày qua. 
                     Vui lòng liên hệ để tư vấn mua thuốc định kỳ.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {reminders.map(cust => (
                  <div key={cust.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg">
                           !
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-lg">{cust.fullName}</h4>
                           <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>{cust.phone}</span> • 
                              <span className="text-red-500 font-medium">Mua lần cuối: {cust.lastPurchaseDate || 'N/A'} (Cách đây {cust.daysSinceLastBuy} ngày)</span>
                           </div>
                           <p className="text-xs text-slate-400 mt-1">Bệnh lý: {cust.medicalHistory}</p>
                        </div>
                     </div>
                     <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                        <PhoneCall size={18} />
                        Gọi điện ngay
                     </button>
                  </div>
               ))}
               {reminders.length === 0 && (
                  <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                     <Users size={48} className="mx-auto mb-2 opacity-30"/>
                     <p>Không có khách hàng nào cần nhắc lịch trong hôm nay.</p>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-2 border-white/50">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                 <h3 className="font-bold text-[#0047AB] text-lg flex items-center gap-2">
                    <UserPlus size={20} className="text-[#FFD700]"/> Thêm Khách Hàng Mới
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className={labelClassName}>Họ và Tên <span className="text-red-500">*</span></label>
                    <input 
                       type="text" 
                       className={inputClassName}
                       placeholder="VD: Nguyễn Văn A"
                       value={newCustomer.fullName}
                       onChange={e => setNewCustomer({...newCustomer, fullName: e.target.value})}
                       autoFocus
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className={labelClassName}>Số Điện Thoại <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          className={inputClassName}
                          placeholder="09..."
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className={labelClassName}>Tuổi</label>
                       <input 
                          type="number" 
                          className={inputClassName}
                          placeholder="VD: 30"
                          value={newCustomer.age}
                          onChange={e => setNewCustomer({...newCustomer, age: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className={labelClassName}>Địa chỉ</label>
                    <input 
                       type="text" 
                       className={inputClassName}
                       placeholder="Nhập địa chỉ..."
                       value={newCustomer.address}
                       onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    />
                 </div>
                  <div className="space-y-1">
                    <label className={labelClassName}>Tiền sử bệnh</label>
                    <input 
                       type="text" 
                       className={inputClassName}
                       placeholder="VD: Dị ứng thuốc, Tiểu đường..."
                       value={newCustomer.medicalHistory}
                       onChange={e => setNewCustomer({...newCustomer, medicalHistory: e.target.value})}
                    />
                 </div>
                 <button 
                    onClick={handleCreateCustomer}
                    className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/30 transition-all mt-4 border border-[#003380]"
                 >
                    Lưu & Chọn Khách Hàng
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
