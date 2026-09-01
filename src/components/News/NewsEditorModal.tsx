import React, { useState } from 'react';
import { X, Save, Sparkles, Image, Tag, Pin, BookOpen } from 'lucide-react';
import { NewsArticle, User } from '../../types';

interface NewsEditorModalProps {
  articleToEdit?: NewsArticle | null;
  currentUser: User;
  onSave: (article: NewsArticle) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Thông báo chung',
  'Góc học tập'
] as const;

export const NewsEditorModal: React.FC<NewsEditorModalProps> = ({
  articleToEdit,
  currentUser,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState(articleToEdit?.title || '');
  const [category, setCategory] = useState<NewsArticle['category']>(articleToEdit?.category || 'Thông báo chung');
  const [summary, setSummary] = useState(articleToEdit?.summary || '');
  const [content, setContent] = useState(articleToEdit?.content || '');
  const [featuredImage, setFeaturedImage] = useState(articleToEdit?.featuredImage || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80');
  const [isPinned, setIsPinned] = useState(articleToEdit?.isPinned ?? false);
  const [tagInput, setTagInput] = useState(articleToEdit?.tags.join(', ') || 'THCS Nguyễn Du, Khảo thí, Thông báo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết!');
      return;
    }

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updatedArticle: NewsArticle = {
      id: articleToEdit?.id || 'news-' + Date.now(),
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
      category,
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      featuredImage: featuredImage.trim(),
      publishedAt: articleToEdit?.publishedAt || new Date().toISOString().split('T')[0],
      authorName: articleToEdit?.authorName || currentUser.name,
      authorTitle: articleToEdit?.authorTitle || (currentUser.role === 'teacher' ? 'Giáo viên bộ môn' : 'Ban Giám Hiệu'),
      views: articleToEdit?.views || 10,
      likes: articleToEdit?.likes || 0,
      isPinned,
      tags,
      attachments: articleToEdit?.attachments || [
        { name: 'Thong_bao_nha_truong.pdf', size: '1.2 MB' }
      ],
      comments: articleToEdit?.comments || []
    };

    onSave(updatedArticle);
  };

  const sampleImages = [
    { label: 'Trường học & Thi cử', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80' },
    { label: 'Học sinh & Lớp học', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80' },
    { label: 'Sách & Góc học tập', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
    { label: 'Thư viện & Đọc sách', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {articleToEdit ? 'Chỉnh sửa tin tức / thông báo' : 'Soạn bài viết / thông báo mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tiêu đề bài viết <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thông báo Lịch khảo sát chất lượng giữa học kỳ II..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden font-semibold text-slate-900"
            />
          </div>

          {/* Category & Pinned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chuyên mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-slate-800"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded-md text-amber-500 focus:ring-amber-400 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  Ghim lên đầu trang chủ
                </span>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tóm tắt ngắn gọn
            </label>
            <textarea
              rows={2}
              placeholder="Tóm tắt nội dung chính trong 1-2 câu để hiển thị ở danh sách bài viết..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ảnh bìa bài viết (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800"
              />
            </div>

            {/* Quick sample pick */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Chọn mẫu nhanh:</span>
              {sampleImages.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFeaturedImage(s.url)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nội dung chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={8}
              required
              placeholder="Nội dung thông báo, hướng dẫn, thể lệ thi hoặc chia sẻ kinh nghiệm học tập..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800 font-mono"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thẻ từ khóa (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              placeholder="VD: Lịch thi, Khối 9, Toán học, GDPT 2018"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{articleToEdit ? 'Lưu thay đổi' : 'Đăng bài viết'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
