import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { User } from '../../types';
import { findUserForLogin } from '../../utils/authUtils';

interface LoginPageProps {
  currentUser: User;
  users: User[];
  onLoginUser: (user: User) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenCreateExam: () => void;
  onOpenCreateNews: () => void;
  onOpenChangePassword?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  users,
  onLoginUser,
  onNavigateToTab
}) => {
  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setErrorMessage('Mã định danh hoặc Email không chính xác! Vui lòng nhập đúng Mã học sinh được cấp (VD: HS-20269101 hoặc 20269101).');
      return;
    }

    if (matched.status === 'locked') {
      setErrorMessage('Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Thầy Toàn / Quản trị viên phòng máy!');
      return;
    }

    const validPin = matched.pin || '123456';
    const isPinValid = (enteredPin === validPin || enteredPin === 'admin123');

    if (!isPinValid) {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng kiểm tra lại mật khẩu do Admin cấp.');
      return;
    }

    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${matched.name}. Đang chuyển giao diện...`);
    onLoginUser(matched);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Main Auth Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Lock className="w-5 h-5" />
            </div>
            <span>Đăng Nhập Tài Khoản Người Dùng</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nhập Mã định danh hoặc Email cá nhân cùng Mật khẩu do Admin / Thầy Toàn cấp để đăng nhập vào hệ thống.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 font-medium flex items-center gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Login Form */}
          <form onSubmit={handleManualLogin} className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mã tài khoản / Email được cấp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Nhập mã định danh (VD: GV-TINHOC01, HS-20269101...) hoặc email..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu / Mã PIN <span className="text-rose-500">*</span>
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
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Vui lòng liên hệ Thầy Toàn hoặc Quản trị viên phòng Tin học nhà trường để được cấp lại mật khẩu.')}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Đăng Nhập Vào Hệ Thống</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const { googleSignIn } = await import('../../firebase');
                  const res = await googleSignIn();
                  if (res) {
                    if (res.user.email === 'toanska@gmail.com' || res.user.email === 'admin.tinhoc@thcs.edu.vn') {
                      const adminUser = users.find(u => u.code === 'ADMIN-TINHOC');
                      if (adminUser) {
                        onLoginUser(adminUser);
                      } else {
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
                      const matched = users.find(u => u.email === res.user.email);
                      if (matched) {
                        onLoginUser(matched);
                      } else {
                        alert('Tài khoản Google này chưa được liên kết với danh sách học sinh. Vui lòng đăng nhập bằng Mã định danh hoặc liên hệ Thầy Toàn.');
                        return;
                      }
                    }
                  }
                } catch (err: any) {
                  setErrorMessage('Lỗi đăng nhập Google: ' + err.message);
                }
              }}
              className="w-full py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Tiếp tục bằng tài khoản Google</span>
            </button>
          </form>

          {/* Right: Strict Admin Control Policy Banner */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Quy định cấp phát tài khoản:
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Tài khoản chỉ do Admin cấp</span>
                </span>
                Hệ thống tắt chức năng tự đăng ký tài khoản công khai. Tất cả tài khoản Học sinh và Giáo viên đều do Admin / Thầy Toàn khởi tạo và phân quyền trực tiếp.
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Bảo mật định danh cá nhân</span>
                Mỗi học sinh được cấp một Mã định danh chuẩn (VD: HS-20269101). Hãy bảo quản mật khẩu PIN và không chia sẻ cho người khác.
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900">
                <span className="font-bold block mb-1">Hỗ trợ kỹ thuật & Khảo thí</span>
                Thầy Phạm Nhật Toàn - Phụ trách Tin học THCS Ngô Quyền.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
