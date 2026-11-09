import { 
  Exam, 
  ExamAttempt, 
  NewsArticle, 
  NotificationItem, 
  Question, 
  User, 
  LessonMaterial 
} from '../types';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

// Constants
export const DEFAULT_SITE_LOGO = '/assets/aistudio/LOGO_WEB_05e2bec9.jpg';
export const PROTECTED_ADMIN_ID = 'admin-protected';

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Memory cache for quick synchronous access if needed, 
// though async is preferred for Firebase
let currentUserCache: User | null = null;

export const StorageService = {
  auth,
  // --- Users ---
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  getCurrentUser(): User {
    // Fallback to local storage for the *current* session user if not in memory
    if (currentUserCache) return currentUserCache;
    const stored = localStorage.getItem('thcs_current_user_v1');
    if (stored) {
      currentUserCache = JSON.parse(stored);
      return currentUserCache!;
    }
    // Default guest
    return {
      id: 'user-guest',
      name: 'Khách truy cập',
      role: 'guest',
      code: 'GUEST',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      email: '',
      school: 'THCS Ngô Quyền'
    };
  },

  setCurrentUser(user: User): void {
    currentUserCache = user;
    localStorage.setItem('thcs_current_user_v1', JSON.stringify(user));
  },

  async loginUser(user: User): Promise<User> {
    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      lastLoginDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Thiết bị Web'
    };
    try {
      await this.saveUser(updatedUser);
    } catch (e) {
      console.warn('Could not save login timestamp to Firestore, continuing with local login.', e);
    }
    this.setCurrentUser(updatedUser);
    return updatedUser;
  },

  async initialize(initialData: { 
    users: User[], 
    questions: Question[], 
    exams: Exam[], 
    news: NewsArticle[], 
    materials: LessonMaterial[] 
  }): Promise<void> {
    const seedIfNeeded = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (usersSnapshot.empty) {
          console.log('Chưa có dữ liệu trên Firestore, đang tiến hành khởi tạo ban đầu...');
          await Promise.all([
            ...initialData.users.map(u => setDoc(doc(db, 'users', u.id), u)),
            ...initialData.questions.map(q => setDoc(doc(db, 'questions', q.id), q)),
            ...initialData.exams.map(e => setDoc(doc(db, 'exams', e.id), e)),
            ...initialData.news.map(n => setDoc(doc(db, 'news', n.id), n)),
            ...initialData.materials.map(m => setDoc(doc(db, 'materials', m.id), m))
          ]);
          console.log('Khởi tạo dữ liệu ban đầu lên Firestore thành công!');
        }
      } catch (err) {
        console.warn('Không thể kiểm tra/khởi tạo dữ liệu tự động:', err);
      }
    };

    // Attempt anonymous sign-in if enabled, but don't block DB check
    try {
      const { signInAnonymously } = await import('firebase/auth');
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(() => {
          // Anonymous auth not enabled or restricted; continue unauthenticated since rules allow read/write
        });
      }
    } catch (e) {
      // ignore
    }

    await seedIfNeeded();
  },

  logoutUser(): void {
    currentUserCache = null;
    localStorage.removeItem('thcs_current_user_v1');
  },

  async saveUser(user: User): Promise<User> {
    try {
      await setDoc(doc(db, 'users', user.id), user);
      return user;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
      return user;
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (id === PROTECTED_ADMIN_ID) {
      console.warn('Cannot delete protected admin user');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },

  // --- Questions ---
  async getQuestions(): Promise<Question[]> {
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      return snapshot.docs.map(doc => doc.data() as Question);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  },

  async saveQuestion(question: Question): Promise<Question> {
    try {
      await setDoc(doc(db, 'questions', question.id), question);
      return question;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `questions/${question.id}`);
      return question;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `questions/${id}`);
    }
  },

  // --- Exams ---
  async getExams(): Promise<Exam[]> {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      return snapshot.docs.map(doc => doc.data() as Exam);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'exams');
      return [];
    }
  },

  async saveExam(exam: Exam): Promise<Exam> {
    try {
      await setDoc(doc(db, 'exams', exam.id), exam);
      return exam;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exams/${exam.id}`);
      return exam;
    }
  },

  async deleteExam(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `exams/${id}`);
    }
  },

  // --- Attempts ---
  async getAttempts(): Promise<ExamAttempt[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'attempts'), orderBy('submittedAt', 'desc')));
      return snapshot.docs.map(doc => doc.data() as ExamAttempt);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'attempts');
      return [];
    }
  },

  async saveAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    try {
      await setDoc(doc(db, 'attempts', attempt.id), attempt);
      return attempt;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `attempts/${attempt.id}`);
      return attempt;
    }
  },

  async deleteAttempt(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'attempts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `attempts/${id}`);
    }
  },

  // --- News ---
  async getNews(): Promise<NewsArticle[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')));
      return snapshot.docs.map(doc => doc.data() as NewsArticle);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'news');
      return [];
    }
  },

  async saveNews(article: NewsArticle): Promise<NewsArticle> {
    try {
      await setDoc(doc(db, 'news', article.id), article);
      return article;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `news/${article.id}`);
      return article;
    }
  },

  async deleteNews(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `news/${id}`);
    }
  },

  // --- Materials ---
  async getMaterials(): Promise<LessonMaterial[]> {
    try {
      const snapshot = await getDocs(collection(db, 'materials'));
      return snapshot.docs.map(doc => doc.data() as LessonMaterial);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'materials');
      return [];
    }
  },

  async saveMaterial(material: LessonMaterial): Promise<LessonMaterial> {
    try {
      await setDoc(doc(db, 'materials', material.id), material);
      return material;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `materials/${material.id}`);
      return material;
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `materials/${id}`);
    }
  },

  // --- Site Logo ---
  getSiteLogo(): string {
    return localStorage.getItem('thcs_site_logo_v1') || DEFAULT_SITE_LOGO;
  },

  setSiteLogo(logoUrl: string | null): void {
    if (logoUrl) {
      localStorage.setItem('thcs_site_logo_v1', logoUrl);
    } else {
      localStorage.removeItem('thcs_site_logo_v1');
    }
  },

  // --- Notifications ---
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')));
      return snapshot.docs.map(doc => doc.data() as NotificationItem);
    } catch (error) {
      // Non-critical, just return empty
      return [];
    }
  },

  // --- Listeners for Real-time Sync ---
  subscribeToCollections(callbacks: {
    onUsers?: (data: User[]) => void;
    onExams?: (data: Exam[]) => void;
    onNews?: (data: NewsArticle[]) => void;
    onMaterials?: (data: LessonMaterial[]) => void;
    onAttempts?: (data: ExamAttempt[]) => void;
    onQuestions?: (data: Question[]) => void;
    onNotifications?: (data: NotificationItem[]) => void;
  }) {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      callbacks.onUsers?.(snap.docs.map(d => d.data() as User));
    }, (err) => console.error('Lỗi lắng nghe users realtime:', err));

    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      callbacks.onExams?.(snap.docs.map(d => d.data() as Exam));
    }, (err) => console.error('Lỗi lắng nghe exams realtime:', err));

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('publishedAt', 'desc')), (snap) => {
      callbacks.onNews?.(snap.docs.map(d => d.data() as NewsArticle));
    }, (err) => console.error('Lỗi lắng nghe news realtime:', err));

    const unsubMaterials = onSnapshot(collection(db, 'materials'), (snap) => {
      callbacks.onMaterials?.(snap.docs.map(d => d.data() as LessonMaterial));
    }, (err) => console.error('Lỗi lắng nghe materials realtime:', err));

    const unsubAttempts = onSnapshot(query(collection(db, 'attempts'), orderBy('submittedAt', 'desc')), (snap) => {
      callbacks.onAttempts?.(snap.docs.map(d => d.data() as ExamAttempt));
    }, (err) => console.error('Lỗi lắng nghe attempts realtime:', err));

    const unsubQuestions = onSnapshot(collection(db, 'questions'), (snap) => {
      callbacks.onQuestions?.(snap.docs.map(d => d.data() as Question));
    }, (err) => console.error('Lỗi lắng nghe questions realtime:', err));

    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), (snap) => {
      callbacks.onNotifications?.(snap.docs.map(d => d.data() as NotificationItem));
    }, (err) => console.error('Lỗi lắng nghe notifications realtime:', err));

    return () => {
      unsubUsers();
      unsubExams();
      unsubNews();
      unsubMaterials();
      unsubAttempts();
      unsubQuestions();
      unsubNotifs();
    };
  },

  // Legacy stub for App.tsx compatibility during transition
  subscribeToAll(onUpdate: () => void) {
    const unsub = onSnapshot(collection(db, 'users'), onUpdate);
    return unsub;
  },

  // Mock methods to satisfy previous interfaces if needed
  resetAllData() {
    console.warn('Reset all data not supported for Firebase directly through this method.');
  },
  
  exportBackup() {
    return JSON.stringify({ message: "Use Firebase Console for backups" });
  },
  
  importBackup(json?: string, verbose = true) {
    return false;
  },

  // Legacy stubs for CloudflareService compatibility
  getDatabasePayload() {
    return {};
  },

  smartMergeBackup(data: any) {
    return { updated: false, newAttemptsCount: 0 };
  }
};
