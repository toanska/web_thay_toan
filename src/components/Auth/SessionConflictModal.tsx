import React from 'react';
import { ShieldAlert, LogIn, AlertTriangle, Monitor, X } from 'lucide-react';

interface SessionConflictModalProps {
  isOpen: boolean;
  userName: string;
  userCode: string;
  newDevice?: string;
  onClose: () => void;
  onReLogin: () => void;
}

export const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  isOpen,
  userName,
  userCode,
  newDevice,
  onClose,
  onReLogin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-serif">
                Phiên Đăng Nhập Đã Kết Thúc
              </h3>
              <p className="text-xs text-rose-100">
                Quy định bảo mật đăng nhập 1 thiết bị
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 mb-1">Phát hiện đăng nhập trên thiết bị khác</p>
              <p>
                Tài khoản <span className="font-bold">{userName}</span> (<span className="font-mono font-semibold">{userCode}</span>) vừa đăng nhập trên một thiết bị / trình duyệt mới.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Thiết bị đang đăng nhập:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                {newDevice || 'Thiết bị trình duyệt mới'}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 text-slate-600 leading-relaxed">
              Theo quy định phòng chống gian lận thi cử và bảo mật dữ liệu, <strong>mỗi tài khoản chỉ được duy trì hoạt động trên 01 thiết bị duy nhất</strong>. Thiết bị này đã tự động được đăng xuất về chế độ Khách.
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Xem chế độ Khách
            </button>
            <button
              onClick={onReLogin}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập lại tại đây</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
