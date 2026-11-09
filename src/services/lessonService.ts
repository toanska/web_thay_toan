import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  UploadTask 
} from 'firebase/storage';
import { db, storage, auth } from '../firebase';

export interface Lesson {
  id: string;
  title: string;
  grade: '6' | '7' | '8' | '9';
  subject: 'toan' | 'tin-hoc' | 'khac';
  semester: 'HK1' | 'HK2';
  chapter: string;
  summary: string;
  sourceType: 'firebase_file' | 'external_link';
  fileUrl: string;
  storagePath: string | null;
  fileType: 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'mp4' | 'youtube' | 'drive' | 'canva' | 'scratch' | 'code';
  fileSize: number;
  visibility: 'public' | 'unlisted' | 'private';
  allowDownload: boolean;
  examId: string | null;
  views: number;
  createdAt: any;
  createdBy: string;
}

/**
 * Sanitize filename: remove diacritics and special characters.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return 'document';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Translate Firebase Storage error messages to friendly Vietnamese.
 */
export function getFriendlyStorageError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'storage/unauthorized':
      return 'Bạn không có quyền tải file lên thư mục này. Vui lòng đăng nhập lại tài khoản Giáo viên.';
    case 'storage/quota-exceeded':
      return 'Dung lượng lưu trữ Firebase Storage đã vượt quá hạn mức miễn phí (5GB).';
    case 'storage/canceled':
      return 'Quá trình tải lên đã bị hủy bỏ theo yêu cầu.';
    case 'storage/retry-limit-exceeded':
      return 'Kết nối mạng không ổn định, quá trình tải lên đã thất bại. Vui lòng thử lại.';
    default:
      return error?.message || 'Đã xảy ra lỗi không xác định trong quá trình tải tệp lên.';
  }
}

/**
 * Upload lesson file using uploadBytesResumable with progress callback and cancel ref.
 */
export async function uploadLessonFile(
  file: File,
  metadata: { grade: string; subject: string; visibility: string },
  onProgress: (progress: number) => void,
  cancelRef?: { current: UploadTask | null }
): Promise<{ downloadUrl: string; storagePath: string; fileSize: number }> {
  const cleanName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const storagePath = `lessons/${metadata.visibility}/khoi-${metadata.grade}/${metadata.subject}/${timestamp}_${cleanName}`;
  
  console.log('Attempting upload to:', storagePath, 'File:', file.name, file.size, file.type);
  
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'application/octet-stream'
  });

  if (cancelRef) {
    cancelRef.current = uploadTask;
  }

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log('Upload progress:', progress, '%');
        onProgress(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(new Error(getFriendlyStorageError(error)));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileSize: file.size
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Create a new lesson document in Firestore.
 */
export async function createLesson(lessonData: Omit<Lesson, 'id' | 'views' | 'createdAt' | 'createdBy'>): Promise<string> {
  const lessonId = `lesson-${Date.now()}`;
  const user = auth.currentUser;
  
  const newLesson: Lesson = {
    ...lessonData,
    id: lessonId,
    views: 0,
    createdAt: serverTimestamp(),
    createdBy: user ? user.uid : 'teacher-toan'
  };

  await setDoc(doc(db, 'lessons', lessonId), newLesson);
  return lessonId;
}

/**
 * Update an existing lesson document.
 */
export async function updateLesson(lessonId: string, newData: Partial<Lesson>, oldStoragePath?: string | null, newFile?: File): Promise<void> {
  const docRef = doc(db, 'lessons', lessonId);
  
  if (oldStoragePath && newFile) {
    try {
      const oldRef = ref(storage, oldStoragePath);
      await deleteObject(oldRef);
    } catch (e) {
      console.warn('Không thể xóa file cũ trên storage:', e);
    }
  }

  await updateDoc(docRef, {
    ...newData,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a lesson from Firestore and its associated Storage file.
 */
export async function deleteLesson(lessonId: string, storagePath?: string | null): Promise<void> {
  if (storagePath) {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (e) {
      console.warn('Không tìm thấy file trên Storage hoặc đã bị xóa:', e);
    }
  }
  await deleteDoc(doc(db, 'lessons', lessonId));
}

/**
 * Get all lessons with optional filtering.
 */
export async function getPublicLessons(filters?: { grade?: string; subject?: string; semester?: string }): Promise<Lesson[]> {
  try {
    let q = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
    
    if (filters?.grade && filters.grade !== 'all') {
      q = query(collection(db, 'lessons'), where('grade', '==', filters.grade), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let lessons = snapshot.docs.map(docSnap => docSnap.data() as Lesson);

    if (filters?.subject && filters.subject !== 'all') {
      lessons = lessons.filter(l => l.subject === filters.subject);
    }
    if (filters?.semester && filters.semester !== 'all') {
      lessons = lessons.filter(l => l.semester === filters.semester);
    }

    return lessons;
  } catch (error) {
    console.error('Lỗi khi tải danh sách bài giảng:', error);
    return [];
  }
}

/**
 * Increment view count with sessionStorage anti-spam.
 */
export async function incrementLessonView(lessonId: string): Promise<void> {
  const viewedKey = `viewed_lesson_${lessonId}`;
  if (sessionStorage.getItem(viewedKey)) return;

  try {
    sessionStorage.setItem(viewedKey, 'true');
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (e) {
    console.warn('Lỗi cập nhật lượt xem:', e);
  }
}

/**
 * Get Smart Embed URL for iframe display with fallback support.
 */
export function getSmartEmbedUrl(fileUrl: string, fileType: string, useProxy: boolean = false): string {
  if (!fileUrl) return '';

  const isDriveLink = fileUrl.includes('drive.google.com');

  if (fileType === 'youtube' || fileUrl.includes('youtube.com') || fileUrl.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = fileUrl.match(regExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
  }

  if (fileType === 'drive' || isDriveLink) {
    let fileId = '';
    if (fileUrl.includes('/file/d/')) {
      fileId = fileUrl.split('/file/d/')[1].split('/')[0];
    } else if (fileUrl.includes('?id=')) {
      fileId = new URL(fileUrl).searchParams.get('id') || '';
    }

    if (fileId) {
      if (useProxy) {
        // Mode 2: Google Docs Viewer Proxy (Stable for multi-account)
        return `https://docs.google.com/viewer?srcid=${fileId}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
      }
      // Mode 1: Standard Drive Preview (Better for mobile/scaling)
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  if (fileType === 'canva') return fileUrl;

  if (fileType === 'pptx' || fileType === 'docx' || fileType === 'xlsx') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }

  return fileUrl;
}
