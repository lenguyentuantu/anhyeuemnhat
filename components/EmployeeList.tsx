
import React, { useState } from 'react';
import { AppData, Employee, EmployeeRole } from '../types';
import { User, Phone, Briefcase, Award, Plus, X, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const EmployeeList: React.FC<Props> = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  
  // Form State
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    fullName: '',
    phone: '',
    role: EmployeeRole.SALES,
    degree: '',
    age: 20
  });

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Styles
  const inputClassName = "w-full border border-blue-200 bg-blue-50/50 p-3 rounded-xl text-[#0047AB] placeholder-blue-300 font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] outline-none transition-all shadow-inner";
  const labelClassName = "text-sm font-bold text-[#0047AB] mb-1 block";
  const adminEmail = "lenguyentuantu0710@gmail.com";

  const handleRequestOtp = async () => {
    if (!newEmp.fullName || !newEmp.phone || !newEmp.degree || !newEmp.age) {
        alert("Vui lòng điền đầy đủ thông tin nhân viên.");
        return;
    }
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(code);
        
        console.log(`[EMAIL SENT] To: ${adminEmail}`);
        console.log(`[CONTENT] Mã xác thực thêm nhân viên: ${code}`);
        
        // In real app, you would verify this code from email. 
        // For demo, we show alert so user can proceed.
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

     const employee: Employee = {
         id: `NV${Date.now().toString().slice(-4)}`,
         fullName: newEmp.fullName || '',
         phone: newEmp.phone || '',
         role: newEmp.role || EmployeeRole.SALES,
         degree: newEmp.degree || '',
         age: Number(newEmp.age),
         password: '123' // Default password
     };

     // 1. Update Local
     setData(prev => ({
         ...prev,
         employees: [...prev.employees, employee]
     }));

     // 2. Update Cloud
     if (isSupabaseConfigured) {
         await supabase.from('employees').insert(employee);
     }

     alert("Thêm nhân viên mới thành công!");
     setShowModal(false);
     setStep('form');
     setNewEmp({ fullName: '', phone: '', role: EmployeeRole.SALES, degree: '', age: 20 });
     setInputOtp('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Danh Sách Nhân Viên</h2>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-900/30 transition-all flex items-center gap-2"
        >
          <Plus size={18} className="text-[#FFD700]"/> Thêm Nhân Viên
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:border-blue-200 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-[#0047AB] transition-colors">
                  <User className="text-blue-500 group-hover:text-[#FFD700]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0047AB]">{emp.fullName}</h3>
                  <p className="text-xs text-slate-500">Mã: {emp.id}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  emp.role === EmployeeRole.MANAGER ? 'bg-purple-100 text-purple-700' :
                  emp.role === EmployeeRole.PHARMACIST ? 'bg-emerald-100 text-emerald-700' :
                  'bg-blue-100 text-blue-700'
              }`}>
                {emp.role}
              </span>
            </div>
            
            <div className="space-y-2 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Award size={16} className="text-slate-400" />
                <span>{emp.degree}</span>
              </div>
               <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase size={16} className="text-slate-400" />
                <span>{emp.age} tuổi</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-2 border-white/50">
              
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                 <h3 className="font-bold text-[#0047AB] text-lg flex items-center gap-2">
                    <UserPlus size={20} className="text-[#FFD700]"/> Thêm Nhân Viên Mới
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
              </div>

              <div className="p-6">
                 {step === 'form' ? (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className={labelClassName}>Họ và Tên</label>
                            <input type="text" className={inputClassName} value={newEmp.fullName} onChange={e => setNewEmp({...newEmp, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClassName}>Số Điện Thoại</label>
                            <input type="text" className={inputClassName} value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} placeholder="090..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={labelClassName}>Chức Vụ</label>
                                <select className={inputClassName} value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value as EmployeeRole})}>
                                    <option value={EmployeeRole.SALES}>Bán hàng</option>
                                    <option value={EmployeeRole.PHARMACIST}>Dược sĩ</option>
                                    <option value={EmployeeRole.WAREHOUSE}>Kho</option>
                                    <option value={EmployeeRole.MANAGER}>Quản lý</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className={labelClassName}>Tuổi</label>
                                <input type="number" className={inputClassName} value={newEmp.age} onChange={e => setNewEmp({...newEmp, age: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClassName}>Bằng Cấp / Trình Độ</label>
                            <input type="text" className={inputClassName} value={newEmp.degree} onChange={e => setNewEmp({...newEmp, degree: e.target.value})} placeholder="VD: Dược sĩ Đại học" />
                        </div>

                        <div className="pt-2">
                             <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-100 text-xs flex gap-2 mb-3">
                                 <Mail size={16} className="shrink-0"/>
                                 <span>Để đảm bảo an toàn, mã xác thực (OTP) sẽ được gửi đến email quản trị: <b>{adminEmail}</b></span>
                             </div>
                             <button 
                                onClick={handleRequestOtp} 
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                             >
                                {loading ? 'Đang gửi...' : 'Gửi Mã Xác Thực & Tiếp Tục'}
                             </button>
                        </div>
                    </div>
                 ) : (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#0047AB]">
                            <ShieldCheck size={32}/>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-[#0047AB]">Nhập Mã Xác Thực</h4>
                            <p className="text-sm text-slate-500 mt-1">Mã đã gửi đến {adminEmail}</p>
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
                            <button onClick={handleVerifyAndSave} className="flex-1 bg-[#0047AB] text-white py-3 rounded-xl font-bold hover:shadow-lg">Xác Nhận</button>
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

export default EmployeeList;
