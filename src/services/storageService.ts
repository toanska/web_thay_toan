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
import { optimizeMaterialPayload, optimizeQuestionPayload, optimizeUserPayload } from '../utils/dataCompressor';

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

/**
 * Sanitizes an object before writing to Firestore.
 * Strips all `undefined` fields and converts non-serializable values,
 * preventing 'Unsupported field value: undefined' errors in Firestore SDK.
 */
export function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item));
  }
  if (typeof data === 'object') {
    if (data instanceof Date) return data.toISOString();
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        result[key] = cleanForFirestore(val);
      }
    }
    return result;
  }
  return data;
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
            ...initialData.users.map(u => setDoc(doc(db, 'users', u.id), cleanForFirestore(u))),
            ...initialData.questions.map(q => setDoc(doc(db, 'questions', q.id), cleanForFirestore(q))),
            ...initialData.exams.map(e => setDoc(doc(db, 'exams', e.id), cleanForFirestore(e))),
            ...initialData.news.map(n => setDoc(doc(db, 'news', n.id), cleanForFirestore(n))),
            ...initialData.materials.map(m => setDoc(doc(db, 'materials', m.id), cleanForFirestore(m)))
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
      const optimized = await optimizeUserPayload(user);
      const sanitized = cleanForFirestore(optimized);
      await setDoc(doc(db, 'users', user.id), sanitized);
      return optimized;
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
      const optimized = optimizeQuestionPayload(question);
      const sanitized = cleanForFirestore(optimized);
      await setDoc(doc(db, 'questions', question.id), sanitized);
      return optimized;
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
      const sanitized = cleanForFirestore(exam);
      await setDoc(doc(db, 'exams', exam.id), sanitized);
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
      const sanitized = cleanForFirestore(attempt);
      await setDoc(doc(db, 'attempts', attempt.id), sanitized);
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
      const sanitized = cleanForFirestore(article);
      await setDoc(doc(db, 'news', article.id), sanitized);
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
      const optimized = optimizeMaterialPayload(material);
      let sanitized = cleanForFirestore(optimized);
      // Safe check: Firestore has a 1MB per document limit.
      if (sanitized.fileUrl && typeof sanitized.fileUrl === 'string' && sanitized.fileUrl.length > 350000) {
        console.warn('Tệp có dung lượng base64 lớn (>350KB), nén/lược bỏ fileUrl khi đồng bộ Firestore để dữ liệu luôn nhẹ.');
        delete sanitized.fileUrl;
      }
      await setDoc(doc(db, 'materials', material.id), sanitized);
      return optimized;
    } catch (error) {
      console.warn('Thử lại lưu bài giảng không kèm fileUrl lớn...', error);
      try {
        const safePayload = cleanForFirestore({
          ...material,
          fileUrl: undefined
        });
        await setDoc(doc(db, 'materials', material.id), safePayload);
        return material;
      } catch (retryErr) {
        handleFirestoreError(retryErr, OperationType.WRITE, `materials/${material.id}`);
        return material;
      }
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
  
  async exportBackup(): Promise<string> {
    try {
      const [users, questions, exams, news, materials, attempts] = await Promise.all([
        this.getUsers(),
        this.getQuestions(),
        this.getExams(),
        this.getNews(),
        this.getMaterials(),
        this.getAttempts()
      ]);
      return JSON.stringify({
        version: '2.0',
        exportedAt: new Date().toISOString(),
        users,
        questions,
        exams,
        news,
        materials,
        attempts
      }, null, 2);
    } catch (e) {
      console.error('Error exporting backup:', e);
      return JSON.stringify({ error: 'Failed to export' });
    }
  },
  
  async importBackup(json?: string, verbose = true): Promise<boolean> {
    if (!json || !json.trim()) return false;
    try {
      const parsed = JSON.parse(json);
      const promises: Promise<any>[] = [];

      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: User) => {
          if (u.id) promises.push(setDoc(doc(db, 'users', u.id), cleanForFirestore(u)));
        });
      }
      if (Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q: Question) => {
          if (q.id) promises.push(setDoc(doc(db, 'questions', q.id), cleanForFirestore(q)));
        });
      }
      if (Array.isArray(parsed.exams)) {
        parsed.exams.forEach((e: Exam) => {
          if (e.id) promises.push(setDoc(doc(db, 'exams', e.id), cleanForFirestore(e)));
        });
      }
      if (Array.isArray(parsed.news)) {
        parsed.news.forEach((n: NewsArticle) => {
          if (n.id) promises.push(setDoc(doc(db, 'news', n.id), cleanForFirestore(n)));
        });
      }
      if (Array.isArray(parsed.materials)) {
        parsed.materials.forEach((m: LessonMaterial) => {
          if (m.id) promises.push(setDoc(doc(db, 'materials', m.id), cleanForFirestore(m)));
        });
      }
      if (Array.isArray(parsed.attempts)) {
        parsed.attempts.forEach((a: ExamAttempt) => {
          if (a.id) promises.push(setDoc(doc(db, 'attempts', a.id), cleanForFirestore(a)));
        });
      }

      await Promise.all(promises);
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  },

  // Legacy stubs for CloudflareService compatibility
  getDatabasePayload() {
    return {};
  },

  smartMergeBackup(data: any) {
    return { updated: false, newAttemptsCount: 0 };
  }
};
