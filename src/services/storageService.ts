import { Exam, ExamAttempt, NewsArticle, NotificationItem, Question, User, Subject, GradeLevel, DifficultyLevel, LessonMaterial } from '../types';
import { INITIAL_USERS, INITIAL_QUESTIONS, INITIAL_EXAMS, INITIAL_ATTEMPTS, INITIAL_NEWS, INITIAL_NOTIFICATIONS, INITIAL_MATERIALS, GUEST_USER } from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'thcs_users_v1',
  CURRENT_USER: 'thcs_current_user_v1',
  ACTIVE_SESSION_TOKEN: 'thcs_active_session_token_v1',
  QUESTIONS: 'thcs_questions_v1',
  EXAMS: 'thcs_exams_v1',
  ATTEMPTS: 'thcs_attempts_v1',
  NEWS: 'thcs_news_v1',
  NOTIFICATIONS: 'thcs_notifications_v1',
  MATERIALS: 'thcs_materials_v1',
  LAST_MODIFIED: 'thcs_last_modified_v1',
};

// Cross-tab real-time sync via BroadcastChannel
export const dbSyncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('thcs_tin_hoc_db_sync_v1')
  : null;

export const authSessionChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('thcs_auth_session_v1')
  : null;

if (dbSyncChannel) {
  dbSyncChannel.onmessage = (event) => {
    if (event?.data?.type === 'DB_MUTATION' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_remote_storage_updated', {
        detail: event.data
      }));
    }
  };
}

// Safe storage access
function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T, broadcast = true): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(STORAGE_KEYS.LAST_MODIFIED, Date.now().toString());

    // Trigger local & cross-tab background auto sync if key is content data
    if (key !== STORAGE_KEYS.CURRENT_USER && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_storage_updated', { detail: { key } }));
      
      if (broadcast && dbSyncChannel) {
        dbSyncChannel.postMessage({
          type: 'DB_MUTATION',
          key,
          timestamp: Date.now()
        });
      }
    }
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

export const StorageService = {
  // Users
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  
  getCurrentUser(): User {
    const users = this.getUsers();
    const stored = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) {
      if (stored.role === 'guest' || stored.id === 'user-guest') {
        return GUEST_USER;
      }
      const match = users.find(u => u.id === stored.id);
      if (match) return match;
    }
    return GUEST_USER; // default to Guest when visitor accesses site
  },

  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  loginUser(user: User, deviceName?: string): { user: User; sessionToken: string } {
    const sessionToken = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    const device = deviceName || this.getDeviceDescription();
    const updatedUser: User = {
      ...user,
      activeSessionToken: sessionToken,
      lastLoginAt: new Date().toISOString(),
      lastLoginDevice: device
    };

    this.saveUser(updatedUser);
    setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_TOKEN, sessionToken);
    }

    if (authSessionChannel) {
      authSessionChannel.postMessage({
        type: 'AUTH_LOGIN_NEW_DEVICE',
        userId: user.id,
        userCode: user.code,
        userName: user.name,
        sessionToken,
        deviceName: device,
        timestamp: Date.now()
      });
    }

    return { user: updatedUser, sessionToken };
  },

  getCurrentSessionToken(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_TOKEN) || '';
  },

  getDeviceDescription(): string {
    if (typeof navigator === 'undefined') return 'Thiết bị người dùng';
    const ua = navigator.userAgent;
    let browser = 'Trình duyệt Web';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';

    let os = 'Máy tính';
    if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS (iPhone/iPad)';
    else if (/Android/.test(ua)) os = 'Thiết bị Android';
    else if (/Windows/.test(ua)) os = 'Máy tính Windows';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'Máy tính MacOS';
    else if (/Linux/.test(ua)) os = 'Máy tính Linux';

    return `${os} • ${browser}`;
  },

  validateSession(currentUser: User): boolean {
    if (!currentUser || currentUser.role === 'guest' || currentUser.id === 'user-guest') {
      return true;
    }
    const users = this.getUsers();
    const latestUser = users.find(u => u.id === currentUser.id);
    if (!latestUser) return false;
    
    const localToken = this.getCurrentSessionToken();
    // If the latest record in database has a session token and local token doesn't match, session is expired
    if (latestUser.activeSessionToken && localToken && latestUser.activeSessionToken !== localToken) {
      return false;
    }
    return true;
  },

  logoutUser(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_TOKEN);
    }
    setItem(STORAGE_KEYS.CURRENT_USER, GUEST_USER);
  },

  saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
    } else {
      updated = [user, ...users];
    }
    setItem(STORAGE_KEYS.USERS, updated);
    return user;
  },

  saveUsersBatch(newUsers: User[]): User[] {
    const users = this.getUsers();
    const existingMap = new Map<string, User>(users.map(u => [u.id, u]));
    newUsers.forEach(u => {
      existingMap.set(u.id, u);
    });
    const updated: User[] = Array.from(existingMap.values());
    setItem(STORAGE_KEYS.USERS, updated);
    return updated;
  },

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, users);
  },

  // Questions
  getQuestions(): Question[] {
    const raw = getItem<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    return raw.map(q => ({ ...q, subject: 'Tin học' as const }));
  },

  saveQuestion(question: Question): Question {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    let updated: Question[];
    if (index >= 0) {
      updated = [...questions];
      updated[index] = { ...question, subject: 'Tin học' };
    } else {
      updated = [{ ...question, subject: 'Tin học' }, ...questions];
    }
    setItem(STORAGE_KEYS.QUESTIONS, updated);
    return question;
  },

  deleteQuestion(id: string): void {
    const questions = this.getQuestions().filter(q => q.id !== id);
    setItem(STORAGE_KEYS.QUESTIONS, questions);
  },

  // Exams
  getExams(): Exam[] {
    const raw = getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    return raw.map(e => ({
      ...e,
      subject: 'Tin học' as const,
      questions: e.questions?.map(q => ({ ...q, subject: 'Tin học' as const })) || []
    }));
  },

  saveExam(exam: Exam): Exam {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === exam.id);
    let updated: Exam[];
    const sanitizedExam = {
      ...exam,
      subject: 'Tin học' as const,
      questions: exam.questions?.map(q => ({ ...q, subject: 'Tin học' as const })) || []
    };
    if (index >= 0) {
      updated = [...exams];
      updated[index] = sanitizedExam;
    } else {
      updated = [sanitizedExam, ...exams];
    }
    setItem(STORAGE_KEYS.EXAMS, updated);
    return sanitizedExam;
  },

  deleteExam(id: string): void {
    const exams = this.getExams().filter(e => e.id !== id);
    setItem(STORAGE_KEYS.EXAMS, exams);
  },

  // Exam Attempts
  getAttempts(): ExamAttempt[] {
    const raw = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
    return raw.map(a => ({ ...a, subject: 'Tin học' as const }));
  },

  saveAttempt(attempt: ExamAttempt): ExamAttempt {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(a => a.id === attempt.id);
    let updated: ExamAttempt[];
    const sanitized = { ...attempt, subject: 'Tin học' as const };
    if (index >= 0) {
      updated = [...attempts];
      updated[index] = sanitized;
    } else {
      updated = [sanitized, ...attempts];
    }
    setItem(STORAGE_KEYS.ATTEMPTS, updated);
    return sanitized;
  },

  getStudentAttempts(studentId: string): ExamAttempt[] {
    return this.getAttempts().filter(a => a.studentId === studentId);
  },

  deleteAttempt(id: string): void {
    const attempts = this.getAttempts().filter(a => a.id !== id);
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
  },

  deleteAttemptsBatch(ids: string[]): void {
    const attempts = this.getAttempts().filter(a => !ids.includes(a.id));
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
  },

  // News
  getNews(): NewsArticle[] {
    const raw = getItem<NewsArticle[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    // Sanitize any legacy categories
    return raw.map(item => {
      if (item.category !== 'Thông báo chung' && item.category !== 'Góc học tập') {
        return { ...item, category: 'Thông báo chung' as const };
      }
      return item;
    });
  },

  saveNews(article: NewsArticle): NewsArticle {
    const newsList = this.getNews();
    const index = newsList.findIndex(n => n.id === article.id);
    let updated: NewsArticle[];
    if (index >= 0) {
      updated = [...newsList];
      updated[index] = article;
    } else {
      updated = [article, ...newsList];
    }
    setItem(STORAGE_KEYS.NEWS, updated);
    return article;
  },

  deleteNews(id: string): void {
    const newsList = this.getNews().filter(n => n.id !== id);
    setItem(STORAGE_KEYS.NEWS, newsList);
  },

  likeNews(id: string): NewsArticle | null {
    const newsList = this.getNews();
    const article = newsList.find(n => n.id === id);
    if (!article) return null;
    article.likes += 1;
    this.saveNews(article);
    return article;
  },

  addComment(articleId: string, authorName: string, role: any, avatar: string, content: string): NewsArticle | null {
    const newsList = this.getNews();
    const article = newsList.find(n => n.id === articleId);
    if (!article) return null;
    const newComment = {
      id: 'c-' + Date.now(),
      authorName,
      authorRole: role,
      authorAvatar: avatar,
      content,
      createdAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    };
    article.comments = [newComment, ...article.comments];
    this.saveNews(article);
    return article;
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // Materials (Bài giảng & Giáo án)
  getMaterials(): LessonMaterial[] {
    return getItem<LessonMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  },

  saveMaterial(mat: LessonMaterial): LessonMaterial {
    const list = this.getMaterials();
    const index = list.findIndex(m => m.id === mat.id);
    let updated: LessonMaterial[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = mat;
    } else {
      updated = [mat, ...list];
    }
    setItem(STORAGE_KEYS.MATERIALS, updated);
    return mat;
  },

  deleteMaterial(id: string): void {
    const list = this.getMaterials().filter(m => m.id !== id);
    setItem(STORAGE_KEYS.MATERIALS, list);
  },

  incrementMaterialDownload(id: string): void {
    const list = this.getMaterials().map(m => m.id === id ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m);
    setItem(STORAGE_KEYS.MATERIALS, list);
  },

  incrementMaterialView(id: string): void {
    const list = this.getMaterials().map(m => m.id === id ? { ...m, viewCount: (m.viewCount || 0) + 1 } : m);
    setItem(STORAGE_KEYS.MATERIALS, list);
  },

  // Reset to default seed data
  resetAllData(): void {
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.CURRENT_USER, GUEST_USER);
    setItem(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    setItem(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    setItem(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
    setItem(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  },

  // Export full JSON database
  exportBackup(): string {
    return JSON.stringify(this.getDatabasePayload(), null, 2);
  },

  getDatabasePayload() {
    return {
      users: this.getUsers(),
      questions: this.getQuestions(),
      exams: this.getExams(),
      attempts: this.getAttempts(),
      news: this.getNews(),
      materials: this.getMaterials(),
      exportedAt: new Date().toISOString(),
      lastModified: Number(localStorage.getItem(STORAGE_KEYS.LAST_MODIFIED) || Date.now())
    };
  },

  // Smart non-destructive merge from remote cloud database
  smartMergeBackup(remoteData: any): { updated: boolean; newAttemptsCount: number } {
    try {
      if (!remoteData || typeof remoteData !== 'object') return { updated: false, newAttemptsCount: 0 };

      let hasChanges = false;
      let newAttemptsCount = 0;

      // 1. Merge Attempts (Non-destructive: union by ID)
      if (Array.isArray(remoteData.attempts) && remoteData.attempts.length > 0) {
        const localAttempts = this.getAttempts();
        const localMap = new Map<string, ExamAttempt>(localAttempts.map(a => [a.id, a]));
        
        remoteData.attempts.forEach((remAtt: ExamAttempt) => {
          if (!localMap.has(remAtt.id)) {
            localMap.set(remAtt.id, remAtt);
            hasChanges = true;
            newAttemptsCount++;
          }
        });

        if (hasChanges) {
          const mergedAttempts = Array.from(localMap.values())
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setItem(STORAGE_KEYS.ATTEMPTS, mergedAttempts, false);
        }
      }

      // 2. Merge Exams
      if (Array.isArray(remoteData.exams) && remoteData.exams.length > 0) {
        const localExams = this.getExams();
        const localMap = new Map<string, Exam>(localExams.map(e => [e.id, e]));
        let examsChanged = false;

        remoteData.exams.forEach((remEx: Exam) => {
          if (!localMap.has(remEx.id)) {
            localMap.set(remEx.id, remEx);
            examsChanged = true;
          }
        });

        if (examsChanged) {
          setItem(STORAGE_KEYS.EXAMS, Array.from(localMap.values()), false);
          hasChanges = true;
        }
      }

      // 3. Merge Questions
      if (Array.isArray(remoteData.questions) && remoteData.questions.length > 0) {
        const localQuestions = this.getQuestions();
        const localMap = new Map<string, Question>(localQuestions.map(q => [q.id, q]));
        let qChanged = false;

        remoteData.questions.forEach((remQ: Question) => {
          if (!localMap.has(remQ.id)) {
            localMap.set(remQ.id, remQ);
            qChanged = true;
          }
        });

        if (qChanged) {
          setItem(STORAGE_KEYS.QUESTIONS, Array.from(localMap.values()), false);
          hasChanges = true;
        }
      }

      // 4. Merge News
      if (Array.isArray(remoteData.news) && remoteData.news.length > 0) {
        const localNews = this.getNews();
        const localMap = new Map<string, NewsArticle>(localNews.map(n => [n.id, n]));
        let newsChanged = false;

        remoteData.news.forEach((remN: NewsArticle) => {
          if (!localMap.has(remN.id)) {
            localMap.set(remN.id, remN);
            newsChanged = true;
          }
        });

        if (newsChanged) {
          const mergedNews = Array.from(localMap.values())
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setItem(STORAGE_KEYS.NEWS, mergedNews, false);
          hasChanges = true;
        }
      }

      // 5. Merge Users
      if (Array.isArray(remoteData.users) && remoteData.users.length > 0) {
        const localUsers = this.getUsers();
        const localMap = new Map<string, User>(localUsers.map(u => [u.id, u]));
        let usersChanged = false;

        remoteData.users.forEach((remU: User) => {
          if (!localMap.has(remU.id)) {
            localMap.set(remU.id, remU);
            usersChanged = true;
          } else {
            // If remote user has custom PIN, update if local doesn't
            const localU = localMap.get(remU.id)!;
            if (remU.pin && remU.pin !== localU.pin) {
              localMap.set(remU.id, { ...localU, pin: remU.pin });
              usersChanged = true;
            }
          }
        });

        if (usersChanged) {
          setItem(STORAGE_KEYS.USERS, Array.from(localMap.values()), false);
          hasChanges = true;
        }
      }

      // 6. Merge Materials
      if (Array.isArray(remoteData.materials) && remoteData.materials.length > 0) {
        const localMat = this.getMaterials();
        const localMap = new Map<string, LessonMaterial>(localMat.map(m => [m.id, m]));
        let matChanged = false;

        remoteData.materials.forEach((remM: LessonMaterial) => {
          if (!localMap.has(remM.id)) {
            localMap.set(remM.id, remM);
            matChanged = true;
          }
        });

        if (matChanged) {
          setItem(STORAGE_KEYS.MATERIALS, Array.from(localMap.values()), false);
          hasChanges = true;
        }
      }

      return { updated: hasChanges, newAttemptsCount };
    } catch (e) {
      console.error('smartMergeBackup failed', e);
      return { updated: false, newAttemptsCount: 0 };
    }
  },

  // Import JSON database
  importBackup(jsonString: string, merge = false): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (merge) {
        return this.smartMergeBackup(data).updated;
      }
      if (data.questions) setItem(STORAGE_KEYS.QUESTIONS, data.questions);
      if (data.exams) setItem(STORAGE_KEYS.EXAMS, data.exams);
      if (data.attempts) setItem(STORAGE_KEYS.ATTEMPTS, data.attempts);
      if (data.news) setItem(STORAGE_KEYS.NEWS, data.news);
      if (data.users) setItem(STORAGE_KEYS.USERS, data.users);
      if (data.materials) setItem(STORAGE_KEYS.MATERIALS, data.materials);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // --- Moderation Handlers (Kiểm duyệt nội dung: Thầy Toàn & Admin) ---
  approveNews(articleId: string, approverName: string): NewsArticle | null {
    const list = this.getNews();
    const idx = list.findIndex(n => n.id === articleId);
    if (idx === -1) return null;
    const updated: NewsArticle = {
      ...list[idx],
      approvalStatus: 'approved',
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.NEWS, list);
    return updated;
  },

  rejectNews(articleId: string, reason: string, rejecterName: string): NewsArticle | null {
    const list = this.getNews();
    const idx = list.findIndex(n => n.id === articleId);
    if (idx === -1) return null;
    const updated: NewsArticle = {
      ...list[idx],
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: rejecterName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.NEWS, list);
    return updated;
  },

  approveExam(examId: string, approverName: string): Exam | null {
    const list = this.getExams();
    const idx = list.findIndex(e => e.id === examId);
    if (idx === -1) return null;
    const updated: Exam = {
      ...list[idx],
      approvalStatus: 'approved',
      isPublished: true,
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.EXAMS, list);
    return updated;
  },

  rejectExam(examId: string, reason: string, rejecterName: string): Exam | null {
    const list = this.getExams();
    const idx = list.findIndex(e => e.id === examId);
    if (idx === -1) return null;
    const updated: Exam = {
      ...list[idx],
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: rejecterName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.EXAMS, list);
    return updated;
  },

  approveMaterial(materialId: string, approverName: string): LessonMaterial | null {
    const list = this.getMaterials();
    const idx = list.findIndex(m => m.id === materialId);
    if (idx === -1) return null;
    const updated: LessonMaterial = {
      ...list[idx],
      approvalStatus: 'approved',
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.MATERIALS, list);
    return updated;
  },

  rejectMaterial(materialId: string, reason: string, rejecterName: string): LessonMaterial | null {
    const list = this.getMaterials();
    const idx = list.findIndex(m => m.id === materialId);
    if (idx === -1) return null;
    const updated: LessonMaterial = {
      ...list[idx],
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: rejecterName,
      approvedAt: new Date().toISOString()
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.MATERIALS, list);
    return updated;
  }
};
