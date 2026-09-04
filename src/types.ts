export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export type GradeLevel = 6 | 7 | 8 | 9;

export type Subject = 'Tin học';

export type DifficultyLevel = 'recognition' | 'understanding' | 'application' | 'high_application';

export type QuestionType = 'multiple_choice' | 'multi_select' | 'true_false' | 'fill_in' | 'essay';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  code: string; // e.g. HS-202409, GV-TOAN01
  className?: string; // e.g. "9A1", "8A2"
  grade?: GradeLevel;
  subject?: string; // e.g. "Tin học", "Toán"
  status?: 'active' | 'locked';
  pin?: string;
  avatar: string;
  email: string;
  phone?: string;
  school: string;
  activeSessionToken?: string;
  lastLoginAt?: string;
  lastLoginDevice?: string;
}

export interface Question {
  id: string;
  code: string; // e.g. TOAN9-NB-001
  subject: Subject;
  grade: GradeLevel;
  difficulty: DifficultyLevel;
  type: QuestionType;
  content: string;
  options?: string[]; // For multiple_choice / multi_select / true_false
  correctAnswers: number[] | string[]; // index for options or string for fill_in
  explanation?: string;
  tags: string[];
  points?: number; // default 1.0
  authorName?: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  code: string; // e.g. DE-TOAN-CK1
  description: string;
  subject: Subject;
  grade: GradeLevel;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number; // e.g. 5.0
  maxScore: number; // e.g. 10.0
  maxAttempts: number;
  accessCode?: string; // Optional password to enter exam
  targetClasses: string[]; // e.g. ['9A1', '9A2', 'All']
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswerAfterSubmit: boolean;
  isPublished: boolean;
  questions: Question[];
  status: 'active' | 'upcoming' | 'closed';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  authorRole?: UserRole;
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface QuestionResult {
  questionId: string;
  studentAnswer: any; // index, array of indices, or string
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  teacherFeedback?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subject: Subject;
  grade: GradeLevel;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentCode: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  answers: Record<string, any>;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  tabSwitchCount: number;
  questionResults: QuestionResult[];
  essayGraded?: boolean;
  submittedAt: string;
  feedback?: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Thông báo chung' | 'Góc học tập';
  summary: string;
  content: string;
  featuredImage: string;
  publishedAt: string;
  authorName: string;
  authorTitle: string;
  authorRole?: UserRole;
  views: number;
  likes: number;
  isPinned: boolean;
  tags: string[];
  attachments?: { name: string; size: string; url?: string }[];
  comments: Comment[];
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface LessonMaterial {
  id: string;
  title: string;
  type: 'lecture' | 'lesson_plan' | 'slide' | 'exercise' | 'software' | 'reference';
  subject: Subject;
  grade: GradeLevel;
  unit?: string; // e.g. "Chủ đề A: Máy tính và cộng đồng"
  description: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  fileUrl?: string; // Data URL / Base64 or external download link
  fileName: string;
  fileSize: string;
  fileFormat: 'pptx' | 'docx' | 'pdf' | 'xlsx' | 'zip' | 'mp4' | 'other';
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  tags: string[];
  externalVideoUrl?: string;
  contentOutline?: string;
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export type MaterialType = 'all' | 'lecture' | 'lesson_plan' | 'slide' | 'exercise' | 'software' | 'reference';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'exam' | 'news' | 'system' | 'result';
  timestamp: string;
  read: boolean;
  targetLink?: string;
}

export type AppNotification = NotificationItem;

export interface CloudflareConfig {
  workerUrl: string;
  apiSecret?: string;
  enabled: boolean;
  autoSync: boolean;
  autoSyncIntervalSeconds?: number; // e.g. 20s
  lastSyncedAt?: string;
  status: 'idle' | 'syncing' | 'connected' | 'error';
  lastError?: string;
  syncCount?: number;
}

export type NavigationTab = 
  | 'news' 
  | 'materials'
  | 'exams' 
  | 'score_lookup' 
  | 'admin_portal'
  | 'students'
  | 'login' 
  | 'reports' 
  | 'profile';
