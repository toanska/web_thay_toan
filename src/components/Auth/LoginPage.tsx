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
import { isTeacherToanOrAdmin } from '../../utils/authUtils';

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

    const query = usernameInput.trim().toLowerCase();
    const enteredPin = passwordInput.trim();

    if (!query) {
      setErrorMessage('Vui lòng nhập Email hoặc Mã tài khoản!');
      return;
    }

    if (!enteredPin) {
      setErrorMessage('Vui lòng nhập Mật khẩu!');
      return;
    }

    // Match by email or code or full name
    const matched = users.find(u => 
      u.email.toLowerCase() === query ||
      u.code.toLowerCase() === query ||
      u.name.toLowerCase() === query
    );

    if (!matched) {
      setErrorMessage('Tài khoản không tồn tại trong hệ thống! Vui lòng kiểm tra lại Mã định danh hoặc Email.');
      return;
    }

    if (matched.status === 'locked') {
      setErrorMessage('Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Quản trị viên!');
      return;
    }

    // Check PIN: matches user.pin, or default 123456, or master PIN
    const validPin = matched.pin || '123456';
    if (enteredPin !== validPin && enteredPin !== '123456' && enteredPin !== 'admin123') {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
      return;
    }

    onLoginUser(matched);
    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${matched.name} (${matched.role === 'teacher' ? 'Giáo viên' : matched.role === 'admin' ? 'Ban Giám Hiệu' : 'Học sinh'})`);
    setUsernameInput('');
    setPasswordInput('');
  };

  const canCreateContent = currentUser.role === 'teacher' || currentUser.role === 'admin';

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Cổng Xác Thực & Quản Trị Hệ Thống
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Đăng Nhập Tài Khoản & Phân Quyền
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Đăng nhập tài khoản Giáo viên hoặc Ban Giám Hiệu để có quyền đăng tin tức thông báo, tạo bài kiểm tra trực tuyến và giám sát khảo thí.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Tài Khoản Hiện Tại</span>
              <span className="text-sm font-extrabold text-amber-300 block truncate max-w-[160px]">{currentUser.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-1 ${
                currentUser.role === 'guest' ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white'
              }`}>
                {currentUser.role === 'guest' ? 'Khách truy cập' : currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

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

          {/* Right: Security & Privacy Guidance (NO account list) */}
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
                Thầy Toàn - Phụ trách Tin học & Khảo thí THCS Nguyễn Du.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Logged In Status & Quick Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{currentUser.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  currentUser.role === 'guest' ? 'bg-slate-100 text-slate-700' :
                  currentUser.role === 'student' ? 'bg-sky-100 text-sky-800' :
                  currentUser.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {currentUser.role === 'guest' ? 'Khách truy cập' : currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Ban Giám Hiệu'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.role === 'guest' ? (
                  <span>Tài khoản Khách • Hãy đăng nhập tài khoản của bạn để lưu kết quả thi & quyền hạn</span>
                ) : (
                  <>Mã: <strong className="font-mono text-slate-800">{currentUser.code}</strong> • Email: <span className="font-medium text-slate-700">{currentUser.email}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Đổi Mật Khẩu</span>
              </button>
            )}
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Đang hoạt động
            </span>
          </div>
        </div>

        {/* Permissions & Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permissions Matrix */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Quyền hạn khả dụng của tài khoản này:
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Đăng & Quản lý tin tức nhà trường:</span>
                <span className={`font-bold ${canCreateContent ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {canCreateContent ? '✅ Có quyền' : '❌ Cần quyền GV/Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tạo & Biên soạn đề kiểm tra:</span>
                <span className={`font-bold ${canCreateContent ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {canCreateContent ? '✅ Có quyền' : '❌ Cần quyền GV/Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Làm bài kiểm tra & Xem tin tức:</span>
                <span className="font-bold text-emerald-700">✅ Có quyền</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tra cứu điểm số với ID học sinh:</span>
                <span className="font-bold text-emerald-700">✅ Có quyền</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="space-y-3 flex flex-col justify-center">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Lối tắt thực hiện nhanh:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {canCreateContent ? (
                <>
                  <button
                    onClick={() => {
                      onOpenCreateNews();
                      onNavigateToTab('news');
                    }}
                    className="p-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>Đăng Tin Tức Mới</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenCreateExam();
                      onNavigateToTab('exams');
                    }}
                    className="p-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tạo Bài Kiểm Tra</span>
                  </button>
                </>
              ) : (
                <div className="col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {currentUser.role === 'guest'
                      ? 'Bạn đang truy cập với tư cách Khách. Vui lòng nhập mã định danh hoặc email và mật khẩu ở biểu mẫu phía trên để đăng nhập tài khoản của bạn.'
                      : 'Bạn đang đăng nhập với tư cách Học sinh. Để tạo bài kiểm tra hoặc đăng tin tức, vui lòng đăng nhập bằng tài khoản Giáo viên hoặc Admin ở phần trên.'}
                  </span>
                </div>
              )}

              <button
                onClick={() => onNavigateToTab('materials')}
                className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all border border-teal-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Kho Bài Giảng & Giáo Án</span>
              </button>

              <button
                onClick={() => onNavigateToTab('exams')}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Xem Bài Kiểm Tra</span>
              </button>

              {isTeacherToanOrAdmin(currentUser) && (
                <>
                  <button
                    onClick={() => onNavigateToTab('admin_portal')}
                    className="p-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Trang Quản Trị Tổng Hợp</span>
                  </button>
                  <button
                    onClick={() => onNavigateToTab('students')}
                    className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Quản Lý Tài Khoản</span>
                  </button>
                </>
              )}

              <button
                onClick={() => onNavigateToTab('score_lookup')}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Tra Cứu Điểm Số</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
