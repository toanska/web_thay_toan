import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  MessageSquare, 
  Calendar, 
  User as UserIcon, 
  Share2, 
  Download, 
  Tag, 
  Pin, 
  Send,
  Sparkles,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { NewsArticle, User } from '../../types';

interface NewsDetailModalProps {
  article: NewsArticle;
  currentUser: User;
  onClose: () => void;
  onLike: (id: string) => void;
  onAddComment: (articleId: string, content: string) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  currentUser,
  onClose,
  onLike,
  onAddComment
}) => {
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(article.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {article.category}
            </span>
            {article.isPinned && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                <Pin className="w-3 h-3" />
                Đã ghim
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Article Title */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug font-serif">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  {article.authorName} ({article.authorTitle || 'Ban Biên Tập'})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.publishedAt}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100 max-h-80">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Summary Quote */}
          {article.summary && (
            <div className="p-4 rounded-xl bg-blue-50/60 border-l-4 border-blue-600 text-slate-700 text-sm italic leading-relaxed">
              {article.summary}
            </div>
          )}

          {/* Full Markdown-styled Content */}
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-normal">
            {article.content}
          </div>

          {/* Attachments Section */}
          {article.attachments && article.attachments.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Tệp đính kèm văn bản ({article.attachments.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {article.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 transition-all text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">({file.size})</span>
                    </div>
                    <button
                      onClick={() => alert(`Tải xuống tệp: ${file.name}`)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md shrink-0 ml-2"
                      title="Tải về"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Từ khóa:
              </span>
              {article.tags.map(t => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Likes and Interactivity */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => onLike(article.id)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors"
            >
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>Yêu thích ({article.likes})</span>
            </button>

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {article.comments?.length || 0} bình luận
            </span>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Bình luận & Thảo luận ({article.comments?.length || 0})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Bình luận với tư cách ${currentUser.name}...`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 disabled:text-slate-300 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Comment List */}
            <div className="space-y-3 pt-2">
              {(!article.comments || article.comments.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
              ) : (
                article.comments.map(c => (
                  <div key={c.id} className="flex space-x-3 p-3 rounded-xl bg-slate-50 text-xs">
                    <img
                      src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={c.authorName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          {c.authorName}
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold uppercase ${
                            c.authorRole === 'student' ? 'bg-sky-100 text-sky-700' :
                            c.authorRole === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {c.authorRole === 'student' ? 'Học sinh' : c.authorRole === 'teacher' ? 'Giáo viên' : 'Admin'}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
