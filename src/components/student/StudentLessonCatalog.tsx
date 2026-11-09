import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  Presentation, 
  Video, 
  CheckCircle2, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Upload,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { Lesson, getPublicLessons } from '../../services/lessonService';
import { StorageService } from '../../services/storageService';
import { AdaptiveLessonViewer } from './AdaptiveLessonViewer';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';
import { User as UserType, LessonMaterial } from '../../types';

interface StudentLessonCatalogProps {
  currentUser?: UserType;
  initialLessonId?: string | null;
  onTakeExam?: (examId: string) => void;
  onNavigateToUpload?: () => void;
  onDeleteLesson: (id: string, storagePath?: string | null) => void;
  onEditLesson: (lesson: Lesson) => void;
}

export const StudentLessonCatalog: React.FC<StudentLessonCatalogProps> = ({ 
  currentUser, 
  initialLessonId, 
  onTakeExam,
  onNavigateToUpload,
  onDeleteLesson,
  onEditLesson
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active viewing lesson modal state
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const isTeacherOrAdmin = isTeacherToanOrAdmin(currentUser);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cloudLessons, rawMaterials] = await Promise.all([
          getPublicLessons(),
          StorageService.getMaterials().catch(() => [] as LessonMaterial[])
        ]);

        // Convert LessonMaterial to Lesson format so both old materials & new cloud lessons merge into one unified library
        const convertedMaterials: Lesson[] = (rawMaterials || []).map((m: LessonMaterial) => ({
          id: m.id,
          title: m.title,
          grade: String(m.grade) as any,
          subject: m.grade ? 'tin-hoc' : 'toan',
          semester: 'HK1',
          chapter: m.unit || 'Chương trình GDPT 2018',
          summary: m.description,
          sourceType: 'firebase_file',
          fileUrl: m.fileUrl || '',
          storagePath: null,
          fileType: m.fileFormat === 'pdf' ? 'pdf' : m.fileFormat === 'pptx' ? 'pptx' : m.fileFormat === 'docx' ? 'docx' : m.fileFormat === 'mp4' ? 'mp4' : 'pdf',
          fileSize: 1024,
          visibility: 'public',
          allowDownload: true,
          examId: null,
          views: m.viewCount || 0,
          createdAt: m.createdAt,
          createdBy: m.authorName
        }));

        // Merge and deduplicate by id
        const map = new Map<string, Lesson>();
        [...cloudLessons, ...convertedMaterials].forEach(l => {
          if (l.id) map.set(l.id, l);
        });

        const merged = Array.from(map.values());
        setLessons(merged);

        // If URL has ?lesson=...
        if (initialLessonId) {
          const found = merged.find(l => l.id === initialLessonId);
          if (found) {
            setActiveLesson(found);
          }
        }
      } catch (e) {
        console.error('Lỗi tải kho thư viện bài giảng:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialLessonId]);

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (selectedGrade !== 'all' && l.grade !== selectedGrade) return false;
      if (selectedSubject !== 'all' && l.subject !== selectedSubject) return false;
      if (selectedSemester !== 'all' && l.semester !== selectedSemester) return false;
      
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = l.title.toLowerCase().includes(q);
        const matchChapter = l.chapter && l.chapter.toLowerCase().includes(q);
        const matchSummary = l.summary && l.summary.toLowerCase().includes(q);
        if (!matchTitle && !matchChapter && !matchSummary) return false;
      }
      return true;
    });
  }, [lessons, selectedGrade, selectedSubject, selectedSemester, searchQuery]);

  const getFileTypeBadge = (type: Lesson['fileType']) => {
    switch (type) {
      case 'pdf': return { label: 'PDF', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: FileText };
      case 'pptx': return { label: 'PowerPoint', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Presentation };
      case 'docx': return { label: 'Word (DOCX)', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText };
      case 'mp4': return { label: 'Video MP4', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Video };
      case 'youtube': return { label: 'YouTube', color: 'bg-red-100 text-red-800 border-red-200', icon: Video };
      default: return { label: 'Tài liệu số', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: BookOpen };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-16">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" /> Trường THCS Ngô Quyền • Kho Thư Viện Bài Giảng & Học Liệu
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            📚 Kho Thư Viện Bài Giảng & Giáo Án Trực Tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tra cứu và học tập bài giảng, kế hoạch bài dạy môn Toán & Tin học Khối 6, 7, 8, 9 hoàn toàn miễn phí. Hỗ trợ xem trực tuyến đa thiết bị và luyện tập trắc nghiệm tức thì.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center w-full sm:w-auto">
            <span className="text-[11px] uppercase tracking-wider text-blue-200 block font-bold">Tổng số học liệu</span>
            <span className="text-3xl font-black text-amber-300 font-mono">{lessons.length}</span>
            <span className="text-xs text-blue-200 block mt-0.5">Bài giảng chuẩn GDPT 2018</span>
          </div>

          {isTeacherOrAdmin && onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Bài Giảng Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Grade Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Khối lớp:
            </span>
            {[
              { id: 'all', label: 'Tất cả khối' },
              { id: '6', label: 'Khối 6' },
              { id: '7', label: 'Khối 7' },
              { id: '8', label: 'Khối 8' },
              { id: '9', label: 'Khối 9' }
            ].map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === g.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả môn học</option>
              <option value="tin-hoc">Môn Tin học</option>
              <option value="toan">Môn Toán học</option>
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên bài giảng, chủ đề, nội dung tóm tắt..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* Lesson Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Đang tải kho thư viện bài giảng từ đám mây...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            📂
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy bài giảng phù hợp</h3>
          <p className="text-xs text-slate-500">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc khối lớp, môn học.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => {
            const badge = getFileTypeBadge(lesson.fileType);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:shadow-lg cursor-pointer"
              >
                <div className="p-5 space-y-3 flex-1">
                  
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                        Khối {lesson.grade} • {lesson.subject === 'toan' ? 'Toán' : 'Tin học'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {lesson.semester}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {lesson.title}
                  </h3>

                  {/* Chapter */}
                  {lesson.chapter && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{lesson.chapter}</span>
                    </p>
                  )}

                  {/* Summary */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {lesson.summary || 'Chưa có tóm tắt lý thuyết chi tiết.'}
                  </p>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.views || 0} lượt xem</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isTeacherOrAdmin && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc muốn xóa bài giảng ${lesson.title}?`)) {
                              onDeleteLesson(lesson.id, lesson.storagePath);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span className="font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Vào học</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Adaptive Lesson Viewer Modal */}
      {activeLesson && (
        <AdaptiveLessonViewer
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onTakeExam={onTakeExam}
        />
      )}

    </div>
  );
};
