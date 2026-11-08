import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { NewsList } from './components/News/NewsList';
import { NewsDetailModal } from './components/News/NewsDetailModal';
import { NewsEditorModal } from './components/News/NewsEditorModal';
import { ExamList } from './components/Exams/ExamList';
import { ExamTaking } from './components/Exams/ExamTaking';
import { ExamResultModal } from './components/Exams/ExamResultModal';
import { ExamCreatorModal } from './components/Exams/ExamCreatorModal';
import { QuestionBankManager } from './components/QuestionBank/QuestionBankManager';
import { QuestionEditorModal } from './components/QuestionBank/QuestionEditorModal';
import { AIQuestionGeneratorModal } from './components/QuestionBank/AIQuestionGeneratorModal';
import { AnalyticsDashboard } from './components/Reports/AnalyticsDashboard';
import { StudentDashboard } from './components/StudentProfile/StudentDashboard';
import { ScoreLookupView } from './components/ScoreLookup/ScoreLookupView';
import { LoginPage } from './components/Auth/LoginPage';
import { LoginModal } from './components/Auth/LoginModal';
import { ChangePasswordModal } from './components/Auth/ChangePasswordModal';
import { SessionConflictModal } from './components/Auth/SessionConflictModal';
import { AccountManagementView } from './components/AccountManager/AccountManagementView';
import { AdminDashboardView } from './components/Admin/AdminDashboardView';
import { MaterialListView } from './components/Materials/MaterialListView';
import { CloudflareSyncModal } from './components/CloudflareSync/CloudflareSyncModal';
import { isTeacherToanOrAdmin } from './utils/authUtils';

import { StorageService } from './services/storageService';
import { CloudflareService } from './services/cloudflareService';
import { 
  User, 
  NewsArticle, 
  Exam, 
  Question, 
  ExamAttempt, 
  AppNotification, 
  NavigationTab,
  LessonMaterial 
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_QUESTIONS, 
  INITIAL_EXAMS, 
  INITIAL_NEWS, 
  INITIAL_MATERIALS 
} from './data/mockData';

export function App() {
  // State Initialization
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavigationTab;
      if (tabParam) return tabParam;
    }
    return 'exams';
  });

  // Domain state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals & Active Session State
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [editingNews, setEditingNews] = useState<NewsArticle | null | undefined>(undefined); // null = new, Article = edit, undefined = closed
  const [editingExam, setEditingExam] = useState<Exam | null | undefined>(undefined); // null = new, Exam = edit, undefined = closed
  const [editingQuestion, setEditingQuestion] = useState<Question | null | undefined>(undefined);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [viewingAttempt, setViewingAttempt] = useState<ExamAttempt | null>(null);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [sessionConflictData, setSessionConflictData] = useState<{
    isOpen: boolean;
    userName: string;
    userCode: string;
    newDevice: string;
  } | null>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [dbConnected, setDbConnected] = useState(false);

  const reloadAllData = async () => {
    try {
      const [
        newsData, 
        materialsData, 
        examsData, 
        questionsData, 
        attemptsData, 
        notificationsData, 
        usersData
      ] = await Promise.all([
        StorageService.getNews(),
        StorageService.getMaterials(),
        StorageService.getExams(),
        StorageService.getQuestions(),
        StorageService.getAttempts(),
        StorageService.getNotifications(),
        StorageService.getUsers()
      ]);

      // Update state with actual database data
      setNews(newsData);
      setMaterials(materialsData);
      setExams(examsData);
      setQuestions(questionsData);
      setAttempts(attemptsData);
      setNotifications(notificationsData);
      setAvailableUsers(usersData);
    } catch (err) {
      console.error('Failed to reload data:', err);
    }
  };

  // Load initial data and run automatic real-time background sync loop
  const unsubRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const initAndLoad = async () => {
      await StorageService.initialize({
        users: INITIAL_USERS,
        questions: INITIAL_QUESTIONS,
        exams: INITIAL_EXAMS,
        news: INITIAL_NEWS,
        materials: INITIAL_MATERIALS
      });
      
      // Auto-detect developer and login as admin if authenticated via Google
      const { auth } = await import('./firebase');
      if (auth.currentUser && (auth.currentUser.email === 'toanska@gmail.com' || auth.currentUser.email === 'admin.tinhoc@thcs.edu.vn')) {
        const adminUser = INITIAL_USERS.find(u => u.code === 'ADMIN-TINHOC');
        if (adminUser) {
          handleUserChange(adminUser);
        }
      }

      // Initial fetch to populate state before listeners kick in
      await reloadAllData();

      // 1. Subscribe to Real-time Firestore Updates (Immediate Automatic Sync)
      unsubRef.current = StorageService.subscribeToCollections({
        onUsers: (data) => setAvailableUsers(data),
        onExams: (data) => setExams(data),
        onNews: (data) => setNews(data),
        onMaterials: (data) => setMaterials(data),
        onAttempts: (data) => setAttempts(data),
        onQuestions: (data) => setQuestions(data),
        onNotifications: (data) => setNotifications(data as any),
      });
    };

    initAndLoad();

    // 2. Fallback for multi-window storage events (Logo, etc)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('thcs_')) {
        reloadAllData();
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (unsubRef.current) unsubRef.current();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // 3. Auto-redirect based on user role changes
  useEffect(() => {
    // If user is admin/teacher and NOT currently on a restricted tab, move them to admin portal
    // This handles both fresh login and returning to the site as admin
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'teacher';
    if (isAdmin && (activeTab === 'login' || activeTab === 'exams')) {
      setActiveTab('admin_portal');
    } else if (currentUser.role === 'guest' && (activeTab === 'admin_portal' || activeTab === 'students' || activeTab === 'reports')) {
      // If guest accidentally hits admin tab, send to exams
      setActiveTab('exams');
    }
  }, [currentUser.id, currentUser.role, activeTab]);

  // 4. Connection Status Monitor
  useEffect(() => {
    const checkConn = async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      onAuthStateChanged(StorageService.auth, (user) => {
        setDbConnected(!!user);
      });
    };
    checkConn();
  }, []);

  // Handle switching users / roles
  const handleUserChange = async (user: User) => {
    if (!user || user.role === 'guest') {
      StorageService.logoutUser();
      setCurrentUser(StorageService.getCurrentUser());
      // Redirection useEffect will handle the tab switch
    } else {
      const updatedUser: User = {
        ...user,
        lastLoginAt: new Date().toISOString()
      };

      // Persist locally
      StorageService.setCurrentUser(updatedUser);
      setCurrentUser(updatedUser);
      
      // Sync with Firestore (Background)
      try {
        await StorageService.loginUser(user);
      } catch (err) {
        console.warn('Background Firestore login failed:', err);
      }
    }
  };

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentUser(StorageService.getCurrentUser());
    setActiveTab('exams');
  };

  // --- Backup & Restore handlers ---
  const handleResetData = () => {
    StorageService.resetAllData();
    // In Firebase version, this might need more logic if we wanted to seed Firestore
    reloadAllData();
  };

  const handleExportData = () => {
    const json = StorageService.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_thcs_nguyendu_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (json: string) => {
    const ok = StorageService.importBackup();
    if (ok) {
      handleResetData();
      alert('Nhập dữ liệu thành công!');
    } else {
      alert('Chức năng nhập dữ liệu đang được cập nhật cho phiên bản Firebase.');
    }
  };

  // --- Materials handlers ---
  const handleSaveMaterial = async (material: LessonMaterial) => {
    await StorageService.saveMaterial(material);
    setEditingNews(undefined);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      await StorageService.deleteMaterial(id);
    }
  };

  const handleIncrementMaterialDownload = async (id: string) => {
    // Implement if needed for Firebase
  };

  const handleIncrementMaterialView = async (id: string) => {
    // Implement if needed for Firebase
  };

  // --- News handlers ---
  const handleSaveNews = async (article: NewsArticle) => {
    await StorageService.saveNews(article);
    setEditingNews(undefined);
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      await StorageService.deleteNews(id);
    }
  };

  const handleLikeNews = async (id: string) => {
    // Implement for Firebase
  };

  // --- Content Moderation Handlers ---
  const handleApproveNews = async (id: string) => {
    const article = news.find(n => n.id === id);
    if (article) {
      await StorageService.saveNews({ 
        ...article, 
        approvalStatus: 'approved',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  const handleRejectNews = async (id: string, reason: string) => {
    const article = news.find(n => n.id === id);
    if (article) {
      await StorageService.saveNews({ 
        ...article, 
        approvalStatus: 'rejected',
        rejectionReason: reason,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  const handleApproveMaterial = async (id: string) => {
    const mat = materials.find(m => m.id === id);
    if (mat) {
      await StorageService.saveMaterial({ 
        ...mat, 
        approvalStatus: 'approved',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  const handleRejectMaterial = async (id: string, reason: string) => {
    const mat = materials.find(m => m.id === id);
    if (mat) {
      await StorageService.saveMaterial({ 
        ...mat, 
        approvalStatus: 'rejected',
        rejectionReason: reason,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  const handleApproveExam = async (id: string) => {
    const ex = exams.find(e => e.id === id);
    if (ex) {
      await StorageService.saveExam({ 
        ...ex, 
        approvalStatus: 'approved',
        isPublished: true,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  const handleRejectExam = async (id: string, reason: string) => {
    const ex = exams.find(e => e.id === id);
    if (ex) {
      await StorageService.saveExam({ 
        ...ex, 
        approvalStatus: 'rejected',
        rejectionReason: reason,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
    }
  };

  // --- User handlers ---
  const handleSaveUser = async (user: User) => {
    await StorageService.saveUser(user);
    if (currentUser.id === user.id) {
      setCurrentUser(user);
    }
  };

  const handleSaveUsersBatch = async (newUsers: User[]) => {
    await Promise.all(newUsers.map(u => StorageService.saveUser(u)));
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      await StorageService.deleteUser(id);
    }
  };

  const handleDeleteUsersBatch = async (ids: string[]) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${ids.length} người dùng đã chọn?`)) {
      await Promise.all(ids.map(id => StorageService.deleteUser(id)));
    }
  };

  const handleDeleteAttemptsBatch = async (ids: string[]) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${ids.length} kết quả đã chọn?`)) {
      // In a real Firebase app, we'd batch this, but for now loop is fine
      await Promise.all(ids.map(id => StorageService.deleteAttempt(id)));
    }
  };

  // --- Question Bank handlers ---
  const handleSaveQuestion = async (question: Question) => {
    await StorageService.saveQuestion(question);
    setEditingQuestion(undefined);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      await StorageService.deleteQuestion(id);
    }
  };

  const handleDuplicateQuestion = async (q: Question) => {
    const duplicated: Question = {
      ...q,
      id: 'q-' + Date.now(),
      code: `${q.code}-COPY`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    await StorageService.saveQuestion(duplicated);
  };

  const handleSaveAIBatchQuestions = async (newQuestions: Question[]) => {
    await Promise.all(newQuestions.map(q => StorageService.saveQuestion(q)));
    setIsAIGeneratorOpen(false);
  };

  // --- Exam handlers ---
  const handleSaveExam = async (exam: Exam) => {
    if (exam.questions && exam.questions.length > 0) {
      await Promise.all(exam.questions.map(q => StorageService.saveQuestion(q)));
    }
    await StorageService.saveExam(exam);
    setEditingExam(undefined);
  };

  const handleDeleteExam = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      await StorageService.deleteExam(id);
    }
  };

  const handleDuplicateExam = async (ex: Exam) => {
    const duplicated: Exam = {
      ...ex,
      id: 'exam-' + Date.now(),
      code: `${ex.code}-COPY`,
      title: `${ex.title} (Bản sao)`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    await StorageService.saveExam(duplicated);
  };

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
  };

  const handleDeleteAttempt = async (id: string) => {
    // Implement deleteAttempt in StorageService if needed
  };

  const handleFinishExamAttempt = async (attempt: ExamAttempt) => {
    await StorageService.saveAttempt(attempt);
    setActiveExam(null);
    setViewingAttempt(attempt);
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    // StorageService.markNotificationRead(id);
  };

  // If in active fullscreen testing mode, render ExamTaking
  if (activeExam) {
    return (
      <ExamTaking
        exam={activeExam}
        currentUser={currentUser}
        onFinishAttempt={handleFinishExamAttempt}
        onCancel={() => {
          if (confirm('Bạn có chắc chắn muốn rời phòng thi? Bài làm chưa nộp sẽ không được lưu.')) {
            setActiveExam(null);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      {/* Universal Portal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={availableUsers}
        onSwitchUser={handleUserChange}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenCloudflareSync={() => setIsCloudflareModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
        dbConnected={dbConnected}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* CHỨC NĂNG 1: Tin Tức & Thông Báo Nhà Trường */}
        {activeTab === 'news' && (
          <NewsList
            news={news}
            currentUser={currentUser}
            onSelectArticle={(art) => setSelectedNews(art)}
            onCreateArticle={() => setEditingNews(null)}
            onEditArticle={(art) => setEditingNews(art)}
            onDeleteArticle={handleDeleteNews}
            onLikeArticle={handleLikeNews}
            onApproveArticle={handleApproveNews}
            onRejectArticle={handleRejectNews}
            onNavigateToLogin={() => setActiveTab('login')}
          />
        )}

        {/* CHỨC NĂNG 1.5: Kho Bài Giảng Điện Tử & Giáo Án (KHBD 5512) */}
        {activeTab === 'materials' && (
          <MaterialListView
            materials={materials}
            currentUser={currentUser}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onIncrementDownload={handleIncrementMaterialDownload}
            onIncrementView={handleIncrementMaterialView}
            onApproveMaterial={handleApproveMaterial}
            onRejectMaterial={handleRejectMaterial}
            onNavigateToLogin={() => setActiveTab('login')}
          />
        )}

        {/* CHỨC NĂNG 2: Danh Sách Bài Kiểm Tra & Làm Bài Trực Tuyến */}
        {activeTab === 'exams' && (
          <ExamList
            exams={exams}
            currentUser={currentUser}
            attempts={attempts}
            onStartExam={handleStartExam}
            onViewAttempt={(att) => setViewingAttempt(att)}
            onCreateExam={() => setEditingExam(null)}
            onEditExam={(ex) => setEditingExam(ex)}
            onDeleteExam={handleDeleteExam}
            onApproveExam={handleApproveExam}
            onRejectExam={handleRejectExam}
            onNavigateToLogin={() => setActiveTab('login')}
          />
        )}

        {/* CHỨC NĂNG 3: Tra Cứu Điểm Với ID Học Sinh */}
        {activeTab === 'score_lookup' && (
          <ScoreLookupView
            attempts={attempts}
            users={availableUsers}
            exams={exams}
            currentUser={currentUser}
            onViewAttempt={(att) => setViewingAttempt(att)}
            onTakeExam={handleStartExam}
            onNavigateToLogin={() => setActiveTab('login')}
          />
        )}

        {/* CHỨC NĂNG 3.5: Trang Quản Trị Toàn Diện (Dành cho Admin hoặc Thầy Toàn) */}
        {activeTab === 'admin_portal' && (
          <AdminDashboardView
            currentUser={currentUser}
            users={availableUsers}
            news={news}
            materials={materials}
            exams={exams}
            attempts={attempts}
            questions={questions}
            onSaveUser={handleSaveUser}
            onSaveUsersBatch={handleSaveUsersBatch}
            onDeleteUser={handleDeleteUser}
            onDeleteUsersBatch={handleDeleteUsersBatch}
            onSwitchUser={handleUserChange}
            onOpenCreateNews={() => setEditingNews(null)}
            onEditNews={(art) => setEditingNews(art)}
            onDeleteNews={handleDeleteNews}
            onSelectNews={(art) => setSelectedNews(art)}
            onApproveNews={handleApproveNews}
            onRejectNews={handleRejectNews}
            onOpenCreateExam={() => setEditingExam(null)}
            onEditExam={(ex) => setEditingExam(ex)}
            onDeleteExam={handleDeleteExam}
            onApproveExam={handleApproveExam}
            onRejectExam={handleRejectExam}
            onApproveMaterial={handleApproveMaterial}
            onRejectMaterial={handleRejectMaterial}
            onOpenCreateQuestion={() => setEditingQuestion(null)}
            onEditQuestion={(q) => setEditingQuestion(q)}
            onDeleteQuestion={handleDeleteQuestion}
            onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            onViewAttempt={(att) => setViewingAttempt(att)}
            onDeleteAttempt={handleDeleteAttempt}
            onDeleteAttemptsBatch={handleDeleteAttemptsBatch}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* CHỨC NĂNG 4: Quản Trị, Tạo & Chỉnh Sửa Tài Khoản (Dành riêng cho Thầy Toàn hoặc Admin) */}
        {activeTab === 'students' && (
          isTeacherToanOrAdmin(currentUser) ? (
            <AccountManagementView
              users={availableUsers}
              currentUser={currentUser}
              attempts={attempts}
              onSaveUser={handleSaveUser}
              onSaveUsersBatch={handleSaveUsersBatch}
              onDeleteUser={handleDeleteUser}
              onDeleteUsersBatch={handleDeleteUsersBatch}
              onSwitchUser={(user) => {
                handleUserChange(user);
              }}
              onNavigateToLogin={() => setActiveTab('login')}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-900">Khu Vực Giới Hạn Quyền Quản Trị</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Trang <strong>Quản lý, tạo và chỉnh sửa tài khoản</strong> chỉ hiển thị và cho phép truy cập đối với tài khoản của <strong>Thầy Toàn</strong> hoặc <strong>Quản trị viên (Admin)</strong>.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Đăng nhập tài khoản Thầy Toàn / Quản trị viên</span>
                </button>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Về danh sách bài kiểm tra
                </button>
              </div>
            </div>
          )
        )}

        {/* CHỨC NĂNG 5: Trang Đăng Nhập Tài Khoản & Phân Quyền */}
        {activeTab === 'login' && (
          <LoginPage
            currentUser={currentUser}
            users={availableUsers}
            onLoginUser={handleUserChange}
            onNavigateToTab={(t) => setActiveTab(t)}
            onOpenCreateExam={() => setEditingExam(null)}
            onOpenCreateNews={() => setEditingNews(null)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          />
        )}

        {/* PHÂN HỆ QUẢN TRỊ: Báo Cáo & Thống Kê Phổ Điểm */}
        {activeTab === 'reports' && (
          (currentUser.role === 'admin' || currentUser.role === 'teacher') ? (
            <AnalyticsDashboard
              exams={exams}
              attempts={attempts}
              currentUser={currentUser}
              onViewAttempt={(att) => setViewingAttempt(att)}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                📊
              </div>
              <h2 className="text-xl font-bold text-slate-900">Báo Cáo & Phổ Điểm Dành Cho Giáo Viên</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Chức năng phân tích phổ điểm và thống kê chất lượng khảo thí chỉ dành riêng cho <strong>Giáo viên</strong> và <strong>Quản trị viên</strong>.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                {currentUser.role === 'guest' && (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Đăng nhập tài khoản Giáo viên
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Về danh sách bài kiểm tra
                </button>
              </div>
            </div>
          )
        )}

        {/* Hồ Sơ Cá Nhân */}
        {activeTab === 'profile' && (
          <StudentDashboard
            currentUser={currentUser}
            attempts={attempts}
            exams={exams}
            onViewAttempt={(att) => setViewingAttempt(att)}
            onTakeExam={handleStartExam}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div>
            <button
              type="button"
              onClick={() => setActiveTab('exams')}
              className="inline-flex items-center gap-2.5 font-bold text-slate-800 hover:text-blue-900 transition-colors cursor-pointer group"
              title="Nhấn để về Trang chủ bài kiểm tra"
            >
              <img
                src="/assets/aistudio/LOGO_WEB_05e2bec9.jpg"
                alt="Logo Thầy Toàn - PNT"
                className="w-7 h-7 object-contain rounded-md bg-white border border-slate-200 shadow-2xs group-hover:scale-110 transition-transform"
              />
              <span className="group-hover:underline">MÔN TIN HỌC - THẦY TOÀN (PHẠM NHẬT TOÀN) • TRƯỜNG THCS NGÔ QUYỀN</span>
            </button>
          </div>
          <p>
            Chuẩn hóa theo Chương trình Giáo dục Phổ thông 2018 • Tích hợp giám sát chống gian lận & Ngân hàng câu hỏi 4 mức độ
          </p>
          <p className="text-[11px] text-slate-400">
            Bản quyền © 2026. Hệ thống vận hành ổn định trên mọi thiết bị máy tính, máy tính bảng và điện thoại di động.
          </p>
        </div>
      </footer>

      {/* MODAL 1: News Detail Viewer */}
      {selectedNews && (
        <NewsDetailModal
          article={selectedNews}
          currentUser={currentUser}
          onClose={() => setSelectedNews(null)}
        />
      )}

      {/* MODAL 2: News Creator / Editor */}
      {editingNews !== undefined && (
        <NewsEditorModal
          articleToEdit={editingNews}
          currentUser={currentUser}
          onSave={handleSaveNews}
          onClose={() => setEditingNews(undefined)}
        />
      )}

      {/* MODAL 3: Exam Creator / Editor */}
      {editingExam !== undefined && (
        <ExamCreatorModal
          examToEdit={editingExam}
          questions={questions}
          currentUser={currentUser}
          onSave={handleSaveExam}
          onClose={() => setEditingExam(undefined)}
          onOpenQuestionCreator={() => {
            setEditingExam(undefined);
            setActiveTab('question_bank');
            setEditingQuestion(null);
          }}
        />
      )}

      {/* MODAL 4: Question Creator / Editor */}
      {editingQuestion !== undefined && (
        <QuestionEditorModal
          questionToEdit={editingQuestion}
          currentUser={currentUser}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(undefined)}
        />
      )}

      {/* MODAL 5: AI Question Generator */}
      {isAIGeneratorOpen && (
        <AIQuestionGeneratorModal
          onSaveQuestions={handleSaveAIBatchQuestions}
          onClose={() => setIsAIGeneratorOpen(false)}
        />
      )}

      {/* MODAL 6: Exam Result & Detailed Review Sheet */}
      {viewingAttempt && (
        <ExamResultModal
          attempt={viewingAttempt}
          exam={exams.find(e => e.id === viewingAttempt.examId)}
          currentUser={currentUser}
          onClose={() => setViewingAttempt(null)}
          onRetake={currentUser.role === 'student' ? undefined : () => {
            const targetExam = exams.find(e => e.id === viewingAttempt.examId);
            setViewingAttempt(null);
            if (targetExam) {
              handleStartExam(targetExam);
            }
          }}
        />
      )}

      {/* MODAL 7: Cloudflare KV Cloud Database Sync & Config */}
      <CloudflareSyncModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        onDataChanged={reloadAllData}
      />

      {/* MODAL 8: Cửa Sổ Đăng Nhập & Chuyển Đổi Tài Khoản */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        users={availableUsers}
        onLoginUser={handleUserChange}
      />

      {/* MODAL 9: Đổi Mật Khẩu Tài Khoản */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onPasswordChanged={(updatedUser) => {
          setCurrentUser(updatedUser);
          setAvailableUsers(StorageService.getUsers());
        }}
      />

      {/* MODAL 10: Cảnh Báo Trùng Lặp Phiên Đăng Nhập Đa Thiết Bị */}
      {sessionConflictData?.isOpen && (
        <SessionConflictModal
          isOpen={sessionConflictData.isOpen}
          userName={sessionConflictData.userName}
          userCode={sessionConflictData.userCode}
          newDevice={sessionConflictData.newDevice}
          onAcknowledge={() => {
            setSessionConflictData(null);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {/* Floating Auto-Sync Notification Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-500/40 animate-fade-in pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{syncToast.message}</span>
        </div>
      )}
    </div>
  );
}
export default App;

