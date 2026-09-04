import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserCheck, 
  Award, 
  BookOpen, 
  Calendar, 
  Clock, 
  Eye, 
  Printer, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  FileSpreadsheet
} from 'lucide-react';
import { ExamAttempt, User, Exam, Subject } from '../../types';

interface ScoreLookupViewProps {
  attempts: ExamAttempt[];
  users: User[];
  exams: Exam[];
  currentUser?: User;
  onViewAttempt: (attempt: ExamAttempt) => void;
  onTakeExam?: (exam: Exam) => void;
  onNavigateToLogin?: () => void;
}

export const ScoreLookupView: React.FC<ScoreLookupViewProps> = ({
  attempts,
  users,
  exams,
  currentUser,
  onViewAttempt,
  onTakeExam,
  onNavigateToLogin
}) => {
  const initialCode = currentUser?.role === 'student' ? currentUser.code : 'HS-20240901';
  const [searchCode, setSearchCode] = useState(initialCode);
  const [activeQuery, setActiveQuery] = useState(initialCode);
  const [selectedSubject, setSelectedSubject] = useState<string>('Tất cả');

  // Find all student users
  const studentUsers = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  // Execute lookup based on activeQuery
  const lookupResult = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    if (!q) return null;

    // Find student matching code or id or name
    const targetStudent = users.find(u => 
      u.code.toLowerCase() === q ||
      u.id.toLowerCase() === q ||
      u.name.toLowerCase().includes(q)
    );

    // Find all attempts matching studentCode or studentId or studentName
    const matchingAttempts = attempts.filter(a => 
      a.studentCode.toLowerCase() === q ||
      a.studentId.toLowerCase() === q ||
      (targetStudent && (a.studentId === targetStudent.id || a.studentCode === targetStudent.code)) ||
      a.studentName.toLowerCase().includes(q)
    );

    // If student user exists, take info from user; otherwise take from first attempt
    let studentInfo: { name: string; code: string; className: string; avatar?: string; school?: string } | null = null;
    
    if (targetStudent) {
      studentInfo = {
        name: targetStudent.name,
        code: targetStudent.code,
        className: targetStudent.className || '9A1',
        avatar: targetStudent.avatar,
        school: targetStudent.school || 'Trường THCS Nguyễn Du'
      };
    } else if (matchingAttempts.length > 0) {
      studentInfo = {
        name: matchingAttempts[0].studentName,
        code: matchingAttempts[0].studentCode,
        className: matchingAttempts[0].studentClass,
        school: 'Trường THCS Nguyễn Du'
      };
    }

    return {
      student: studentInfo,
      attempts: matchingAttempts
    };
  }, [activeQuery, attempts, users]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setActiveQuery(searchCode.trim());
    }
  };

  const handleSelectQuickStudent = (code: string) => {
    setSearchCode(code);
    setActiveQuery(code);
  };

  // Filter attempts by subject
  const filteredAttempts = useMemo(() => {
    if (!lookupResult) return [];
    if (selectedSubject === 'Tất cả') return lookupResult.attempts;
    return lookupResult.attempts.filter(a => a.subject === selectedSubject);
  }, [lookupResult, selectedSubject]);

  // Metrics for looked up student
  const studentMetrics = useMemo(() => {
    if (!lookupResult || lookupResult.attempts.length === 0) {
      return { total: 0, avg: 0, highest: 0, passedCount: 0, perfectCount: 0, ranking: 'Chưa có dữ liệu' };
    }
    const atts = lookupResult.attempts;
    const total = atts.length;
    const sum = atts.reduce((s, a) => s + a.score, 0);
    const avg = Math.round((sum / total) * 10) / 10;
    const highest = Math.max(...atts.map(a => a.score));
    const passedCount = atts.filter(a => a.score >= 5.0).length;
    const perfectCount = atts.filter(a => a.score >= 9.5).length;

    let ranking = 'Trung bình';
    if (avg >= 9.0) ranking = 'Xuất sắc';
    else if (avg >= 8.0) ranking = 'Giỏi';
    else if (avg >= 6.5) ranking = 'Khá';
    else if (avg >= 5.0) ranking = 'Đạt';
    else ranking = 'Cần cố gắng';

    return { total, avg, highest, passedCount, perfectCount, ranking };
  }, [lookupResult]);

  // Handle print
  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Tra Cứu Khảo Thí & Bảng Điểm Điện Tử
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Tra Cứu Điểm Bài Kiểm Tra Với ID Học Sinh
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Nhập mã định danh học sinh (Mã HS / ID) để tra cứu toàn bộ lịch sử làm bài kiểm tra trực tuyến, điểm số chi tiết từng môn, xếp loại và lời phê từ giáo viên.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-xs text-blue-100 space-y-2 max-w-sm shrink-0">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Quy ước mã định danh:
            </div>
            <p className="text-[11px] leading-tight">
              Mã học sinh có định dạng: <span className="font-mono font-bold text-white">HS-NĂM-KHỐI-STT</span> (Ví dụ: <span className="font-mono text-amber-200">HS-20240901</span>).
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar & Quick Select Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Nhập Mã học sinh (VD: HS-20240901) hoặc Họ tên học sinh..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Tra Cứu Điểm</span>
          </button>
        </form>

        {/* Quick select sample student chips */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            Học sinh mẫu sẵn có:
          </span>
          {studentUsers.map(st => (
            <button
              key={st.id}
              onClick={() => handleSelectQuickStudent(st.code)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeQuery.toLowerCase() === st.code.toLowerCase() || activeQuery.toLowerCase() === st.name.toLowerCase()
                  ? 'bg-blue-900 text-white border-blue-900 font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <span className="font-mono font-bold text-[11px] opacity-80">{st.code}</span>
              <span>- {st.name} ({st.className})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Display */}
      {lookupResult && lookupResult.student ? (
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {lookupResult.student.avatar ? (
                <img
                  src={lookupResult.student.avatar}
                  alt={lookupResult.student.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-100 text-blue-800 font-bold text-2xl flex items-center justify-center border-2 border-blue-300 shrink-0">
                  {lookupResult.student.name.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Học sinh Lớp {lookupResult.student.className}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
                  {lookupResult.student.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Mã định danh: <strong className="font-mono text-blue-900 font-bold">{lookupResult.student.code}</strong></span>
                  <span>•</span>
                  <span>{lookupResult.student.school}</span>
                </div>
              </div>
            </div>

            {/* Academic Badges */}
            <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
              <div className="flex-1 md:flex-none p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Điểm TB</span>
                <span className="text-2xl font-black text-blue-900 font-mono">{studentMetrics.avg.toFixed(1)}</span>
              </div>

              <div className="flex-1 md:flex-none p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bài Đã Thi</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{studentMetrics.total}</span>
              </div>

              <div className="flex-1 md:flex-none p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Xếp Loại</span>
                <span className="text-sm font-black text-emerald-700 block mt-1">{studentMetrics.ranking}</span>
              </div>

              <button
                onClick={handlePrintTranscript}
                title="In phiếu điểm học sinh"
                className="hidden sm:flex items-center justify-center p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Transcript / Exam Attempts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Danh Sách Điểm Các Bài Kiểm Tra Đã Làm
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hiển thị chi tiết từng bài thi khảo thí trực tuyến của học sinh {lookupResult.student.name}
                </p>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  aria-label="Lọc theo môn học"
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Tất cả">Tất cả bài kiểm tra</option>
                  <option value="Tin học">Môn Tin học</option>
                </select>
              </div>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">
                  Chưa có bài kiểm tra nào được ghi nhận cho môn học này.
                </p>
                <p className="text-xs text-slate-400">
                  Học sinh có thể vào mục "Bài kiểm tra trực tuyến" để bắt đầu làm bài.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttempts.map((att) => {
                  const isPassed = att.score >= 5.0;
                  const rank = 
                    att.score >= 9.0 ? 'Xuất sắc' : 
                    att.score >= 8.0 ? 'Giỏi' : 
                    att.score >= 6.5 ? 'Khá' : 
                    att.score >= 5.0 ? 'Trung bình' : 'Chưa đạt';

                  const badgeClass = 
                    att.score >= 8.0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    att.score >= 6.5 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    att.score >= 5.0 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-rose-100 text-rose-800 border-rose-200';

                  return (
                    <div
                      key={att.id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {att.subject}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                            {rank}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(att.submittedAt).toLocaleDateString('vi-VN')} {new Date(att.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h5 className="text-sm sm:text-base font-bold text-slate-900">
                          {att.examTitle}
                        </h5>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Thời gian làm: {Math.round(att.durationSeconds / 60)} phút
                          </span>
                          <span>•</span>
                          <span>Tỷ lệ chính xác: <strong>{att.percentage}%</strong></span>
                          {att.tabSwitchCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 flex items-center gap-1 font-semibold">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Đổi tab: {att.tabSwitchCount} lần
                              </span>
                            </>
                          )}
                        </div>

                        {att.feedback && (
                          <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 italic">
                            💬 <strong>Lời phê của giáo viên:</strong> "{att.feedback}"
                          </div>
                        )}
                      </div>

                      {/* Score Badge & Action Button */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0">
                        <div className="text-left lg:text-right">
                          <div className="text-2xl font-black text-blue-900 font-mono leading-none">
                            {att.score.toFixed(1)}
                            <span className="text-xs text-slate-400 font-normal"> / {att.maxScore}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {isPassed ? '✅ Đạt yêu cầu' : '❌ Chưa đạt'}
                          </span>
                        </div>

                        <button
                          onClick={() => onViewAttempt(att)}
                          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem Chi Tiết Bài Làm</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Not found state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy mã học sinh "{activeQuery}"</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vui lòng kiểm tra lại chính xác Mã học sinh (ví dụ: <span className="font-mono font-bold text-blue-600">HS-20240901</span>) hoặc nhấp vào danh sách học sinh mẫu ở thanh tra cứu phía trên.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
