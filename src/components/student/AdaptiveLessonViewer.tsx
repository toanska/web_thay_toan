import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Printer, 
  BookOpen, 
  Eye, 
  Calendar, 
  User, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Play, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Lesson, incrementLessonView, getSmartEmbedUrl } from '../../services/lessonService';

interface AdaptiveLessonViewerProps {
  lesson: Lesson;
  onClose: () => void;
  onTakeExam?: (examId: string) => void;
}

export const AdaptiveLessonViewer: React.FC<AdaptiveLessonViewerProps> = ({ lesson, onClose, onTakeExam }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    incrementLessonView(lesson.id);
  }, [lesson.id]);

  const embedUrl = getSmartEmbedUrl(lesson.fileUrl, lesson.fileType);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?lesson=${lesson.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-bold text-[10px]">
                  Khối {lesson.grade} • Môn {lesson.subject.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold text-[10px] uppercase">
                  {lesson.fileType}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 line-clamp-1">
                {lesson.title}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sao chép liên kết"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Đã sao chép' : 'Chia sẻ'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Main Embedded Viewer (Mobile & Webview Optimized) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Trình xem bài giảng trực tuyến</span>
              </h3>

              <div className="flex items-center gap-2">
                <a
                  href={lesson.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới (Full Screen)</span>
                </a>
                
                {lesson.allowDownload && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(lesson.fileUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        // Force extension based on fileType
                        const ext = lesson.fileType === 'pptx' ? '.pptx' : lesson.fileType === 'docx' ? '.docx' : lesson.fileType === 'pdf' ? '.pdf' : '';
                        a.download = `${lesson.title}${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Download failed:', error);
                        window.open(lesson.fileUrl, '_blank');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp về máy</span>
                  </button>
                )}
              </div>
            </div>

            {/* Embed container with touch gestures */}
            <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 relative flex items-center justify-center touch-pan-x touch-pan-y">
              {embedUrl ? (
                <div className="w-full h-full relative">
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    className="w-full h-full border-none bg-white touch-auto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Overlay for mobile touch encouragement */}
                  <div className="absolute top-2 right-2 p-2 bg-slate-800/70 text-white text-[10px] rounded-lg pointer-events-none sm:hidden">
                    Dùng 2 ngón tay để thu phóng
                  </div>
                </div>
              ) : (
                <div className="text-white text-xs text-center p-6 space-y-2">
                  <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                  <p>Không thể hiển thị khung nhúng trực tiếp cho liên kết này.</p>
                  <a href={lesson.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">
                    Bấm vào đây để mở trực tiếp tài liệu
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Metadata & Chapter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Chủ đề / Chương:</span>
              <strong className="text-slate-900 font-bold">{lesson.chapter || 'Chương trình GDPT 2018'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Học kỳ & Khối:</span>
              <strong className="text-slate-900">{lesson.semester} • Khối {lesson.grade}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lượt truy cập học tập:</span>
              <strong className="text-emerald-700 font-bold">{lesson.views || 1} lượt xem</strong>
            </div>
          </div>

          {/* Theory Summary / Description */}
          {lesson.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Tóm tắt lý thuyết & Ghi chú quan trọng</span>
              </h3>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {lesson.summary}
              </div>
            </div>
          )}

          {/* Linked Exam Button (Luyện tập ngay) */}
          {lesson.examId && onTakeExam && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 font-bold text-[10px]">
                  Khảo thí trực tuyến
                </span>
                <h4 className="text-base font-extrabold">Bài tập trắc nghiệm củng cố bài học</h4>
                <p className="text-xs text-emerald-100">Làm bài kiểm tra ngay để đánh giá mức độ hiểu bài của em.</p>
              </div>
              <button
                onClick={() => {
                  if (lesson.examId) {
                    onTakeExam(lesson.examId);
                    onClose();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4 fill-emerald-900" />
                <span>Luyện tập & Kiểm tra ngay</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Hệ thống Kho Học Liệu & Khảo Thí THCS Ngô Quyền
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
