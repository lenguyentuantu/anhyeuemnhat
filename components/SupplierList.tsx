
import React, { useState } from 'react';
import { AppData, Supplier, SupplierType } from '../types';
import { Truck, Globe, FileText, Phone, Plus, X, Building2, MapPin, Mail, ShieldCheck, Search } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const SupplierList: React.FC<Props> = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newSup, setNewSup] = useState<Partial<Supplier>>({
      name: '',
      address: '',
      phone: '',
      taxId: '',
      countryId: 'VN',
      type: SupplierType.DOMESTIC
  });

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Styles
  const inputClassName = "w-full border border-blue-200 bg-blue-50/50 p-3 rounded-xl text-[#0047AB] placeholder-blue-300 font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] outline-none transition-all shadow-inner";
  const labelClassName = "text-sm font-bold text-[#0047AB] mb-1 block";
  const adminEmail = "lenguyentuantu0710@gmail.com";

  // Filter Logic
  const filteredSuppliers = data.suppliers.filter(sup => 
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.phone.includes(searchTerm) ||
    sup.taxId.includes(searchTerm) || 
    sup.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestOtp = async () => {
    if (!newSup.name || !newSup.phone || !newSup.taxId || !newSup.address) {
        alert("Vui lòng điền đầy đủ thông tin nhà cung cấp.");
        return;
    }
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(code);
        
        console.log(`[EMAIL SENT] To: ${adminEmail}`);
        console.log(`[CONTENT] Mã xác thực thêm NCC: ${code}`);
        
        alert(`Hệ thống đã gửi mã xác thực đến email quản trị viên: ${adminEmail}.\n\n(Mã Demo: ${code})`);
        
        setStep('verify');
        setLoading(false);
    }, 1500);
  };

  const handleVerifyAndSave = async () => {
     if (inputOtp !== otpCode) {
         alert("Mã xác thực không đúng. Vui lòng kiểm tra email.");
         return;
     }

     // Generate ID
     const generatedId = `NCC${Date.now().toString().slice(-4)}`;

     // 1. Prepare Local Object (camelCase for React App)
     const supplierLocal: Supplier = {
         id: generatedId,
         name: newSup.name || '',
         address: newSup.address || '',
         phone: newSup.phone || '',
         taxId: newSup.taxId || '',
         countryId: newSup.countryId || 'VN',
         type: newSup.type || SupplierType.DOMESTIC
     };

     try {
         // 2. Update Cloud (Supabase) with Error Handling
         if (isSupabaseConfigured) {
             // Correctly map keys to database column names
             // Note: Columns in DB script are created with quotes: "taxId", "countryId"
             const dbPayload = {
                 id: generatedId,
                 name: supplierLocal.name,
                 address: supplierLocal.address,
                 phone: supplierLocal.phone,
                 taxId: supplierLocal.taxId,      // Fixed: tax_id -> taxId
                 countryId: supplierLocal.countryId, // Fixed: country_id -> countryId
                 type: supplierLocal.type
             };

             const { error } = await supabase.from('suppliers').insert(dbPayload);

             if (error) {
                 throw error; // Throw to catch block
             }
         }

         // 3. Update Local State (Only if Cloud success or Offline)
         setData(prev => ({
             ...prev,
             suppliers: [...prev.suppliers, supplierLocal]
         }));

         alert("Thêm nhà cung cấp thành công!");
         setShowModal(false);
         setStep('form');
         setNewSup({ name: '', address: '', phone: '', taxId: '', countryId: 'VN', type: SupplierType.DOMESTIC });
         setInputOtp('');

     } catch (error: any) {
         console.error("Critical Error adding supplier:", error);
         // Alert exact error from Supabase
         alert(`Lỗi khi lưu dữ liệu vào Supabase!\n\nChi tiết: ${error.message}\nMã lỗi: ${error.code}`);
     }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Nhà Cung Cấp</h2>
        <button 
             onClick={() => setShowModal(true)}
             className="bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-900/30 transition-all flex items-center gap-2"
        >
          <Plus size={18} className="text-[#FFD700]"/> Thêm NCC
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0047AB]" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm NCC, SĐT, Mã số thuế..." 
            className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl bg-blue-50/30 text-[#0047AB] placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Nhà Cung Cấp</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Thông tin liên hệ</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Pháp lý</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Loại hình</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSuppliers.length === 0 ? (
                <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                        Không tìm thấy nhà cung cấp nào phù hợp.
                    </td>
                </tr>
            ) : (
                filteredSuppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                    <div className="font-bold text-slate-800">{sup.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Truck size={12} /> {sup.id}
                    </div>
                    </td>
                    <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Phone size={14} /> {sup.phone}</div>
                        <div className="text-xs text-slate-400">{sup.address}</div>
                    </div>
                    </td>
                    <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText size={14} /> MST: {sup.taxId}
                    </div>
                    </td>
                    <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sup.type === SupplierType.IMPORT 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                        {sup.type === SupplierType.IMPORT ? <Globe size={12} /> : <Truck size={12} />}
                        {sup.type}
                    </span>
                    <div className="text-xs text-slate-400 mt-1 pl-1">Quốc gia: {sup.countryId}</div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

       {/* Add Supplier Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-2 border-white/50">
              
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                 <h3 className="font-bold text-[#0047AB] text-lg flex items-center gap-2">
                    <Building2 size={20} className="text-[#FFD700]"/> Thêm Nhà Cung Cấp
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
              </div>

              <div className="p-6">
                 {step === 'form' ? (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className={labelClassName}>Tên Nhà Cung Cấp</label>
                            <input type="text" className={inputClassName} value={newSup.name} onChange={e => setNewSup({...newSup, name: e.target.value})} placeholder="Công ty Dược..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className={labelClassName}>Số Điện Thoại</label>
                              <input type="text" className={inputClassName} value={newSup.phone} onChange={e => setNewSup({...newSup, phone: e.target.value})} placeholder="028..." />
                           </div>
                           <div className="space-y-1">
                              <label className={labelClassName}>Mã Số Thuế</label>
                              <input type="text" className={inputClassName} value={newSup.taxId} onChange={e => setNewSup({...newSup, taxId: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClassName}>Địa Chỉ</label>
                            <input type="text" className={inputClassName} value={newSup.address} onChange={e => setNewSup({...newSup, address: e.target.value})} placeholder="Số nhà, đường, quận..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={labelClassName}>Loại Hình</label>
                                <select className={inputClassName} value={newSup.type} onChange={e => setNewSup({...newSup, type: e.target.value as SupplierType})}>
                                    <option value={SupplierType.DOMESTIC}>Nội địa</option>
                                    <option value={SupplierType.IMPORT}>Nhập khẩu</option>
                                </select>
                            </div>
                             <div className="space-y-1">
                                <label className={labelClassName}>Quốc Gia</label>
                                <input type="text" className={inputClassName} value={newSup.countryId} onChange={e => setNewSup({...newSup, countryId: e.target.value})} placeholder="VN" />
                            </div>
                        </div>

                        <div className="pt-2">
                             <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-100 text-xs flex gap-2 mb-3">
                                 <Mail size={16} className="shrink-0"/>
                                 <span>Cần xác thực quản trị viên qua email: <b>{adminEmail}</b> trước khi thêm đối tác mới.</span>
                             </div>
                             <button 
                                onClick={handleRequestOtp} 
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                             >
                                {loading ? 'Đang gửi...' : 'Gửi Mã Xác Thực & Lưu'}
                             </button>
                        </div>
                    </div>
                 ) : (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#0047AB]">
                            <ShieldCheck size={32}/>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-[#0047AB]">Xác Thực Bảo Mật</h4>
                            <p className="text-sm text-slate-500 mt-1">Nhập mã OTP từ email {adminEmail}</p>
                        </div>
                        
                        <input 
                            type="text" 
                            className="text-center text-3xl font-mono font-bold tracking-widest w-full border-b-2 border-slate-200 focus:border-[#FFD700] outline-none py-2 text-[#0047AB]"
                            placeholder="••••••"
                            maxLength={6}
                            value={inputOtp}
                            onChange={e => setInputOtp(e.target.value)}
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setStep('form')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Quay lại</button>
                            <button onClick={handleVerifyAndSave} className="flex-1 bg-[#0047AB] text-white py-3 rounded-xl font-bold hover:shadow-lg">Hoàn Tất Thêm</button>
                        </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
