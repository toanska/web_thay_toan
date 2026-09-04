import React, { useState, useEffect } from 'react';
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

import { StorageService, authSessionChannel } from './services/storageService';
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
import { INITIAL_USERS } from './data/mockData';

export function App() {
  // State Initialization
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<NavigationTab>('news');

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

  const reloadAllData = () => {
    setNews(StorageService.getNews());
    setMaterials(StorageService.getMaterials());
    setExams(StorageService.getExams());
    setQuestions(StorageService.getQuestions());
    setAttempts(StorageService.getAttempts());
    setNotifications(StorageService.getNotifications());
    setAvailableUsers(StorageService.getUsers());
  };

  // Load initial data and run automatic real-time background sync loop
  useEffect(() => {
    reloadAllData();

    // 1. Listen for local storage updates to trigger debounced auto-push
    const handleStorageUpdated = () => {
      CloudflareService.triggerAutoSync();
    };

    // 2. Listen for remote storage updates (from other tabs via BroadcastChannel or background cloud pull)
    const handleRemoteStorageUpdated = (event: any) => {
      reloadAllData();
      if (event?.detail?.newAttempts && event.detail.newAttempts > 0) {
        setSyncToast({
          message: `Tự động đồng bộ: Đã cập nhật ${event.detail.newAttempts} bài thi mới!`,
          type: 'success'
        });
        setTimeout(() => setSyncToast(null), 3500);
      }
    };

    // 3. Fallback for multi-window storage events
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('thcs_')) {
        reloadAllData();
      }
      if (e.key === 'thcs_users_v2' || e.key === 'thcs_active_session_token') {
        const myUser = StorageService.getCurrentUser();
        if (myUser.role !== 'guest') {
          const isValid = StorageService.validateSession(myUser);
          if (!isValid) {
            StorageService.logoutUser();
            setCurrentUser(StorageService.getCurrentUser());
            setSessionConflictData({
              isOpen: true,
              userName: myUser.name,
              userCode: myUser.code,
              newDevice: myUser.lastLoginDevice || 'Thiết bị khác'
            });
          }
        }
      }
    };

    // 4. Listen to multi-device / multi-tab login events to kick out old sessions
    if (authSessionChannel) {
      authSessionChannel.onmessage = (event) => {
        if (event?.data?.type === 'AUTH_LOGIN_NEW_DEVICE') {
          const { userId, userCode, userName, sessionToken, deviceName } = event.data;
          const myUser = StorageService.getCurrentUser();
          const myToken = StorageService.getCurrentSessionToken();

          if (myUser.id === userId && myUser.role !== 'guest' && myToken && myToken !== sessionToken) {
            StorageService.logoutUser();
            setCurrentUser(StorageService.getCurrentUser());
            setSessionConflictData({
              isOpen: true,
              userName: userName || myUser.name,
              userCode: userCode || myUser.code,
              newDevice: deviceName || 'Thiết bị mới'
            });
          }
        }
      };
    }

    // 5. Periodic & focus check for session integrity
    const checkSessionIntegrity = () => {
      const myUser = StorageService.getCurrentUser();
      if (myUser.role !== 'guest') {
        const isValid = StorageService.validateSession(myUser);
        if (!isValid) {
          StorageService.logoutUser();
          setCurrentUser(StorageService.getCurrentUser());
          setSessionConflictData({
            isOpen: true,
            userName: myUser.name,
            userCode: myUser.code,
            newDevice: myUser.lastLoginDevice || 'Thiết bị khác'
          });
        }
      }
    };

    window.addEventListener('focus', checkSessionIntegrity);

    // 6. Initialize automated cloud sync background loop (periodic pull + window focus + network recovery)
    const cleanupAutoSync = CloudflareService.initAutoSyncLoop(() => {
      reloadAllData();
    });

    window.addEventListener('thcs_storage_updated', handleStorageUpdated);
    window.addEventListener('thcs_remote_storage_updated', handleRemoteStorageUpdated);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      cleanupAutoSync();
      window.removeEventListener('focus', checkSessionIntegrity);
      window.removeEventListener('thcs_storage_updated', handleStorageUpdated);
      window.removeEventListener('thcs_remote_storage_updated', handleRemoteStorageUpdated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Handle switching users / roles
  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    if (activeTab === 'students' && !isTeacherToanOrAdmin(user)) {
      setActiveTab('exams');
    }
  };

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentUser(StorageService.getCurrentUser());
    setActiveTab('news');
  };

  // --- Backup & Restore handlers ---
  const handleResetData = () => {
    StorageService.resetAllData();
    setCurrentUser(StorageService.getCurrentUser());
    setAvailableUsers(StorageService.getUsers());
    setNews(StorageService.getNews());
    setMaterials(StorageService.getMaterials());
    setExams(StorageService.getExams());
    setQuestions(StorageService.getQuestions());
    setAttempts(StorageService.getAttempts());
    setNotifications(StorageService.getNotifications());
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
    const ok = StorageService.importBackup(json);
    if (ok) {
      handleResetData();
      alert('Nhập dữ liệu thành công!');
    } else {
      alert('Định dạng tập tin sao lưu JSON không hợp lệ!');
    }
  };

  // --- Materials (Bài giảng & Giáo án) handlers ---
  const handleSaveMaterial = (material: LessonMaterial) => {
    StorageService.saveMaterial(material);
    setMaterials(StorageService.getMaterials());
  };

  const handleDeleteMaterial = (id: string) => {
    StorageService.deleteMaterial(id);
    setMaterials(StorageService.getMaterials());
  };

  const handleIncrementMaterialDownload = (id: string) => {
    StorageService.incrementMaterialDownload(id);
    setMaterials(StorageService.getMaterials());
  };

  const handleIncrementMaterialView = (id: string) => {
    StorageService.incrementMaterialView(id);
    setMaterials(StorageService.getMaterials());
  };

  // --- News handlers ---
  const handleSaveNews = (article: NewsArticle) => {
    StorageService.saveNews(article);
    setNews(StorageService.getNews());
    setEditingNews(undefined);
  };

  const handleDeleteNews = (id: string) => {
    StorageService.deleteNews(id);
    setNews(StorageService.getNews());
  };

  const handleLikeNews = (id: string) => {
    StorageService.likeNews(id);
    setNews(StorageService.getNews());
  };

  // --- Content Moderation Handlers (Kiểm duyệt: Thầy Toàn & Admin) ---
  const handleApproveNews = (id: string) => {
    StorageService.approveNews(id, currentUser.name);
    setNews(StorageService.getNews());
  };

  const handleRejectNews = (id: string, reason: string) => {
    StorageService.rejectNews(id, reason, currentUser.name);
    setNews(StorageService.getNews());
  };

  const handleApproveMaterial = (id: string) => {
    StorageService.approveMaterial(id, currentUser.name);
    setMaterials(StorageService.getMaterials());
  };

  const handleRejectMaterial = (id: string, reason: string) => {
    StorageService.rejectMaterial(id, reason, currentUser.name);
    setMaterials(StorageService.getMaterials());
  };

  const handleApproveExam = (id: string) => {
    StorageService.approveExam(id, currentUser.name);
    setExams(StorageService.getExams());
  };

  const handleRejectExam = (id: string, reason: string) => {
    StorageService.rejectExam(id, reason, currentUser.name);
    setExams(StorageService.getExams());
  };

  // --- Student User handlers ---
  const handleSaveUser = (user: User) => {
    StorageService.saveUser(user);
    const updatedUsers = StorageService.getUsers();
    setAvailableUsers(updatedUsers);
    if (currentUser.id === user.id) {
      setCurrentUser(user);
    }
  };

  const handleSaveUsersBatch = (newUsers: User[]) => {
    const updatedUsers = StorageService.saveUsersBatch(newUsers);
    setAvailableUsers(updatedUsers);
  };

  const handleDeleteUser = (id: string) => {
    StorageService.deleteUser(id);
    const updatedUsers = StorageService.getUsers();
    setAvailableUsers(updatedUsers);
    if (currentUser.id === id) {
      handleUserChange(updatedUsers[0]);
    }
  };

  // --- Question Bank handlers ---
  const handleSaveQuestion = (question: Question) => {
    StorageService.saveQuestion(question);
    setQuestions(StorageService.getQuestions());
    setEditingQuestion(undefined);
  };

  const handleDeleteQuestion = (id: string) => {
    StorageService.deleteQuestion(id);
    setQuestions(StorageService.getQuestions());
  };

  const handleDuplicateQuestion = (q: Question) => {
    const duplicated: Question = {
      ...q,
      id: 'q-' + Date.now(),
      code: `${q.code}-COPY`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    StorageService.saveQuestion(duplicated);
    setQuestions(StorageService.getQuestions());
  };

  const handleSaveAIBatchQuestions = (newQuestions: Question[]) => {
    newQuestions.forEach(q => {
      StorageService.saveQuestion(q);
    });
    setQuestions(StorageService.getQuestions());
    setIsAIGeneratorOpen(false);
  };

  // --- Exam handlers ---
  const handleSaveExam = (exam: Exam) => {
    // Also sync questions into Question Bank for future reuse
    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => {
        StorageService.saveQuestion(q);
      });
      setQuestions(StorageService.getQuestions());
    }
    StorageService.saveExam(exam);
    setExams(StorageService.getExams());
    setEditingExam(undefined);
  };

  const handleDeleteExam = (id: string) => {
    StorageService.deleteExam(id);
    setExams(StorageService.getExams());
  };

  const handleDuplicateExam = (ex: Exam) => {
    const duplicated: Exam = {
      ...ex,
      id: 'exam-' + Date.now(),
      code: `${ex.code}-COPY`,
      title: `${ex.title} (Bản sao)`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    StorageService.saveExam(duplicated);
    setExams(StorageService.getExams());
  };

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
  };

  const handleFinishExamAttempt = (attempt: ExamAttempt) => {
    StorageService.saveAttempt(attempt);
    setAttempts(StorageService.getAttempts());
    setActiveExam(null);
    setViewingAttempt(attempt);
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    StorageService.markNotificationRead(id);
    setNotifications(StorageService.getNotifications());
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
            onDeleteUser={handleDeleteUser}
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
          <AnalyticsDashboard
            exams={exams}
            attempts={attempts}
            currentUser={currentUser}
            onViewAttempt={(att) => setViewingAttempt(att)}
          />
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
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-800">
            HỆ THỐNG CỔNG THÔNG TIN & KHẢO THÍ TRỰC TUYẾN
          </p>
          <p>
            Chuẩn hóa theo Chương trình Giáo dục Phổ thông 2018 • Tích hợp giám sát chống gian lận & Ngân hàng câu hỏi 4 mức độ
          </p>
          <p className="text-[11px] text-slate-400">
            Bản quyền © 2025. Hệ thống vận hành ổn định trên mọi thiết bị máy tính, máy tính bảng và điện thoại di động.
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
          onClose={() => setViewingAttempt(null)}
          onRetake={() => {
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

