import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'QUAN_LY' | 'NHAN_VIEN';

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean; // Trả về true nếu đăng nhập đúng
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Trạng thái user hiện tại
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // DATABASE MẪU (2 TÀI KHOẢN)
  const mockUsers = [
    { id: '1', name: 'Trần Văn Quản Lý', username: 'admin', password: '123', role: 'QUAN_LY' as Role },
    { id: '2', name: 'Nguyễn Thị Nhân Viên', username: 'nhanvien', password: '123', role: 'NHAN_VIEN' as Role }
  ];

  // Hàm xử lý Đăng nhập
  const login = (username: string, password: string) => {
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) {
      // Nếu đúng tài khoản & mật khẩu -> Lưu user vào hệ thống
      setCurrentUser({ id: user.id, name: user.name, role: user.role, username: user.username });
      return true; 
    }
    return false; // Sai thông tin
  };

  // Hàm xử lý Đăng xuất
  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};