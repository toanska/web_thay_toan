import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  HelpCircle, 
  ShieldAlert, 
  Sparkles, 
  X,
  Maximize2,
  FileText
} from 'lucide-react';
import { Exam, Question, ExamAttempt, User, QuestionResult } from '../../types';

interface ExamTakingProps {
  exam: Exam;
  currentUser: User;
  onFinishExam?: (attempt: ExamAttempt) => void;
  onFinishAttempt?: (attempt: ExamAttempt) => void;
  onCancel: () => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  currentUser,
  onFinishExam,
  onFinishAttempt,
  onCancel
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [startTime] = useState(new Date().toISOString());
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatchFinish = useCallback((attempt: ExamAttempt) => {
    if (onFinishExam) onFinishExam(attempt);
    else if (onFinishAttempt) onFinishAttempt(attempt);
  }, [onFinishExam, onFinishAttempt]);

  // Anti-cheat tab switch listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const updated = prev + 1;
          setShowCheatWarning(true);
          return updated;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount(prev => {
        const updated = prev + 1;
        setShowCheatWarning(true);
        return updated;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Compute final score & question results
  const calculateResult = useCallback((submitType: 'manual' | 'timeout' = 'manual'): ExamAttempt => {
    let earnedPoints = 0;
    const totalMaxPoints = exam.questions.reduce((acc, q) => acc + (q.points || 1.0), 0);
    const questionResults: QuestionResult[] = [];

    exam.questions.forEach(q => {
      const studentAns = answers[q.id];
      const maxPts = q.points || 1.0;
      let isCorrect = false;
      let awarded = 0;

      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (studentAns !== undefined && q.correctAnswers.includes(studentAns)) {
          isCorrect = true;
          awarded = maxPts;
        }
      } else if (q.type === 'multi_select') {
        if (Array.isArray(studentAns)) {
          const correctSet = new Set(q.correctAnswers);
          const studentSet = new Set(studentAns);
          if (correctSet.size === studentSet.size && [...studentSet].every(val => correctSet.has(val))) {
            isCorrect = true;
            awarded = maxPts;
          }
        }
      } else if (q.type === 'fill_in') {
        if (studentAns !== undefined) {
          const cleanStudent = String(studentAns).trim().toLowerCase();
          const cleanCorrect = q.correctAnswers.map(c => String(c).trim().toLowerCase());
          if (cleanCorrect.includes(cleanStudent)) {
            isCorrect = true;
            awarded = maxPts;
          }
        }
      } else if (q.type === 'essay') {
        // For essays, automatically award partial points or mark pending teacher review
        if (studentAns && String(studentAns).trim().length > 10) {
          isCorrect = true;
          awarded = maxPts * 0.8; // default tentative score before teacher grade
        }
      }

      earnedPoints += awarded;
      questionResults.push({
        questionId: q.id,
        questionCode: q.code,
        questionText: q.content,
        questionType: q.type,
        options: q.options ? [...q.options] : undefined,
        correctAnswers: q.correctAnswers ? [...q.correctAnswers] : undefined,
        explanation: q.explanation || '',
        studentAnswer: studentAns !== undefined ? studentAns : null,
        isCorrect,
        pointsAwarded: Math.round(awarded * 100) / 100,
        maxPoints: maxPts,
        teacherFeedback: isCorrect ? 'Chính xác' : 'Cần ôn lại kiến thức phần này'
      });
    });

    const scaledScore = Math.round((earnedPoints / (totalMaxPoints || 1)) * exam.maxScore * 10) / 10;
    const percentage = Math.round((scaledScore / exam.maxScore) * 100);
    const passed = scaledScore >= exam.passingScore;

    const endTime = new Date().toISOString();
    const durationSeconds = exam.durationMinutes * 60 - timeLeftSeconds;

    const correctCount = questionResults.filter(q => q.isCorrect).length;
    const answeredCount = questionResults.filter(q => q.studentAnswer !== null && q.studentAnswer !== undefined).length;
    const wrongCount = answeredCount - correctCount;
    const unansweredCount = questionResults.length - answeredCount;

    return {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      examId: exam.id,
      examCode: exam.code,
      examTitle: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentClass: currentUser.className || '9A1',
      studentCode: currentUser.code,
      startTime,
      endTime,
      durationSeconds: Math.max(durationSeconds, 5),
      answers: { ...answers },
      score: scaledScore,
      maxScore: exam.maxScore,
      percentage,
      passed,
      tabSwitchCount,
      totalQuestions: exam.questions.length,
      correctAnswersCount: correctCount,
      wrongAnswersCount: Math.max(wrongCount, 0),
      unansweredCount,
      questionResults,
      submittedAt: endTime,
      feedback: scaledScore >= 8.5 
        ? 'Kết quả xuất sắc! Em đã nắm rất vững kiến thức và kỹ năng của bài kiểm tra.'
        : scaledScore >= 6.5 
        ? 'Làm bài khá tốt! Hãy xem lại các câu trả lời chưa chính xác để hoàn thiện hơn.'
        : scaledScore >= 5.0
        ? 'Đạt yêu cầu cơ bản. Cần dành thêm thời gian ôn tập lại lý thuyết và các dạng bài tập trọng tâm.'
        : 'Chưa đạt yêu cầu. Em cần xem kỹ lời giải chi tiết và liên hệ Thầy Toàn để được hướng dẫn thêm.',
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 80)}` : 'Web',
      submitType
    };
  }, [answers, currentUser, exam, startTime, tabSwitchCount, timeLeftSeconds]);

  // Countdown timer
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      // Auto submit on time out
      const attempt = calculateResult('timeout');
      dispatchFinish(attempt);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, calculateResult, dispatchFinish]);

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    const attempt = calculateResult('manual');
    setTimeout(() => {
      dispatchFinish(attempt);
    }, 300);
  };

  const currentQ = exam.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const totalCount = exam.questions.length;
  const isCurrentFlagged = !!flaggedQuestions[currentQ.id];

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (index: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: index
    }));
  };

  const handleSelectMultiOption = (index: number) => {
    const currentList: number[] = answers[currentQ.id] || [];
    const exists = currentList.includes(index);
    const updated = exists ? currentList.filter(i => i !== index) : [...currentList, index];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: updated
    }));
  };

  const handleFillInChange = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: text
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  return (
    <div className="min-h-[85vh] bg-slate-100/70 -m-4 sm:-m-6 p-4 sm:p-6 rounded-2xl flex flex-col space-y-4">
      {/* Top Floating Control Bar */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm font-serif">
            {exam.subject.slice(0, 1)}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1">
              {exam.title}
            </h2>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Mã đề: <strong>{exam.code}</strong></span>
              <span>•</span>
              <span>Thí sinh: <strong>{currentUser.name}</strong> ({currentUser.className || currentUser.code})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Anti-cheat badge */}
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Chuyển tab: {tabSwitchCount} lần</span>
            </div>
          )}

          {/* Timer Badge */}
          <div className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-inner ${
            timeLeftSeconds < 300
              ? 'bg-rose-500 text-white animate-pulse'
              : timeLeftSeconds < 600
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài thi</span>
          </button>
        </div>
      </div>

      {/* Main Testing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left: Question Content & Options (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-5">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs">
                  Câu {currentQuestionIndex + 1} / {totalCount}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm đơn' :
                   currentQ.type === 'multi_select' ? 'Nhiều lựa chọn' :
                   currentQ.type === 'true_false' ? 'Đúng / Sai' :
                   currentQ.type === 'fill_in' ? 'Điền khuyết' : 'Tự luận ngắn'}
                </span>
                <span className="text-xs text-slate-400 font-medium">({currentQ.points || 1.0} điểm)</span>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrentFlagged
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-600' : ''}`} />
                <span>{isCurrentFlagged ? 'Đã đánh dấu' : 'Xem lại sau'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
              {currentQ.content}
            </div>

            {/* Options Interactive Area */}
            <div className="pt-2">
              {/* Type: Multiple Choice & True / False */}
              {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = answers[currentQ.id] === idx;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`flex items-start space-x-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {letter}
                        </div>
                        <div className={`text-sm pt-0.5 leading-relaxed ${isSelected ? 'font-semibold text-blue-950' : 'text-slate-800'}`}>
                          {opt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type: Multi Select */}
              {currentQ.type === 'multi_select' && currentQ.options && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 italic mb-2">*(Câu hỏi này có thể có nhiều đáp án đúng, hãy tích chọn tất cả các đáp án phù hợp)*</p>
                  {currentQ.options.map((opt, idx) => {
                    const selectedList: number[] = answers[currentQ.id] || [];
                    const isSelected = selectedList.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectMultiOption(idx)}
                        className={`flex items-start space-x-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 rounded-md text-indigo-600 mt-0.5"
                        />
                        <div className={`text-sm ${isSelected ? 'font-semibold text-indigo-950' : 'text-slate-800'}`}>
                          {opt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type: Fill in the blank */}
              {currentQ.type === 'fill_in' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Nhập câu trả lời của bạn:
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập kết quả hoặc từ khóa chính xác..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleFillInChange(e.target.value)}
                    className="w-full p-3.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">Gợi ý: Kiểm tra kỹ định dạng số hoặc dấu câu trước khi chuyển câu.</p>
                </div>
              )}

              {/* Type: Essay */}
              {currentQ.type === 'essay' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Trình bày bài làm tự luận của bạn:
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Viết câu trả lời, lập luận hoặc các bước giải chi tiết..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleFillInChange(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm leading-relaxed outline-hidden"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Hệ thống tự động lưu bài viết.</span>
                    <span>{(answers[currentQ.id] || '').length} ký tự</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls (Prev / Next) */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {answeredCount}/{totalCount} câu đã làm
            </span>

            {currentQuestionIndex < totalCount - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
              >
                <span>Câu kế tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
              >
                <span>Hoàn thành & Nộp bài</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-36">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Bản đồ câu hỏi ({totalCount})
              </h3>
              <div className="text-xs font-bold text-blue-600">
                {Math.round((answeredCount / totalCount) * 100)}%
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
              />
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-1">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Đánh dấu</span>
              </div>
            </div>

            {/* Matrix of Question Badges */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = currentQuestionIndex === idx;

                let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                if (isAnswered) {
                  btnClass = 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs';
                }
                if (isFlagged) {
                  btnClass = 'bg-amber-400 text-slate-900 font-bold border-amber-500 ring-2 ring-amber-300';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-blue-500 ring-offset-2';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Exam Rules & Advice */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Lưu ý quy chế thi:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 pl-1">
                <li>Không mở tab mới hoặc ứng dụng khác.</li>
                <li>Hệ thống lưu bài tự động theo từng câu.</li>
                <li>Hết giờ hệ thống sẽ tự động nộp bài.</li>
              </ul>
            </div>

            {/* Cancel / Exit Exam */}
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn thoát khỏi bài thi? Mọi câu trả lời chưa nộp sẽ không được lưu điểm.')) {
                  onCancel();
                }
              }}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-rose-600 transition-colors"
            >
              Hủy bài thi và quay lại
            </button>
          </div>
        </div>
      </div>

      {/* Anti-cheat Modal Alert */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Cảnh Báo Giám Thị Trực Tuyến!
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                Phát hiện hành vi rời khỏi màn hình bài thi (Lần thứ {tabSwitchCount})
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quy chế thi trực tuyến THCS nghiêm cấm thí sinh chuyển tab hoặc mở ứng dụng tra cứu khác. Số lần chuyển tab sẽ được gửi trực tiếp vào báo cáo kết quả của Ban Giám Hiệu.
            </p>
            <button
              onClick={() => setShowCheatWarning(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Tôi đã hiểu và tiếp tục làm bài
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Xác nhận nộp bài thi
              </h3>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist summary */}
            <div className="p-4 rounded-xl bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Tổng số câu hỏi:</span>
                <strong>{totalCount} câu</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Số câu đã hoàn thành:</span>
                <strong>{answeredCount} / {totalCount}</strong>
              </div>
              {totalCount - answeredCount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Số câu CHƯA làm:</span>
                  <strong>{totalCount - answeredCount} câu</strong>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Thời gian còn lại:</span>
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            </div>

            {totalCount - answeredCount > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 leading-relaxed">
                ⚠️ Bạn vẫn còn {totalCount - answeredCount} câu chưa làm. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang chấm điểm...' : 'Xác nhận nộp bài'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
