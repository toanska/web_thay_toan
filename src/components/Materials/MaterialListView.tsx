import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Filter, 
  Pin, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  FileText, 
  Presentation, 
  File, 
  FileSpreadsheet, 
  FileArchive, 
  Video, 
  Sparkles, 
  Calendar, 
  User as UserIcon, 
  CheckCircle2,
  Tag,
  Share2,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Laptop,
  Clock,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Check
} from 'lucide-react';
import { LessonMaterial, GradeLevel, MaterialType, User } from '../../types';
import { MaterialUploadModal } from './MaterialUploadModal';
import { MaterialDetailModal } from './MaterialDetailModal';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';
import { RejectModal } from '../Admin/RejectModal';

interface MaterialListViewProps {
  materials: LessonMaterial[];
  currentUser: User;
  onSaveMaterial: (material: LessonMaterial) => void;
  onDeleteMaterial: (id: string) => void;
  onIncrementDownload: (id: string) => void;
  onIncrementView: (id: string) => void;
  onApproveMaterial?: (id: string) => void;
  onRejectMaterial?: (id: string, reason: string) => void;
  onNavigateToLogin?: () => void;
}

export const MaterialListView: React.FC<MaterialListViewProps> = ({
  materials,
  currentUser,
  onSaveMaterial,
  onDeleteMaterial,
  onIncrementDownload,
  onIncrementView,
  onApproveMaterial,
  onRejectMaterial,
  onNavigateToLogin
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<MaterialType>('all');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'views' | 'title'>('newest');
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LessonMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<LessonMaterial | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rejectMaterialTarget, setRejectMaterialTarget] = useState<LessonMaterial | null>(null);

  const isModerator = isTeacherToanOrAdmin(currentUser);
  const isTeacher = currentUser.role === 'teacher';
  const canManage = isModerator || isTeacher || currentUser.role === 'admin';

  // Count pending materials
  const pendingCount = useMemo(() => {
    return materials.filter(m => m.approvalStatus === 'pending_approval').length;
  }, [materials]);

  // Statistics
  const stats = useMemo(() => {
    const total = materials.length;
    const slides = materials.filter(m => m.type === 'slide').length;
    const lessonPlans = materials.filter(m => m.type === 'lesson_plan').length;
    const totalDownloads = materials.reduce((acc, m) => acc + (m.downloadCount || 0), 0);
    const totalViews = materials.reduce((acc, m) => acc + (m.viewCount || 0), 0);
    return { total, slides, lessonPlans, totalDownloads, totalViews };
  }, [materials]);

  // Filtered & Sorted list
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // Permission visibility rules
      if (!isModerator) {
        if (isTeacher) {
          const isAuthor = item.authorName === currentUser.name;
          const isApproved = item.approvalStatus === 'approved' || item.approvalStatus === undefined;
          if (!isApproved && !isAuthor) return false;
        } else {
          const isApproved = item.approvalStatus === 'approved' || item.approvalStatus === undefined;
          if (!isApproved) return false;
        }
      }

      // Moderation filter for moderators
      if (isModerator && moderationFilter !== 'all') {
        if (moderationFilter === 'pending' && item.approvalStatus !== 'pending_approval') return false;
        if (moderationFilter === 'approved' && item.approvalStatus !== 'approved' && item.approvalStatus !== undefined) return false;
        if (moderationFilter === 'rejected' && item.approvalStatus !== 'rejected') return false;
      }

      const matchGrade = selectedGrade === 'all' || item.grade === selectedGrade;
      const matchType = selectedType === 'all' || item.type === selectedType;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        item.title.toLowerCase().includes(query) ||
        (item.unit && item.unit.toLowerCase().includes(query)) ||
        item.authorName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));
      return matchGrade && matchType && matchQuery;
    }).sort((a, b) => {
      // Pinned items stay on top unless specific sort requested
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'downloads') {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [materials, selectedGrade, selectedType, searchQuery, sortBy, isModerator, isTeacher, currentUser.name, moderationFilter]);

  const pinnedList = filteredMaterials.filter(m => m.isPinned);
  const regularList = filteredMaterials.filter(m => !m.isPinned);

  // File Download Handler
  const handleDownload = (material: LessonMaterial) => {
    onIncrementDownload(material.id);

    if (material.fileUrl) {
      // If has Base64 or DataURL
      const a = document.createElement('a');
      a.href = material.fileUrl;
      a.download = material.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Generate formatted blob content
      const content = `TÊN TÀI LIỆU: ${material.title}\n` +
        `KHỐI LỚP: Tin học ${material.grade}\n` +
        `CHỦ ĐỀ: ${material.unit || 'Chương trình GDPT 2018'}\n` +
        `TÁC GIẢ: ${material.authorName}\n` +
        `NGÀY ĐĂNG: ${material.createdAt}\n` +
        `-----------------------------------------\n` +
        `MÔ TẢ:\n${material.description}\n\n` +
        `NỘI DUNG KẾ HOẠCH BÀI DẠY (GIÁO ÁN):\n${material.contentOutline || 'Chưa có đề cương chi tiết.'}\n\n` +
        `Hệ thống Kho Học Liệu & Bài Giảng Tin Học - Thầy Toàn`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.fileName.replace(/\.[^/.]+$/, '') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenDetail = (material: LessonMaterial) => {
    onIncrementView(material.id);
    setViewingMaterial(material);
  };

  const getFormatBadge = (format: LessonMaterial['fileFormat']) => {
    switch (format) {
      case 'pptx':
        return { label: 'PPTX', icon: Presentation, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'docx':
        return { label: 'DOCX', icon: FileText, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'pdf':
        return { label: 'PDF', icon: File, color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'xlsx':
        return { label: 'XLSX', icon: FileSpreadsheet, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'zip':
        return { label: 'ZIP', icon: FileArchive, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'mp4':
        return { label: 'MP4', icon: Video, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default:
        return { label: 'FILE', icon: File, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner & Quick Statistics */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kho Học Liệu Mở Môn Tin Học THCS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Kho Bài Giảng Điện Tử & Giáo Án (KHBD 5512)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Thư viện giáo án chuẩn Bộ GD&ĐT, Slide bài giảng PowerPoint tương tác, video hướng dẫn thực hành và tài liệu ôn tập Tin học Khối 6, 7, 8, 9.
            </p>
          </div>

          {/* Action Button: Upload */}
          <div className="flex flex-wrap items-center gap-3">
            {canManage ? (
              <button
                onClick={() => {
                  setEditingMaterial(null);
                  setIsUploadModalOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload Bài Giảng / Giáo Án</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-slate-200">
                <span>💡 Học sinh có thể đọc và tải toàn bộ học liệu miễn phí</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-xs text-slate-300 font-medium">Tổng số tài liệu</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-xs text-amber-300 font-medium">Bài giảng PowerPoint</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{stats.slides}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-xs text-blue-300 font-medium">Giáo án (KHBD 5512)</p>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{stats.lessonPlans}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-xs text-teal-300 font-medium">Tổng lượt tải & xem</p>
            <p className="text-xl sm:text-2xl font-black text-teal-400 mt-1">
              {(stats.totalDownloads + stats.totalViews).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Moderation tabs (if moderator) */}
        {isModerator && (
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Kiểm duyệt học liệu:
            </span>
            <button
              onClick={() => setModerationFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moderationFilter === 'all'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({materials.length})
            </button>
            <button
              onClick={() => setModerationFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                moderationFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ Thầy Toàn / Admin duyệt</span>
              {pendingCount > 0 && (
                <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setModerationFilter('approved')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moderationFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Đã duyệt
            </button>
            <button
              onClick={() => setModerationFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moderationFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Từ chối
            </button>
          </div>
        )}

        {/* Grade Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Khối lớp:</span>
            </span>
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGrade === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả các khối
            </button>
            {([6, 7, 8, 9] as GradeLevel[]).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Mới đăng nhất</option>
              <option value="downloads">Lượt tải nhiều nhất</option>
              <option value="views">Lượt xem nhiều nhất</option>
              <option value="title">Tên tiêu đề A - Z</option>
            </select>
          </div>
        </div>

        {/* Category Chips & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Material Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả loại
            </button>
            <button
              onClick={() => setSelectedType('slide')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'slide'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Bài giảng Slide PPT</span>
            </button>
            <button
              onClick={() => setSelectedType('lesson_plan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'lesson_plan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Giáo án (KHBD 5512)</span>
            </button>
            <button
              onClick={() => setSelectedType('lecture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'lecture'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video bài giảng</span>
            </button>
            <button
              onClick={() => setSelectedType('reference')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'reference'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <File className="w-3.5 h-3.5" />
              <span>Tài liệu & Đề cương</span>
            </button>
            <button
              onClick={() => setSelectedType('exercise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'exercise'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Code mẫu & Bài tập</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài giảng, giáo án, chủ đề..."
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

      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            📂
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-slate-500">
            Hãy thử thay đổi từ khóa tìm kiếm, bộ lọc khối lớp hoặc tải lên tài liệu mới.
          </p>
          {canManage && (
            <button
              onClick={() => {
                setEditingMaterial(null);
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              + Upload tài liệu ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const badge = getFormatBadge(mat.fileFormat);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={mat.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:shadow-lg ${
                  mat.isPinned 
                    ? 'border-amber-300 shadow-sm bg-gradient-to-b from-amber-50/20 to-white' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Top Section */}
                <div className="p-5 space-y-3 flex-1">
                  
                  {/* Category & Pin badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                        Tin học {mat.grade}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                      {mat.approvalStatus === 'pending_approval' && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3" />
                          Chờ duyệt
                        </span>
                      )}
                      {mat.approvalStatus === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                          <XCircle className="w-3 h-3" />
                          Bị từ chối
                        </span>
                      )}
                    </div>

                    {mat.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <Pin className="w-3 h-3 fill-amber-600 text-amber-600" />
                        <span>Ghim</span>
                      </span>
                    )}
                  </div>

                  {/* Moderation Action Banner on Material Card */}
                  {mat.approvalStatus === 'pending_approval' && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-semibold flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {isModerator ? 'Giáo viên gửi duyệt:' : 'Đang chờ Thầy Toàn / Admin duyệt'}
                      </span>
                      {isModerator && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onApproveMaterial) onApproveMaterial(mat.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Duyệt</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectMaterialTarget(mat);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {mat.approvalStatus === 'rejected' && mat.rejectionReason && (
                    <div className="bg-rose-50 rounded-xl border border-rose-200 p-2.5 text-xs text-rose-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="text-[11px]"><strong>Lý do từ chối:</strong> {mat.rejectionReason}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 
                    onClick={() => handleOpenDetail(mat)}
                    className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                    title={mat.title}
                  >
                    {mat.title}
                  </h3>

                  {/* Unit / Topic */}
                  {mat.unit && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{mat.unit}</span>
                    </p>
                  )}

                  {/* Description preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>

                  {/* Tags */}
                  {mat.tags && mat.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {mat.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                      {mat.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                          +{mat.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom Meta & Actions */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                  
                  {/* Meta: Author, Date, Stats */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mat.authorName}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-0.5" title="Lượt tải">
                        <Download className="w-3 h-3 text-slate-400" />
                        <span>{mat.downloadCount}</span>
                      </span>
                      <span className="flex items-center gap-0.5" title="Lượt xem">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{mat.viewCount}</span>
                      </span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDetail(mat)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Xem & Đọc</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMaterial(mat);
                              setIsUploadModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa bài giảng"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(mat.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa bài giảng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDownload(mat)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        title={`Tải file ${mat.fileName} (${mat.fileSize})`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải ({mat.fileSize})</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Edit Modal */}
      <MaterialUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingMaterial(null);
        }}
        onSave={(material) => {
          onSaveMaterial(material);
        }}
        editingMaterial={editingMaterial}
        currentUser={currentUser}
      />

      {/* Material Detail Viewer Modal */}
      <MaterialDetailModal
        material={viewingMaterial}
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Bài Giảng</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài giảng/giáo án này khỏi kho học liệu? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteMaterial(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal for Material */}
      {rejectMaterialTarget && (
        <RejectModal
          isOpen={!!rejectMaterialTarget}
          itemType="tài liệu học tập"
          itemTitle={rejectMaterialTarget.title}
          onConfirm={(reason) => {
            if (onRejectMaterial) {
              onRejectMaterial(rejectMaterialTarget.id, reason);
            }
            setRejectMaterialTarget(null);
          }}
          onClose={() => setRejectMaterialTarget(null)}
        />
      )}

    </div>
  );
};
