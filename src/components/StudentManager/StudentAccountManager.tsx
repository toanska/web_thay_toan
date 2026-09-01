import React, { useState, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  LogIn, 
  Sparkles, 
  Key, 
  Mail, 
  Phone, 
  School, 
  GraduationCap, 
  Plus, 
  X, 
  Copy, 
  Check, 
  Layers,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { User, GradeLevel, ExamAttempt } from '../../types';

interface StudentAccountManagerProps {
  users: User[];
  currentUser: User;
  attempts: ExamAttempt[];
  onSaveUser: (user: User) => void;
  onSaveUsersBatch: (users: User[]) => void;
  onDeleteUser: (id: string) => void;
  onSwitchToStudent: (user: User) => void;
  onNavigateToLogin: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

// Helper to remove accents for email generation
function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str.toLowerCase().trim();
}

function generateSuggestedEmail(fullName: string, className: string): string {
  const cleanName = removeVietnameseTones(fullName);
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'hocsinh@thcs.edu.vn';
  const firstName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0]).join('');
  const cleanClass = className.toLowerCase().replace(/\s+/g, '');
  return `${firstName}${initials}.${cleanClass || 'hs'}@thcs.edu.vn`;
}

function generateSuggestedCode(grade: GradeLevel, existingCount: number): string {
  const year = new Date().getFullYear();
  const index = String(existingCount + 1).padStart(2, '0');
  return `HS-${year}${String(grade).padStart(2, '0')}${index}`;
}

export const StudentAccountManager: React.FC<StudentAccountManagerProps> = ({
  users,
  currentUser,
  attempts,
  onSaveUser,
  onSaveUsersBatch,
  onDeleteUser,
  onSwitchToStudent,
  onNavigateToLogin
}) => {
  const studentList = users.filter(u => u.role === 'student');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Single Student Form States
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState<GradeLevel>(9);
  const [formClass, setFormClass] = useState('9A1');
  const [formCode, setFormCode] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAvatar, setFormAvatar] = useState(DEFAULT_AVATARS[0]);
  const [formSchool, setFormSchool] = useState('Trường THCS Nguyễn Du');

  // Batch Form States
  const [batchClass, setBatchClass] = useState('9A1');
  const [batchGrade, setBatchGrade] = useState<GradeLevel>(9);
  const [batchRawText, setBatchRawText] = useState(
`Nguyễn Hải Đăng
Trần Phương Linh
Lê Hoàng Nam
Phạm Ngọc Ánh
Vũ Minh Trí
Đỗ Bảo Châu
Hoàng Gia Huy
Bùi Thảo Nhi`
  );
  const [batchPreview, setBatchPreview] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique classes from existing students
  const availableClasses = Array.from(new Set(studentList.map(s => s.className).filter(Boolean))) as string[];

  // Filtered student list
  const filteredStudents = studentList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGrade = gradeFilter === 'all' || s.grade === Number(gradeFilter);
    const matchClass = classFilter === 'all' || s.className === classFilter;
    return matchSearch && matchGrade && matchClass;
  });

  // Calculate statistics per student
  const getStudentStats = (studentId: string) => {
    const studentAttempts = attempts.filter(a => a.studentId === studentId);
    const count = studentAttempts.length;
    const avgScore = count > 0 
      ? (studentAttempts.reduce((sum, a) => sum + a.score, 0) / count).toFixed(1)
      : 'Chưa thi';
    return { count, avgScore };
  };

  const handleOpenCreateSingle = () => {
    setEditingStudent(null);
    setFormName('');
    setFormGrade(9);
    setFormClass('9A1');
    const autoCode = generateSuggestedCode(9, studentList.length);
    setFormCode(autoCode);
    setFormEmail('');
    setFormPhone('');
    setFormAvatar(DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]);
    setFormSchool('Trường THCS Nguyễn Du');
    setShowCreateModal(true);
  };

  const handleOpenEditSingle = (student: User) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormGrade(student.grade || 9);
    setFormClass(student.className || '9A1');
    setFormCode(student.code);
    setFormEmail(student.email);
    setFormPhone(student.phone || '');
    setFormAvatar(student.avatar);
    setFormSchool(student.school || 'Trường THCS Nguyễn Du');
    setShowCreateModal(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingStudent) {
      setFormEmail(generateSuggestedEmail(val, formClass));
    }
  };

  const handleClassChange = (val: string) => {
    setFormClass(val);
    const gradeNum = parseInt(val.charAt(0), 10) as GradeLevel;
    if ([6, 7, 8, 9].includes(gradeNum)) {
      setFormGrade(gradeNum);
    }
    if (!editingStudent && formName) {
      setFormEmail(generateSuggestedEmail(formName, val));
    }
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    const finalCode = formCode.trim() || generateSuggestedCode(formGrade, studentList.length);
    const finalEmail = formEmail.trim() || generateSuggestedEmail(formName, formClass);

    const newOrUpdatedUser: User = {
      id: editingStudent ? editingStudent.id : `user-student-${Date.now()}`,
      name: formName.trim(),
      role: 'student',
      code: finalCode.toUpperCase(),
      className: formClass.trim().toUpperCase(),
      grade: formGrade,
      avatar: formAvatar,
      email: finalEmail.toLowerCase(),
      phone: formPhone.trim() || undefined,
      school: formSchool.trim() || 'Trường THCS Nguyễn Du',
    };

    onSaveUser(newOrUpdatedUser);
    setShowCreateModal(false);
  };

  // Parse Batch list from Text
  const handleParseBatchText = () => {
    const lines = batchRawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      alert('Vui lòng nhập hoặc dán danh sách họ tên học sinh!');
      return;
    }

    const year = new Date().getFullYear();
    const generated: User[] = lines.map((line, idx) => {
      // Line might be: "Nguyễn Văn A" or "1. Nguyễn Văn A" or "HS-01, Nguyễn Văn A, 9A1"
      let clean = line.replace(/^\d+[\.\s:\-_]+/, '').trim();
      let customCode = '';
      let customClass = batchClass;

      if (clean.includes(',')) {
        const parts = clean.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          clean = parts[0];
          customClass = parts[1] || batchClass;
        }
      }

      const seq = String(studentList.length + idx + 1).padStart(2, '0');
      customCode = `HS-${year}${String(batchGrade).padStart(2, '0')}${seq}`;
      const email = generateSuggestedEmail(clean, customClass);
      const avatar = DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];

      return {
        id: `user-student-${Date.now()}-${idx + 1}`,
        name: clean,
        role: 'student',
        code: customCode,
        className: customClass.toUpperCase(),
        grade: batchGrade,
        avatar,
        email,
        school: 'Trường THCS Nguyễn Du'
      };
    });

    setBatchPreview(generated);
  };

  // Upload Excel / CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setBatchRawText(text);
      // Auto trigger parsing
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      const year = new Date().getFullYear();
      const generated: User[] = lines.map((line, idx) => {
        let clean = line.replace(/^\d+[\.\s:\-_]+/, '').replace(/["']/g, '').trim();
        let customClass = batchClass;
        if (clean.includes(',')) {
          const parts = clean.split(',').map(p => p.trim());
          clean = parts[0];
          if (parts[1]) customClass = parts[1];
        }
        const seq = String(studentList.length + idx + 1).padStart(2, '0');
        const customCode = `HS-${year}${String(batchGrade).padStart(2, '0')}${seq}`;
        const email = generateSuggestedEmail(clean, customClass);
        const avatar = DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];

        return {
          id: `user-student-${Date.now()}-${idx + 1}`,
          name: clean,
          role: 'student',
          code: customCode,
          className: customClass.toUpperCase(),
          grade: batchGrade,
          avatar,
          email,
          school: 'Trường THCS Nguyễn Du'
        };
      });
      setBatchPreview(generated);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc tệp văn bản/CSV.');
    }
  };

  const handleSaveBatch = () => {
    if (batchPreview.length === 0) {
      alert('Chưa có học sinh nào trong danh sách xem trước!');
      return;
    }
    onSaveUsersBatch(batchPreview);
    alert(`Đã khởi tạo thành công ${batchPreview.length} tài khoản học sinh mới!`);
    setShowBatchModal(false);
    setBatchPreview([]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export Student Accounts to CSV
  const handleExportCSV = () => {
    const headers = ['STT', 'Mã định danh HS (ID)', 'Họ và tên', 'Khối', 'Lớp', 'Email đăng nhập', 'Số điện thoại', 'Trường học'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.code}"`,
      `"${s.name}"`,
      s.grade || '',
      `"${s.className || ''}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.school || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_tai_khoan_hoc_sinh_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              Phân Hệ Quản Trị & Khảo Thí Môn Tin Học
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
              Quản Lý & Tạo Tài Khoản Học Sinh
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Khởi tạo mã định danh học sinh (ID), cấp tài khoản đăng nhập phòng thi, quản lý thông tin lớp học và theo dõi kết quả khảo thí trực tuyến.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateSingle}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm 1 Học Sinh Mới</span>
            </button>

            <button
              onClick={() => {
                setShowBatchModal(true);
                handleParseBatchText();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>📥 Tạo Nhanh Hàng Loạt (Excel/DS Lớp)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng số học sinh</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{studentList.length}</p>
          <p className="text-[11px] text-slate-400">Đã cấp tài khoản trên hệ thống</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Khối 9</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">Lớp 9</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {studentList.filter(s => s.grade === 9).length}
          </p>
          <p className="text-[11px] text-slate-400">Học sinh khối 9</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Khối 8 & Khối 7</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Lớp 7, 8</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {studentList.filter(s => s.grade === 8 || s.grade === 7).length}
          </p>
          <p className="text-[11px] text-slate-400">Học sinh khối 7 và 8</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Khối 6</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">Lớp 6</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {studentList.filter(s => s.grade === 6).length}
          </p>
          <p className="text-[11px] text-slate-400">Học sinh đầu cấp</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên học sinh, Mã định danh HS (HS-...), Email, Lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="bg-transparent border-0 font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">Tất cả khối lớp</option>
                <option value="9">Khối 9</option>
                <option value="8">Khối 8</option>
                <option value="7">Khối 7</option>
                <option value="6">Khối 6</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent border-0 font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">Tất cả lớp học</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors"
              title="Xuất file danh sách học sinh và mã định danh"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Danh Sách Tài Khoản Học Sinh ({filteredStudents.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Click vào mã ID để sao chép nhanh hoặc Đăng nhập thử nghiệm
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy tài khoản học sinh nào phù hợp</p>
            <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc nhấn nút thêm mới bên trên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-4 py-3.5">Mã định danh (ID)</th>
                  <th className="px-4 py-3.5">Lớp</th>
                  <th className="px-4 py-3.5">Email tài khoản</th>
                  <th className="px-4 py-3.5 text-center">Lượt thi</th>
                  <th className="px-4 py-3.5 text-center">ĐTB Tin học</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((student) => {
                  const stats = getStudentStats(student.id);
                  const isCurrent = currentUser.id === student.id;

                  return (
                    <tr key={student.id} className={`hover:bg-blue-50/40 transition-colors ${isCurrent ? 'bg-blue-50/70' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {student.name}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold">
                                  Đang chọn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{student.school}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-mono font-bold text-slate-800 text-xs border border-slate-200">
                          <span>{student.code}</span>
                          <button
                            onClick={() => handleCopyCode(student.code)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Sao chép mã ID"
                          >
                            {copiedCode === student.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                          {student.className || `Khối ${student.grade}`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-600 text-xs flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{student.email}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {stats.count} bài
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                          stats.avgScore === 'Chưa thi' 
                            ? 'bg-slate-100 text-slate-500' 
                            : Number(stats.avgScore) >= 8.0 
                              ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                              : Number(stats.avgScore) >= 5.0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                        }`}>
                          {stats.avgScore}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSwitchToStudent(student)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Đăng nhập tài khoản này để làm bài thử"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditSingle(student)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa tài khoản học sinh "${student.name}" (${student.code})?`)) {
                                onDeleteUser(student.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT SINGLE STUDENT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStudent ? 'Chỉnh Sửa Tài Khoản Học Sinh' : 'Tạo Mới Tài Khoản Học Sinh'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấp mã định danh học sinh (ID) & Thông tin tham gia khảo thí trực tuyến
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="p-6 space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Grade & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 9A1, 8A2, 7A3..."
                    value={formClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold uppercase outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-hidden"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>
              </div>

              {/* Student Code & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Mã định danh HS (ID)</span>
                    <button
                      type="button"
                      onClick={() => setFormCode(generateSuggestedCode(formGrade, studentList.length))}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Tự sinh mã
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: HS-20240901"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 uppercase outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email tài khoản học đường
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="VD: an.9a1@thcs.edu.vn"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Phone & School */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại phụ huynh / HS (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0988 123 456"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trường học
                  </label>
                  <input
                    type="text"
                    value={formSchool}
                    onChange={(e) => setFormSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn ảnh đại diện học sinh:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {DEFAULT_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormAvatar(url)}
                      className={`relative rounded-full p-0.5 transition-transform ${
                        formAvatar === url ? 'ring-2 ring-blue-600 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      {formAvatar === url && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingStudent ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản Học Sinh'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH CREATE FROM EXCEL / TEXT */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tạo Tài Khoản Học Sinh Hàng Loạt (Batch Import)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dán danh sách cả lớp từ Excel hoặc tải tệp lên để hệ thống tự động sinh ID và Email học đường
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
              {/* Batch Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Áp dụng cho Lớp
                  </label>
                  <input
                    type="text"
                    value={batchClass}
                    onChange={(e) => {
                      setBatchClass(e.target.value.toUpperCase());
                      const gradeNum = parseInt(e.target.value.charAt(0), 10) as GradeLevel;
                      if ([6, 7, 8, 9].includes(gradeNum)) setBatchGrade(gradeNum);
                    }}
                    placeholder="VD: 9A1"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold uppercase outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={batchGrade}
                    onChange={(e) => setBatchGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold outline-hidden"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải tệp danh sách (.txt/.csv)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Dán danh sách họ và tên học sinh (Mỗi học sinh một dòng):
                  </label>
                  <button
                    type="button"
                    onClick={handleParseBatchText}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" /> Cập nhật bảng xem trước
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={batchRawText}
                  onChange={(e) => setBatchRawText(e.target.value)}
                  placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Xem trước kết quả sinh tài khoản ({batchPreview.length} học sinh)
                  </h4>
                </div>

                {batchPreview.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 text-[11px]">
                        <tr>
                          <th className="px-3 py-2">STT</th>
                          <th className="px-3 py-2">Họ và tên</th>
                          <th className="px-3 py-2">Mã ID</th>
                          <th className="px-3 py-2">Lớp</th>
                          <th className="px-3 py-2">Email cấp tự động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchPreview.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-900">{item.name}</td>
                            <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{item.code}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-700">{item.className}</td>
                            <td className="px-3 py-1.5 text-slate-600">{item.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    Nhấn nút "Cập nhật bảng xem trước" để kiểm tra danh sách tài khoản sẽ được khởi tạo.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                Sau khi tạo, học sinh có thể sử dụng ngay mã ID hoặc Email để tra cứu điểm và làm bài thi.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Xác Nhận & Cấp {batchPreview.length} Tài Khoản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
