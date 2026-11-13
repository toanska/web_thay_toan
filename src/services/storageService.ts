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
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { optimizeMaterialPayload, optimizeQuestionPayload, optimizeUserPayload } from '../utils/dataCompressor';
import { 
  INITIAL_USERS, 
  INITIAL_QUESTIONS, 
  INITIAL_EXAMS, 
  INITIAL_NEWS, 
  INITIAL_MATERIALS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { getCachedLessons, getPublicLessons, importLessonsBackup, Lesson, LESSONS_CACHE_KEY } from './lessonService';

// Constants
export const DEFAULT_SITE_LOGO = '/assets/aistudio/LOGO_WEB_05e2bec9.jpg';
export const PROTECTED_ADMIN_ID = 'admin-protected';
const SYNC_TS_KEY = 'thcs_last_cloud_sync_ts_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút: tránh đọc lại toàn bộ Firestore mỗi lần F5

const CACHE_KEYS = {
  users: 'thcs_cache_users_v2',
  questions: 'thcs_cache_questions_v2',
  exams: 'thcs_cache_exams_v2',
  attempts: 'thcs_cache_attempts_v2',
  news: 'thcs_cache_news_v2',
  materials: 'thcs_cache_materials_v2',
  notifications: 'thcs_cache_notifications_v2',
};
const PENDING_ATTEMPT_IDS_KEY = 'thcs_pending_attempt_ids_v1';

let firestoreQuotaExceeded = false;

function readPendingAttemptIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_ATTEMPT_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePendingAttemptIds(ids: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENDING_ATTEMPT_IDS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore
  }
}

function markAttemptPending(id: string): void {
  if (!id) return;
  const ids = readPendingAttemptIds();
  if (!ids.includes(id)) {
    writePendingAttemptIds([...ids, id]);
  }
}

function unmarkAttemptPending(id: string): void {
  if (!id) return;
  const ids = readPendingAttemptIds();
  if (ids.includes(id)) {
    writePendingAttemptIds(ids.filter((x) => x !== id));
  }
}

function mergeById<T extends { id?: string }>(primary: T[], secondary: T[]): T[] {
  const map = new Map<string, T>();
  secondary.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  primary.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

function readCache<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && (!Array.isArray(parsed) || parsed.length === 0)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Khi có >600 học sinh và hàng nghìn bài nộp vượt 5MB localStorage, giữ nguyên các bài chưa đồng bộ + thu gọn bản lưu tạm
    if (key === CACHE_KEYS.attempts && Array.isArray(data)) {
      try {
        const pendingSet = new Set(readPendingAttemptIds());
        const pendingItems = data.filter((a: any) => a?.id && pendingSet.has(a.id));
        const otherCompact = data
          .filter((a: any) => a?.id && !pendingSet.has(a.id))
          .slice(0, 200)
          .map((a: any) => {
            if (!Array.isArray(a.questionResults)) return a;
            return {
              ...a,
              questionResults: a.questionResults.map((qr: any) => ({
                ...qr,
                options: undefined,
                explanation: undefined,
              })),
            };
          });
        localStorage.setItem(key, JSON.stringify([...pendingItems, ...otherCompact]));
        return;
      } catch {
        // Fallback tối thiểu: chỉ giữ bài nộp chưa đẩy lên cloud
        try {
          const pendingSet = new Set(readPendingAttemptIds());
          const pendingItems = data.filter((a: any) => a?.id && pendingSet.has(a.id));
          localStorage.setItem(key, JSON.stringify(pendingItems));
          return;
        } catch {
          // ignore
        }
      }
    }
    console.warn(`Không thể ghi cache cục bộ (${key}):`, e);
  }
}

// Error handling helper (logs cleanly without crashing app state)
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function logFirestoreWarning(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.toLowerCase().includes('resource-exhausted') || errMsg.toLowerCase().includes('quota')) {
    firestoreQuotaExceeded = true;
  }
  console.warn(`[Firestore Fallback] ${operationType} (${path}): ${errMsg}`);
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

// Helper sanitizers to ensure 'Ban Giám Hiệu' is replaced with 'Thầy Toàn' everywhere
function sanitizeUser(u: User): User {
  if (!u) return u;
  if (u.name === 'Ban Giám Hiệu' || u.name === 'Ban Giám hiệu' || u.name === 'Quản Trị Viên Hệ Thống') {
    return { ...u, name: 'Thầy Toàn' };
  }
  return u;
}

function mergeBuiltInUsers(users: User[]): User[] {
  const sanitized = users.map(sanitizeUser);
  const byId = new Map<string, User>();
  sanitized.forEach(u => {
    if (u && u.id) byId.set(u.id, u);
  });
  // Ensure core built-in accounts (Admin & Teacher Toan) are always available for login
  INITIAL_USERS.forEach(seedUser => {
    if (!byId.has(seedUser.id)) {
      const existsByCode = sanitized.some(u => u.code?.toUpperCase() === seedUser.code?.toUpperCase());
      if (!existsByCode) {
        byId.set(seedUser.id, sanitizeUser(seedUser));
      }
    }
  });
  return Array.from(byId.values());
}

function sanitizeNews(n: NewsArticle): NewsArticle {
  if (!n) return n;
  let changed = false;
  const updated = { ...n };
  if (updated.authorName === 'Ban Giám Hiệu' || updated.authorName === 'Ban Giám hiệu') {
    updated.authorName = 'Thầy Toàn';
    changed = true;
  }
  if (updated.authorTitle === 'Ban Giám Hiệu' || updated.authorTitle === 'Ban Giám hiệu' || updated.authorTitle === 'Hiệu trưởng') {
    updated.authorTitle = 'Quản trị viên';
    changed = true;
  }
  if (updated.summary && (updated.summary.includes('Ban Giám Hiệu') || updated.summary.includes('Ban Giám hiệu'))) {
    updated.summary = updated.summary.replace(/Ban Giám [Hh]iệu/g, 'Thầy Toàn');
    changed = true;
  }
  return changed ? updated : n;
}

function sanitizeNotification(item: NotificationItem): NotificationItem {
  if (!item) return item;
  if (item.message && (item.message.includes('Ban Giám Hiệu') || item.message.includes('Ban Giám hiệu'))) {
    return { ...item, message: item.message.replace(/Ban Giám [Hh]iệu/g, 'Thầy Toàn') };
  }
  return item;
}

// Memory cache for quick synchronous access if needed
let currentUserCache: User | null = null;

export const StorageService = {
  auth,

  // Synchronous cached getters for instant UI hydration (0ms startup, offline/quota resilient)
  getCachedUsers(): User[] {
    return mergeBuiltInUsers(readCache<User[]>(CACHE_KEYS.users, INITIAL_USERS));
  },
  getCachedQuestions(): Question[] {
    return readCache<Question[]>(CACHE_KEYS.questions, INITIAL_QUESTIONS);
  },
  getCachedExams(): Exam[] {
    return readCache<Exam[]>(CACHE_KEYS.exams, INITIAL_EXAMS);
  },
  getCachedAttempts(): ExamAttempt[] {
    return readCache<ExamAttempt[]>(CACHE_KEYS.attempts, []);
  },
  getCachedNews(): NewsArticle[] {
    return readCache<NewsArticle[]>(CACHE_KEYS.news, INITIAL_NEWS).map(sanitizeNews);
  },
  getCachedMaterials(): LessonMaterial[] {
    return readCache<LessonMaterial[]>(CACHE_KEYS.materials, INITIAL_MATERIALS);
  },
  getCachedNotifications(): NotificationItem[] {
    return readCache<NotificationItem[]>(CACHE_KEYS.notifications, INITIAL_NOTIFICATIONS).map(sanitizeNotification);
  },
  isQuotaExceeded(): boolean {
    return firestoreQuotaExceeded;
  },
  isSyncFresh(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(SYNC_TS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < CACHE_TTL_MS;
  },
  markSyncFresh(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SYNC_TS_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }
  },



  // --- Users ---
  // --- Users ---
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const fetched = snapshot.docs.map(docSnap => sanitizeUser(docSnap.data() as User));
      const merged = mergeBuiltInUsers(fetched.length > 0 ? fetched : readCache<User[]>(CACHE_KEYS.users, INITIAL_USERS));
      writeCache(CACHE_KEYS.users, merged);
      return merged;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'users');
      return this.getCachedUsers();
    }
  },

  getCurrentUser(): User {
    if (currentUserCache) return sanitizeUser(currentUserCache);
    const stored = localStorage.getItem('thcs_current_user_v1');
    if (stored) {
      try {
        currentUserCache = sanitizeUser(JSON.parse(stored));
        if (currentUserCache.name === 'Ban Giám Hiệu' || currentUserCache.name === 'Ban Giám hiệu' || currentUserCache.name === 'Quản Trị Viên Hệ Thống') {
          currentUserCache.name = 'Thầy Toàn';
          localStorage.setItem('thcs_current_user_v1', JSON.stringify(currentUserCache));
        }
        return currentUserCache;
      } catch {
        // Fallback below
      }
    }
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
    const cleanUser = sanitizeUser(user);
    currentUserCache = cleanUser;
    localStorage.setItem('thcs_current_user_v1', JSON.stringify(cleanUser));
  },

  async loginUser(user: User): Promise<User> {
    const updatedUser: User = sanitizeUser({
      ...user,
      lastLoginAt: new Date().toISOString(),
      lastLoginDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Thiết bị Web'
    });
    this.setCurrentUser(updatedUser);
    try {
      await this.saveUser(updatedUser);
    } catch (e) {
      console.warn('Could not save login timestamp to Firestore, continuing with local login.', e);
    }
    return updatedUser;
  },

  async initialize(initialData: { 
    users: User[], 
    questions: Question[], 
    exams: Exam[], 
    news: NewsArticle[], 
    materials: LessonMaterial[] 
  }): Promise<void> {
    // Seed local cache immediately if empty so app is 100% usable even offline or when Firestore quota is hit
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(CACHE_KEYS.users)) writeCache(CACHE_KEYS.users, mergeBuiltInUsers(initialData.users));
      if (!localStorage.getItem(CACHE_KEYS.questions)) writeCache(CACHE_KEYS.questions, initialData.questions);
      if (!localStorage.getItem(CACHE_KEYS.exams)) writeCache(CACHE_KEYS.exams, initialData.exams);
      if (!localStorage.getItem(CACHE_KEYS.news)) writeCache(CACHE_KEYS.news, initialData.news.map(sanitizeNews));
      if (!localStorage.getItem(CACHE_KEYS.materials)) writeCache(CACHE_KEYS.materials, initialData.materials);
    }

    // Only attempt Firestore seed check once per session to conserve daily Firestore read quota
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('thcs_firestore_init_checked') === '1') {
      return;
    }

    // Attempt anonymous sign-in if enabled, but don't block DB check
    try {
      const { signInAnonymously } = await import('firebase/auth');
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
    } catch {
      // ignore
    }

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('thcs_firestore_init_checked', '1');
      }
      if (usersSnapshot.empty) {
        console.log('Chưa có dữ liệu trên Firestore, đang tiến hành khởi tạo ban đầu...');
        await Promise.all([
          ...initialData.users.map(u => setDoc(doc(db, 'users', u.id), cleanForFirestore(sanitizeUser(u)))),
          ...initialData.questions.map(q => setDoc(doc(db, 'questions', q.id), cleanForFirestore(q))),
          ...initialData.exams.map(e => setDoc(doc(db, 'exams', e.id), cleanForFirestore(e))),
          ...initialData.news.map(n => setDoc(doc(db, 'news', n.id), cleanForFirestore(sanitizeNews(n)))),
          ...initialData.materials.map(m => setDoc(doc(db, 'materials', m.id), cleanForFirestore(m)))
        ]);
        console.log('Khởi tạo dữ liệu ban đầu lên Firestore thành công!');
      }
    } catch (err) {
      logFirestoreWarning(err, OperationType.LIST, 'initialize');
    }
  },

  logoutUser(): void {
    currentUserCache = null;
    localStorage.removeItem('thcs_current_user_v1');
  },

  async saveUser(user: User): Promise<User> {
    const optimized = await optimizeUserPayload(sanitizeUser(user));
    const currentList = this.getCachedUsers();
    const idx = currentList.findIndex(u => u.id === optimized.id);
    const nextList = idx >= 0 ? currentList.map(u => (u.id === optimized.id ? optimized : u)) : [optimized, ...currentList];
    writeCache(CACHE_KEYS.users, nextList);

    try {
      const sanitized = cleanForFirestore(optimized);
      await setDoc(doc(db, 'users', user.id), sanitized);
    } catch (error) {
      logFirestoreWarning(error, OperationType.WRITE, `users/${user.id}`);
    }
    return optimized;
  },

  async saveUsersBulk(users: User[]): Promise<User[]> {
    if (!Array.isArray(users) || users.length === 0) return [];
    const optimizedList = await Promise.all(users.map((u) => optimizeUserPayload(sanitizeUser(u))));
    const mergedList = mergeBuiltInUsers(mergeById(optimizedList, this.getCachedUsers()));
    writeCache(CACHE_KEYS.users, mergedList);

    await Promise.allSettled(
      optimizedList.map((u) => setDoc(doc(db, 'users', u.id), cleanForFirestore(u)))
    );
    return optimizedList;
  },

  async deleteUser(id: string): Promise<void> {
    if (id === PROTECTED_ADMIN_ID) {
      console.warn('Cannot delete protected admin user');
      return;
    }
    const nextList = this.getCachedUsers().filter(u => u.id !== id);
    writeCache(CACHE_KEYS.users, nextList);
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `users/${id}`);
    }
  },

  async deleteUsersBulk(ids: string[]): Promise<void> {
    const deletableIds = ids.filter((id) => id && id !== PROTECTED_ADMIN_ID);
    if (deletableIds.length === 0) return;
    const idSet = new Set(deletableIds);
    writeCache(CACHE_KEYS.users, this.getCachedUsers().filter((u) => !idSet.has(u.id)));
    await Promise.allSettled(deletableIds.map((id) => deleteDoc(doc(db, 'users', id))));
  },

  // --- Questions ---
  async getQuestions(): Promise<Question[]> {
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      const fetched = snapshot.docs.map(docSnap => docSnap.data() as Question);
      const data = fetched.length > 0 ? fetched : this.getCachedQuestions();
      writeCache(CACHE_KEYS.questions, data);
      return data;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'questions');
      return this.getCachedQuestions();
    }
  },

  async saveQuestion(question: Question): Promise<Question> {
    const optimized = optimizeQuestionPayload(question);
    const currentList = this.getCachedQuestions();
    const idx = currentList.findIndex(q => q.id === optimized.id);
    const nextList = idx >= 0 ? currentList.map(q => (q.id === optimized.id ? optimized : q)) : [optimized, ...currentList];
    writeCache(CACHE_KEYS.questions, nextList);

    try {
      const sanitized = cleanForFirestore(optimized);
      await setDoc(doc(db, 'questions', question.id), sanitized);
    } catch (error) {
      logFirestoreWarning(error, OperationType.WRITE, `questions/${question.id}`);
    }
    return optimized;
  },

  async saveQuestionsBulk(questions: Question[]): Promise<Question[]> {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    const optimizedList = questions.map((q) => optimizeQuestionPayload(q));
    const mergedList = mergeById(optimizedList, this.getCachedQuestions());
    writeCache(CACHE_KEYS.questions, mergedList);

    await Promise.allSettled(
      optimizedList.map((q) => setDoc(doc(db, 'questions', q.id), cleanForFirestore(q)))
    );
    return optimizedList;
  },

  async deleteQuestion(id: string): Promise<void> {
    writeCache(CACHE_KEYS.questions, this.getCachedQuestions().filter(q => q.id !== id));
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `questions/${id}`);
    }
  },

  // --- Exams ---
  async getExams(): Promise<Exam[]> {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const fetched = snapshot.docs.map(docSnap => docSnap.data() as Exam);
      const data = fetched.length > 0 ? fetched : this.getCachedExams();
      writeCache(CACHE_KEYS.exams, data);
      return data;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'exams');
      return this.getCachedExams();
    }
  },

  async saveExam(exam: Exam): Promise<Exam> {
    const currentList = this.getCachedExams();
    const idx = currentList.findIndex(e => e.id === exam.id);
    const nextList = idx >= 0 ? currentList.map(e => (e.id === exam.id ? exam : e)) : [exam, ...currentList];
    writeCache(CACHE_KEYS.exams, nextList);

    try {
      const sanitized = cleanForFirestore(exam);
      await setDoc(doc(db, 'exams', exam.id), sanitized);
    } catch (error) {
      logFirestoreWarning(error, OperationType.WRITE, `exams/${exam.id}`);
    }
    return exam;
  },

  async deleteExam(id: string): Promise<void> {
    writeCache(CACHE_KEYS.exams, this.getCachedExams().filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `exams/${id}`);
    }
  },

  // --- Attempts ---
  async getAttempts(): Promise<ExamAttempt[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'attempts'), orderBy('submittedAt', 'desc')));
      const fetched = snapshot.docs.map(docSnap => docSnap.data() as ExamAttempt);
      writeCache(CACHE_KEYS.attempts, fetched);
      return fetched;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'attempts');
      return this.getCachedAttempts();
    }
  },

  async saveAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    const currentList = this.getCachedAttempts();
    const idx = currentList.findIndex(a => a.id === attempt.id);
    const nextList = idx >= 0 ? currentList.map(a => (a.id === attempt.id ? attempt : a)) : [attempt, ...currentList];
    writeCache(CACHE_KEYS.attempts, nextList);
    markAttemptPending(attempt.id);

    try {
      const sanitized = cleanForFirestore(attempt);
      await setDoc(doc(db, 'attempts', attempt.id), sanitized);
      unmarkAttemptPending(attempt.id);
    } catch (error) {
      logFirestoreWarning(error, OperationType.WRITE, `attempts/${attempt.id}`);
    }
    return attempt;
  },

  isAttemptPending(id: string): boolean {
    return readPendingAttemptIds().includes(id);
  },

  getPendingAttemptCount(): number {
    return readPendingAttemptIds().length;
  },

  async flushPendingAttempts(): Promise<{ flushedCount: number; remainingCount: number }> {
    const pendingIds = readPendingAttemptIds();
    if (pendingIds.length === 0) return { flushedCount: 0, remainingCount: 0 };

    const pendingSet = new Set(pendingIds);
    const cached = this.getCachedAttempts();
    const toUpload = cached.filter((a) => a?.id && pendingSet.has(a.id));
    if (toUpload.length === 0) {
      writePendingAttemptIds([]);
      return { flushedCount: 0, remainingCount: 0 };
    }

    let flushed = 0;
    const stillPending: string[] = [];
    for (const item of toUpload) {
      try {
        await setDoc(doc(db, 'attempts', item.id), cleanForFirestore(item));
        flushed++;
      } catch {
        stillPending.push(item.id);
      }
    }
    writePendingAttemptIds(stillPending);
    return { flushedCount: flushed, remainingCount: stillPending.length };
  },

  async deleteAttempt(id: string): Promise<void> {
    unmarkAttemptPending(id);
    writeCache(CACHE_KEYS.attempts, this.getCachedAttempts().filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'attempts', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `attempts/${id}`);
    }
  },

  async deleteAttemptsBulk(ids: string[]): Promise<void> {
    const cleanIds = ids.filter(Boolean);
    if (cleanIds.length === 0) return;
    const idSet = new Set(cleanIds);
    writePendingAttemptIds(readPendingAttemptIds().filter((id) => !idSet.has(id)));
    writeCache(CACHE_KEYS.attempts, this.getCachedAttempts().filter((a) => !idSet.has(a.id)));
    await Promise.allSettled(cleanIds.map((id) => deleteDoc(doc(db, 'attempts', id))));
  },

  // --- News ---
  async getNews(): Promise<NewsArticle[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')));
      const fetched = snapshot.docs.map(docSnap => sanitizeNews(docSnap.data() as NewsArticle));
      const data = fetched.length > 0 ? fetched : this.getCachedNews();
      writeCache(CACHE_KEYS.news, data);
      return data;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'news');
      return this.getCachedNews();
    }
  },

  async saveNews(article: NewsArticle): Promise<NewsArticle> {
    const cleanArticle = sanitizeNews(article);
    const currentList = this.getCachedNews();
    const idx = currentList.findIndex(n => n.id === cleanArticle.id);
    const nextList = idx >= 0 ? currentList.map(n => (n.id === cleanArticle.id ? cleanArticle : n)) : [cleanArticle, ...currentList];
    writeCache(CACHE_KEYS.news, nextList);

    try {
      const sanitized = cleanForFirestore(cleanArticle);
      await setDoc(doc(db, 'news', article.id), sanitized);
    } catch (error) {
      logFirestoreWarning(error, OperationType.WRITE, `news/${article.id}`);
    }
    return cleanArticle;
  },

  async deleteNews(id: string): Promise<void> {
    writeCache(CACHE_KEYS.news, this.getCachedNews().filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `news/${id}`);
    }
  },

  // --- Materials ---
  async getMaterials(): Promise<LessonMaterial[]> {
    try {
      const snapshot = await getDocs(collection(db, 'materials'));
      const fetched = snapshot.docs.map(docSnap => docSnap.data() as LessonMaterial);
      const data = fetched.length > 0 ? fetched : this.getCachedMaterials();
      writeCache(CACHE_KEYS.materials, data);
      return data;
    } catch (error) {
      logFirestoreWarning(error, OperationType.LIST, 'materials');
      return this.getCachedMaterials();
    }
  },

  async saveMaterial(material: LessonMaterial): Promise<LessonMaterial> {
    const optimized = optimizeMaterialPayload(material);
    const currentList = this.getCachedMaterials();
    const idx = currentList.findIndex(m => m.id === optimized.id);
    const nextList = idx >= 0 ? currentList.map(m => (m.id === optimized.id ? optimized : m)) : [optimized, ...currentList];
    writeCache(CACHE_KEYS.materials, nextList);

    try {
      const sanitized = cleanForFirestore(optimized);
      if (sanitized.fileUrl && typeof sanitized.fileUrl === 'string' && sanitized.fileUrl.length > 350000) {
        delete sanitized.fileUrl;
      }
      await setDoc(doc(db, 'materials', material.id), sanitized);
      return optimized;
    } catch (error) {
      try {
        const safePayload = cleanForFirestore({
          ...material,
          fileUrl: undefined
        });
        await setDoc(doc(db, 'materials', material.id), safePayload);
        return material;
      } catch (retryErr) {
        logFirestoreWarning(retryErr, OperationType.WRITE, `materials/${material.id}`);
        return material;
      }
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    writeCache(CACHE_KEYS.materials, this.getCachedMaterials().filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (error) {
      logFirestoreWarning(error, OperationType.DELETE, `materials/${id}`);
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
      const fetched = snapshot.docs.map(docSnap => sanitizeNotification(docSnap.data() as NotificationItem));
      const data = fetched.length > 0 ? fetched : this.getCachedNotifications();
      writeCache(CACHE_KEYS.notifications, data);
      return data;
    } catch {
      return this.getCachedNotifications();
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
    onLessons?: (data: Lesson[]) => void;
  }) {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (!snap.empty) {
        const merged = mergeBuiltInUsers(snap.docs.map(d => sanitizeUser(d.data() as User)));
        writeCache(CACHE_KEYS.users, merged);
        callbacks.onUsers?.(merged);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'users/realtime'));

    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => d.data() as Exam);
        writeCache(CACHE_KEYS.exams, data);
        callbacks.onExams?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'exams/realtime'));

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('publishedAt', 'desc')), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => sanitizeNews(d.data() as NewsArticle));
        writeCache(CACHE_KEYS.news, data);
        callbacks.onNews?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'news/realtime'));

    const unsubMaterials = onSnapshot(collection(db, 'materials'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => d.data() as LessonMaterial);
        writeCache(CACHE_KEYS.materials, data);
        callbacks.onMaterials?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'materials/realtime'));

    const unsubAttempts = onSnapshot(query(collection(db, 'attempts'), orderBy('submittedAt', 'desc')), (snap) => {
      const data = snap.docs.map(d => d.data() as ExamAttempt);
      writeCache(CACHE_KEYS.attempts, data);
      callbacks.onAttempts?.(data);
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'attempts/realtime'));

    const unsubQuestions = onSnapshot(collection(db, 'questions'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => d.data() as Question);
        writeCache(CACHE_KEYS.questions, data);
        callbacks.onQuestions?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'questions/realtime'));

    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => sanitizeNotification(d.data() as NotificationItem));
        writeCache(CACHE_KEYS.notifications, data);
        callbacks.onNotifications?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'notifications/realtime'));

    const unsubLessons = onSnapshot(query(collection(db, 'lessons'), orderBy('createdAt', 'desc')), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => d.data() as Lesson);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(LESSONS_CACHE_KEY, JSON.stringify(data));
          } catch {}
        }
        callbacks.onLessons?.(data);
      }
    }, (err) => logFirestoreWarning(err, OperationType.LIST, 'lessons/realtime'));

    return () => {
      unsubUsers();
      unsubExams();
      unsubNews();
      unsubMaterials();
      unsubAttempts();
      unsubQuestions();
      unsubNotifs();
      unsubLessons();
    };
  },

  subscribeToAll(onUpdate: () => void) {
    const unsub = onSnapshot(collection(db, 'users'), onUpdate, (err) => logFirestoreWarning(err, OperationType.LIST, 'users/all'));
    return unsub;
  },

  resetAllData() {
    writeCache(CACHE_KEYS.users, mergeBuiltInUsers(INITIAL_USERS));
    writeCache(CACHE_KEYS.questions, INITIAL_QUESTIONS);
    writeCache(CACHE_KEYS.exams, INITIAL_EXAMS);
    writeCache(CACHE_KEYS.news, INITIAL_NEWS.map(sanitizeNews));
    writeCache(CACHE_KEYS.materials, INITIAL_MATERIALS);
    writeCache(CACHE_KEYS.notifications, INITIAL_NOTIFICATIONS.map(sanitizeNotification));
  },
  
  async exportBackup(): Promise<string> {
    try {
      const [users, questions, exams, news, materials, attempts, lessons] = await Promise.all([
        this.getUsers(),
        this.getQuestions(),
        this.getExams(),
        this.getNews(),
        this.getMaterials(),
        this.getAttempts(),
        getPublicLessons().catch(() => getCachedLessons())
      ]);
      return JSON.stringify({
        version: '2.1',
        exportedAt: new Date().toISOString(),
        users,
        questions,
        exams,
        news,
        materials,
        attempts,
        lessons
      }, null, 2);
    } catch (e) {
      console.error('Error exporting backup:', e);
      return JSON.stringify(this.getDatabasePayload(), null, 2);
    }
  },
  
  async importBackup(json?: string, pushToCloud = true): Promise<boolean> {
    if (!json || !json.trim()) return false;
    try {
      const parsed = JSON.parse(json);
      const promises: Promise<any>[] = [];
      const mergeIfPushing = pushToCloud;

      if (Array.isArray(parsed.users)) {
        const merged = mergeBuiltInUsers(
          mergeIfPushing ? mergeById(parsed.users, this.getCachedUsers()) : parsed.users
        );
        writeCache(CACHE_KEYS.users, merged);
        if (pushToCloud) {
          merged.forEach((u: User) => {
            if (u.id) promises.push(setDoc(doc(db, 'users', u.id), cleanForFirestore(u)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.questions)) {
        const nextQuestions = mergeIfPushing
          ? mergeById(parsed.questions, this.getCachedQuestions())
          : parsed.questions;
        writeCache(CACHE_KEYS.questions, nextQuestions);
        if (pushToCloud) {
          nextQuestions.forEach((q: Question) => {
            if (q.id) promises.push(setDoc(doc(db, 'questions', q.id), cleanForFirestore(q)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.exams)) {
        const nextExams = mergeIfPushing
          ? mergeById(parsed.exams, this.getCachedExams())
          : parsed.exams;
        writeCache(CACHE_KEYS.exams, nextExams);
        if (pushToCloud) {
          nextExams.forEach((e: Exam) => {
            if (e.id) promises.push(setDoc(doc(db, 'exams', e.id), cleanForFirestore(e)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.news)) {
        const cleanNews = (
          mergeIfPushing ? mergeById(parsed.news, this.getCachedNews()) : parsed.news
        ).map(sanitizeNews);
        writeCache(CACHE_KEYS.news, cleanNews);
        if (pushToCloud) {
          cleanNews.forEach((n: NewsArticle) => {
            if (n.id) promises.push(setDoc(doc(db, 'news', n.id), cleanForFirestore(n)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.materials)) {
        const nextMaterials = mergeIfPushing
          ? mergeById(parsed.materials, this.getCachedMaterials())
          : parsed.materials;
        writeCache(CACHE_KEYS.materials, nextMaterials);
        if (pushToCloud) {
          nextMaterials.forEach((m: LessonMaterial) => {
            if (m.id) promises.push(setDoc(doc(db, 'materials', m.id), cleanForFirestore(m)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.attempts)) {
        const nextAttempts = mergeIfPushing
          ? mergeById(parsed.attempts, this.getCachedAttempts())
          : parsed.attempts;
        writeCache(CACHE_KEYS.attempts, nextAttempts);
        if (pushToCloud) {
          nextAttempts.forEach((a: ExamAttempt) => {
            if (a.id) promises.push(setDoc(doc(db, 'attempts', a.id), cleanForFirestore(a)).catch(() => {}));
          });
        }
      }
      if (Array.isArray(parsed.notifications)) {
        const cleanNotifs = (
          mergeIfPushing
            ? mergeById(parsed.notifications, this.getCachedNotifications())
            : parsed.notifications
        ).map(sanitizeNotification);
        writeCache(CACHE_KEYS.notifications, cleanNotifs);
      }
      if (Array.isArray(parsed.lessons)) {
        const nextLessons = mergeIfPushing
          ? mergeById(parsed.lessons, getCachedLessons())
          : parsed.lessons;
        if (pushToCloud) {
          promises.push(importLessonsBackup(nextLessons as Lesson[]).catch(() => {}));
        }
      }

      await Promise.allSettled(promises);
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  },



  getDatabasePayload() {
    return {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      users: this.getCachedUsers(),
      questions: this.getCachedQuestions(),
      exams: this.getCachedExams(),
      news: this.getCachedNews(),
      materials: this.getCachedMaterials(),
      attempts: this.getCachedAttempts(),
      notifications: this.getCachedNotifications(),
      lessons: getCachedLessons(),
    };
  },

  smartMergeBackup(data: any) {
    if (!data || typeof data !== 'object') {
      return { updated: false, newAttemptsCount: 0 };
    }
    let updated = false;
    let newAttemptsCount = 0;

    if (Array.isArray(data.attempts)) {
      const existing = this.getCachedAttempts();
      const ids = new Set(existing.map(a => a.id));
      const added = data.attempts.filter((a: ExamAttempt) => a?.id && !ids.has(a.id));
      if (added.length > 0) {
        writeCache(CACHE_KEYS.attempts, [...added, ...existing]);
        updated = true;
        newAttemptsCount = added.length;
      }
    }
    return { updated, newAttemptsCount };
  }
};
