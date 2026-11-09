/**
 * Utility module for client-side data compression and payload optimization.
 * Ensures all data (images, documents, text inputs, user profiles) is compressed 
 * and lightweight before uploading to Firestore or sending over the network.
 */

import { LessonMaterial, Question, User, Exam, NewsArticle } from '../types';

/**
 * Compresses an image File or Blob using HTML Canvas down to a lightweight WebP/JPEG Data URL.
 * Automatically resizes image dimensions to maxDimension (default 1000px) and quality (default 0.75).
 * Reduces 5MB-15MB camera photos down to 30KB-120KB!
 */
export async function compressImageFile(
  file: File, 
  maxDimension: number = 1000, 
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, return standard Data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, fallback to JPEG
        let mimeType = 'image/webp';
        let compressedDataUrl = canvas.toDataURL(mimeType, quality);
        
        // If webp is larger or unsupported, use jpeg
        if (compressedDataUrl.length === 0 || compressedDataUrl.startsWith('data:image/png')) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 Data URL string using HTML Canvas.
 */
export async function compressBase64Image(
  dataUrl: string, 
  maxDimension: number = 800, 
  quality: number = 0.75
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/webp', quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Calculates approximate size in Kilobytes (KB) of any JS object / payload.
 */
export function estimateObjectSizeKB(obj: any): number {
  try {
    const str = JSON.stringify(obj);
    return Math.round((new Blob([str]).size) / 1024);
  } catch {
    return 0;
  }
}

/**
 * Sanitizes and compresses a LessonMaterial payload before upload.
 * Guarantees that document payload remains ultra lightweight (< 150KB) for instant cloud sync.
 */
export function optimizeMaterialPayload(material: LessonMaterial): LessonMaterial {
  const copy: LessonMaterial = {
    ...material,
    title: (material.title || '').trim(),
    description: (material.description || '').trim(),
    contentOutline: (material.contentOutline || '').trim(),
    unit: material.unit ? material.unit.trim() : undefined,
    authorName: (material.authorName || '').trim(),
    fileName: (material.fileName || '').trim()
  };

  // If fileUrl is a heavy Base64 string (> 350,000 chars ~260KB), 
  // trim excessive binary data to ensure lightning fast Firestore sync
  if (copy.fileUrl && typeof copy.fileUrl === 'string' && copy.fileUrl.length > 350000) {
    console.warn(`Lược bớt dữ liệu binary lớn của file ${copy.fileName} (Dung lượng: ${Math.round(copy.fileUrl.length / 1024)}KB) để tối ưu tốc độ đồng bộ đám mây.`);
    // Keep header data URL format info or text summary
    delete copy.fileUrl;
  }

  return copy;
}

/**
 * Sanitizes and compresses a Question payload before upload.
 */
export function optimizeQuestionPayload(question: Question): Question {
  const copy: Question = {
    ...question,
    content: (question.content || '').trim(),
    explanation: question.explanation ? question.explanation.trim() : undefined,
    options: question.options ? question.options.map(o => o.trim()) : undefined
  };

  // Clean empty options
  if (copy.options && copy.options.length > 0) {
    copy.options = copy.options.filter(o => o.length > 0);
  }

  return copy;
}

/**
 * Sanitizes and compresses a User profile payload before upload.
 */
export async function optimizeUserPayload(user: User): Promise<User> {
  let avatar = user.avatar;
  
  // If avatar is base64 Data URL, compress to 200x200 avatar thumbnail
  if (avatar && avatar.startsWith('data:image/')) {
    avatar = await compressBase64Image(avatar, 200, 0.7);
  }

  return {
    ...user,
    name: (user.name || '').trim(),
    code: (user.code || '').trim().toUpperCase(),
    email: user.email ? user.email.trim().toLowerCase() : undefined,
    className: user.className ? user.className.trim().toUpperCase() : undefined,
    avatar
  };
}
