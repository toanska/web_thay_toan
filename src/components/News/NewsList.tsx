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
  TrendingUp
} from 'lucide-react';
import { NewsArticle, User } from '../../types';
import { LogIn } from 'lucide-react';

interface NewsListProps {
  news: NewsArticle[];
  currentUser: User;
  onSelectArticle: (article: NewsArticle) => void;
  onCreateArticle: () => void;
  onEditArticle: (article: NewsArticle) => void;
  onDeleteArticle: (id: string) => void;
  onLikeArticle: (id: string) => void;
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
  onNavigateToLogin
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNews = news.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchQuery = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  const pinnedNews = filteredNews.filter(n => n.isPinned);
  const regularNews = filteredNews.filter(n => !n.isPinned);

  const canManageNews = currentUser.role === 'teacher' || currentUser.role === 'admin';

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

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
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
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 backdrop-blur-xs text-white border border-white/20">
                      {item.category}
                    </span>
                  </div>
                </div>

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
    </div>
  );
};
