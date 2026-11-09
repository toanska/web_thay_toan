import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  QrCode, 
  Eye, 
  BookOpen, 
  Shield, 
  Download, 
  Sparkles, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw 
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { uploadLessonFile, createLesson, Lesson } from '../../services/lessonService';
import { UploadTask } from 'firebase/storage';

interface TeacherLessonUploaderProps {
  onClose?: () => void;
  onLessonCreated?: () => void;
}

export const TeacherLessonUploader: React.FC<TeacherLessonUploaderProps> = ({ onClose, onLessonCreated }) => {
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState<'6' | '7' | '8' | '9'>('9');
  const [subject, setSubject] = useState<'toan' | 'tin-hoc' | 'khac'>('tin-hoc');
  const [semester, setSemester] = useState<'HK1' | 'HK2'>('HK1');
  const [chapter, setChapter] = useState('Chủ đề 1: Máy tính và cộng đồng');
  const [summary, setSummary] = useState('');
  
  const [sourceType, setSourceType] = useState<'firebase_file' | 'external_link'>('firebase_file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [fileType, setFileType] = useState<Lesson['fileType']>('pdf');
  
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [allowDownload, setAllowDownload] = useState(true);
  const [examId, setExamId] = useState('');

  // Upload progress states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cancelTaskRef = useRef<UploadTask | null>(null);

  // Success modal states
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);

      // Auto detect fileType
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setFileType('pdf');
      else if (ext === 'pptx' || ext === 'ppt') setFileType('pptx');
      else if (ext === 'docx' || ext === 'doc') setFileType('docx');
      else if (ext === 'mp4' || ext === 'mov') setFileType('mp4');
      else setFileType('pdf');

      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleCancelUpload = () => {
    if (cancelTaskRef.current) {
      cancelTaskRef.current.cancel();
      cancelTaskRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError('Đã hủy quá trình tải lên theo yêu cầu.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài giảng!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      let finalFileUrl = '';
      let storagePath: string | null = null;
      let calculatedSize = 0;

      if (sourceType === 'firebase_file') {
        if (!selectedFile) {
          throw new Error('Vui lòng chọn tệp tin cần tải lên Firebase Storage.');
        }

        const uploadRes = await uploadLessonFile(
          selectedFile,
          { grade, subject, visibility },
          (prog) => setUploadProgress(prog),
          cancelTaskRef
        );

        finalFileUrl = uploadRes.downloadUrl;
        storagePath = uploadRes.storagePath;
        calculatedSize = uploadRes.fileSize;
      } else {
        if (!externalUrl.trim()) {
          throw new Error('Vui lòng dán đường dẫn liên kết ngoài (Drive, YouTube, Canva, Scratch...).');
        }
        finalFileUrl = externalUrl.trim();
        calculatedSize = 1024; // Dummy size for links
      }

      const newId = await createLesson({
        title: title.trim(),
        grade,
        subject,
        semester,
        chapter: chapter.trim(),
        summary: summary.trim(),
        sourceType,
        fileUrl: finalFileUrl,
        storagePath,
        fileType,
        fileSize: calculatedSize,
        visibility,
        allowDownload,
        examId: examId.trim() ? examId.trim() : null
      });

      const shareUrl = `${window.location.origin}/?lesson=${newId}`;
      setCreatedLessonId(newId);
      setCreatedShareUrl(shareUrl);
      setShowSuccessModal(true);
      setIsUploading(false);

      if (onLessonCreated) onLessonCreated();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Có lỗi xảy ra khi lưu bài giảng.');
      setIsUploading(false);
    }
  };

  const handleCopyZalo = () => {
    if (!createdShareUrl) return;
    const text = `📚 BÀI GIẢNG ĐIỆN TỬ MÔN ${subject.toUpperCase()} KHỐI ${grade}\n📌 Tiêu đề: ${title}\n🔗 Liên kết học tập: ${createdShareUrl}\n✨ Mời các em học sinh truy cập học tập và ôn luyện!`;
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-xs">
              Phân hệ Giáo viên THCS Ngô Quyền
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 font-bold text-xs">
              Firebase Storage v10+ Hybrid
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            📤 Đăng Tải & Quản Lý Bài Giảng Thông Minh
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Hỗ trợ tải file trực tiếp lên đám mây hoặc nhúng liên kết ngoài (Drive, YouTube, Canva, Scratch).
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>1. Thông tin chung bài giảng</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tên bài giảng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài 1: Thu thập và phân loại thông tin"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Môn học</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tin-hoc">Tin học</option>
                  <option value="toan">Toán học</option>
                  <option value="khac">Môn khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Học kỳ</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HK1">Học kỳ 1</option>
                  <option value="HK2">Học kỳ 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Chủ đề / Chương</label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="VD: Chủ đề A: Máy tính và cộng đồng"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tóm tắt lý thuyết / Hướng dẫn học sinh
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nhập tóm tắt nội dung chính, công thức toán học hoặc hướng dẫn thực hành..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-900 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>2. Nguồn học liệu & Định dạng tệp</span>
          </h2>

          {/* Source Type Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSourceType('firebase_file')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceType === 'firebase_file' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Tải file lên Firebase</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('external_link')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceType === 'external_link' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Dán Link ngoài (Drive, YouTube...)</span>
            </button>
          </div>

          {sourceType === 'firebase_file' ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-all">
                <input
                  type="file"
                  id="lesson-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.mp4,.mov"
                  className="hidden"
                />
                <label htmlFor="lesson-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block mb-1">
                      Chọn tệp bài giảng
                    </span>
                    <p className="text-xs text-slate-500">Hỗ trợ PDF, PowerPoint (.pptx), Word (.docx), Video (.mp4) tối đa 15MB</p>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã chọn: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span>Đang tải lên Firebase Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Hủy tải lên
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đường dẫn liên kết (URL)
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... hoặc Google Drive / Canva / Scratch"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pdf', label: 'PDF Link' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'drive', label: 'Google Drive' },
                  { id: 'canva', label: 'Canva / Khác' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFileType(t.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      fileType === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-base font-bold text-slate-900 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>3. Cấu hình bảo mật & Khảo thí gắn kèm</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Quyền hiển thị</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Công khai (Hiển thị trên Cổng thông tin)</option>
                <option value="unlisted">Chỉ người có link (Unlisted)</option>
                <option value="private">Riêng tư (Chỉ giáo viên)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mã đề kiểm tra trắc nghiệm (Tùy chọn)</label>
              <input
                type="text"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                placeholder="VD: exam-1741000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 w-full hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Cho phép học sinh tải tệp về máy</span>
                <span className="text-[11px] text-slate-500">Học sinh có thể bấm nút tải tệp gốc về thiết bị cá nhân để học offline.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Đang tải lên đám mây...' : 'Đăng & Xuất bản bài giảng'}</span>
            </button>
          </div>

        </form>

        {/* Right Column: Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Xem trước trực tiếp (Live Preview)</span>
            </h2>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-bold text-[10px]">
                  Khối {grade} • Môn {subject.toUpperCase()} • {semester}
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/30 text-teal-200 font-bold text-[10px] uppercase">
                  {fileType}
                </span>
              </div>
              <h3 className="text-base font-extrabold line-clamp-2">
                {title || 'Tiêu đề bài giảng hiển thị ở đây...'}
              </h3>
              <p className="text-xs text-blue-100 line-clamp-2">
                {summary || 'Tóm tắt nội dung bài học sẽ hiển thị tại đây để học sinh nắm nhanh trước khi vào học...'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Chủ đề / Chương:</span>
                <strong className="text-slate-900">{chapter}</strong>
              </div>
              <div className="flex justify-between">
                <span>Nguồn học liệu:</span>
                <strong className="text-slate-900">{sourceType === 'firebase_file' ? 'Firebase Storage v10+' : 'Liên kết ngoài'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Quyền tải về:</span>
                <strong className={allowDownload ? 'text-emerald-600' : 'text-rose-600'}>{allowDownload ? 'Cho phép' : 'Khóa tải'}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Hướng dẫn chuyên gia:
              </span>
              <p className="text-slate-700 leading-relaxed">
                Sau khi bấm xuất bản, hệ thống sẽ tự động tạo mã QR và link chia sẻ qua Zalo nhóm lớp để học sinh truy cập ngay lập tức.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && createdShareUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-center border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Xuất Bản Bài Giảng Thành Công!</h3>
              <p className="text-xs text-slate-500 mt-1">Bài giảng đã được lưu trên hệ thống đám mây và sẵn sàng chia sẻ.</p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <QRCodeCanvas value={createdShareUrl} size={160} level="H" includeMargin={true} />
              <span className="text-[11px] text-slate-500 font-medium">Mã QR truy cập nhanh cho học sinh</span>
            </div>

            {/* Share URL */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">Liên kết chia sẻ:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdShareUrl}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyZalo}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedZalo ? '✓ Đã sao chép tin nhắn gửi Zalo!' : 'Sao chép tin nhắn gửi Zalo nhóm lớp'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onClose) onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng & Quay lại quản lý
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
