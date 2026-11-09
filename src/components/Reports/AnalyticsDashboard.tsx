import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Award, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Eye, 
  TrendingUp, 
  Sparkles,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { Exam, ExamAttempt, User } from '../../types';

interface AnalyticsDashboardProps {
  exams: Exam[];
  attempts: ExamAttempt[];
  currentUser: User;
  onViewAttempt: (attempt: ExamAttempt) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  exams,
  attempts,
  currentUser,
  onViewAttempt
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState('');

  // Filter attempts based on selection
  const filteredAttempts = attempts.filter(a => {
    const matchExam = selectedExamId === 'all' || a.examId === selectedExamId;
    const matchClass = selectedClass === 'all' || a.studentClass === selectedClass;
    const matchSearch = 
      a.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      a.studentCode.toLowerCase().includes(searchStudent.toLowerCase());
    return matchExam && matchClass && matchSearch;
  });

  // Calculate high-level summary metrics
  const totalSubmissions = filteredAttempts.length;
  const avgScore = totalSubmissions > 0
    ? Math.round((filteredAttempts.reduce((acc, a) => acc + a.score, 0) / totalSubmissions) * 10) / 10
    : 0;
  const passCount = filteredAttempts.filter(a => a.passed).length;
  const passRate = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;
  const excellentCount = filteredAttempts.filter(a => a.score >= 8.0).length;
  const excellentRate = totalSubmissions > 0 ? Math.round((excellentCount / totalSubmissions) * 100) : 0;

  // 1. Grade Distribution Histogram
  const scoreDistribution = [
    { range: '< 5.0 (Yếu)', count: filteredAttempts.filter(a => a.score < 5.0).length, fill: '#f43f5e' },
    { range: '5.0 - 6.4 (TB)', count: filteredAttempts.filter(a => a.score >= 5.0 && a.score < 6.5).length, fill: '#94a3b8' },
    { range: '6.5 - 7.9 (Khá)', count: filteredAttempts.filter(a => a.score >= 6.5 && a.score < 8.0).length, fill: '#3b82f6' },
    { range: '8.0 - 8.9 (Giỏi)', count: filteredAttempts.filter(a => a.score >= 8.0 && a.score < 9.0).length, fill: '#10b981' },
    { range: '9.0 - 10 (Xuất sắc)', count: filteredAttempts.filter(a => a.score >= 9.0).length, fill: '#f59e0b' },
  ];

  // 2. Class Performance Comparison
  const classList = Array.from(new Set(attempts.map(a => a.studentClass || '9A1'))).sort();
  const classComparisonData = classList.map(cls => {
    const classAttempts = attempts.filter(a => a.studentClass === cls);
    const clsAvg = classAttempts.length > 0
      ? Math.round((classAttempts.reduce((sum, a) => sum + a.score, 0) / classAttempts.length) * 10) / 10
      : 0;
    return {
      className: `Lớp ${cls}`,
      avgScore: clsAvg,
      studentsCount: classAttempts.length
    };
  });

  // 3. Subject Mastery Radar Data
  const detectedSubjects = Array.from(new Set([
    ...exams.map(e => e.subject).filter(Boolean),
    ...attempts.map(a => a.subject).filter(Boolean)
  ]));
  const subjects = detectedSubjects.length > 0 
    ? detectedSubjects 
    : ['Tin học 6', 'Tin học 7', 'Tin học 8', 'Tin học 9'];
  const subjectMasteryData = subjects.slice(0, 6).map(sub => {
    const subAttempts = attempts.filter(a => a.subject === sub);
    const subAvg = subAttempts.length > 0
      ? Math.round((subAttempts.reduce((sum, a) => sum + a.score, 0) / subAttempts.length) * 10)
      : 80;
    return {
      subject: sub,
      mastery: subAvg,
      fullMark: 100
    };
  });

  // Export to CSV
  const handleExportCSV = () => {
    const sanitizeFilename = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
    };

    let examNameSlug = 'Tat_Ca_Bai_Kiem_Tra';
    if (selectedExamId !== 'all') {
      const foundExam = exams.find(e => e.id === selectedExamId);
      if (foundExam) {
        examNameSlug = sanitizeFilename(foundExam.title);
      }
    } else if (filteredAttempts.length > 0) {
      const firstTitle = filteredAttempts[0].examTitle;
      const allSame = filteredAttempts.every(a => a.examTitle === firstTitle);
      if (allSame) {
        examNameSlug = sanitizeFilename(firstTitle);
      } else {
        examNameSlug = 'Nhieu_Bai_Kiem_Tra';
      }
    }

    const classSlug = selectedClass !== 'all' ? `_Lop_${sanitizeFilename(selectedClass)}` : '';
    const fileName = `Ket_Qua_${examNameSlug}${classSlug}_${Date.now().toString().slice(-6)}.csv`;

    const headers = ['Mã học sinh,Họ và tên,Lớp,Đề kiểm tra,Môn,Điểm số,Xếp loại,Số lần chuyển tab,Thời gian nộp'];
    const rows = filteredAttempts.map(a => {
      const rank = a.score >= 9.0 ? 'Xuất sắc' : a.score >= 8.0 ? 'Giỏi' : a.score >= 6.5 ? 'Khá' : a.score >= 5.0 ? 'Trung bình' : 'Chưa đạt';
      return `"${a.studentCode}","${a.studentName}","${a.studentClass}","${a.examTitle}","${a.subject}",${a.score},"${rank}",${a.tabSwitchCount},"${a.submittedAt}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Báo Cáo Phân Tích Kết Quả & Phổ Điểm</h2>
          <p className="text-xs text-slate-500">Trực quan hóa phổ điểm toàn trường và quản lý nhật ký thi</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất báo cáo Excel (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Tổng lượt làm bài</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalSubmissions}</p>
          <span className="text-[11px] text-emerald-600 font-medium">100% dữ liệu đã đồng bộ</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Điểm trung bình</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{avgScore} / 10</p>
          <span className="text-[11px] text-slate-500">Chuẩn đánh giá GDPT</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Tỉ lệ đạt chuẩn (≥ 5.0)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{passRate}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">{passCount} bài đạt chuẩn</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Tỉ lệ Giỏi - Xuất sắc (≥ 8.0)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 font-mono">{excellentRate}%</p>
          <span className="text-[11px] text-indigo-600 font-medium">{excellentCount} bài điểm cao</span>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Phổ điểm Histogram (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Phổ Điểm Khảo Thí (Grade Distribution)
              </h3>
              <p className="text-xs text-slate-500">Số lượng học sinh theo từng phân khúc điểm số</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Học kỳ II
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${value} học sinh`, 'Số lượng']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: So sánh điểm giữa các lớp (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Điểm TB Theo Từng Lớp
              </h3>
              <p className="text-xs text-slate-500">So sánh tiến độ học tập các khối lớp</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classComparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="className" type="category" tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} / 10 điểm`, 'Điểm TB']}
                />
                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Toolbar for Detailed Records Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Exam selector */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="font-semibold text-slate-500">Đề thi:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-hidden"
              >
                <option value="all">Tất cả đề kiểm tra</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {/* Class selector */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="font-semibold text-slate-500">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-hidden"
              >
                <option value="all">Tất cả lớp</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã học sinh..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Detailed Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Danh Sách Kết Quả & Nhật Ký Bài Làm ({filteredAttempts.length} lượt nộp)
          </h3>
          <span className="text-[11px] text-slate-400">Thời gian thực</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3">Học sinh & Mã số</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Bài kiểm tra</th>
                <th className="px-4 py-3 text-center">Điểm số</th>
                <th className="px-4 py-3 text-center">Xếp loại</th>
                <th className="px-4 py-3 text-center">Giám thị</th>
                <th className="px-4 py-3">Thời gian nộp</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không có bản ghi làm bài nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map(att => {
                  const rank = att.score >= 9.0 ? 'Xuất sắc' : att.score >= 8.0 ? 'Giỏi' : att.score >= 6.5 ? 'Khá' : att.score >= 5.0 ? 'Trung bình' : 'Chưa đạt';
                  const rankColor = att.score >= 8.0 ? 'bg-emerald-100 text-emerald-800' : att.score >= 6.5 ? 'bg-blue-100 text-blue-800' : att.score >= 5.0 ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-800';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{att.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.studentCode}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {att.studentClass}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={att.examTitle}>
                          {att.examTitle}
                        </div>
                        <div className="text-[10px] text-slate-400">{att.subject}</div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-black font-mono text-blue-900">
                          {att.score.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400"> / {att.maxScore}</span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${rankColor}`}>
                          {rank}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {att.tabSwitchCount === 0 ? (
                          <span className="text-emerald-700 text-[11px] font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn mực
                          </span>
                        ) : (
                          <span className="text-rose-600 text-[11px] font-bold flex items-center justify-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> {att.tabSwitchCount} lần
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-slate-500">
                        {new Date(att.submittedAt).toLocaleString('vi-VN')}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onViewAttempt(att)}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Difficulty Index Analysis (Chỉ số độ khó & Tỷ lệ sai theo từng câu hỏi) */}
      {selectedExamId !== 'all' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Phân Tích Ma Trận Độ Khó & Tỷ Lệ Sai Từng Câu Hỏi</span>
              </h3>
              <p className="text-xs text-slate-500">Giúp Thầy Toàn phát hiện ngay các phần kiến thức học sinh làm sai nhiều để giảng lại</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
              {filteredAttempts.length} bài thi được phân tích
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(() => {
              const targetExam = exams.find(e => e.id === selectedExamId);
              if (!targetExam || !targetExam.questions) return null;

              return targetExam.questions.map((q, qIdx) => {
                let totalAnsweredThisQ = 0;
                let correctCount = 0;

                filteredAttempts.forEach(att => {
                  const qRes = att.questionResults?.find(r => r.questionId === q.id);
                  if (qRes) {
                    totalAnsweredThisQ++;
                    if (qRes.isCorrect) correctCount++;
                  }
                });

                const correctRate = totalAnsweredThisQ > 0 ? Math.round((correctCount / totalAnsweredThisQ) * 100) : 0;
                const wrongRate = 100 - correctRate;
                const isHard = wrongRate >= 60;
                const isEasy = correctRate >= 80;

                return (
                  <div key={q.id} className={`p-4 rounded-xl border transition-all space-y-2 ${
                    isHard ? 'bg-rose-50/60 border-rose-200' : isEasy ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Câu {qIdx + 1} ({q.code || 'TN'})</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isHard ? 'bg-rose-200 text-rose-800' : isEasy ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                      }`}>
                        {isHard ? 'Tỷ lệ sai cao' : isEasy ? 'Nắm vững' : 'Trung bình'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 font-medium" title={q.content}>
                      {q.content}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Đúng: <strong className="text-emerald-700">{correctRate}%</strong></span>
                      <span className="text-slate-500">Sai: <strong className={isHard ? 'text-rose-700' : 'text-slate-700'}>{wrongRate}%</strong></span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
