import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Database, 
  Tag, 
  HelpCircle, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  CheckCircle2,
  Filter,
  Layers
} from 'lucide-react';
import { Question, Subject, GradeLevel, DifficultyLevel, QuestionType, User } from '../../types';

interface QuestionBankManagerProps {
  questions: Question[];
  currentUser: User;
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenAIGenerator: () => void;
  onDuplicateQuestion: (question: Question) => void;
}

const SUBJECT_LIST: ('Tất cả' | Subject)[] = [
  'Tất cả',
  'Tin học'
];

const GRADE_LIST = ['Tất cả', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  questions,
  currentUser,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenAIGenerator,
  onDuplicateQuestion
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'Tất cả' | Subject>('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState<string>('Tất cả');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  // Filters
  const filteredQuestions = questions.filter(q => {
    const matchSubject = selectedSubject === 'Tất cả' || q.subject === selectedSubject;
    const matchGrade = selectedGrade === 'Tất cả' || `Lớp ${q.grade}` === selectedGrade;
    const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchType = selectedType === 'all' || q.type === selectedType;
    const matchQuery = 
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchGrade && matchDiff && matchType && matchQuery;
  });

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'recognition':
        return { label: 'Nhận biết', bg: 'bg-emerald-100 text-emerald-800' };
      case 'understanding':
        return { label: 'Thông hiểu', bg: 'bg-blue-100 text-blue-800' };
      case 'application':
        return { label: 'Vận dụng', bg: 'bg-amber-100 text-amber-800' };
      case 'high_application':
        return { label: 'Vận dụng cao', bg: 'bg-rose-100 text-rose-800' };
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice': return 'Trắc nghiệm đơn';
      case 'multi_select': return 'Nhiều lựa chọn';
      case 'true_false': return 'Đúng / Sai';
      case 'fill_in': return 'Điền khuyết';
      case 'essay': return 'Tự luận';
    }
  };

  const handleExportQuestions = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Ngan_hang_cau_hoi_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-amber-300" />
              Ngân Hàng Câu Hỏi Khảo Thí THCS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Kho Học Liệu & Câu Hỏi Chuẩn 4 Mức Độ GDPT 2018
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Quản lý phân loại theo khối 6-9, 8 môn học cốt lõi, ma trận Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao kèm lời giải chi tiết và công cụ sinh câu hỏi AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenAIGenerator}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sinh câu hỏi với AI</span>
            </button>

            <button
              onClick={onAddQuestion}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {GRADE_LIST.map(gr => (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGrade === gr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>

          {/* Search Box & Export */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nội dung, mã câu hỏi, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleExportQuestions}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0"
              title="Xuất file JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Xuất dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters (Subject, Difficulty, Question Type) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Subject dropdown */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 shrink-0">Môn học:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as any)}
              className="w-full px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 outline-hidden font-medium"
            >
              {SUBJECT_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Difficulty dropdown */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 shrink-0">Mức độ:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 outline-hidden font-medium"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="recognition">Nhận biết</option>
              <option value="understanding">Thông hiểu</option>
              <option value="application">Vận dụng</option>
              <option value="high_application">Vận dụng cao</option>
            </select>
          </div>

          {/* Question Type dropdown */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 shrink-0">Dạng câu:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 outline-hidden font-medium"
            >
              <option value="all">Tất cả dạng câu hỏi</option>
              <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
              <option value="multi_select">Nhiều lựa chọn đúng</option>
              <option value="true_false">Đúng / Sai</option>
              <option value="fill_in">Điền khuyết</option>
              <option value="essay">Tự luận</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Kết quả tìm kiếm: {filteredQuestions.length} câu hỏi</span>
          <span>Khối 6, 7, 8, 9</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy câu hỏi nào phù hợp với bộ lọc</p>
            <button
              onClick={onAddQuestion}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
            >
              Thêm câu hỏi mới ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const diffBadge = getDifficultyBadge(q.difficulty);
              const isExplanationOpen = expandedExplanationId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 space-y-3"
                >
                  {/* Question Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {q.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {q.subject} • Lớp {q.grade}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${diffBadge.bg}`}>
                        {diffBadge.label}
                      </span>
                      <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {getTypeLabel(q.type)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onDuplicateQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Nhân bản câu hỏi"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xác nhận xóa câu hỏi: [${q.code}]?`)) {
                            onDeleteQuestion(q.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.content}
                  </div>

                  {/* Options Display */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswers.includes(optIdx);
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {letter}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in / Essay answers */}
                  {(!q.options || q.type === 'fill_in' || q.type === 'essay') && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
                      <span className="text-emerald-700 font-bold block text-[11px]">Đáp án chuẩn / Hướng dẫn đáp số:</span>
                      <strong>{q.correctAnswers.join(' hoặc ')}</strong>
                    </div>
                  )}

                  {/* Tags and Toggle Explanation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <div className="flex flex-wrap gap-1">
                      {q.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                          <Tag className="w-2.5 h-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span>Tác giả: {q.authorName || 'Tổ bộ môn'}</span>
                      {q.explanation && (
                        <button
                          onClick={() => setExpandedExplanationId(isExplanationOpen ? null : q.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{isExplanationOpen ? 'Ẩn lời giải' : 'Xem lời giải chi tiết'}</span>
                          {isExplanationOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Step-by-step Explanation Box */}
                  {isExplanationOpen && q.explanation && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1 animate-in fade-in duration-100">
                      <strong className="text-slate-900 block font-bold">Hướng dẫn giải & Lập luận:</strong>
                      <p className="leading-relaxed whitespace-pre-line text-slate-700 font-normal">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
