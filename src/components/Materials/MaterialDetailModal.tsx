import React from 'react';
import { 
  X, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  BookOpen, 
  FileText, 
  Presentation, 
  File, 
  FileSpreadsheet, 
  FileArchive, 
  Video, 
  Printer, 
  Share2, 
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { LessonMaterial } from '../../types';

interface MaterialDetailModalProps {
  material: LessonMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (material: LessonMaterial) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  material,
  isOpen,
  onClose,
  onDownload
}) => {
  if (!isOpen || !material) return null;

  const getFormatIcon = (format: LessonMaterial['fileFormat']) => {
    switch (format) {
      case 'pptx':
        return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pdf':
        return <File className="w-5 h-5 text-rose-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-purple-600" />;
      case 'mp4':
        return <Video className="w-5 h-5 text-indigo-600" />;
      default:
        return <File className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeLabel = (type: LessonMaterial['type']) => {
    switch (type) {
      case 'slide': return { label: 'Bài giảng điện tử PowerPoint', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'lesson_plan': return { label: 'Kế hoạch bài dạy (Giáo án 5512)', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'lecture': return { label: 'Video bài giảng trực tuyến', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'reference': return { label: 'Đề cương & Tài liệu PDF', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'exercise': return { label: 'Code mẫu & Bài tập thực hành', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'software': return { label: 'Phần mềm / Công cụ', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default: return { label: 'Tài liệu học tập', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const typeInfo = getTypeLabel(material.type);

  // Extract YouTube ID if any
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(material.externalVideoUrl);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 font-bold text-[11px]">
                  Tin học Khối {material.grade}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 line-clamp-1">
                {material.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Metadata Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                {getFormatIcon(material.fileFormat)}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Tệp đính kèm:</p>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{material.fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {material.fileSize}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onDownload(material)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Tệp ({material.fileFormat.toUpperCase()})</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="In giáo án"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Author & Statistics Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-[11px] text-blue-600 font-bold uppercase">Giáo viên biên soạn</p>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{material.authorName}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
              <p className="text-[11px] text-purple-600 font-bold uppercase">Ngày đăng tải</p>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>{material.createdAt}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <p className="text-[11px] text-emerald-600 font-bold uppercase">Lượt tải về</p>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{material.downloadCount} lượt tải</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <p className="text-[11px] text-amber-600 font-bold uppercase">Lượt xem tài liệu</p>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>{material.viewCount} lượt xem</span>
              </p>
            </div>
          </div>

          {/* Unit / Topic */}
          {material.unit && (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">Phân phối chương trình: </span>
                {material.unit}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Tóm tắt & Giới thiệu học liệu</span>
            </h3>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 leading-relaxed">
              {material.description}
            </div>
          </div>

          {/* Embedded YouTube Player */}
          {youtubeEmbedUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
                <Video className="w-4 h-4" />
                <span>Video bài giảng trực tuyến</span>
              </h3>
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
                <iframe
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Lesson Plan Outline (Khung giáo án 5512) */}
          {material.contentOutline && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Kế Hoạch Bài Dạy (Khung 5512 / Tiến trình bài học)</span>
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
                {material.contentOutline}
              </div>
            </div>
          )}

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thẻ chủ đề:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {material.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Hệ thống quản trị học liệu Tin học THCS
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => onDownload(material)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file về máy ({material.fileSize})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
