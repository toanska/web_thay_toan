import { Exam, ExamAttempt, NewsArticle, NotificationItem, Question, User, Subject, GradeLevel, DifficultyLevel, LessonMaterial } from '../types';
import { INITIAL_USERS, INITIAL_QUESTIONS, INITIAL_EXAMS, INITIAL_ATTEMPTS, INITIAL_NEWS, INITIAL_NOTIFICATIONS, INITIAL_MATERIALS } from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'thcs_users_v1',
  CURRENT_USER: 'thcs_current_user_v1',
  QUESTIONS: 'thcs_questions_v1',
  EXAMS: 'thcs_exams_v1',
  ATTEMPTS: 'thcs_attempts_v1',
  NEWS: 'thcs_news_v1',
  NOTIFICATIONS: 'thcs_notifications_v1',
  MATERIALS: 'thcs_materials_v1',
};

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

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger background auto sync if key is content data
    if (key !== STORAGE_KEYS.CURRENT_USER && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_storage_updated', { detail: { key } }));
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
      const match = users.find(u => u.id === stored.id);
      if (match) return match;
    }
    return users[0]; // default to first student
  },

  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
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
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    setItem(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    setItem(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    setItem(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
    setItem(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  },

  // Export full JSON database
  exportBackup(): string {
    const backup = {
      users: this.getUsers(),
      questions: this.getQuestions(),
      exams: this.getExams(),
      attempts: this.getAttempts(),
      news: this.getNews(),
      materials: this.getMaterials(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import JSON database
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
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
  }
};
