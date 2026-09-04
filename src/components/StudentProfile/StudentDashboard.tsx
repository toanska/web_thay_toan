import React from 'react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  User as UserIcon, 
  Star, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  KeyRound
} from 'lucide-react';
import { ExamAttempt, User, Exam } from '../../types';

interface StudentDashboardProps {
  currentUser: User;
  attempts: ExamAttempt[];
  exams: Exam[];
  onViewAttempt: (attempt: ExamAttempt) => void;
  onTakeExam: (exam: Exam) => void;
  onOpenChangePassword?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  attempts,
  exams,
  onViewAttempt,
  onTakeExam,
  onOpenChangePassword
}) => {
  const isStudent = currentUser.role === 'student';
  const myAttempts = isStudent 
    ? attempts.filter(a => a.studentId === currentUser.id)
    : attempts;

  // Student metrics
  const totalTests = myAttempts.length;
  const avgScore = totalTests > 0
    ? Math.round((myAttempts.reduce((sum, a) => sum + a.score, 0) / totalTests) * 10) / 10
    : 0;
  const perfectTests = myAttempts.filter(a => a.score >= 9.5).length;

  // Suggested upcoming exams to take
  const completedExamIds = new Set(myAttempts.map(a => a.examId));
  const recommendedExams = exams.filter(e => !completedExamIds.has(e.id)).slice(0, 3);

  // Subject breakdowns
  const subjectScores: Record<string, { total: number; count: number }> = {};
  myAttempts.forEach(a => {
    if (!subjectScores[a.subject]) {
      subjectScores[a.subject] = { total: 0, count: 0 };
    }
    subjectScores[a.subject].total += a.score;
    subjectScores[a.subject].count += 1;
  });

  const badges = [
    { title: 'Chăm Chỉ Khảo Thí', desc: 'Đã hoàn thành các bài khảo sát trực tuyến', icon: Flame, color: 'text-amber-500 bg-amber-50' },
    { title: 'Tư Duy Xuất Sắc', desc: 'Đạt điểm 9.0+ trong bài kiểm tra định kỳ', icon: Star, color: 'text-purple-500 bg-purple-50' },
    { title: 'Kỷ Luật & Trung Thực', desc: '0 lần chuyển tab trong quá trình thi', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Student Profile Top Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-lg shrink-0"
          />
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              {isStudent ? 'Học sinh THCS' : 'Cán bộ giáo viên'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-serif text-white">
              {currentUser.name}
            </h2>
            <p className="text-xs text-blue-200 flex items-center gap-2 flex-wrap">
              <span>{currentUser.className ? `Lớp ${currentUser.className} • ` : ''}Mã định danh: <span className="font-mono text-white font-bold">{currentUser.code}</span></span>
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-amber-300" />
                  <span>Đổi mật khẩu</span>
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Quick Personal Stats */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Bài Đã Nộp</span>
            <span className="text-2xl font-black text-white font-mono">{totalTests}</span>
          </div>

          <div className="flex-1 md:flex-none p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Điểm TB</span>
            <span className="text-2xl font-black text-amber-300 font-mono">{avgScore}</span>
          </div>

          <div className="flex-1 md:flex-none p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Điểm 10</span>
            <span className="text-2xl font-black text-emerald-300 font-mono">{perfectTests}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Performance & Transcripts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attempt History (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Lịch Sử Làm Bài & Bảng Điểm Chi Tiết
              </h3>
              <span className="text-xs text-slate-400">{myAttempts.length} bài thi</span>
            </div>

            {myAttempts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <p className="text-xs">Bạn chưa hoàn thành bài kiểm tra trực tuyến nào.</p>
                <p className="text-xs text-blue-600 font-semibold">Hãy truy cập mục "Bài kiểm tra trực tuyến" để bắt đầu thử sức!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAttempts.map(att => {
                  const rank = att.score >= 9.0 ? 'Xuất sắc' : att.score >= 8.0 ? 'Giỏi' : att.score >= 6.5 ? 'Khá' : att.score >= 5.0 ? 'Trung bình' : 'Chưa đạt';
                  const rankColor = att.score >= 8.0 ? 'bg-emerald-100 text-emerald-800' : att.score >= 6.5 ? 'bg-blue-100 text-blue-800' : att.score >= 5.0 ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-800';

                  return (
                    <div
                      key={att.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {att.subject}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(att.submittedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{att.examTitle}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Thời gian: {Math.round(att.durationSeconds / 60)} phút</span>
                          <span>•</span>
                          <span>Đổi tab: {att.tabSwitchCount} lần</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-black text-blue-900 font-mono">
                            {att.score.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ {att.maxScore}</span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${rankColor}`}>
                            {rank}
                          </span>
                        </div>

                        <button
                          onClick={() => onViewAttempt(att)}
                          className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem lại</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Strengths Breakdown */}
          {Object.keys(subjectScores).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Năng Lực Khảo Thí Môn Tin Học
              </h3>

              <div className="space-y-3">
                {Object.entries(subjectScores).map(([sub, data]) => {
                  const subAvg = Math.round((data.total / data.count) * 10) / 10;
                  const pct = Math.round((subAvg / 10) * 100);

                  return (
                    <div key={sub} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{sub} ({data.count} bài)</span>
                        <span className="text-blue-600">{subAvg} / 10 đ ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Recommended Exams & Badges (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Achievements & Badges */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Huy Hiệu & Danh Hiệu Đã Đạt
            </h3>

            <div className="space-y-3">
              {badges.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`p-2 rounded-lg ${b.color} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <h4 className="font-bold text-slate-900">{b.title}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-tight">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Upcoming Exams */}
          {recommendedExams.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Đề Thi Gợi Ý Ôn Tập
              </h3>

              <div className="space-y-3">
                {recommendedExams.map(ex => (
                  <div key={ex.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                        {ex.subject}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {ex.durationMinutes} phút
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">{ex.title}</h4>

                    <button
                      onClick={() => onTakeExam(ex)}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Vào thi ngay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
