import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  Eye, 
  Printer, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  ShieldAlert, 
  GraduationCap,
  School,
  UserCheck
} from 'lucide-react';
import { ExamAttempt, User, Exam } from '../../types';

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
  exams: _exams,
  currentUser,
  onViewAttempt,
  onTakeExam: _onTakeExam,
  onNavigateToLogin: _onNavigateToLogin
}) => {
  // If currentUser is a logged-in student, default to their own info; otherwise start empty
  const isStudentLoggedIn = currentUser?.role === 'student';
  const defaultQuery = isStudentLoggedIn ? (currentUser.code || currentUser.name || '') : '';
  const defaultClass = isStudentLoggedIn ? (currentUser.className || 'all') : 'all';

  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [searchClass, setSearchClass] = useState<string>(defaultClass);
  const [activeQuery, setActiveQuery] = useState(defaultQuery);
  const [activeClass, setActiveClass] = useState<string>(defaultClass);
  const [hasSearched, setHasSearched] = useState(isStudentLoggedIn);
  const [selectedSubject, setSelectedSubject] = useState<string>('Tất cả');
  const [selectedStudentCode, setSelectedStudentCode] = useState<string | null>(isStudentLoggedIn ? (currentUser.code || null) : null);

  // Available classes in system
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    users.forEach(u => { if (u.className) classSet.add(u.className); });
    attempts.forEach(a => { if (a.studentClass) classSet.add(a.studentClass); });
    ['6A1', '6A2', '7A1', '7A2', '8A1', '8A2', '9A1', '9A2'].forEach(c => classSet.add(c));
    return Array.from(classSet).sort();
  }, [users, attempts]);

  // Execute lookup based on activeQuery and activeClass
  const searchResults = useMemo(() => {
    if (!hasSearched) return null;
    const q = activeQuery.trim().toLowerCase();
    const targetClass = activeClass !== 'all' ? activeClass.trim().toLowerCase() : null;

    if (!q && !targetClass) return null;

    // 1. Find candidate students from users
    const candidateStudents = users.filter(u => {
      if (u.role !== 'student') return false;
      if (targetClass && u.className && u.className.toLowerCase() !== targetClass) return false;
      if (!q) return true;
      return (
        u.code.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
      );
    });

    // 2. Find matching attempts
    const matchingAttempts = attempts.filter(a => {
      if (targetClass && a.studentClass && a.studentClass.toLowerCase() !== targetClass) return false;
      if (!q) return true;
      return (
        a.studentCode.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.studentName.toLowerCase().includes(q)
      );
    });

    // If a specific student is selected (or only one student found, or exact match)
    let activeStudent = candidateStudents.find(s => s.code === selectedStudentCode) || null;
    if (!activeStudent && candidateStudents.length === 1) {
      activeStudent = candidateStudents[0];
    } else if (!activeStudent && candidateStudents.length > 0 && q) {
      // Check for exact code match
      const exactCode = candidateStudents.find(s => s.code.toLowerCase() === q);
      if (exactCode) activeStudent = exactCode;
    }

    // Determine attempts for activeStudent
    let studentAttempts: ExamAttempt[] = [];
    if (activeStudent) {
      studentAttempts = attempts.filter(a => 
        a.studentCode === activeStudent!.code || 
        a.studentId === activeStudent!.id ||
        (a.studentName.toLowerCase() === activeStudent!.name.toLowerCase() && (!targetClass || a.studentClass.toLowerCase() === targetClass))
      );
    } else if (matchingAttempts.length > 0 && candidateStudents.length <= 1) {
      studentAttempts = matchingAttempts;
    }

    // Student profile info
    let studentInfo: { name: string; code: string; className: string; avatar?: string; school?: string } | null = null;
    if (activeStudent) {
      studentInfo = {
        name: activeStudent.name,
        code: activeStudent.code,
        className: activeStudent.className || 'Chưa phân lớp',
        avatar: activeStudent.avatar,
        school: activeStudent.school || 'Trường THCS Ngô Quyền'
      };
    } else if (matchingAttempts.length > 0 && candidateStudents.length <= 1) {
      studentInfo = {
        name: matchingAttempts[0].studentName,
        code: matchingAttempts[0].studentCode,
        className: matchingAttempts[0].studentClass,
        school: 'Trường THCS Ngô Quyền'
      };
    }

    return {
      candidateStudents,
      activeStudent,
      studentInfo,
      attempts: studentAttempts,
      allMatchingAttemptsCount: matchingAttempts.length
    };
  }, [hasSearched, activeQuery, activeClass, selectedStudentCode, users, attempts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert('Vui lòng nhập chính xác Mã học sinh (ID) hoặc Họ và tên học sinh để tra cứu điểm cá nhân!');
      return;
    }
    setActiveQuery(searchQuery.trim());
    setActiveClass(searchClass);
    setSelectedStudentCode(null);
    setHasSearched(true);
  };

  // Filter attempts by subject
  const filteredAttempts = useMemo(() => {
    if (!searchResults || !searchResults.attempts) return [];
    if (selectedSubject === 'Tất cả') return searchResults.attempts;
    return searchResults.attempts.filter(a => a.subject === selectedSubject);
  }, [searchResults, selectedSubject]);

  // Metrics for looked up student
  const studentMetrics = useMemo(() => {
    if (!searchResults || searchResults.attempts.length === 0) {
      return { total: 0, avg: 0, highest: 0, passedCount: 0, perfectCount: 0, ranking: 'Chưa có dữ liệu' };
    }
    const atts = searchResults.attempts;
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
  }, [searchResults]);

  // Handle print
  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tra Cứu Điểm Bài Kiểm Tra Học Sinh</h2>
          <p className="text-xs text-slate-500">Nhập chính xác Mã định danh học sinh (ID) hoặc Họ tên cá nhân để tra cứu bảng điểm riêng</p>
        </div>
      </div>

      {/* Search Bar - Strictly for 1 student per lookup */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          {/* Input ID or Name */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập chính xác Mã học sinh / ID (VD: HS-20240901) hoặc Họ và tên học sinh..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Select Class Filter (Optional filter to narrow down single student) */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              aria-label="Chọn lớp học"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Tất cả các lớp</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Lớp {cls}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-7 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Tra Cứu Điểm</span>
          </button>
        </form>
      </div>

      {/* If Multiple Candidate Students Found from Query: force user to select ONLY ONE student */}
      {searchResults && searchResults.candidateStudents.length > 1 && !searchResults.activeStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Tìm thấy {searchResults.candidateStudents.length} học sinh trùng khớp. Vui lòng chọn 1 học sinh duy nhất để xem bảng điểm cá nhân:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {searchResults.candidateStudents.map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStudentCode(st.code)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm group-hover:text-blue-900">{st.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Mã HS: <span className="font-mono font-bold text-blue-700">{st.code}</span> • Lớp {st.className}
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 group-hover:underline">Xem điểm cá nhân →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Results Display */}
      {searchResults && searchResults.studentInfo ? (
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {searchResults.studentInfo.avatar ? (
                <img
                  src={searchResults.studentInfo.avatar}
                  alt={searchResults.studentInfo.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-100 text-blue-800 font-bold text-2xl flex items-center justify-center border-2 border-blue-300 shrink-0">
                  {searchResults.studentInfo.name.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Học sinh Lớp {searchResults.studentInfo.className}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
                  {searchResults.studentInfo.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Mã định danh: <strong className="font-mono text-blue-900 font-bold">{searchResults.studentInfo.code}</strong></span>
                  <span>•</span>
                  <span>{searchResults.studentInfo.school}</span>
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
                  Hiển thị chi tiết từng bài thi khảo thí trực tuyến của học sinh {searchResults.studentInfo.name}
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
                  Chưa có bài kiểm tra nào được ghi nhận cho học sinh này.
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
      ) : hasSearched ? (
        /* Not found state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">
              Không tìm thấy kết quả tra cứu phù hợp
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Không tìm thấy dữ liệu điểm của học sinh với từ khóa {activeQuery ? `"${activeQuery}"` : ''} {activeClass !== 'all' ? `(Lớp ${activeClass})` : ''}. Vui lòng kiểm tra lại chính xác Mã học sinh (ID) hoặc Họ và tên và Lớp học.
            </p>
          </div>
        </div>
      ) : (
        /* Initial Ready-to-Search state (no preset student) */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-14 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <School className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Sẵn Sàng Tra Cứu Điểm Khảo Thí Trực Tuyến
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Vui lòng nhập <strong>Mã học sinh (ID)</strong> hoặc <strong>Họ và tên</strong>, chọn <strong>Lớp học</strong> ở khung tìm kiếm phía trên rồi bấm nút <strong>Tra Cứu Điểm</strong> để xem kết quả chi tiết.
          </p>
        </div>
      )}
    </div>
  );
};
