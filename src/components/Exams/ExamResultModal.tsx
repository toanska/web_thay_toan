import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Printer, 
  RotateCcw, 
  HelpCircle, 
  Sparkles,
  BookOpen,
  Share2,
  Calendar
} from 'lucide-react';
import { Exam, ExamAttempt, Question } from '../../types';

interface ExamResultModalProps {
  attempt: ExamAttempt;
  exam?: Exam | null;
  onClose: () => void;
  onRetake?: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  attempt,
  exam,
  onClose,
  onRetake
}) => {
  useEffect(() => {
    if (attempt.score >= 8.0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [attempt.score]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const getRankBadge = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất Sắc', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (score >= 8.0) return { label: 'Giỏi', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (score >= 6.5) return { label: 'Khá', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (score >= 5.0) return { label: 'Trung Bình', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    return { label: 'Chưa Đạt', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const rank = getRankBadge(attempt.score);
  const correctCount = attempt.questionResults.filter(q => q.isCorrect).length;
  const totalCount = attempt.questionResults.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 print:max-h-none print:shadow-none print:rounded-none">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Phiếu Báo Kết Quả Khảo Thí Trực Tuyến
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Printable Official School Header */}
          <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TRƯỜNG THCS NGUYỄN DU • HỆ THỐNG e-TESTING</p>
              <h1 className="text-xl font-extrabold text-slate-900 font-serif mt-1">
                {attempt.examTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Môn: {attempt.subject} • Khối {attempt.grade} • Ngày nộp: {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white text-center shadow-md shrink-0">
              <span className="text-[11px] text-blue-200 block uppercase font-bold tracking-wider">ĐIỂM SỐ ĐẠT ĐƯỢC</span>
              <span className="text-3xl font-black text-amber-300 font-mono">
                {attempt.score.toFixed(1)}
              </span>
              <span className="text-xs text-blue-200"> / {attempt.maxScore.toFixed(1)}</span>
            </div>
          </div>

          {/* Student Info Card & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Họ và tên thí sinh:</span>
              <strong className="text-slate-900 font-bold">{attempt.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lớp & Mã học sinh:</span>
              <strong className="text-slate-900">{attempt.studentClass} ({attempt.studentCode})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Thời gian làm bài:</span>
              <strong className="text-slate-900">{formatDuration(attempt.durationSeconds)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Xếp loại học lực:</span>
              <span className={`inline-block px-2 py-0.5 rounded-md font-extrabold text-[11px] border ${rank.bg}`}>
                {rank.label}
              </span>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-emerald-700 font-semibold block text-[11px]">Đúng</span>
                <strong className="text-lg font-black text-emerald-900">{correctCount} / {totalCount}</strong>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-rose-700 font-semibold block text-[11px]">Sai / Bỏ trống</span>
                <strong className="text-lg font-black text-rose-900">{totalCount - correctCount} câu</strong>
              </div>
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-blue-700 font-semibold block text-[11px]">Tỉ lệ hoàn thành</span>
                <strong className="text-lg font-black text-blue-900">{attempt.percentage}%</strong>
              </div>
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Giám thị</span>
                <strong className={`text-xs font-bold ${attempt.tabSwitchCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {attempt.tabSwitchCount === 0 ? 'Chuẩn mực (0)' : `${attempt.tabSwitchCount} lần đổi tab`}
                </strong>
              </div>
              <ShieldAlert className={`w-6 h-6 ${attempt.tabSwitchCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Teacher feedback quote */}
          {attempt.feedback && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Nhận xét & Đánh giá năng lực:
              </span>
              <p className="italic text-slate-700">{attempt.feedback}</p>
            </div>
          )}

          {/* Detailed Question Review Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Chi Tiết Toàn Bộ Bài Làm & Lời Giải Hướng Dẫn ({attempt.questionResults.length} câu)
            </h3>

            <div className="space-y-4">
              {attempt.questionResults.map((result, idx) => {
                const questionObj = exam?.questions.find(q => q.id === result.questionId);
                const isCorrect = result.isCorrect;
                const content = result.questionText || questionObj?.content || `Câu hỏi #${idx + 1}`;
                const options = result.options || questionObj?.options;
                const correctAnswers = result.correctAnswers || questionObj?.correctAnswers || [];
                const explanation = result.explanation || questionObj?.explanation;
                const qType = result.questionType || questionObj?.type || 'multiple_choice';

                return (
                  <div
                    key={result.questionId || idx}
                    className={`p-4 sm:p-5 rounded-xl border-2 space-y-3 transition-all ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    {/* Header of question review */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {isCorrect ? 'Đúng' : 'Sai'} ({result.pointsAwarded}/{result.maxPoints} đ)
                        </span>
                      </div>

                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Chính xác
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-700 font-bold">
                          <XCircle className="w-4 h-4" /> Chưa đúng
                        </span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="text-sm text-slate-900 font-medium leading-relaxed">
                      {content}
                    </div>

                    {/* Options Breakdown */}
                    {options && options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {options.map((opt, optIdx) => {
                          let isStudentSelected = false;
                          if (Array.isArray(result.studentAnswer)) {
                            isStudentSelected = result.studentAnswer.includes(optIdx);
                          } else {
                            isStudentSelected = result.studentAnswer === optIdx;
                          }
                          const isCorrectOption = correctAnswers.includes(optIdx);
                          const letter = String.fromCharCode(65 + optIdx);

                          let style = 'border-slate-200 bg-white text-slate-700';
                          if (isCorrectOption) {
                            style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          }
                          if (isStudentSelected && !isCorrectOption) {
                            style = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                          }

                          return (
                            <div key={optIdx} className={`p-2.5 rounded-lg border flex items-center space-x-2 ${style}`}>
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {letter}
                              </span>
                              <span className="truncate">{opt}</span>
                              {isStudentSelected && (
                                <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-900 font-bold shrink-0">
                                  Học sinh chọn
                                </span>
                              )}
                              {isCorrectOption && (
                                <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-sm bg-emerald-200 text-emerald-900 font-bold shrink-0">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill in & Essay Answers */}
                    {(!options || qType === 'fill_in' || qType === 'essay') && (
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-400 block text-[11px]">Câu trả lời của học sinh:</span>
                          <strong className="text-slate-800">{String(result.studentAnswer ?? '(Chưa trả lời)')}</strong>
                        </div>
                        {correctAnswers && correctAnswers.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                            <span className="text-emerald-700 block text-[11px] font-semibold">Đáp án chuẩn / Hướng dẫn chấm:</span>
                            <strong>{correctAnswers.join(' hoặc ')}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher Explanation */}
                    {explanation && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                          Hướng dẫn giải chi tiết:
                        </p>
                        <p className="leading-relaxed text-slate-800 font-normal">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu điểm</span>
          </button>

          <div className="flex items-center space-x-2">
            {onRetake && (
              <button
                onClick={onRetake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài thi</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
