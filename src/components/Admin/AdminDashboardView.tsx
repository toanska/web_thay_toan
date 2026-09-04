import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Newspaper, 
  BookOpen, 
  FileText, 
  History, 
  Database, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  UserCheck,
  GraduationCap,
  Pin,
  Calendar,
  Key,
  XCircle,
  Check
} from 'lucide-react';
import { 
  User, 
  NewsArticle, 
  LessonMaterial, 
  Exam, 
  ExamAttempt, 
  Question, 
  GradeLevel,
  Subject,
  NavigationTab
} from '../../types';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';
import { RejectModal } from './RejectModal';

interface AdminDashboardViewProps {
  currentUser: User;
  users: User[];
  news: NewsArticle[];
  materials: LessonMaterial[];
  exams: Exam[];
  attempts: ExamAttempt[];
  questions: Question[];
  // Handlers
  onSaveUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onOpenCreateNews: () => void;
  onEditNews: (news: NewsArticle) => void;
  onDeleteNews: (id: string) => void;
  onSelectNews: (news: NewsArticle) => void;
  onApproveNews?: (id: string) => void;
  onRejectNews?: (id: string, reason: string) => void;
  onOpenCreateExam: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onApproveExam?: (id: string) => void;
  onRejectExam?: (id: string, reason: string) => void;
  onApproveMaterial?: (id: string) => void;
  onRejectMaterial?: (id: string, reason: string) => void;
  onOpenCreateQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenAIGenerator: () => void;
  onViewAttempt: (attempt: ExamAttempt) => void;
  onDeleteAttempt?: (id: string) => void;
  onDeleteAttemptsBatch?: (ids: string[]) => void;
  onNavigateToTab: (tab: NavigationTab) => void;
}

type AdminSection = 'overview' | 'accounts' | 'news' | 'materials' | 'exams' | 'attempts' | 'questions';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  users,
  news,
  materials,
  exams,
  attempts,
  questions,
  onSaveUser,
  onDeleteUser,
  onOpenCreateNews,
  onEditNews,
  onDeleteNews,
  onSelectNews,
  onApproveNews,
  onRejectNews,
  onOpenCreateExam,
  onEditExam,
  onDeleteExam,
  onApproveExam,
  onRejectExam,
  onApproveMaterial,
  onRejectMaterial,
  onOpenCreateQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenAIGenerator,
  onViewAttempt,
  onDeleteAttempt,
  onDeleteAttemptsBatch,
  onNavigateToTab
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [attemptClassFilter, setAttemptClassFilter] = useState<string>('all');
  const [attemptExamFilter, setAttemptExamFilter] = useState<string>('all');
  const [selectedAttemptIds, setSelectedAttemptIds] = useState<string[]>([]);

  const [rejectingItem, setRejectingItem] = useState<{
    id: string;
    type: 'bài viết' | 'đề thi' | 'tài liệu học tập';
    title: string;
    category: 'news' | 'material' | 'exam';
  } | null>(null);

  const isAuthorized = isTeacherToanOrAdmin(currentUser);

  // Computed summary metrics
  const totalStudents = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const totalTeachers = useMemo(() => users.filter(u => u.role === 'teacher').length, [users]);
  const totalAttempts = attempts.length;
  const avgScore = useMemo(() => {
    if (attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, a) => acc + a.score, 0);
    return Math.round((sum / attempts.length) * 10) / 10;
  }, [attempts]);

  const pendingNewsCount = useMemo(() => news.filter(n => n.approvalStatus === 'pending_approval').length, [news]);
  const pendingMaterialsCount = useMemo(() => materials.filter(m => m.approvalStatus === 'pending_approval').length, [materials]);
  const pendingExamsCount = useMemo(() => exams.filter(e => e.approvalStatus === 'pending_approval').length, [exams]);
  const totalPendingModeration = pendingNewsCount + pendingMaterialsCount + pendingExamsCount;

  // Section items with counts
  const sections = [
    { id: 'overview', label: 'Tổng Quan', icon: ShieldCheck, badge: totalPendingModeration > 0 ? `${totalPendingModeration} cần duyệt` : 'Thống kê' },
    { id: 'accounts', label: 'Tài Khoản', icon: Users, count: users.length },
    { id: 'news', label: 'Tin Tức & Thông Báo', icon: Newspaper, count: news.length, pending: pendingNewsCount },
    { id: 'materials', label: 'Bài Giảng & Giáo Án', icon: BookOpen, count: materials.length, pending: pendingMaterialsCount },
    { id: 'exams', label: 'Bài Kiểm Tra', icon: FileText, count: exams.length, pending: pendingExamsCount },
    { id: 'attempts', label: 'Lịch Sử & Kết Quả', icon: History, count: attempts.length },
    { id: 'questions', label: 'Ngân Hàng Câu Hỏi', icon: Database, count: questions.length },
  ];

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Khu Vực Giới Hạn Quản Trị</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Trang tổng hợp quản trị nội dung và dữ liệu này chỉ dành riêng cho tài khoản của <strong>Thầy Toàn</strong> hoặc <strong>Quản trị viên (Admin)</strong>.
        </p>
        <button
          onClick={() => onNavigateToTab('login')}
          className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
        >
          Đăng nhập tài khoản Quản trị / Thầy Toàn
        </button>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchSearch = !searchKeyword || 
        u.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        u.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        u.email.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, filterRole, searchKeyword]);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => {
      const matchClass = attemptClassFilter === 'all' || a.studentClass === attemptClassFilter;
      const matchExam = attemptExamFilter === 'all' || a.examId === attemptExamFilter;
      const matchSearch = !searchKeyword || 
        a.studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        a.studentCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        a.examTitle.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchClass && matchExam && matchSearch;
    });
  }, [attempts, attemptClassFilter, attemptExamFilter, searchKeyword]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchGrade = filterGrade === 'all' || `Lớp ${q.grade}` === filterGrade;
      const matchSearch = !searchKeyword || 
        q.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        q.code.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [questions, filterGrade, searchKeyword]);

  // Toggle user lock
  const handleToggleLockUser = (u: User) => {
    const updated: User = {
      ...u,
      status: u.status === 'locked' ? 'active' : 'locked'
    };
    onSaveUser(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Bảng Điều Khiển Quản Trị Hệ Thống Toàn Diện</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Trung Tâm Quản Trị - Thầy Toàn & Admin
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Quản lý toàn bộ danh sách tài khoản học sinh, giáo viên, nội dung tin tức, kho bài giảng giáo án, bài kiểm tra, lịch sử làm bài và ngân hàng câu hỏi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateToTab('students')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>Quản lý học sinh chi tiết</span>
            </button>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Biểu đồ phổ điểm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id as AdminSection);
                setSearchKeyword('');
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-700/50' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
              <span>{s.label}</span>
              {s.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {s.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= SECTION: OVERVIEW ================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setActiveSection('accounts')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Tài khoản</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{users.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalStudents} học sinh • {totalTeachers} giáo viên
              </p>
            </div>

            <div 
              onClick={() => setActiveSection('exams')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Bài kiểm tra</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{exams.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {questions.length} câu hỏi trong ngân hàng
              </p>
            </div>

            <div 
              onClick={() => setActiveSection('attempts')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Lượt làm bài</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalAttempts}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Điểm trung bình: <strong className="text-emerald-700">{avgScore}/10</strong>
              </p>
            </div>

            <div 
              onClick={() => setActiveSection('materials')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Bài giảng & Giáo án</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{materials.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {news.length} tin tức thông báo
              </p>
            </div>
          </div>

          {/* Action Hubs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1: Quản lý tài khoản */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Quản lý Tài Khoản</h3>
                    <p className="text-[11px] text-slate-500">Học sinh & Giáo viên</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('accounts')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tạo mới, chỉnh sửa thông tin, đặt lại mật khẩu PIN (mặc định 123456), khóa hoặc mở khóa tài khoản người dùng.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('students')}
                  className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  + Tạo tài khoản mới
                </button>
              </div>
            </div>

            {/* Box 2: Quản lý Khảo thí & Đề thi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Khảo Thí & Đề Thi</h3>
                    <p className="text-[11px] text-slate-500">{exams.length} bài kiểm tra</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('exams')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thiết lập đề thi trắc nghiệm, cấu hình thời gian, mã bảo mật phòng thi, xáo trộn câu hỏi và phân quyền theo lớp.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onOpenCreateExam}
                  className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  + Tạo bài kiểm tra
                </button>
                <button
                  onClick={onOpenAIGenerator}
                  className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all text-center flex items-center gap-1 cursor-pointer"
                  title="Tạo câu hỏi tự động với AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI</span>
                </button>
              </div>
            </div>

            {/* Box 3: Ngân hàng câu hỏi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Ngân Hàng Câu Hỏi</h3>
                    <p className="text-[11px] text-slate-500">{questions.length} câu hỏi 4 mức độ</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('questions')}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quản lý các câu hỏi chuẩn GDPT 2018: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao môn Tin học.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onOpenCreateQuestion}
                  className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  + Thêm câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION: TÀI KHOẢN ================= */}
      {activeSection === 'accounts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Quản Lý Danh Sách Tài Khoản ({filteredUsers.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm soát tài khoản người dùng, xem mã định danh, vai trò, lớp và mật khẩu PIN
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigateToTab('students')}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm tài khoản mới</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm theo tên, mã tài khoản hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(['all', 'student', 'teacher', 'admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterRole === role
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {role === 'all' ? 'Tất cả' : role === 'student' ? 'Học sinh' : role === 'teacher' ? 'Giáo viên' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Mã tài khoản</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Lớp / Môn</th>
                  <th className="px-4 py-3">Mật khẩu PIN</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {u.code}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'student' ? 'bg-sky-100 text-sky-800' :
                        u.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.role === 'student' ? 'Học sinh' : u.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {u.className ? `Lớp ${u.className}` : u.subject || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {u.pin || '123456'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'locked' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.status === 'locked' ? 'Tạm khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleLockUser(u)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            u.status === 'locked' 
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={u.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {u.status === 'locked' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa tài khoản ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION: TIN TỨC & THÔNG BÁO ================= */}
      {activeSection === 'news' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-sky-600" />
                <span>Quản Lý Bài Đăng Tin Tức & Thông Báo ({news.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đăng bài thông báo lịch thi, phong trào học tập và tin tức nhà trường
              </p>
            </div>

            <button
              onClick={onOpenCreateNews}
              className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng tin tức mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map(art => {
              const isPending = art.approvalStatus === 'pending_approval';
              const isRejected = art.approvalStatus === 'rejected';
              return (
                <div key={art.id} className={`p-4 rounded-2xl border transition-all space-y-3 bg-white flex flex-col justify-between ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/20' :
                  isRejected ? 'border-rose-200 bg-rose-50/10' :
                  'border-slate-200 hover:border-sky-300'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold">{art.category}</span>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Từ chối</span>
                          </span>
                        )}
                        {art.approvalStatus === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã duyệt</span>
                          </span>
                        )}
                      </div>
                      <span>{art.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{art.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3">{art.summary}</p>
                    {isRejected && art.rejectionReason && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Lý do từ chối:</strong> {art.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[120px]">Tác giả: {art.authorName}</span>
                    <div className="flex items-center gap-1.5">
                      {isPending && onApproveNews && (
                        <button
                          onClick={() => onApproveNews(art.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Phê duyệt bài viết"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      {isPending && onRejectNews && (
                        <button
                          onClick={() => setRejectingItem({
                            id: art.id,
                            type: 'bài viết',
                            title: art.title,
                            category: 'news'
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Từ chối bài viết"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectNews(art)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                        title="Xem bài viết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditNews(art)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                        title="Chỉnh sửa bài viết"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa bài đăng "${art.title}"?`)) {
                            onDeleteNews(art.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Xóa bài viết"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION: BÀI GIẢNG & GIÁO ÁN ================= */}
      {activeSection === 'materials' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <span>Quản Lý Kho Bài Giảng & Giáo Án (KHBD 5512) ({materials.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các học liệu môn Tin học khối 6, 7, 8, 9 được lưu trữ trên hệ thống
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('materials')}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Kho Học Liệu Đầy Đủ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(mat => {
              const isPending = mat.approvalStatus === 'pending_approval';
              const isRejected = mat.approvalStatus === 'rejected';
              return (
                <div key={mat.id} className={`p-4 rounded-2xl border transition-all space-y-3 bg-white flex flex-col justify-between ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/20' :
                  isRejected ? 'border-rose-200 bg-rose-50/10' :
                  'border-slate-200 hover:border-teal-300'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold">Khối {mat.grade}</span>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Từ chối</span>
                          </span>
                        )}
                        {mat.approvalStatus === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã duyệt</span>
                          </span>
                        )}
                      </div>
                      <span>{mat.createdAt}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{mat.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{mat.description}</p>
                    {isRejected && mat.rejectionReason && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Lý do từ chối:</strong> {mat.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[120px]">Tác giả: {mat.authorName}</span>
                    <div className="flex items-center gap-1.5">
                      {isPending && onApproveMaterial && (
                        <button
                          onClick={() => onApproveMaterial(mat.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Phê duyệt học liệu"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      {isPending && onRejectMaterial && (
                        <button
                          onClick={() => setRejectingItem({
                            id: mat.id,
                            type: 'tài liệu học tập',
                            title: mat.title,
                            category: 'material'
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Từ chối học liệu"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      )}
                      <span className="font-bold text-teal-700 ml-1">{mat.downloads || 0} tải</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION: BÀI KIỂM TRA ================= */}
      {activeSection === 'exams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Quản Lý Danh Sách Bài Kiểm Tra Khảo Thí ({exams.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập đề thi, thời gian, câu hỏi và chế độ bảo mật
              </p>
            </div>

            <button
              onClick={onOpenCreateExam}
              className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề kiểm tra mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map(ex => {
              const examAttempts = attempts.filter(a => a.examId === ex.id);
              const isPending = ex.approvalStatus === 'pending_approval';
              const isRejected = ex.approvalStatus === 'rejected';
              return (
                <div key={ex.id} className={`p-5 rounded-2xl border transition-all space-y-4 bg-white ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/20' :
                  isRejected ? 'border-rose-200 bg-rose-50/10' :
                  'border-slate-200 hover:border-indigo-300'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px]">{ex.code}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">Khối {ex.grade}</span>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Từ chối</span>
                          </span>
                        )}
                        {ex.approvalStatus === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã duyệt</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{ex.title}</h4>
                      <p className="text-xs text-slate-500">{ex.description}</p>
                      {isRejected && ex.rejectionReason && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <strong>Lý do từ chối:</strong> {ex.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">Thời lượng</div>
                      <div className="font-bold text-slate-800">{ex.durationMinutes} phút</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Số câu hỏi</div>
                      <div className="font-bold text-slate-800">{ex.totalQuestions} câu</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Lượt nộp bài</div>
                      <div className="font-bold text-indigo-700">{examAttempts.length} lượt</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Mã vào thi: <strong className="font-mono text-slate-700">{ex.accessCode || 'Không'}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isPending && onApproveExam && (
                        <button
                          onClick={() => onApproveExam(ex.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="Phê duyệt đề thi"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      {isPending && onRejectExam && (
                        <button
                          onClick={() => setRejectingItem({
                            id: ex.id,
                            type: 'đề thi',
                            title: ex.title,
                            category: 'exam'
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Từ chối đề thi"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      )}
                      <button
                        onClick={() => onEditExam(ex)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                        title="Chỉnh sửa bài thi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa đề thi "${ex.title}"?`)) {
                            onDeleteExam(ex.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION: LỊCH SỬ & KẾT QUẢ ================= */}
      {activeSection === 'attempts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Lịch Sử & Kết Quả Bài Kiểm Tra Của Học Sinh ({filteredAttempts.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lọc theo lớp, tên bài kiểm tra, chọn nhiều học sinh để xóa hoặc xuất báo cáo kết quả chi tiết
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter by Class */}
              <select
                value={attemptClassFilter}
                onChange={(e) => setAttemptClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tất cả các lớp</option>
                {Array.from(new Set(attempts.map(a => a.studentClass))).filter(Boolean).map(c => (
                  <option key={c} value={c}>Lớp {c}</option>
                ))}
              </select>

              {/* Filter by Exam */}
              <select
                value={attemptExamFilter}
                onChange={(e) => setAttemptExamFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 max-w-[200px]"
              >
                <option value="all">Tất cả đề thi</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>

              {/* Search keyword */}
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm học sinh, mã HS..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Batch Actions & Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Đã chọn: <span className="text-blue-600">{selectedAttemptIds.length}</span> / {filteredAttempts.length} bài làm
              </span>

              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              {/* Allow Retake for Selected */}
              {selectedAttemptIds.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn cho phép ${selectedAttemptIds.length} học sinh đã chọn làm bài lại? Thao tác này sẽ xóa kết quả cũ để học sinh có thể vào thi lại.`)) {
                      if (onDeleteAttemptsBatch) {
                        onDeleteAttemptsBatch(selectedAttemptIds);
                        setSelectedAttemptIds([]);
                        alert('Đã mở quyền làm bài lại cho các học sinh được chọn thành công!');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🔄 Cho phép thi lại ({selectedAttemptIds.length})</span>
                </button>
              )}

              {/* Allow Retake for All Filtered (Whole Class / Filter) */}
              {filteredAttempts.length > 0 && (
                <button
                  onClick={() => {
                    const label = attemptClassFilter !== 'all' ? `cả lớp ${attemptClassFilter}` : 'toàn bộ danh sách đang hiển thị';
                    if (confirm(`Bạn có chắc chắn muốn cho phép ${label} (${filteredAttempts.length} học sinh) làm bài lại? Thao tác này sẽ xóa toàn bộ kết quả trong danh sách lọc.`)) {
                      if (onDeleteAttemptsBatch) {
                        const ids = filteredAttempts.map(a => a.id);
                        onDeleteAttemptsBatch(ids);
                        setSelectedAttemptIds([]);
                        alert('Đã mở quyền làm bài lại cho toàn bộ danh sách thành công!');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🔄 Cho phép cả lớp/lọc thi lại ({filteredAttempts.length})</span>
                </button>
              )}

              {/* Delete Selected */}
              {selectedAttemptIds.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedAttemptIds.length} kết quả bài kiểm tra đã chọn?`)) {
                      if (onDeleteAttemptsBatch) {
                        onDeleteAttemptsBatch(selectedAttemptIds);
                        setSelectedAttemptIds([]);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa đã chọn</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedAttemptIds(filteredAttempts.map(a => a.id));
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                Chọn tất cả
              </button>
              {selectedAttemptIds.length > 0 && (
                <button
                  onClick={() => setSelectedAttemptIds([])}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Bỏ chọn
                </button>
              )}

              {/* Export Report Button */}
              <button
                onClick={() => {
                  // Export filtered or selected attempts as CSV report
                  const dataToExport = selectedAttemptIds.length > 0
                    ? filteredAttempts.filter(a => selectedAttemptIds.includes(a.id))
                    : filteredAttempts;

                  if (dataToExport.length === 0) {
                    alert('Không có dữ liệu kết quả để xuất báo cáo!');
                    return;
                  }

                  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
                  csvContent += "STT,Họ và tên,Mã học sinh,Lớp,Tên bài kiểm tra,Điểm số,Số câu đúng,Tổng số câu,Thời gian làm (giây),Vi phạm tab,Thời gian nộp\n";

                  dataToExport.forEach((att, idx) => {
                    const row = [
                      idx + 1,
                      `"${att.studentName}"`,
                      `"${att.studentCode}"`,
                      `"${att.studentClass}"`,
                      `"${att.examTitle.replace(/"/g, '""')}"`,
                      att.score.toFixed(1),
                      att.correctCount,
                      att.totalQuestions,
                      att.durationSeconds,
                      att.tabSwitchCount || 0,
                      `"${att.submittedAt}"`
                    ];
                    csvContent += row.join(",") + "\n";
                  });

                  let examNameSlug = 'Tat_Ca_Bai_Kiem_Tra';
                  if (attemptExamFilter !== 'all') {
                    const foundExam = exams.find(e => e.id === attemptExamFilter);
                    if (foundExam) {
                      examNameSlug = foundExam.title.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '').trim().replace(/\s+/g, '_');
                    }
                  } else if (dataToExport.length > 0) {
                    const firstTitle = dataToExport[0].examTitle;
                    const allSame = dataToExport.every(a => a.examTitle === firstTitle);
                    if (allSame) {
                      examNameSlug = firstTitle.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '').trim().replace(/\s+/g, '_');
                    } else {
                      examNameSlug = 'Nhieu_Bai_Kiem_Tra';
                    }
                  }

                  const classSlug = attemptClassFilter !== 'all' ? `_Lop_${attemptClassFilter}` : '';
                  const fileName = `Ket_Qua_${examNameSlug}${classSlug}_${Date.now().toString().slice(-6)}.csv`;

                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", fileName);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Báo Cáo Excel/CSV ({selectedAttemptIds.length > 0 ? selectedAttemptIds.length : filteredAttempts.length})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredAttempts.length > 0 && selectedAttemptIds.length === filteredAttempts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAttemptIds(filteredAttempts.map(a => a.id));
                        } else {
                          setSelectedAttemptIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Đề thi</th>
                  <th className="px-4 py-3">Điểm số</th>
                  <th className="px-4 py-3">Đúng / Tổng</th>
                  <th className="px-4 py-3">Thời gian làm</th>
                  <th className="px-4 py-3">Vi phạm</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Không tìm thấy kết quả bài kiểm tra nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map(att => {
                    const isPassed = att.score >= 5.0;
                    const isSelected = selectedAttemptIds.includes(att.id);
                    return (
                      <tr key={att.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAttemptIds([...selectedAttemptIds, att.id]);
                              } else {
                                setSelectedAttemptIds(selectedAttemptIds.filter(id => id !== att.id));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{att.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {att.studentCode} • Lớp {att.studentClass}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {att.examTitle}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                            isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {att.score.toFixed(1)} / 10
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {att.correctCount} / {att.totalQuestions}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {Math.floor(att.durationSeconds / 60)} phút {att.durationSeconds % 60}s
                        </td>
                        <td className="px-4 py-3">
                          {att.tabSwitchCount && att.tabSwitchCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {att.tabSwitchCount} lần đổi tab
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Không</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewAttempt(att)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                              title="Xem chi tiết bài làm"
                            >
                              Xem
                            </button>
                            {onDeleteAttempt && (
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa kết quả bài làm của học sinh ${att.studentName}?`)) {
                                    onDeleteAttempt(att.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                                title="Xóa kết quả"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION: NGÂN HÀNG CÂU HỎI ================= */}
      {activeSection === 'questions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Ngân Hàng Câu Hỏi Môn Tin Học ({filteredQuestions.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các câu hỏi trắc nghiệm phân hóa 4 mức độ theo chuẩn chương trình GDPT 2018
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAIGenerator}
                className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Tạo câu hỏi AI</span>
              </button>
              <button
                onClick={onOpenCreateQuestion}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm nội dung câu hỏi hoặc mã câu hỏi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {['all', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'].map(gr => (
                <button
                  key={gr}
                  onClick={() => setFilterGrade(gr)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterGrade === gr
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {gr === 'all' ? 'Tất cả' : gr}
                </button>
              ))}
            </div>
          </div>

          {/* Question Cards */}
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {q.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Khối {q.grade}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      q.difficulty === 'recognition' ? 'bg-blue-50 text-blue-700' :
                      q.difficulty === 'understanding' ? 'bg-amber-50 text-amber-700' :
                      q.difficulty === 'application' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {q.difficulty === 'recognition' ? 'Nhận biết' :
                       q.difficulty === 'understanding' ? 'Thông hiểu' :
                       q.difficulty === 'application' ? 'Vận dụng' : 'Vận dụng cao'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditQuestion(q)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa câu hỏi ${q.code}?`)) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {q.content}
                </p>

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(oIdx);
                      return (
                        <div 
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            isCorrect 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Reject Reason */}
      <RejectModal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        itemTitle={rejectingItem?.title || ''}
        itemType={rejectingItem?.type || 'bài viết'}
        onConfirmReject={(reason) => {
          if (!rejectingItem) return;
          if (rejectingItem.category === 'news' && onRejectNews) {
            onRejectNews(rejectingItem.id, reason);
          } else if (rejectingItem.category === 'material' && onRejectMaterial) {
            onRejectMaterial(rejectingItem.id, reason);
          } else if (rejectingItem.category === 'exam' && onRejectExam) {
            onRejectExam(rejectingItem.id, reason);
          }
          setRejectingItem(null);
        }}
      />
    </div>
  );
};
