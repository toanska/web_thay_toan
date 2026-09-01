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
import { AccountManagementView } from './components/AccountManager/AccountManagementView';
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

  const reloadAllData = () => {
    setNews(StorageService.getNews());
    setMaterials(StorageService.getMaterials());
    setExams(StorageService.getExams());
    setQuestions(StorageService.getQuestions());
    setAttempts(StorageService.getAttempts());
    setNotifications(StorageService.getNotifications());
    setAvailableUsers(StorageService.getUsers());
  };

  // Load initial data from StorageService
  useEffect(() => {
    reloadAllData();

    // Listen for storage updates to trigger auto sync if enabled
    const handleStorageUpdated = () => {
      CloudflareService.triggerAutoSync();
    };

    window.addEventListener('thcs_storage_updated', handleStorageUpdated);
    return () => {
      window.removeEventListener('thcs_storage_updated', handleStorageUpdated);
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
                {availableUsers.find(u => u.code === 'GV-TINHOC01' || u.name.includes('Toàn')) && (
                  <button
                    onClick={() => {
                      const toan = availableUsers.find(u => u.code === 'GV-TINHOC01' || u.name.includes('Toàn'));
                      if (toan) handleUserChange(toan);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Chuyển sang tài khoản Thầy Toàn
                  </button>
                )}
                {availableUsers.find(u => u.role === 'admin') && (
                  <button
                    onClick={() => {
                      const admin = availableUsers.find(u => u.role === 'admin');
                      if (admin) handleUserChange(admin);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Chuyển sang tài khoản Quản trị viên
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

        {/* CHỨC NĂNG 5: Trang Đăng Nhập Tài Khoản & Phân Quyền */}
        {activeTab === 'login' && (
          <LoginPage
            currentUser={currentUser}
            users={availableUsers}
            onLoginUser={handleUserChange}
            onNavigateToTab={(t) => setActiveTab(t)}
            onOpenCreateExam={() => setEditingExam(null)}
            onOpenCreateNews={() => setEditingNews(null)}
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
    </div>
  );
}
export default App;

