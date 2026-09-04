import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  HelpCircle, 
  CheckSquare, 
  Square, 
  Layers, 
  Clock, 
  Lock, 
  Award,
  Filter,
  Search,
  Plus,
  Upload,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Info,
  ShieldCheck
} from 'lucide-react';
import { Exam, Question, Subject, GradeLevel, DifficultyLevel, QuestionType, User } from '../../types';
import { parseDocxFile, parseExamText } from '../../utils/examWordParser';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';

interface ExamCreatorModalProps {
  examToEdit?: Exam | null;
  questions: Question[];
  currentUser: User;
  onSave: (exam: Exam) => void;
  onClose: () => void;
  onOpenQuestionCreator?: () => void;
}

const SUBJECT_LIST: Subject[] = ['Tin học'];

type QuestionAddTab = 'upload_word' | 'direct_input' | 'question_bank';
type DirectInputMode = 'form' | 'paste_text';

export const ExamCreatorModal: React.FC<ExamCreatorModalProps> = ({
  examToEdit,
  questions: initialBankQuestions,
  currentUser,
  onSave,
  onClose,
  onOpenQuestionCreator
}) => {
  const [title, setTitle] = useState(examToEdit?.title || '');
  const [code, setCode] = useState(examToEdit?.code || `KT-${Date.now().toString().slice(-4)}`);
  const [description, setDescription] = useState(examToEdit?.description || '');
  const [subject, setSubject] = useState<Subject>(examToEdit?.subject || 'Tin học');
  const [grade, setGrade] = useState<GradeLevel>(examToEdit?.grade || 9);
  const [durationMinutes, setDurationMinutes] = useState(examToEdit?.durationMinutes || 45);
  const [passingScore, setPassingScore] = useState(examToEdit?.passingScore || 5.0);
  const [maxScore, setMaxScore] = useState(examToEdit?.maxScore || 10.0);
  const [maxAttempts, setMaxAttempts] = useState(examToEdit?.maxAttempts || 2);
  const [accessCode, setAccessCode] = useState(examToEdit?.accessCode || '');
  const [shuffleQuestions, setShuffleQuestions] = useState(examToEdit?.shuffleQuestions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState(examToEdit?.shuffleOptions ?? true);
  const [showAnswerAfterSubmit, setShowAnswerAfterSubmit] = useState(examToEdit?.showAnswerAfterSubmit ?? true);
  const [targetClassesInput, setTargetClassesInput] = useState(examToEdit?.targetClasses.join(', ') || '9A1, 9A2, 9A3');

  // List of active questions inside the exam being created/edited
  const [examQuestions, setExamQuestions] = useState<Question[]>(
    examToEdit?.questions || []
  );

  // Tab for Section 2
  const [activeTab, setActiveTab] = useState<QuestionAddTab>('upload_word');
  const [directInputMode, setDirectInputMode] = useState<DirectInputMode>('form');

  // Word Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Form Input State
  const [directType, setDirectType] = useState<QuestionType>('multiple_choice');
  const [directContent, setDirectContent] = useState('');
  const [directDifficulty, setDirectDifficulty] = useState<DifficultyLevel>('understanding');
  const [directPoints, setDirectPoints] = useState(1.0);
  const [directExplanation, setDirectExplanation] = useState('');
  const [directOptions, setDirectOptions] = useState<string[]>([
    '',
    '',
    '',
    ''
  ]);
  const [directCorrectAnswer, setDirectCorrectAnswer] = useState<number>(0);
  const [directFillAnswer, setDirectFillAnswer] = useState<string>('');

  // Paste Text Input State
  const [pasteRawText, setPasteRawText] = useState(
`Câu 1: [NB] Trong ngôn ngữ lập trình Python, hàm nào sau đây dùng để in kết quả ra màn hình?
A. input()
*B. print()
C. echo()
D. write()
Lời giải: Hàm print() trong Python dùng để xuất dữ liệu ra màn hình.

Câu 2: [TH] Đoạn mã sau in ra giá trị gì?
a = 10
b = 3
print(a % b)
A. 3
*B. 1
C. 0
D. 3.33
Lời giải: Toán tử % lấy phần dư của phép chia nguyên: 10 % 3 = 1.

Câu 3: [VD] Thiết bị nào sau đây kết nối các máy tính trong mạng và định tuyến dữ liệu ra Internet?
*A. Router
B. Switch
C. Hub
D. Màn hình
`
  );

  // Question Bank Picker States
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDiffFilter, setQuestionDiffFilter] = useState('all');

  // Filter available questions in question bank by current subject & grade
  const availableBankQuestions = initialBankQuestions.filter(q => {
    const matchSubject = q.subject === subject;
    const matchGrade = q.grade === grade;
    const matchDiff = questionDiffFilter === 'all' || q.difficulty === questionDiffFilter;
    const matchSearch = q.content.toLowerCase().includes(questionSearch.toLowerCase()) ||
                        q.code.toLowerCase().includes(questionSearch.toLowerCase());
    return matchSubject && matchGrade && matchDiff && matchSearch;
  });

  // Calculate current total points
  const totalPointsCalculated = examQuestions.reduce((sum, q) => sum + (q.points || 1.0), 0);

  // Handle Word file upload (.docx or .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadWarning(null);
    setUploadedFileName(file.name);

    try {
      if (file.name.endsWith('.docx')) {
        const result = await parseDocxFile(file, subject, grade);
        if (result.questions.length > 0) {
          setExamQuestions(prev => [...prev, ...result.questions]);
          if (!title && result.title) {
            setTitle(result.title);
          }
          if (result.warnings.length > 0) {
            setUploadWarning(result.warnings.join(' | '));
          }
        } else {
          setUploadWarning('Không trích xuất được câu hỏi nào từ file Word. Vui lòng kiểm tra lại định dạng câu hỏi (Câu 1: ... A. ... B. ...).');
        }
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        const result = parseExamText(text, subject, grade);
        if (result.questions.length > 0) {
          setExamQuestions(prev => [...prev, ...result.questions]);
          if (!title && result.title) {
            setTitle(result.title);
          }
          if (result.warnings.length > 0) {
            setUploadWarning(result.warnings.join(' | '));
          }
        } else {
          setUploadWarning('Không nhận diện được câu hỏi từ file văn bản.');
        }
      } else {
        setUploadWarning('Hệ thống hỗ trợ tốt nhất tệp Word định dạng .docx hoặc tệp văn bản .txt.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadWarning(err.message || 'Lỗi khi đọc file Word.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Direct Form Question
  const handleAddDirectQuestion = () => {
    if (!directContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (directType === 'multiple_choice') {
      const validOptions = directOptions.map(o => o.trim());
      if (validOptions.some(o => o === '')) {
        alert('Vui lòng nhập đầy đủ nội dung cho cả 4 đáp án A, B, C, D!');
        return;
      }

      const newQ: Question = {
        id: `q-custom-${Date.now()}`,
        code: `TIN${grade}-${directDifficulty === 'recognition' ? 'NB' : directDifficulty === 'understanding' ? 'TH' : directDifficulty === 'application' ? 'VD' : 'VDC'}-${String(examQuestions.length + 1).padStart(2, '0')}`,
        subject,
        grade,
        difficulty: directDifficulty,
        type: 'multiple_choice',
        content: directContent.trim(),
        options: validOptions,
        correctAnswers: [directCorrectAnswer],
        explanation: directExplanation.trim() || undefined,
        points: directPoints,
        tags: [`Tin học ${grade}`, 'Tạo trực tiếp'],
        authorName: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setExamQuestions(prev => [...prev, newQ]);
      // Reset form
      setDirectContent('');
      setDirectOptions(['', '', '', '']);
      setDirectExplanation('');
      setDirectCorrectAnswer(0);
    } else if (directType === 'true_false') {
      const newQ: Question = {
        id: `q-custom-${Date.now()}`,
        code: `TIN${grade}-${directDifficulty === 'recognition' ? 'NB' : directDifficulty === 'understanding' ? 'TH' : directDifficulty === 'application' ? 'VD' : 'VDC'}-${String(examQuestions.length + 1).padStart(2, '0')}`,
        subject,
        grade,
        difficulty: directDifficulty,
        type: 'true_false',
        content: directContent.trim(),
        options: ['Đúng', 'Sai'],
        correctAnswers: [directCorrectAnswer === 1 ? 1 : 0],
        explanation: directExplanation.trim() || undefined,
        points: directPoints,
        tags: [`Tin học ${grade}`, 'Đúng/Sai'],
        authorName: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setExamQuestions(prev => [...prev, newQ]);
      setDirectContent('');
      setDirectExplanation('');
      setDirectCorrectAnswer(0);
    } else {
      if (!directFillAnswer.trim()) {
        alert('Vui lòng nhập đáp án chuẩn cho câu hỏi điền khuyết!');
        return;
      }
      const newQ: Question = {
        id: `q-custom-${Date.now()}`,
        code: `TIN${grade}-${directDifficulty === 'recognition' ? 'NB' : directDifficulty === 'understanding' ? 'TH' : directDifficulty === 'application' ? 'VD' : 'VDC'}-${String(examQuestions.length + 1).padStart(2, '0')}`,
        subject,
        grade,
        difficulty: directDifficulty,
        type: 'fill_in',
        content: directContent.trim(),
        correctAnswers: [directFillAnswer.trim()],
        explanation: directExplanation.trim() || undefined,
        points: directPoints,
        tags: [`Tin học ${grade}`, 'Điền đáp án'],
        authorName: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setExamQuestions(prev => [...prev, newQ]);
      setDirectContent('');
      setDirectFillAnswer('');
      setDirectExplanation('');
    }
  };

  // Parse Paste Text
  const handleParsePasteText = () => {
    if (!pasteRawText.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung văn bản đề kiểm tra!');
      return;
    }

    const result = parseExamText(pasteRawText, subject, grade);
    if (result.questions.length > 0) {
      setExamQuestions(prev => [...prev, ...result.questions]);
      if (!title && result.title) {
        setTitle(result.title);
      }
      alert(`Đã trích xuất thành công ${result.questions.length} câu hỏi và thêm vào đề thi!`);
    } else {
      alert('Không nhận diện được câu hỏi nào từ văn bản. Vui lòng kiểm tra định dạng câu hỏi (Ví dụ: "Câu 1: ... A. ... B. ...").');
    }
  };

  // Bank Question Actions
  const toggleBankQuestion = (q: Question) => {
    if (examQuestions.some(item => item.id === q.id)) {
      setExamQuestions(examQuestions.filter(item => item.id !== q.id));
    } else {
      setExamQuestions([...examQuestions, q]);
    }
  };

  const selectAllBankQuestions = () => {
    const existingIds = new Set(examQuestions.map(q => q.id));
    const toAdd = availableBankQuestions.filter(q => !existingIds.has(q.id));
    setExamQuestions([...examQuestions, ...toAdd]);
  };

  // Smart Matrix Auto Pick
  const handleAutoMatrix = () => {
    const pool = initialBankQuestions.filter(q => q.subject === subject && q.grade === grade);
    if (pool.length === 0) {
      alert(`Không có câu hỏi nào trong ngân hàng môn ${subject} khối ${grade}!`);
      return;
    }

    const nb = pool.filter(q => q.difficulty === 'recognition').slice(0, 3);
    const th = pool.filter(q => q.difficulty === 'understanding').slice(0, 3);
    const vd = pool.filter(q => q.difficulty === 'application').slice(0, 2);
    const vdc = pool.filter(q => q.difficulty === 'high_application').slice(0, 1);

    const autoSelected = [...nb, ...th, ...vd, ...vdc];
    setExamQuestions(autoSelected.length > 0 ? autoSelected : pool.slice(0, 5));
    alert(`Đã tự động rút trích ${autoSelected.length} câu hỏi theo ma trận chuẩn GDPT 2018 (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)!`);
  };

  // Remove a question from exam list
  const removeQuestionFromExam = (index: number) => {
    setExamQuestions(examQuestions.filter((_, i) => i !== index));
  };

  // Move question up or down
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === examQuestions.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...examQuestions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setExamQuestions(updated);
  };

  // Change correct answer of an exam question on the fly
  const changeCorrectAnswer = (questionIndex: number, newOptionIndex: number) => {
    const updated = [...examQuestions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      correctAnswers: [newOptionIndex]
    };
    setExamQuestions(updated);
  };

  // Download Sample Word Template
  const downloadSampleWordTemplate = () => {
    const sampleText = `HỆ THỐNG KHẢO THÍ TRỰC TUYẾN - ĐỀ KIỂM TRA MÔN TIN HỌC LỚP 9
Thời gian làm bài: 45 phút

Câu 1: [NB] Trong ngôn ngữ lập trình Python, hàm nào sau đây dùng để xuất dữ liệu ra màn hình?
A. cin >>
*B. print()
C. output()
D. echo()
Lời giải: Hàm print() trong Python dùng để in/xuất chuỗi ký tự hoặc giá trị ra màn hình chuẩn.

Câu 2: [TH] Trong phần mềm bảng tính Excel, địa chỉ ô $A$1 thuộc loại địa chỉ nào?
A. Địa chỉ tương đối
*B. Địa chỉ tuyệt đối
C. Địa chỉ hỗn hợp
D. Địa chỉ mạng
Lời giải: $A$1 có dấu $ trước cả tên cột và chỉ số dòng nên là địa chỉ tuyệt đối.

Câu 3: [VD] Cho đoạn mã sau trong Python:
s = 0
for i in range(1, 5):
    s += i
print(s)
Kết quả in ra là:
*A. 10
B. 15
C. 4
D. 6
Lời giải: range(1, 5) sinh ra các giá trị 1, 2, 3, 4. Tổng s = 1 + 2 + 3 + 4 = 10.

Câu 4: [VDC] Thiết bị nào sau đây đóng vai trò định tuyến và chuyển tiếp các gói tin giữa các mạng máy tính khác nhau qua môi trường Internet?
*A. Router (Bộ định tuyến)
B. Switch (Bộ chuyển mạch)
C. Hub (Bộ tập trung)
D. Repeater (Bộ lặp)
Lời giải: Router hoạt động ở tầng mạng, có bảng định tuyến để tìm đường đi tối ưu cho gói tin.
`;
    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_de_kiem_tra_tin_hoc.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return;
    }

    if (examQuestions.length === 0) {
      alert('Đề kiểm tra cần có ít nhất 1 câu hỏi! Vui lòng tải lên file Word, nhập trực tiếp hoặc chọn từ ngân hàng.');
      return;
    }

    const targetClasses = targetClassesInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const isModerator = isTeacherToanOrAdmin(currentUser);

    const updatedExam: Exam = {
      id: examToEdit?.id || 'exam-' + Date.now(),
      title: title.trim(),
      code: code.trim(),
      description: description.trim() || `Đề kiểm tra môn ${subject} khối ${grade}`,
      subject,
      grade,
      durationMinutes: Number(durationMinutes),
      totalQuestions: examQuestions.length,
      passingScore: Number(passingScore),
      maxScore: Number(maxScore),
      maxAttempts: Number(maxAttempts),
      accessCode: accessCode.trim() || undefined,
      targetClasses: targetClasses.length > 0 ? targetClasses : ['Tất cả'],
      shuffleQuestions,
      shuffleOptions,
      showAnswerAfterSubmit,
      isPublished: true,
      status: 'active',
      questions: examQuestions,
      createdAt: examToEdit?.createdAt || new Date().toISOString().split('T')[0],
      createdBy: examToEdit?.createdBy || currentUser.name,
      approvalStatus: isModerator ? 'approved' : 'pending_approval',
      approvedBy: isModerator ? currentUser.name : undefined,
      approvedAt: isModerator ? new Date().toISOString() : undefined
    };

    onSave(updatedExam);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {examToEdit ? 'Chỉnh sửa cấu hình đề kiểm tra' : 'Tạo đề kiểm tra trực tuyến mới'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Môn: <strong className="text-blue-700">{subject}</strong> • Khối {grade} • {examQuestions.length} câu hỏi trong đề
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
          
          {/* Moderation Notice */}
          {!isTeacherToanOrAdmin(currentUser) ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quy trình kiểm duyệt đề thi: </span>
                Đề kiểm tra do giáo viên biên soạn sẽ được chuyển đến hàng đợi phê duyệt của <strong>Thầy Toàn hoặc Quản trị viên (Admin)</strong> trước khi học sinh có thể truy cập làm bài.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Đặc quyền Thầy Toàn / Admin: </span>
                Đề thi sẽ được tự động kích hoạt và phê duyệt mở phòng thi ngay lập tức.
              </div>
            </div>
          )}
          {/* General Information Section */}
          <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
              Thông Tin Chung Đề Thi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên bài kiểm tra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm Tra Giữa Học Kỳ II - Môn Tin Học 9"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã đề thi
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-hidden uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Môn học
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value as Subject);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                >
                  {SUBJECT_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Khối lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(Number(e.target.value) as GradeLevel);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                >
                  <option value={6}>Lớp 6</option>
                  <option value={7}>Lớp 7</option>
                  <option value={8}>Lớp 8</option>
                  <option value={9}>Lớp 9</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thời gian làm bài
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold">phút</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Số lượt thi tối đa
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả & Hướng dẫn làm bài
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú cấu trúc đề thi, phạm vi kiến thức kiểm tra..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mã truy cập phòng thi (Mật khẩu)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống nếu cho phép học sinh vào tự do"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono uppercase outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lớp áp dụng (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 9A1, 9A2 hoặc Tất cả"
                    value={targetClassesInput}
                    onChange={(e) => setTargetClassesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Exam Security Settings */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600"
                />
                <span className="font-semibold text-slate-700">Trộn thứ tự câu hỏi</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600"
                />
                <span className="font-semibold text-slate-700">Trộn thứ tự đáp án A/B/C/D</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnswerAfterSubmit}
                  onChange={(e) => setShowAnswerAfterSubmit(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600"
                />
                <span className="font-semibold text-slate-700">Hiện lời giải sau khi nộp</span>
              </label>
            </div>
          </div>

          {/* Section 2: Question Import and Direct Creation Methods */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
                Thêm Câu Hỏi Vào Đề Thi (Upload Word / Nhập Trực Tiếp / Ngân Hàng)
              </h3>

              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                  Đã có: <strong>{examQuestions.length}</strong> câu
                </span>
                <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                  Tổng: <strong>{totalPointsCalculated.toFixed(1)}</strong> điểm
                </span>
              </div>
            </div>

            {/* Selection Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('upload_word')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upload_word'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('direct_input')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'direct_input'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Nhập Trực Tiếp Câu Hỏi & Đáp Án</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('question_bank')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'question_bank'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Ngân Hàng Câu Hỏi Sẵn Có</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD WORD FILE */}
            {activeTab === 'upload_word' && (
              <div className="p-5 bg-blue-50/40 rounded-2xl border-2 border-dashed border-blue-200 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Tải lên tệp đề kiểm tra từ Microsoft Word (.docx)
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Hệ thống tự động trích xuất nội dung câu hỏi, 4 đáp án A/B/C/D, nhận diện đáp án đúng (*A hoặc Đáp án: A) và giải thích.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={downloadSampleWordTemplate}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Xem file mẫu</span>
                    </button>

                    <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm hover:shadow transition-all flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? 'Đang đọc file...' : 'Chọn file Word (.docx)'}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".docx,.doc,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {uploadWarning && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{uploadWarning}</span>
                  </div>
                )}

                {uploadedFileName && !uploadWarning && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã nạp thành công câu hỏi từ file: <strong>{uploadedFileName}</strong></span>
                  </div>
                )}

                <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Quy ước định dạng Word hỗ trợ tốt nhất:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                    <li>Đầu mỗi câu: <code>Câu 1:</code>, <code>Câu 2.</code> hoặc <code>Bài 1:</code></li>
                    <li>Mức độ nhận thức trong ngoặc: <code>[NB]</code> (Nhận biết), <code>[TH]</code> (Thông hiểu), <code>[VD]</code> (Vận dụng), <code>[VDC]</code> (Vận dụng cao).</li>
                    <li>Đánh dấu đáp án đúng: Có dấu sao trước phương án (VD: <code>*B. print()</code>) hoặc có dòng <code>Đáp án: B</code> ở cuối câu.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT INPUT */}
            {activeTab === 'direct_input' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                {/* Sub-mode Toggle */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDirectInputMode('form')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        directInputMode === 'form'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Soạn Thảo Từng Câu
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectInputMode('paste_text')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        directInputMode === 'paste_text'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Dán Nhanh Đoạn Văn Bản (Paste Text)
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Nhập câu hỏi kèm phương án và đáp án đúng
                  </span>
                </div>

                {directInputMode === 'form' ? (
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Loại câu hỏi
                        </label>
                        <select
                          value={directType}
                          onChange={(e) => setDirectType(e.target.value as QuestionType)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                        >
                          <option value="multiple_choice">Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                          <option value="true_false">Đúng / Sai</option>
                          <option value="fill_in">Điền đáp án ngắn</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Mức độ nhận thức
                        </label>
                        <select
                          value={directDifficulty}
                          onChange={(e) => setDirectDifficulty(e.target.value as DifficultyLevel)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                        >
                          <option value="recognition">Nhận biết</option>
                          <option value="understanding">Thông hiểu</option>
                          <option value="application">Vận dụng</option>
                          <option value="high_application">Vận dụng cao</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Điểm số
                        </label>
                        <input
                          type="number"
                          step={0.25}
                          min={0.25}
                          max={10}
                          value={directPoints}
                          onChange={(e) => setDirectPoints(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nội dung câu hỏi <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Nhập nội dung câu hỏi (Ví dụ: Trong Python, câu lệnh nào dùng để xuất dữ liệu ra màn hình?)..."
                        value={directContent}
                        onChange={(e) => setDirectContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-medium"
                      />
                    </div>

                    {/* Options For Multiple Choice */}
                    {directType === 'multiple_choice' && (
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-700">
                          Các phương án trả lời (Click vào nút tròn để chọn đáp án đúng):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map((label, idx) => (
                            <div
                              key={label}
                              className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all ${
                                directCorrectAnswer === idx
                                  ? 'border-emerald-500 bg-emerald-50/70'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setDirectCorrectAnswer(idx)}
                                className={`w-7 h-7 rounded-full font-bold flex items-center justify-center shrink-0 transition-colors ${
                                  directCorrectAnswer === idx
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {label}
                              </button>
                              <input
                                type="text"
                                placeholder={`Nội dung phương án ${label}...`}
                                value={directOptions[idx]}
                                onChange={(e) => {
                                  const updated = [...directOptions];
                                  updated[idx] = e.target.value;
                                  setDirectOptions(updated);
                                }}
                                className="flex-1 bg-transparent border-0 outline-hidden font-medium text-xs text-slate-800"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* True False */}
                    {directType === 'true_false' && (
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-700">
                          Chọn đáp án đúng:
                        </label>
                        <div className="flex gap-4">
                          <label className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border cursor-pointer ${
                            directCorrectAnswer === 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'
                          }`}>
                            <input
                              type="radio"
                              name="tf-ans"
                              checked={directCorrectAnswer === 0}
                              onChange={() => setDirectCorrectAnswer(0)}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span className="font-bold text-slate-800">Đúng</span>
                          </label>

                          <label className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border cursor-pointer ${
                            directCorrectAnswer === 1 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'
                          }`}>
                            <input
                              type="radio"
                              name="tf-ans"
                              checked={directCorrectAnswer === 1}
                              onChange={() => setDirectCorrectAnswer(1)}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span className="font-bold text-slate-800">Sai</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Fill In */}
                    {directType === 'fill_in' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Đáp án đúng chuẩn <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập giá trị đáp án chính xác..."
                          value={directFillAnswer}
                          onChange={(e) => setDirectFillAnswer(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-mono font-bold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lời giải thích / Hướng dẫn giải chi tiết (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Giải thích vì sao chọn đáp án này..."
                        value={directExplanation}
                        onChange={(e) => setDirectExplanation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleAddDirectQuestion}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm câu hỏi này vào đề thi</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700">
                      Dán nội dung toàn bộ câu hỏi (hỗ trợ nhiều câu một lúc):
                    </label>
                    <textarea
                      rows={8}
                      value={pasteRawText}
                      onChange={(e) => setPasteRawText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">
                        Định dạng: <code>Câu X: ... A. ... *B. ... C. ... D. ... Lời giải: ...</code>
                      </span>
                      <button
                        type="button"
                        onClick={handleParsePasteText}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Trích xuất & Thêm vào đề</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUESTION BANK */}
            {activeTab === 'question_bank' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-slate-600 text-xs">
                    Ngân hàng câu hỏi môn <strong>{subject}</strong> Lớp <strong>{grade}</strong> (có {availableBankQuestions.length} câu)
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoMatrix}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Rút theo ma trận chuẩn</span>
                    </button>

                    <button
                      type="button"
                      onClick={selectAllBankQuestions}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Sub-filter bar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Lọc câu hỏi trong ngân hàng theo từ khóa..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-hidden"
                    />
                  </div>

                  <select
                    value={questionDiffFilter}
                    onChange={(e) => setQuestionDiffFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-hidden"
                  >
                    <option value="all">Mọi mức độ</option>
                    <option value="recognition">Nhận biết</option>
                    <option value="understanding">Thông hiểu</option>
                    <option value="application">Vận dụng</option>
                    <option value="high_application">Vận dụng cao</option>
                  </select>
                </div>

                {/* Question Bank List */}
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                  {availableBankQuestions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <p>Không có câu hỏi nào trong ngân hàng phù hợp.</p>
                      {onOpenQuestionCreator && (
                        <button
                          type="button"
                          onClick={onOpenQuestionCreator}
                          className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                        >
                          + Thêm câu hỏi mới vào ngân hàng
                        </button>
                      )}
                    </div>
                  ) : (
                    availableBankQuestions.map((q) => {
                      const isSelected = examQuestions.some(item => item.id === q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleBankQuestion(q)}
                          className={`p-3 rounded-lg border flex items-start space-x-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="pt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2 text-[10px]">
                              <span className="font-mono font-bold text-slate-600">{q.code}</span>
                              <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-700 font-medium">
                                {q.difficulty === 'recognition' ? 'Nhận biết' :
                                 q.difficulty === 'understanding' ? 'Thông hiểu' :
                                 q.difficulty === 'application' ? 'Vận dụng' : 'Vận dụng cao'}
                              </span>
                              <span className="text-slate-400">({q.points || 1.0} điểm)</span>
                            </div>

                            <p className="text-xs text-slate-900 font-medium line-clamp-2">
                              {q.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ACTIVE EXAM QUESTIONS LIST & PREVIEW */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-extrabold uppercase tracking-wider text-slate-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Danh Sách Câu Hỏi Trong Đề ({examQuestions.length} câu)
                </h4>

                {examQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExamQuestions([])}
                    className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] transition-colors"
                  >
                    Xóa tất cả câu hỏi trong đề
                  </button>
                )}
              </div>

              {examQuestions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">Đề thi hiện chưa có câu hỏi nào.</p>
                  <p className="text-[11px]">
                    Hãy chọn <strong>Upload File Word</strong>, <strong>Nhập Trực Tiếp</strong> hoặc <strong>Chọn từ Ngân Hàng</strong> ở trên để nạp câu hỏi vào đề.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {examQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-[11px] text-slate-500">
                            {q.code || `CÂU-${idx + 1}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {q.difficulty === 'recognition' ? 'Nhận biết' :
                             q.difficulty === 'understanding' ? 'Thông hiểu' :
                             q.difficulty === 'application' ? 'Vận dụng' : 'Vận dụng cao'}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({q.points || 1.0} điểm)
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => moveQuestion(idx, 'up')}
                            disabled={idx === 0}
                            title="Di chuyển lên"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(idx, 'down')}
                            disabled={idx === examQuestions.length - 1}
                            title="Di chuyển xuống"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestionFromExam(idx)}
                            title="Xóa câu hỏi khỏi đề"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-900 font-medium whitespace-pre-line text-xs">
                        {q.content}
                      </p>

                      {/* Options rendering & quick answer selection */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(optIdx);
                            const optLabel = String.fromCharCode(65 + optIdx);
                            return (
                              <div
                                key={optIdx}
                                onClick={() => changeCorrectAnswer(idx, optIdx)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-2 cursor-pointer transition-colors ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-900'
                                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {optLabel}
                                </span>
                                <span className="flex-1 truncate">{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] text-emerald-700 font-bold">✓ Đáp án đúng</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill in correct answer preview */}
                      {q.type === 'fill_in' && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                          <strong>Đáp án đúng:</strong> {Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : q.correctAnswers}
                        </div>
                      )}

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <strong>Hướng dẫn giải:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Tổng số: <strong className="text-slate-800">{examQuestions.length} câu hỏi</strong> • Điểm tối đa: <strong className="text-slate-800">{totalPointsCalculated.toFixed(1)}</strong>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{examToEdit ? 'Lưu cập nhật đề thi' : 'Phát hành đề thi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
