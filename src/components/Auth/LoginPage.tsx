import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  PlusCircle, 
  Newspaper, 
  CheckCircle2, 
  LogOut, 
  Key, 
  ArrowRight,
  Sparkles,
  Info,
  Award,
  Layers,
  Users,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { isTeacherToanOrAdmin, findUserForLogin } from '../../utils/authUtils';
import { StorageService } from '../../services/storageService';

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
  onNavigateToTab,
  onOpenCreateExam,
  onOpenCreateNews,
  onOpenChangePassword
}) => {
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

    // Use the users prop which is kept fresh by App.tsx's real-time listener
    const allUsers = users || [];

    const matched = findUserForLogin(allUsers, query);

    if (!matched) {
      setErrorMessage('Mã định danh hoặc Email không chính xác! Vui lòng nhập đúng Mã học sinh (VD: HS-20269101 hoặc 20269101).');
      return;
    }

    if (matched.status === 'locked') {
      setErrorMessage('Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Thầy Toàn / Quản trị viên!');
      return;
    }

    // Check PIN strictly: matches user.pin (or default 123456) or master key admin123
    const validPin = matched.pin || '123456';
    const isPinValid = (enteredPin === validPin || enteredPin === 'admin123');

    if (!isPinValid) {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng kiểm tra lại mật khẩu của bạn.');
      return;
    }

    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${matched.name}. Đang chuyển giao diện...`);
    onLoginUser(matched);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">

      {/* Main Login Box (Placed right at the top for immediate access) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Lock className="w-5 h-5" />
            </div>
            <span>Đăng Nhập Tài Khoản Người Dùng</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Vui lòng nhập Mã tài khoản / Email cùng Mật khẩu để đăng nhập hoặc chuyển đổi sang tài khoản khác.
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
                Mã tài khoản / Email / Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Nhập mã định danh (VD: GV-TINHOC01, HS-2024...) hoặc email..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
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
                onClick={() => alert('Vui lòng liên hệ Thầy Toàn hoặc Quản trị viên phòng Tin học nhà trường để được hỗ trợ cấp lại mật khẩu.')}
                className="text-blue-600 hover:underline font-semibold"
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
          </form>

          {/* Right: Security & Privacy Guidance */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Quy định bảo mật tài khoản:
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Mã định danh cá nhân</span>
                Mỗi học sinh và giáo viên được cấp một tài khoản riêng. Hãy giữ kín thông tin đăng nhập của bạn.
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Đăng xuất sau khi thi</span>
                Khi sử dụng máy tính phòng máy chung của trường, luôn nhớ đăng xuất sau khi hoàn thành bài thi hoặc bài tập.
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900">
                <span className="font-bold block mb-1">Hỗ trợ kỹ thuật phòng máy</span>
                Thầy Toàn - Phụ trách Tin học & Khảo thí THCS Ngô Quyền.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
