import React, { useState } from 'react';
import { AlertCircle, X, Send, Ban } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  itemType: 'bài viết' | 'đề thi' | 'tài liệu học tập';
  itemTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  itemType,
  itemTitle,
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối để giáo viên nắm rõ và chỉnh sửa!');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
    onClose();
  };

  const sampleReasons = [
    'Nội dung cần bổ sung thêm giải thích chi tiết',
    'Hình ảnh minh họa chưa rõ ràng hoặc không phù hợp',
    'Cần kiểm tra lại đáp án và ma trận đề thi',
    'Định dạng tài liệu chưa đúng quy chuẩn 5512'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-red-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-rose-200">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Từ chối phê duyệt {itemType}
              </h3>
              <p className="text-xs text-rose-200 line-clamp-1 max-w-xs">
                {itemTitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do hoặc yêu cầu chỉnh sửa gửi đến Giáo viên <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Nhập lý do cụ thể để giáo viên biết và bổ sung (Ví dụ: Cần cập nhật lại slide bài giảng phần 2)..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-hidden bg-slate-50 focus:bg-white transition-all resize-none"
            />
            {error && (
              <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1.5">Gợi ý lý do nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleReasons.map((r, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setReason(r)}
                  className="text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi phản hồi & Từ chối</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
