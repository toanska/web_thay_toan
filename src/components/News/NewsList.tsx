import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar, 
  User as UserIcon, 
  Paperclip, 
  Tag, 
  Share2, 
  Edit3, 
  Trash2,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { NewsArticle, User } from '../../types';
import { LogIn } from 'lucide-react';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';
import { RejectModal } from '../Admin/RejectModal';

interface NewsListProps {
  news: NewsArticle[];
  currentUser: User;
  onSelectArticle: (article: NewsArticle) => void;
  onCreateArticle: () => void;
  onEditArticle: (article: NewsArticle) => void;
  onDeleteArticle: (id: string) => void;
  onLikeArticle: (id: string) => void;
  onApproveArticle?: (id: string) => void;
  onRejectArticle?: (id: string, reason: string) => void;
  onNavigateToLogin?: () => void;
}

const CATEGORIES = [
  'Tất cả',
  'Thông báo chung',
  'Góc học tập'
];

export const NewsList: React.FC<NewsListProps> = ({
  news,
  currentUser,
  onSelectArticle,
  onCreateArticle,
  onEditArticle,
  onDeleteArticle,
  onLikeArticle,
  onApproveArticle,
  onRejectArticle,
  onNavigateToLogin
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rejection modal state
  const [rejectArticleTarget, setRejectArticleTarget] = useState<NewsArticle | null>(null);

  const isModerator = isTeacherToanOrAdmin(currentUser);
  const isTeacher = currentUser.role === 'teacher';
  const canManageNews = isTeacher || currentUser.role === 'admin';

  // Count pending articles
  const pendingCount = news.filter(n => n.approvalStatus === 'pending_approval').length;

  const filteredNews = news.filter(item => {
    // Permission visibility rules
    if (!isModerator) {
      if (isTeacher) {
        // Teachers see approved articles OR articles authored by themselves
        const isAuthor = item.authorName === currentUser.name;
        const isApproved = item.approvalStatus === 'approved' || item.approvalStatus === undefined;
        if (!isApproved && !isAuthor) return false;
      } else {
        // Students & Guests only see approved articles
        const isApproved = item.approvalStatus === 'approved' || item.approvalStatus === undefined;
        if (!isApproved) return false;
      }
    }

    // Moderation filter for moderators/teachers
    if (isModerator && moderationFilter !== 'all') {
      if (moderationFilter === 'pending' && item.approvalStatus !== 'pending_approval') return false;
      if (moderationFilter === 'approved' && item.approvalStatus !== 'approved' && item.approvalStatus !== undefined) return false;
      if (moderationFilter === 'rejected' && item.approvalStatus !== 'rejected') return false;
    }

    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchQuery = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  const pinnedNews = filteredNews.filter(n => n.isPinned);
  const regularNews = filteredNews.filter(n => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Bản Tin & Thông Báo Khảo Thí THCS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Thông Tin Giáo Dục & Hoạt Động Nhà Trường
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Cập nhật lịch thi, kế hoạch khảo sát chất lượng, hoạt động Đoàn - Đội, tài liệu học tập và tin tức mới nhất từ Ban Giám Hiệu.
            </p>
          </div>

          {canManageNews ? (
            <button
              onClick={onCreateArticle}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-lg hover:shadow-xl transition-all transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng tin thông báo mới</span>
            </button>
          ) : onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Đăng nhập Giáo viên để đăng tin</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills, Moderation Filter & Search */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Moderation tabs (if moderator) */}
        {isModerator && (
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Kiểm duyệt bài viết:
            </span>
            <button
              onClick={() => setModerationFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moderationFilter === 'all'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({news.length})
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

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tin tức, thông báo, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pinned News Highlight Section */}
      {pinnedNews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5" />
            <span>Thông báo ghim quan trọng ({pinnedNews.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNews.map(item => (
              <div
                key={item.id}
                className="group relative bg-amber-50/40 border border-amber-200 hover:border-amber-300 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.publishedAt}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectArticle(item)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors cursor-pointer line-clamp-2"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {item.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {item.views}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {canManageNews && (
                        <div className="flex items-center space-x-1 mr-2">
                          <button
                            onClick={() => onEditArticle(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-sm hover:bg-white"
                            title="Sửa tin"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xác nhận xóa bài viết: "${item.title}"?`)) {
                                onDeleteArticle(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-sm hover:bg-white"
                            title="Xóa tin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => onSelectArticle(item)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
                      >
                        Đọc chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Tất cả bài viết ({filteredNews.length})
          </span>
          <span className="text-slate-400">Trang 1 / 1</span>
        </div>

        {filteredNews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy bài viết nào phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển danh mục</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map(item => (
              <article
                key={item.id}
                className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                {/* Thumbnail Image */}
                <div 
                  className="h-44 w-full overflow-hidden bg-slate-100 relative cursor-pointer"
                  onClick={() => onSelectArticle(item)}
                >
                  <img
                    src={item.featuredImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 backdrop-blur-xs text-white border border-white/20">
                      {item.category}
                    </span>
                    {item.approvalStatus === 'pending_approval' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3" />
                        Chờ duyệt
                      </span>
                    )}
                    {item.approvalStatus === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                        <XCircle className="w-3 h-3" />
                        Bị từ chối
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Action Banner on Card */}
                {item.approvalStatus === 'pending_approval' && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isModerator ? 'Bài của giáo viên gửi duyệt:' : 'Đang chờ Thầy Toàn / Admin duyệt'}
                    </span>
                    {isModerator && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onApproveArticle) onApproveArticle(item.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectArticleTarget(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {item.approvalStatus === 'rejected' && item.rejectionReason && (
                  <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Lý do từ chối:</strong> {item.rejectionReason}</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.publishedAt}
                      </span>
                      <span>{item.authorTitle || item.authorName}</span>
                    </div>

                    <h3
                      onClick={() => onSelectArticle(item)}
                      className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeArticle(item.id);
                        }}
                        className="flex items-center gap-1 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                        <span>{item.likes}</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{item.comments?.length || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{item.views}</span>
                      </span>
                    </div>

                    {canManageNews && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onEditArticle(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-sm"
                          title="Sửa tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xác nhận xóa bài viết: "${item.title}"?`)) {
                              onDeleteArticle(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-sm"
                          title="Xóa tin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {/* Reject Modal */}
      {rejectArticleTarget && (
        <RejectModal
          isOpen={!!rejectArticleTarget}
          itemType="bài viết"
          itemTitle={rejectArticleTarget.title}
          onConfirm={(reason) => {
            if (onRejectArticle) {
              onRejectArticle(rejectArticleTarget.id, reason);
            }
            setRejectArticleTarget(null);
          }}
          onClose={() => setRejectArticleTarget(null)}
        />
      )}
    </div>
  );
};
