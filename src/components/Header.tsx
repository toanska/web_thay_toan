import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Newspaper, 
  BookOpen,
  FileText, 
  Database, 
  BarChart3, 
  UserCheck, 
  Bell, 
  RotateCcw, 
  Download, 
  Upload, 
  Menu, 
  X,
  Award,
  CheckCircle2,
  LogIn,
  LogOut,
  Search,
  Key,
  Laptop,
  Users,
  UserPlus,
  CloudLightning,
  ShieldCheck,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { User, NotificationItem, NavigationTab } from '../types';
import { isTeacherToanOrAdmin } from '../utils/authUtils';
import { CloudflareService } from '../services/cloudflareService';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (json: string) => void;
  onOpenCloudflareSync?: () => void;
  onOpenLoginModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onResetData,
  onExportData,
  onImportData,
  onOpenCloudflareSync,
  onOpenLoginModal,
  onOpenChangePasswordModal,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const [syncState, setSyncState] = useState<{
    status: 'idle' | 'syncing' | 'connected' | 'error';
    isSyncing: boolean;
    autoSync: boolean;
    hasWorker: boolean;
  }>(() => {
    const cfg = CloudflareService.getConfig();
    return {
      status: cfg.status,
      isSyncing: cfg.status === 'syncing',
      autoSync: cfg.autoSync && cfg.enabled,
      hasWorker: !!cfg.workerUrl,
    };
  });

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      const cfg = CloudflareService.getConfig();
      setSyncState({
        status: cfg.status,
        isSyncing: e?.detail?.status === 'syncing' || cfg.status === 'syncing',
        autoSync: cfg.autoSync && cfg.enabled,
        hasWorker: !!cfg.workerUrl,
      });
    };

    const handleConfigUpdated = (e: any) => {
      const cfg = e.detail || CloudflareService.getConfig();
      setSyncState({
        status: cfg.status,
        isSyncing: cfg.status === 'syncing',
        autoSync: cfg.autoSync && cfg.enabled,
        hasWorker: !!cfg.workerUrl,
      });
    };

    window.addEventListener('thcs_sync_status_changed', handleSyncStatus);
    window.addEventListener('thcs_cloudflare_config_updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('thcs_sync_status_changed', handleSyncStatus);
      window.removeEventListener('thcs_cloudflare_config_updated', handleConfigUpdated);
    };
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);
  const isAuthorizedToManageStudents = isTeacherToanOrAdmin(currentUser);

  const allNavItems: { id: NavigationTab; label: string; icon: any; color: string; badge?: string }[] = [
    { id: 'news', label: 'Tin tức & Thông báo', icon: Newspaper, color: 'text-sky-600' },
    { id: 'materials', label: 'Bài giảng & Giáo án', icon: BookOpen, color: 'text-teal-600', badge: 'Mới' },
    { id: 'exams', label: 'Bài kiểm tra trực tuyến', icon: FileText, color: 'text-indigo-600', badge: 'Hot' },
    { id: 'score_lookup', label: 'Tra cứu điểm (ID Học sinh)', icon: Search, color: 'text-amber-600' },
    { id: 'admin_portal', label: 'Trang Quản Trị Tổng Hợp', icon: ShieldCheck, color: 'text-rose-600', badge: 'VIP' },
    { id: 'reports', label: 'Báo cáo & Phổ điểm', icon: BarChart3, color: 'text-purple-600' },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.id === 'admin_portal') {
      return isAuthorizedToManageStudents;
    }
    if (item.id === 'reports' && (currentUser.role === 'guest' || currentUser.role === 'student')) {
      return false;
    }
    return true;
  });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner / School Branding */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 backdrop-blur-xs flex items-center justify-center border border-blue-400/30 shadow-inner">
              <Laptop className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
                Môn Tin học - Thầy Toàn
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifMenu(false); setShowSettingsMenu(false); }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-white/40"
                />
                <div className="hidden sm:block">
                  <div className="font-semibold leading-tight text-white flex items-center gap-1">
                    {currentUser.name}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-bold uppercase ${
                      currentUser.role === 'guest' ? 'bg-slate-300 text-slate-900' :
                      currentUser.role === 'student' ? 'bg-amber-400 text-slate-900' :
                      currentUser.role === 'teacher' ? 'bg-amber-400 text-slate-900' : 'bg-purple-300 text-slate-900'
                    }`}>
                      {currentUser.role === 'guest' ? 'Khách' : currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-200">
                    {currentUser.role === 'guest' ? 'Chưa đăng nhập' : currentUser.className ? `Lớp ${currentUser.className}` : currentUser.code}
                  </div>
                </div>
                <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center space-x-3">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        currentUser.role === 'guest' ? 'bg-slate-100 text-slate-700' :
                        currentUser.role === 'student' ? 'bg-sky-100 text-sky-700' :
                        currentUser.role === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {currentUser.role === 'guest' ? 'Khách truy cập' : currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    {currentUser.role === 'guest' ? (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenLoginModal) {
                            onOpenLoginModal();
                          } else {
                            setActiveTab('login');
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 flex items-center gap-2.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-4 h-4 text-amber-300" />
                        <span>Đăng nhập hệ thống</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenChangePasswordModal) {
                              onOpenChangePasswordModal();
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-600" />
                          <span>Đổi mật khẩu tài khoản</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenLoginModal) {
                              onOpenLoginModal();
                            } else {
                              setActiveTab('login');
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-blue-600" />
                          <span>Đăng nhập tài khoản khác</span>
                        </button>

                        {isAuthorizedToManageStudents && (
                          <>
                            <button
                              onClick={() => {
                                setActiveTab('admin_portal');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-rose-600" />
                              <span>Trang Quản Trị Tổng Hợp</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('students');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4 text-emerald-600" />
                              <span>Quản lý tài khoản</span>
                            </button>
                          </>
                        )}

                        {onLogout && (
                          <div className="pt-1 mt-1 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                onLogout();
                              }}
                              className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-rose-600" />
                              <span>Đăng xuất tài khoản</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); setShowSettingsMenu(false); }}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white"
                title="Thông báo hệ thống"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-blue-900 animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo mới ({unreadNotifs.length})</span>
                    <span className="text-[11px] text-blue-600">Trực tuyến</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">Không có thông báo nào</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-blue-50/50 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-slate-900 font-semibold mb-1">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.timestamp}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Realtime Auto-Sync Cloud Status button - ONLY for Teacher Toan or Admin */}
            {isAuthorizedToManageStudents && onOpenCloudflareSync && (
              <button
                onClick={onOpenCloudflareSync}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                  syncState.isSyncing
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-200'
                    : syncState.hasWorker && syncState.autoSync
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/50 text-emerald-200'
                    : 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/40 text-orange-200'
                }`}
                title="Hệ thống tự động đồng bộ thời gian thực với cơ sở dữ liệu (Dành riêng cho Thầy Toàn / Admin)"
              >
                {syncState.isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    <span className="hidden sm:inline font-semibold text-xs text-amber-100">Đang đồng bộ...</span>
                  </>
                ) : syncState.hasWorker && syncState.autoSync ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <CloudLightning className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline font-semibold text-xs text-emerald-100">Tự động đồng bộ</span>
                  </>
                ) : (
                  <>
                    <CloudLightning className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden sm:inline font-semibold text-xs text-orange-100">Đồng bộ Cloud</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Data Backup / Reset Dropdown - ONLY for Teacher Toan or Admin */}
            {isAuthorizedToManageStudents && (
              <div className="relative">
                <button
                  onClick={() => { setShowSettingsMenu(!showSettingsMenu); setShowUserMenu(false); setShowNotifMenu(false); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white cursor-pointer"
                  title="Quản lý dữ liệu hệ thống (Dành riêng cho Thầy Toàn / Admin)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Dữ liệu & Khôi phục</p>
                      <p className="text-[11px] text-slate-500">Dành cho Thầy Toàn / Quản trị viên</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {onOpenCloudflareSync && (
                        <button
                          onClick={() => { onOpenCloudflareSync(); setShowSettingsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-orange-50 flex items-center space-x-2 text-orange-800 font-medium cursor-pointer"
                        >
                          <CloudLightning className="w-4 h-4 text-orange-600" />
                          <span>Đồng bộ Cloudflare KV (Cloud)</span>
                        </button>
                      )}

                      <button
                        onClick={() => { onExportData(); setShowSettingsMenu(false); }}
                        className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-slate-100 flex items-center space-x-2 text-slate-700 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                        <span>Xuất sao lưu (JSON)</span>
                      </button>

                      <label className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-slate-100 flex items-center space-x-2 text-slate-700 cursor-pointer">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Nhập dữ liệu (JSON)</span>
                        <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                      </label>

                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ bài kiểm tra, tin tức và câu hỏi về trạng thái mẫu ban đầu?')) {
                            onResetData();
                            setShowSettingsMenu(false);
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-rose-50 flex items-center space-x-2 text-rose-600 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>Khôi phục dữ liệu mẫu gốc</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* School Motto / Academic Year Tag */}
          <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Học kỳ I (2026 - 2027)
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 italic">"Tận tâm - Trí tuệ - Khát vọng"</span>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center justify-between w-full">
            <span className="text-sm font-bold text-slate-800">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {showMobileNav && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileNav(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              {currentUser.role === 'guest' ? (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    if (onOpenLoginModal) {
                      onOpenLoginModal();
                    } else {
                      setActiveTab('login');
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <LogIn className="w-5 h-5 text-amber-300" />
                  <span>Đăng nhập hệ thống</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowMobileNav(false);
                      if (onOpenChangePasswordModal) {
                        onOpenChangePasswordModal();
                      }
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <KeyRound className="w-5 h-5 text-amber-600" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileNav(false);
                      if (onOpenLoginModal) {
                        onOpenLoginModal();
                      } else {
                        setActiveTab('login');
                      }
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <LogIn className="w-5 h-5 text-blue-600" />
                    <span>Đăng nhập tài khoản khác</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowMobileNav(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5 text-rose-600" />
                      <span>Đăng xuất</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
