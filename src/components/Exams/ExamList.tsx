import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  HelpCircle, 
  Award, 
  Lock, 
  Unlock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Eye, 
  Edit, 
  Trash2,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Exam, ExamAttempt, User, Subject, GradeLevel } from '../../types';
import { LogIn } from 'lucide-react';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';
import { RejectModal } from '../Admin/RejectModal';

interface ExamListProps {
  exams: Exam[];
  attempts: ExamAttempt[];
  currentUser: User;
  onStartExam: (exam: Exam, accessCode?: string) => void;
  onViewAttempt: (attempt: ExamAttempt) => void;
  onCreateExam: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onApproveExam?: (id: string) => void;
  onRejectExam?: (id: string, reason: string) => void;
  onNavigateToLogin?: () => void;
}

const SUBJECT_LIST: ('Tất cả' | Subject)[] = [
  'Tất cả',
  'Tin học'
];

const GRADE_LIST = ['Tất cả', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

export const ExamList: React.FC<ExamListProps> = ({
  exams,
  attempts,
  currentUser,
  onStartExam,
  onViewAttempt,
  onCreateExam,
  onEditExam,
  onDeleteExam,
  onApproveExam,
  onRejectExam,
  onNavigateToLogin
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'Tất cả' | Subject>('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState<string>('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'upcoming' | 'closed'>('all');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState<Record<string, string>>({});
  const [activeCodeExamId, setActiveCodeExamId] = useState<string | null>(null);
  const [rejectExamTarget, setRejectExamTarget] = useState<Exam | null>(null);

  const isModerator = isTeacherToanOrAdmin(currentUser);
  const isTeacher = currentUser.role === 'teacher';
  const canManageExams = isModerator || isTeacher || currentUser.role === 'admin';

  const pendingCount = exams.filter(e => e.approvalStatus === 'pending_approval').length;

  // Filter exams
  const filteredExams = exams.filter(exam => {
    // Permission visibility
    if (!isModerator) {
      if (isTeacher) {
        const isAuthor = exam.createdBy === currentUser.name;
        const isApproved = exam.approvalStatus === 'approved' || exam.approvalStatus === undefined;
        if (!isApproved && !isAuthor) return false;
      } else {
        const isApproved = exam.approvalStatus === 'approved' || exam.approvalStatus === undefined;
        if (!isApproved) return false;
      }
    }

    // Moderation tab filter
    if (isModerator && moderationFilter !== 'all') {
      if (moderationFilter === 'pending' && exam.approvalStatus !== 'pending_approval') return false;
      if (moderationFilter === 'approved' && exam.approvalStatus !== 'approved' && exam.approvalStatus !== undefined) return false;
      if (moderationFilter === 'rejected' && exam.approvalStatus !== 'rejected') return false;
    }

    const matchSubject = selectedSubject === 'Tất cả' || exam.subject === selectedSubject;
    const matchGrade = selectedGrade === 'Tất cả' || `Lớp ${exam.grade}` === selectedGrade;
    const matchStatus = selectedStatus === 'all' || exam.status === selectedStatus;
    const matchQuery = 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchGrade && matchStatus && matchQuery;
  });

  // Check student attempts for an exam
  const getStudentAttemptsForExam = (examId: string) => {
    return attempts.filter(a => a.examId === examId && a.studentId === currentUser.id);
  };

  const handleStartExamClick = (exam: Exam) => {
    if (exam.accessCode) {
      setActiveCodeExamId(exam.id);
    } else {
      onStartExam(exam);
    }
  };

  const handleConfirmAccessCode = (exam: Exam) => {
    const code = accessCodeInput[exam.id] || '';
    if (code.trim().toUpperCase() !== exam.accessCode?.toUpperCase()) {
      alert('Mã truy cập phòng thi không chính xác! Vui lòng hỏi lại giáo viên.');
      return;
    }
    setActiveCodeExamId(null);
    onStartExam(exam, code);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Khảo Thí Trực Tuyến Chuẩn GDPT 2018
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Hệ Thống Phòng Thi & Đề Kiểm Tra Trực Tuyến
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Môi trường làm bài thi trắc nghiệm và tự luận chuẩn mực, tự động chấm điểm, phân tích lời giải chi tiết và tích hợp cảnh báo giám thị chống gian lận.
            </p>
          </div>

          {canManageExams ? (
            <button
              onClick={onCreateExam}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-lg hover:shadow-xl transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề kiểm tra mới</span>
            </button>
          ) : onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Đăng nhập Giáo viên để tạo đề</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Moderation tabs (if moderator) */}
        {isModerator && (
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Kiểm duyệt đề thi:
            </span>
            <button
              onClick={() => setModerationFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moderationFilter === 'all'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({exams.length})
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

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {GRADE_LIST.map(gr => (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGrade === gr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm đề thi, mã đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Môn:
          </span>
          {SUBJECT_LIST.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                selectedSubject === sub
                  ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Danh sách đề thi ({filteredExams.length})</span>
          <span>Học kỳ II</span>
        </div>

        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy bài kiểm tra nào phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng thay đổi bộ lọc môn học hoặc khối lớp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map(exam => {
              const myAttempts = getStudentAttemptsForExam(exam.id);
              const hasCompleted = myAttempts.length > 0;
              const bestScore = hasCompleted
                ? Math.max(...myAttempts.map(a => a.score))
                : null;
              const remainingAttempts = exam.maxAttempts - myAttempts.length;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800">
                          {exam.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          Khối {exam.grade}
                        </span>
                        {exam.approvalStatus === 'pending_approval' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                            <Clock className="w-3 h-3" />
                            Chờ duyệt
                          </span>
                        )}
                        {exam.approvalStatus === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                            <XCircle className="w-3 h-3" />
                            Bị từ chối
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-semibold text-slate-400">
                        {exam.code}
                      </span>
                    </div>

                    {/* Moderation Action Banner on Exam Card */}
                    {exam.approvalStatus === 'pending_approval' && (
                      <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 flex items-center justify-between text-xs">
                        <span className="text-amber-900 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {isModerator ? 'GV gửi duyệt:' : 'Chờ Thầy Toàn / Admin duyệt'}
                        </span>
                        {isModerator && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onApproveExam) onApproveExam(exam.id);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectExamTarget(exam);
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

                    {exam.approvalStatus === 'rejected' && exam.rejectionReason && (
                      <div className="bg-rose-50 rounded-xl border border-rose-200 p-2.5 text-xs text-rose-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]"><strong>Lý do từ chối:</strong> {exam.rejectionReason}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {exam.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Thời gian: <strong>{exam.durationMinutes} phút</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Số lượng: <strong>{exam.questions.length} câu</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Điểm tối đa: <strong>{exam.maxScore} đ</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {exam.accessCode ? (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold">
                            <Lock className="w-3.5 h-3.5" /> Có mật mã
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <Unlock className="w-3.5 h-3.5" /> Tự do
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target classes & author */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Lớp áp dụng: {exam.targetClasses.join(', ')}</span>
                      <span>{exam.createdBy}</span>
                    </div>

                    {/* Student Attempt History Badge */}
                    {hasCompleted && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Điểm cao nhất: <strong>{bestScore}/10</strong> ({myAttempts.length}/{exam.maxAttempts} lượt)</span>
                        </div>
                        <button
                          onClick={() => onViewAttempt(myAttempts[0])}
                          className="text-xs text-blue-600 hover:underline font-bold"
                        >
                          Xem lại
                        </button>
                      </div>
                    )}

                    {/* Access Code Input Form */}
                    {activeCodeExamId === exam.id && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                        <p className="font-semibold text-amber-900 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Nhập mật mã phòng thi do GV cung cấp:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="VD: TOAN9GK2"
                            value={accessCodeInput[exam.id] || ''}
                            onChange={(e) => setAccessCodeInput({ ...accessCodeInput, [exam.id]: e.target.value })}
                            className="flex-1 px-2.5 py-1.5 rounded-md border border-amber-300 bg-white font-mono text-xs uppercase focus:ring-2 focus:ring-amber-500 outline-hidden"
                          />
                          <button
                            onClick={() => handleConfirmAccessCode(exam)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md"
                          >
                            Vào thi
                          </button>
                          <button
                            onClick={() => setActiveCodeExamId(null)}
                            className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {canManageExams ? (
                      <div className="flex items-center space-x-2 w-full justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditExam(exam)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-md text-xs font-semibold flex items-center gap-1"
                            title="Sửa đề thi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sửa đề</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xác nhận xóa đề thi: "${exam.title}"?`)) {
                                onDeleteExam(exam.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-white rounded-md text-xs font-semibold flex items-center gap-1"
                            title="Xóa đề"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>

                        <button
                          onClick={() => onStartExam(exam)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Xem trước / Thử</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-500">
                          {remainingAttempts > 0 
                            ? `Còn ${remainingAttempts} lượt làm` 
                            : 'Đã hết lượt làm'}
                        </span>

                        <button
                          disabled={remainingAttempts <= 0}
                          onClick={() => handleStartExamClick(exam)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
                            remainingAttempts > 0
                              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{hasCompleted ? 'Làm lại bài thi' : 'Bắt đầu làm bài'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Reject Modal for Exam */}
      {rejectExamTarget && (
        <RejectModal
          isOpen={!!rejectExamTarget}
          itemType="đề kiểm tra"
          itemTitle={rejectExamTarget.title}
          onConfirm={(reason) => {
            if (onRejectExam) {
              onRejectExam(rejectExamTarget.id, reason);
            }
            setRejectExamTarget(null);
          }}
          onClose={() => setRejectExamTarget(null)}
        />
      )}

    </div>
  );
};
