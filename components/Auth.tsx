import React, { useState } from 'react';
import { AppData, Employee, EmployeeRole } from '../types';
import { User, Lock, Phone, ArrowRight, ShieldCheck, Mail, Briefcase, Star, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // <-- ĐÃ THÊM IMPORT NÀY

interface AuthProps {
  employees: Employee[];
  onLogin: (user: Employee) => void;
  onRegister: (newEmployee: Employee) => void;
}

const Auth: React.FC<AuthProps> = ({ employees, onLogin, onRegister }) => {
  const { login } = useAuth(); // <-- GỌI HÀM LOGIN TỪ CONTEXT
  const [view, setView] = useState<'login' | 'register' | 'verify'>('login');
  
  // Login State
  const [loginId, setLoginId] = useState('admin');
  const [loginPass, setLoginPass] = useState('123');
  const [error, setError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<EmployeeRole>(EmployeeRole.SALES);
  const [regPass, setRegPass] = useState('');
  
  // Verification State
  const [otpCode, setOtpCode] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<Employee | null>(null);

  // --- Styles ---
  const sapphireInputStyle = "w-full pl-10 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none bg-[#0047AB] text-white placeholder-blue-300 transition-all shadow-inner";
  const labelStyle = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-[#FFD700]"; 

  // --- LOGIC ĐĂNG NHẬP MỚI ĐÃ ĐƯỢC PHÂN QUYỀN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gọi hàm login xịn xò từ AuthContext
    const isSuccess = login(loginId, loginPass);
    
    if (isSuccess) {
      // Tạo một user giả lập để pass qua cổng App.tsx hiện tại
      const loggedUser: Employee = {
        id: loginId,
        fullName: loginId === 'admin' ? 'Quản Trị Viên' : 'Nhân Viên',
        role: loginId === 'admin' ? EmployeeRole.MANAGER : EmployeeRole.SALES,
        phone: loginId,
        degree: '',
        age: 0,
        // @ts-ignore
        password: loginPass
      };
      onLogin(loggedUser);
    } else {
      setError('Sai tài khoản hoặc mật khẩu! (Hãy thử: admin/123 hoặc nhanvien/123)');
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPass) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    const newUser: Employee = {
      id: `NV${Math.floor(Math.random() * 1000)}`,
      fullName: regName, phone: regPhone, role: regRole, degree: 'Thực tập sinh', age: 20,
      // @ts-ignore
      password: regPass 
    };
    setPendingUser(newUser);
    setView('verify');
    setError('');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOtp === otpCode && pendingUser) {
      onRegister(pendingUser);
      alert('Đăng ký thành công! Thông tin đăng nhập đã được lưu.');
      setView('login');
      setLoginId(pendingUser.phone);
      setLoginPass((pendingUser as any).password);
    } else {
      setError('Mã xác thực không đúng.');
    }
  };

  const CustomLogo = ({ size = 48, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="8" width="40" height="32" rx="16" stroke="#FFD700" strokeWidth="3" fill="rgba(255, 215, 0, 0.1)" />
      <rect x="14" y="16" width="6" height="12" rx="1" fill="#FF4444" />
      <line x1="17" y1="12" x2="17" y2="32" stroke="#FF4444" strokeWidth="2" strokeLinecap="round"/>
      <rect x="26" y="20" width="6" height="12" rx="1" fill="#00C851" />
      <line x1="29" y1="16" x2="29" y2="36" stroke="#00C851" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[650px] border border-white/50">
        
        {/* Left Side: Brand */}
        <div className="md:w-1/2 bg-[#0047AB] text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2E67F8] rounded-full blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700] rounded-full blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 mt-10">
            <div className="mb-8"><CustomLogo size={80} className="mb-6 drop-shadow-lg" /></div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight font-serif text-white">BabyPharma</h1>
            <p className="text-blue-100 text-xl font-light border-l-4 border-[#FFD700] pl-4 italic leading-relaxed">
              Hệ thống quản lý nhà thuốc toàn diện
            </p>
          </div>

          <div className="relative z-10 mb-10">
            <p className="text-[#FFD700] text-3xl font-bold tracking-wider leading-relaxed uppercase drop-shadow-md">
              Gần gũi <br/> Chuyên nghiệp <br/> Tận tâm
            </p>
          </div>
          
          <div className="text-xs text-blue-200/50 relative z-10 text-center">
            © 2024 BabyPharma Group. Premium Healthcare System.
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
          
          {view === 'login' && (
            <div className="animate-fade-in max-w-sm mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#0047AB] mb-2">Đăng Nhập</h2>
                <div className="h-1 w-20 bg-[#FFD700] rounded-full"></div>
                <p className="text-slate-500 mt-2">Chào mừng trở lại làm việc</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2 animate-pulse">
                    <ShieldCheck size={16} /> {error}
                  </div>
                )}
                
                <div>
                  <label className={labelStyle}>Tài khoản</label>
                  <div className="relative group">
                    <User className={iconStyle} size={18} />
                    <input 
                      type="text"
                      className={sapphireInputStyle}
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Mật khẩu</label>
                  <div className="relative group">
                    <Lock className={iconStyle} size={18} />
                    <input 
                      type="password"
                      className={sapphireInputStyle}
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                    />
                  </div>
                </div>

                {/* --- 2 NÚT ĐIỀN NHANH ĐƯỢC THÊM VÀO ĐÂY --- */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setLoginId('admin'); setLoginPass('123'); }}
                    className="flex-1 py-2 bg-blue-50 text-[#0047AB] rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200 transition-all"
                  >
                    👔 Điền Quản Lý
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setLoginId('nhanvien'); setLoginPass('123'); }}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 border border-emerald-200 transition-all"
                  >
                    🧑‍⚕️ Điền Nhân Viên
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-900/30 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  Đăng Nhập <ArrowRight size={20} className="text-[#FFD700]" />
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500">
                Nhân viên mới? 
                <button onClick={() => { setView('register'); setError(''); }} className="text-[#0047AB] font-bold ml-1 hover:underline">
                  Đăng ký ngay
                </button>
              </div>
            </div>
          )}

          {/* CÁC PHẦN REGISTER VÀ VERIFY GIỮ NGUYÊN */}
          {view === 'register' && (
             <div className="animate-fade-in max-w-sm mx-auto w-full">
              <div className="mb-6">
                 <h2 className="text-3xl font-bold text-[#0047AB] mb-2">Tạo Tài Khoản</h2>
                 <div className="h-1 w-20 bg-[#FFD700] rounded-full"></div>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelStyle}>Họ và tên</label>
                    <input type="text" className={`${sapphireInputStyle} px-4 pl-4`} value={regName} onChange={(e) => setRegName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelStyle}>Chức vụ</label>
                    <select className={`${sapphireInputStyle} px-4 pl-4`} value={regRole} onChange={(e) => setRegRole(e.target.value as EmployeeRole)}>
                      <option value={EmployeeRole.SALES} className="text-slate-900 bg-white">Bán hàng</option>
                      <option value={EmployeeRole.PHARMACIST} className="text-slate-900 bg-white">Dược sĩ</option>
                      <option value={EmployeeRole.WAREHOUSE} className="text-slate-900 bg-white">Kho</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Số điện thoại</label>
                  <div className="relative">
                    <Phone className={iconStyle} size={18} />
                    <input type="text" className={sapphireInputStyle} value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Mật khẩu khởi tạo</label>
                  <div className="relative">
                    <Lock className={iconStyle} size={18} />
                    <input type="password" className={sapphireInputStyle} value={regPass} onChange={(e) => setRegPass(e.target.value)} />
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-[#0047AB] mb-4">
                  <p className="font-bold flex items-center gap-1 mb-1"><Mail size={12}/> Yêu cầu xác thực</p>
                  Mã xác thực gửi đến: <span className="font-mono font-bold text-[#1E5FD6]">lenguyentuantu0710@gmail.com</span>
                </div>

                <button type="submit" className="w-full bg-[#0047AB] text-white py-3 rounded-xl font-bold hover:bg-[#1E5FD6] transition-all border-b-4 border-[#003380] active:border-b-0 active:translate-y-1">
                  Gửi Mã Xác Thực
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                <button onClick={() => { setView('login'); setError(''); }} className="text-slate-600 hover:text-[#0047AB] font-medium flex items-center justify-center gap-2 mx-auto">
                  ← Quay lại đăng nhập
                </button>
              </div>
             </div>
          )}

          {view === 'verify' && (
            <div className="animate-fade-in text-center max-w-sm mx-auto w-full">
              <div className="w-20 h-20 bg-blue-50 text-[#0047AB] rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-100">
                <Mail size={36} />
              </div>
              <h2 className="text-2xl font-bold text-[#0047AB] mb-2">Nhập Mã Xác Thực</h2>
              <p className="text-slate-500 text-sm mb-4 px-4">Vui lòng kiểm tra email quản trị viên và nhập mã 6 số.</p>

              <div className="mb-6 mx-auto bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm max-w-[90%] flex flex-col items-center animate-pulse">
                <div className="flex items-center gap-2 font-bold mb-1"><Info size={16}/> Môi trường Demo (Không gửi Email)</div>
                <div>Mã xác thực của bạn là: <span className="font-mono text-xl font-black text-amber-600">{otpCode}</span></div>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <input type="text" maxLength={6} className="w-full text-center text-4xl tracking-[0.5em] font-bold py-4 border-b-2 border-slate-300 focus:border-[#FFD700] focus:outline-none bg-transparent text-[#0047AB] font-mono" value={inputOtp} onChange={(e) => setInputOtp(e.target.value)} placeholder="••••••" />
                <button type="submit" className="w-full bg-[#0047AB] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                  Xác Nhận & Hoàn Tất
                </button>
              </form>

               <div className="mt-6 text-sm">
                <button onClick={() => setView('register')} className="text-slate-400 hover:text-slate-600">
                  Nhập lại thông tin
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;