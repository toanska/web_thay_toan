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
  Users
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
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  users,
  onLoginUser,
  onNavigateToTab,
  onOpenCreateExam,
  onOpenCreateNews
}) => {
  const [selectedRoleType, setSelectedRoleType] = useState<'teacher_admin' | 'student'>('teacher_admin');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const teacherAndAdminUsers = users.filter(u => u.role === 'teacher' || u.role === 'admin');
  const studentUsers = users.filter(u => u.role === 'student');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const query = usernameInput.trim().toLowerCase();
    if (!query) {
      setErrorMessage('Vui lòng nhập Email hoặc Mã tài khoản!');
      return;
    }

    // Match by email or code or username
    const matched = users.find(u => 
      u.email.toLowerCase() === query ||
      u.code.toLowerCase() === query ||
      u.name.toLowerCase().includes(query)
    );

    if (matched) {
      onLoginUser(matched);
      setSuccessMessage(`Đăng nhập thành công với vai trò: ${matched.name} (${matched.role === 'teacher' ? 'Giáo viên' : matched.role === 'admin' ? 'Ban Giám Hiệu' : 'Học sinh'})`);
    } else {
      setErrorMessage('Tài khoản hoặc mật khẩu không chính xác trong hệ thống!');
    }
  };

  const handleQuickLogin = (user: User) => {
    onLoginUser(user);
    setSuccessMessage(`Đã đăng nhập thành công: ${user.name}`);
    setErrorMessage('');
  };

  const canCreateContent = currentUser.role === 'teacher' || currentUser.role === 'admin';

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
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
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Tài Khoản Hiện Tại</span>
              <span className="text-sm font-extrabold text-amber-300 block truncate max-w-[160px]">{currentUser.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase inline-block mt-1">
                {currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Logged In Status & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
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
                  currentUser.role === 'student' ? 'bg-sky-100 text-sky-800' :
                  currentUser.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Ban Giám Hiệu'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã: <strong className="font-mono text-slate-800">{currentUser.code}</strong> • Email: <span className="font-medium text-slate-700">{currentUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                    Bạn đang đăng nhập với tư cách <strong>Học sinh</strong>. Để tạo bài kiểm tra hoặc đăng tin tức, vui lòng chọn một tài khoản <strong>Giáo viên</strong> hoặc <strong>Admin</strong> ở phần bên dưới.
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
                <button
                  onClick={() => onNavigateToTab('students')}
                  className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Quản Trị & Tạo Tài Khoản</span>
                </button>
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

      {/* Switch / Login New Account Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 1-Click Fast Demo Login (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Đăng Nhập Nhanh 1-Chạm (Demo Accounts)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp trực tiếp vào tài khoản để đăng nhập và trải nghiệm tức thì
              </p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              onClick={() => setSelectedRoleType('teacher_admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedRoleType === 'teacher_admin'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Giáo Viên & Quản Trị ({teacherAndAdminUsers.length})</span>
            </button>

            <button
              onClick={() => setSelectedRoleType('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedRoleType === 'student'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Học Sinh ({studentUsers.length})</span>
            </button>
          </div>

          {/* User Cards List */}
          <div className="space-y-3">
            {(selectedRoleType === 'teacher_admin' ? teacherAndAdminUsers : studentUsers).map(u => {
              const isSelected = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{u.name}</h4>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase shrink-0 ${
                          u.role === 'student' ? 'bg-sky-100 text-sky-800' :
                          u.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {u.role === 'student' ? 'Học sinh' : u.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Mã: <strong className="font-mono text-slate-700">{u.code}</strong> • {u.className ? `Lớp ${u.className}` : u.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Đang chọn
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-900 hover:text-white hover:border-blue-900 font-semibold text-slate-700 transition-all">
                        Đăng nhập
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Manual Login Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Đăng Nhập Bằng Mật Khẩu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập mã tài khoản hoặc email được cấp bởi nhà trường
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Tài khoản / Email / Mã định danh
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="VD: mainguyen.toan@thcs.edu.vn hoặc GV-TOAN01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Mật khẩu
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#help" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ Quản trị viên phòng Tin học nhà trường để cấp lại mật khẩu.'); }} className="text-blue-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Xác Nhận Đăng Nhập</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">💡 Gợi ý tài khoản kiểm thử:</p>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
              <li><strong className="text-slate-800">Thầy Toàn (Tin học):</strong> Mã <span className="font-mono text-blue-700 font-bold">GV-TINHOC01</span></li>
              <li><strong className="text-slate-800">Cô Mai (Tin học):</strong> Mã <span className="font-mono text-blue-700 font-bold">GV-TINHOC02</span></li>
              <li><strong className="text-slate-800">Quản trị viên:</strong> Mã <span className="font-mono text-blue-700 font-bold">ADMIN-TINHOC</span></li>
              <li><strong className="text-slate-800">Học sinh 9A1:</strong> Mã <span className="font-mono text-blue-700 font-bold">HS-20240901</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
