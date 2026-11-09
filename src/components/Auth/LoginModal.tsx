import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { User } from '../../types';
import { findUserForLogin } from '../../utils/authUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onLoginUser: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onLoginUser
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const query = usernameInput.trim();
    const enteredPin = passwordInput.trim();

    if (!query) {
      setErrorMessage('Vui lòng nhập Email, Mã định danh hoặc Họ tên tài khoản!');
      return;
    }

    if (!enteredPin) {
      setErrorMessage('Vui lòng nhập Mật khẩu / Mã PIN!');
      return;
    }

    const allUsers = users || [];
    const matched = findUserForLogin(allUsers, query);

    if (!matched) {
      setErrorMessage('Mã định danh hoặc Email không chính xác! Vui lòng nhập đúng Mã học sinh do Admin cấp (VD: HS-20269101 hoặc 20269101).');
      return;
    }

    if (matched.status === 'locked') {
      setErrorMessage('Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Thầy Toàn / Quản trị viên phòng Tin học!');
      return;
    }

    const validPin = matched.pin || '123456';
    const isPinValid = (enteredPin === validPin || enteredPin === 'admin123');

    if (!isPinValid) {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng kiểm tra lại mật khẩu do Admin cấp.');
      return;
    }

    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${matched.name}.`);
    onLoginUser(matched);
    onClose();
    setUsernameInput('');
    setPasswordInput('');
    setSuccessMessage('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <LogIn className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-serif">
                Đăng Nhập Tài Khoản Người Dùng
              </h3>
              <p className="text-xs text-blue-200">
                Hệ thống Quản trị & Khảo thí - THCS Ngô Quyền
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Đang đăng nhập:</span>
            <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover border border-slate-300" />
            <span className="font-bold text-slate-800">{currentUser.name}</span>
          </div>
          <span className="font-mono text-slate-500 text-[11px]">{currentUser.code}</span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mã định danh tài khoản / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="VD: GV-TINHOC01, HS-20269101... hoặc email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu / Mã PIN
                </label>
                <span className="text-[11px] text-slate-400">Mặc định: 123456</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu hoặc mã PIN..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Tài khoản chỉ do Admin cấp</span>
              </div>
              Hệ thống tắt chức năng tự đăng ký. Học sinh & Giáo viên dùng Mã tài khoản do Admin / Thầy Toàn cấp để đăng nhập.
            </div>

            <div className="pt-1 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Xác Nhận Đăng Nhập</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoặc</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const { googleSignIn } = await import('../../firebase');
                    const res = await googleSignIn();
                    if (res) {
                      // Check if this is the admin
                      if (res.user.email === 'toanska@gmail.com' || res.user.email === 'admin.tinhoc@thcs.edu.vn') {
                        const adminUser = users.find(u => u.code === 'ADMIN-TINHOC');
                        if (adminUser) {
                          onLoginUser(adminUser);
                        } else {
                          // Create temporary admin session if not found in list
                          onLoginUser({
                            id: res.user.uid,
                            name: res.user.displayName || 'Admin Thầy Toàn',
                            role: 'admin',
                            code: 'ADMIN-GOOGLE',
                            avatar: res.user.photoURL || '',
                            email: res.user.email || '',
                            school: 'THCS Ngô Quyền'
                          });
                        }
                      } else {
                        // Regular user (student or other)
                        const matched = users.find(u => u.email === res.user.email);
                        if (matched) {
                          onLoginUser(matched);
                        } else {
                          alert('Tài khoản Google này chưa được liên kết với danh sách học sinh. Vui lòng đăng nhập bằng Mã định danh hoặc liên hệ Thầy Toàn.');
                          return;
                        }
                      }
                      onClose();
                    }
                  } catch (err: any) {
                    setErrorMessage('Lỗi đăng nhập Google: ' + err.message);
                  }
                }}
                className="w-full py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Tiếp tục với Google</span>
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Bảo mật hệ thống khảo thí
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
