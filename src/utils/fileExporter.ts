import { LessonMaterial } from '../types';

/**
 * Downloads a LessonMaterial file for students.
 * - If material has an attached binary file (Data URL), downloads the original file.
 * - If not, generates a rich formatted Word document (.doc) containing full lesson plan details,
 *   styled headers, and complete content outlines encoded with UTF-8 BOM (\uFEFF) for flawless Word viewing.
 */
export function downloadLessonMaterialFile(material: LessonMaterial): void {
  if (material.fileUrl && material.fileUrl.startsWith('data:')) {
    // Download direct attached file (PowerPoint, Word, PDF, Video, etc.)
    const a = document.createElement('a');
    a.href = material.fileUrl;
    a.download = material.fileName || `BaiGiang_TinHoc${material.grade}.${material.fileFormat || 'pptx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Generate a rich Word-compatible HTML document with UTF-8 BOM
  const cleanTitle = (material.title || 'Tài liệu học tập').trim();
  const cleanUnit = (material.unit || 'Chương trình GDPT 2018').trim();
  const cleanAuthor = (material.authorName || 'Thầy Nguyễn Văn Toàn').trim();
  const cleanDesc = (material.description || 'Chưa có tóm tắt.').trim();
  const cleanOutline = (material.contentOutline || 'Chưa có nội dung đề cương chi tiết.').trim();
  const cleanDate = material.createdAt || new Date().toISOString().split('T')[0];

  const wordHtml = `\uFEFF<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${cleanTitle}</title>
<style>
  @page { size: 21cm 29.7cm; margin: 2cm; }
  body { font-family: "Calibri", "Arial", sans-serif; font-size: 11pt; line-height: 1.6; color: #0f172a; margin: 0; padding: 20px; }
  .school-header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
  .school-title { font-size: 11pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0; }
  .doc-title { font-size: 18pt; font-weight: bold; color: #0f172a; margin: 12px 0 6px 0; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; }
  .meta-table td { padding: 10px 14px; font-size: 10.5pt; border: 1px solid #e2e8f0; }
  .meta-label { font-weight: bold; color: #334155; width: 180px; }
  .section-title { font-size: 13pt; font-weight: bold; color: #1e40af; border-left: 4px solid #2563eb; padding-left: 10px; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; }
  .content-box { background-color: #ffffff; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; font-size: 11pt; white-space: pre-wrap; word-wrap: break-word; line-height: 1.7; }
  .footer { margin-top: 40px; font-size: 10pt; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; font-style: italic; }
</style>
</head>
<body>

  <div class="school-header">
    <p class="school-title">TRƯỜNG THCS NGÔ QUYỀN • HỆ THỐNG KHO HỌC LIỆU e-TESTING</p>
    <p style="margin: 4px 0 0 0; font-size: 10pt; color: #475569;">Chương Trình Giáo Dục Phổ Thông 2018 — Môn Tin Học</p>
    <div class="doc-title">${cleanTitle}</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Môn học & Khối:</td>
      <td>Tin học ${material.grade}</td>
    </tr>
    <tr>
      <td class="meta-label">Phân phối chương trình:</td>
      <td><strong>${cleanUnit}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Giáo viên biên soạn:</td>
      <td>${cleanAuthor}</td>
    </tr>
    <tr>
      <td class="meta-label">Ngày phát hành:</td>
      <td>${cleanDate}</td>
    </tr>
    <tr>
      <td class="meta-label">Loại tài liệu:</td>
      <td>${material.fileFormat ? material.fileFormat.toUpperCase() : 'BÀI GIẢNG / GIÁO ÁN'}</td>
    </tr>
  </table>

  <div class="section-title">I. TÓM TẮT MÔ TẢ HỌC LIỆU</div>
  <div class="content-box">${cleanDesc}</div>

  <div class="section-title">II. NỘI DUNG CHI TIẾT BÀI DẠY (KHUNG GIÁO ÁN 5512)</div>
  <div class="content-box">${cleanOutline}</div>

  <div class="footer">
    Bản quyền tài liệu thuộc Hệ thống Kho Học Liệu & Bài Giảng Tin Học — Thầy Toàn (Trường THCS Ngô Quyền)
  </div>

</body>
</html>`;

  // Create Word blob with application/msword mime type and UTF-8 charset
  const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Format filename cleanly (.doc extension so Microsoft Word / WPS / Google Docs opens directly)
  const baseName = (material.fileName || cleanTitle).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_ -]/g, '');
  const downloadName = `${baseName || 'BaiGiang_TinHoc'}.doc`;

  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
