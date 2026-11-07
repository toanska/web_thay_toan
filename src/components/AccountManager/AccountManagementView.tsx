import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  BookOpen,
  Settings,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react';
import { User, UserRole, GradeLevel, ExamAttempt } from '../../types';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';

interface AccountManagementViewProps {
  users: User[];
  currentUser: User;
  attempts: ExamAttempt[];
  onSaveUser: (user: User) => void;
  onSaveUsersBatch: (users: User[]) => void;
  onDeleteUser: (id: string) => void;
  onDeleteUsersBatch?: (ids: string[]) => void;
  onSwitchUser: (user: User) => void;
  onNavigateToLogin: () => void;
}

const DEFAULT_AVATARS_STUDENT = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const DEFAULT_AVATARS_TEACHER = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
];

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

function generateSuggestedEmail(fullName: string, role: UserRole, className?: string, subject?: string): string {
  const cleanName = removeVietnameseTones(fullName);
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'taikhoan@thcs.edu.vn';
  const firstName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0]).join('');

  if (role === 'student') {
    const cleanClass = (className || 'hs').toLowerCase().replace(/\s+/g, '');
    return `${firstName}${initials}.${cleanClass}@thcs.edu.vn`;
  } else if (role === 'teacher') {
    const cleanSub = removeVietnameseTones(subject || 'tinhoc').replace(/\s+/g, '');
    return `${firstName}${initials}.${cleanSub}@thcs.edu.vn`;
  } else {
    return `${firstName}${initials}.admin@thcs.edu.vn`;
  }
}

export function getClassCodeDigits(className?: string, grade?: number): string {
  if (!className) {
    return `${grade || 9}1`;
  }
  const clean = className.trim().toUpperCase();
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 2) {
    return digitsOnly;
  } else if (digitsOnly.length === 1) {
    const letterMatch = clean.match(/[A-Z]/);
    let sec = '1';
    if (letterMatch) {
      const charCode = letterMatch[0].charCodeAt(0) - 64; // A=1, B=2, C=3...
      sec = String(Math.max(1, Math.min(9, charCode)));
    }
    return `${digitsOnly}${sec}`;
  } else {
    return `${grade || 9}1`;
  }
}

export function formatStudentCode(className?: string, grade?: number, sttIndex: number = 1, year: number = 2026): string {
  const classDigits = getClassCodeDigits(className, grade);
  const sttStr = String(sttIndex).padStart(2, '0');
  return `HS-${year}${classDigits}${sttStr}`;
}

function generateSuggestedCode(role: UserRole, grade: GradeLevel, existingCount: number, subject?: string, className?: string): string {
  const year = 2026;
  if (role === 'student') {
    return formatStudentCode(className, grade, existingCount + 1, year);
  } else if (role === 'teacher') {
    const index = String(existingCount + 1).padStart(2, '0');
    const subTag = subject?.includes('Toán') ? 'TOAN' : 'TINHOC';
    return `GV-${subTag}${index}`;
  } else {
    const index = String(existingCount + 1).padStart(2, '0');
    return `ADMIN-${index}`;
  }
}

export const AccountManagementView: React.FC<AccountManagementViewProps> = ({
  users,
  currentUser,
  attempts,
  onSaveUser,
  onSaveUsersBatch,
  onDeleteUser,
  onDeleteUsersBatch,
  onSwitchUser,
  onNavigateToLogin
}) => {
  // Security verification
  const isAuthorized = isTeacherToanOrAdmin(currentUser);

  // Filter & Search states
  const [roleTab, setRoleTab] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('student');
  const [formGrade, setFormGrade] = useState<GradeLevel>(9);
  const [formClass, setFormClass] = useState('9A1');
  const [formSubject, setFormSubject] = useState('Tin học');
  const [formCode, setFormCode] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'locked'>('active');
  const [formPin, setFormPin] = useState('123456');
  const [formAvatar, setFormAvatar] = useState(DEFAULT_AVATARS_STUDENT[0]);
  const [formSchool, setFormSchool] = useState('Môn Tin học - Thầy Toàn');

  // Batch Form States
  const [batchRole, setBatchRole] = useState<UserRole>('student');
  const [batchClass, setBatchClass] = useState('9A1');
  const [batchGrade, setBatchGrade] = useState<GradeLevel>(9);
  const [batchSubject, setBatchSubject] = useState('Tin học');
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
  const availableClasses = Array.from(new Set(users.filter(u => u.role === 'student').map(s => s.className).filter(Boolean))) as string[];

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchRole = roleTab === 'all' || u.role === roleTab;
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.className && u.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (u.subject && u.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGrade = gradeFilter === 'all' || (u.grade && u.grade === Number(gradeFilter));
    const matchClass = classFilter === 'all' || (u.className && u.className === classFilter);
    const userStatus = u.status || 'active';
    const matchStatus = statusFilter === 'all' || userStatus === statusFilter;

    return matchRole && matchSearch && matchGrade && matchClass && matchStatus;
  });

  // KPI Calculations
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  const getStudentStats = (studentId: string) => {
    const studentAttempts = attempts.filter(a => a.studentId === studentId);
    const count = studentAttempts.length;
    const avgScore = count > 0 
      ? (studentAttempts.reduce((sum, a) => sum + a.score, 0) / count).toFixed(1)
      : 'Chưa thi';
    return { count, avgScore };
  };

  // Open Create Single Modal
  const handleOpenCreate = (defaultRole: UserRole = 'student') => {
    setEditingUser(null);
    setFormName('');
    setFormRole(defaultRole);
    setFormGrade(9);
    setFormClass(defaultRole === 'student' ? '9A1' : '');
    setFormSubject(defaultRole === 'teacher' ? 'Tin học' : '');
    const count = users.filter(u => u.role === defaultRole).length;
    setFormCode(generateSuggestedCode(defaultRole, 9, count, 'Tin học'));
    setFormEmail('');
    setFormPhone('');
    setFormStatus('active');
    setFormPin('123456');
    setFormAvatar(defaultRole === 'student' ? DEFAULT_AVATARS_STUDENT[0] : DEFAULT_AVATARS_TEACHER[0]);
    setFormSchool('Môn Tin học - Thầy Toàn');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setFormGrade(user.grade || 9);
    setFormClass(user.className || '');
    setFormSubject(user.subject || 'Tin học');
    setFormCode(user.code);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormStatus(user.status || 'active');
    setFormPin(user.pin || '123456');
    setFormAvatar(user.avatar);
    setFormSchool(user.school || 'Môn Tin học - Thầy Toàn');
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingUser) {
      setFormEmail(generateSuggestedEmail(val, formRole, formClass, formSubject));
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    const count = users.filter(u => u.role === role).length;
    setFormCode(generateSuggestedCode(role, formGrade, count, formSubject));
    if (!editingUser && formName) {
      setFormEmail(generateSuggestedEmail(formName, role, formClass, formSubject));
    }
    setFormAvatar(role === 'student' ? DEFAULT_AVATARS_STUDENT[0] : DEFAULT_AVATARS_TEACHER[0]);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    const finalCode = formCode.trim() || generateSuggestedCode(formRole, formGrade, users.length, formSubject);
    const finalEmail = formEmail.trim() || generateSuggestedEmail(formName, formRole, formClass, formSubject);

    const newOrUpdatedUser: User = {
      id: editingUser ? editingUser.id : `user-${formRole}-${Date.now()}`,
      name: formName.trim(),
      role: formRole,
      code: finalCode.toUpperCase(),
      className: formRole === 'student' ? (formClass.trim().toUpperCase() || '9A1') : undefined,
      grade: formRole === 'student' ? formGrade : undefined,
      subject: formRole === 'teacher' ? formSubject.trim() : undefined,
      status: formStatus,
      pin: formPin.trim() || '123456',
      avatar: formAvatar,
      email: finalEmail.toLowerCase(),
      phone: formPhone.trim() || undefined,
      school: formSchool.trim() || 'Môn Tin học - Thầy Toàn',
    };

    onSaveUser(newOrUpdatedUser);
    setShowModal(false);
  };

  // Toggle Account Lock Status
  const handleToggleLock = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Không thể tự khóa tài khoản bạn đang đăng nhập!');
      return;
    }
    const currentStatus = user.status || 'active';
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    const updated: User = { ...user, status: newStatus };
    onSaveUser(updated);
  };

  // Reset PIN/Password
  const handleResetPin = (user: User) => {
    const newPin = prompt(`Đặt lại mã PIN / Mật khẩu cho "${user.name}" (${user.code}):`, '123456');
    if (newPin !== null && newPin.trim()) {
      onSaveUser({ ...user, pin: newPin.trim() });
      alert(`Đã đặt lại mã PIN thành công cho ${user.name}: "${newPin.trim()}"`);
    }
  };

  // Recalculate code for all student accounts according to rule: Năm (2026) + MãLớp (9A1 -> 91) + STT (01, 02...)
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);

  const handleRecalculateAllStudentCodes = () => {
    const studentUsers = users.filter(u => u.role === 'student');
    if (studentUsers.length === 0) {
      setToastMessage('Không tìm thấy học sinh nào trong hệ thống!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Group students by class name
    const classGroups: Record<string, User[]> = {};
    studentUsers.forEach(s => {
      const clsKey = (s.className || `Khối ${s.grade || 9}`).trim().toUpperCase();
      if (!classGroups[clsKey]) classGroups[clsKey] = [];
      classGroups[clsKey].push(s);
    });

    const sortedClassNames = Object.keys(classGroups).sort((a, b) => a.localeCompare(b, 'vi'));
    const updatedStudents: User[] = [];
    const year = 2026;

    sortedClassNames.forEach(clsKey => {
      const classList = classGroups[clsKey];
      // Sort alphabetically by student full name within class
      classList.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      classList.forEach((st, idx) => {
        const newCode = formatStudentCode(st.className, st.grade, idx + 1, year);
        updatedStudents.push({
          ...st,
          code: newCode
        });
      });
    });

    onSaveUsersBatch(updatedStudents);
    setShowRecalculateModal(false);
    setToastMessage(`Đã cập nhật mã định danh chuẩn [HS-Năm+Lớp+STT] cho ${updatedStudents.length} học sinh thành công! (Ví dụ: Nguyễn Văn A lớp 9A1 -> HS-20269101)`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Parse Batch text
  const handleParseBatchText = () => {
    const lines = batchRawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      alert('Vui lòng nhập danh sách họ tên!');
      return;
    }

    const currentCount = users.filter(u => u.role === batchRole).length;
    const year = 2026;

    const generated: User[] = lines.map((line, idx) => {
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

      const seq = String(currentCount + idx + 1).padStart(2, '0');
      if (batchRole === 'student') {
        customCode = formatStudentCode(customClass, batchGrade, idx + 1, year);
      } else if (batchRole === 'teacher') {
        customCode = `GV-TINHOC${seq}`;
      } else {
        customCode = `ADMIN-${seq}`;
      }

      const email = generateSuggestedEmail(clean, batchRole, customClass, batchSubject);
      const avatars = batchRole === 'student' ? DEFAULT_AVATARS_STUDENT : DEFAULT_AVATARS_TEACHER;
      const avatar = avatars[idx % avatars.length];

      return {
        id: `user-${batchRole}-${Date.now()}-${idx + 1}`,
        name: clean,
        role: batchRole,
        code: customCode,
        className: batchRole === 'student' ? customClass.toUpperCase() : undefined,
        grade: batchRole === 'student' ? batchGrade : undefined,
        subject: batchRole === 'teacher' ? batchSubject : undefined,
        status: 'active',
        pin: '123456',
        avatar,
        email,
        school: 'Môn Tin học - Thầy Toàn'
      };
    });

    setBatchPreview(generated);
  };

  // Download Sample Excel Template
  const downloadSampleExcel = () => {
    const sampleRows = [
      ['STT', 'Họ và tên', 'Lớp', 'Mã định danh (Tùy chọn)', 'Mật khẩu PIN (Tùy chọn)'],
      [1, 'Nguyễn Văn An', '9A1', '', '123456'],
      [2, 'Trần Thị Bình', '9A1', '', '123456'],
      [3, 'Lê Hoàng Cường', '9A1', '', '123456'],
      [4, 'Phạm Ngọc Duyên', '9A1', '', '123456'],
      [5, 'Hoàng Minh Đức', '9A1', '', '123456'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Hoc_Sinh');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_THCS_NgoQuyen.xlsx');
  };

  // Upload File for Batch (.xlsx, .xls, .csv, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let lines: string[] = [];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        rows.forEach((row, rIdx) => {
          if (!row || row.length === 0) return;
          const strCells = row.map(c => String(c ?? '').trim()).filter(Boolean);
          if (strCells.length === 0) return;
          const joined = strCells.join(' ').toLowerCase();
          if (rIdx === 0 && (joined.includes('họ') || joined.includes('tên') || joined.includes('stt') || joined.includes('name'))) {
            return;
          }

          let name = '';
          let cls = batchClass;

          if (strCells.length >= 2 && /^\d+$/.test(strCells[0])) {
            name = strCells[1];
            if (strCells[2] && /^[6-9][A-Z]\d*$/i.test(strCells[2])) cls = strCells[2];
          } else {
            name = strCells[0];
            if (strCells[1] && /^[6-9][A-Z]\d*$/i.test(strCells[1])) cls = strCells[1];
          }

          if (name && name.length >= 2 && !/^\d+$/.test(name)) {
            lines.push(cls ? `${name}, ${cls}` : name);
          }
        });
      } else {
        const text = await file.text();
        lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      }

      setBatchRawText(lines.join('\n'));
      const currentCount = users.filter(u => u.role === batchRole).length;
      const year = 2026;

      const generated: User[] = lines.map((line, idx) => {
        let clean = line.replace(/^\d+[\.\s:\-_]+/, '').replace(/["']/g, '').trim();
        let customClass = batchClass;
        if (clean.includes(',')) {
          const parts = clean.split(',').map(p => p.trim());
          clean = parts[0];
          if (parts[1]) customClass = parts[1];
        }
        const seq = String(currentCount + idx + 1).padStart(2, '0');
        const customCode = batchRole === 'student' 
          ? formatStudentCode(customClass, batchGrade, idx + 1, year)
          : `GV-TINHOC${seq}`;
        const email = generateSuggestedEmail(clean, batchRole, customClass, batchSubject);
        const avatars = batchRole === 'student' ? DEFAULT_AVATARS_STUDENT : DEFAULT_AVATARS_TEACHER;

        return {
          id: `user-${batchRole}-${Date.now()}-${idx + 1}`,
          name: clean,
          role: batchRole,
          code: customCode,
          className: batchRole === 'student' ? customClass.toUpperCase() : undefined,
          grade: batchRole === 'student' ? batchGrade : undefined,
          subject: batchRole === 'teacher' ? batchSubject : undefined,
          status: 'active',
          pin: '123456',
          avatar: avatars[idx % avatars.length],
          email,
          school: 'Môn Tin học - Thầy Toàn'
        };
      });
      setBatchPreview(generated);
      setToastMessage(`Đã đọc thành công ${generated.length} tài khoản từ tệp "${file.name}"!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setToastMessage('Không thể đọc tệp Excel / CSV! Vui lòng kiểm tra lại định dạng.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSaveBatch = () => {
    if (batchPreview.length === 0) {
      setToastMessage('Chưa có tài khoản nào trong danh sách xem trước!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    onSaveUsersBatch(batchPreview);
    setToastMessage(`Đã khởi tạo thành công ${batchPreview.length} tài khoản mới vào hệ thống!`);
    setTimeout(() => setToastMessage(null), 3500);
    setShowBatchModal(false);
    setBatchPreview([]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    const headers = ['STT', 'Vai trò', 'Mã định danh (ID)', 'Họ và tên', 'Khối', 'Lớp', 'Bộ môn', 'Email', 'Mã PIN', 'Số ĐT', 'Trạng thái', 'Trường học'];
    const rows = filteredUsers.map((u, idx) => [
      idx + 1,
      u.role === 'admin' ? 'Quản trị viên' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh',
      `"${u.code}"`,
      `"${u.name}"`,
      u.grade || '',
      `"${u.className || ''}"`,
      `"${u.subject || ''}"`,
      `"${u.email}"`,
      `"${u.pin || '123456'}"`,
      `"${u.phone || ''}"`,
      u.status === 'locked' ? 'Tạm khóa' : 'Hoạt động',
      `"${u.school || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_tai_khoan_he_thong_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Access check guard
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-slate-900">Khu Vực Giới Hạn Quyền Quản Trị</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Trang <strong>Quản lý, tạo và chỉnh sửa tài khoản</strong> chỉ dành riêng cho <strong>Thầy Toàn</strong> hoặc <strong>Quản trị viên (Admin)</strong>.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={onNavigateToLogin}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md"
          >
            Đăng nhập tài khoản Thầy Toàn / Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Quản Trị & Phân Quyền Tài Khoản</h2>
          <p className="text-xs text-slate-500">Khởi tạo, cập nhật hồ sơ và cấp mã định danh Giáo viên & Học sinh</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenCreate('student')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tạo Tài Khoản</span>
          </button>
          <button
            onClick={() => {
              setShowBatchModal(true);
              handleParseBatchText();
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>📥 Nhập Hàng Loạt</span>
          </button>
          <button
            onClick={() => setShowRecalculateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Tự động cập nhật mã học sinh theo chuẩn: [Năm][MãLớp][STT] (Ví dụ: 9A1 số 1 -> 20269101)"
          >
            <RefreshCw className="w-4 h-4 text-indigo-200" />
            <span>🔄 Cập Nhật Mã HS (Năm+Lớp+STT)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setRoleTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-1 ${
            roleTab === 'all' ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tất cả tài khoản</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalUsers}</p>
          <p className="text-[11px] text-slate-400">Giáo viên, HS, Admin</p>
        </div>

        <div 
          onClick={() => setRoleTab('student')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-1 ${
            roleTab === 'student' ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tài khoản Học sinh</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
          <p className="text-[11px] text-slate-400">Khối 6, 7, 8, 9</p>
        </div>

        <div 
          onClick={() => setRoleTab('teacher')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-1 ${
            roleTab === 'teacher' ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tài khoản Giáo viên</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalTeachers}</p>
          <p className="text-[11px] text-slate-400">Bộ môn Tin học & các môn</p>
        </div>

        <div 
          onClick={() => setRoleTab('admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-1 ${
            roleTab === 'admin' ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ban Quản Trị / BGH</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalAdmins}</p>
          <p className="text-[11px] text-slate-400">Quyền hạn cao nhất</p>
        </div>
      </div>

      {/* Role Switcher & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        {/* Role Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 overflow-x-auto">
          <button
            onClick={() => setRoleTab('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              roleTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tất cả ({totalUsers})</span>
          </button>

          <button
            onClick={() => setRoleTab('student')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              roleTab === 'student' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Học sinh ({totalStudents})</span>
          </button>

          <button
            onClick={() => setRoleTab('teacher')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              roleTab === 'teacher' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Giáo viên ({totalTeachers})</span>
          </button>

          <button
            onClick={() => setRoleTab('admin')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              roleTab === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản trị viên ({totalAdmins})</span>
          </button>
        </div>

        {/* Search & Detail Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Tên, Mã ID (GV-..., HS-..., ADMIN-...), Email, Lớp, Môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {(roleTab === 'all' || roleTab === 'student') && (
              <>
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
              </>
            )}

            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors"
              title="Xuất bảng tính danh sách tài khoản kèm mật khẩu/PIN"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Danh Sách Tài Khoản Hệ Thống ({filteredUsers.length})
            </h3>
            {selectedUserIds.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                Đã chọn {selectedUserIds.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedUserIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa {selectedUserIds.length} tài khoản đã chọn</span>
              </button>
            )}
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Đang hoạt động
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-2"></span> Tạm khóa
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy tài khoản nào phù hợp</p>
            <p className="text-xs text-slate-400">Hãy thay đổi bộ lọc hoặc nhấn nút "+ Tạo Tài Khoản Mới".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={
                        filteredUsers.length > 0 &&
                        filteredUsers.every(u => selectedUserIds.includes(u.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUserIds([]);
                        }
                      }}
                      title="Chọn tất cả danh sách đang hiển thị"
                    />
                  </th>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-4 py-3.5">Mã ID (Định danh)</th>
                  <th className="px-4 py-3.5">Vai trò & Phân môn / Lớp</th>
                  <th className="px-4 py-3.5">Email tài khoản</th>
                  <th className="px-4 py-3.5 text-center">Mã PIN / MK</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  const isLocked = user.status === 'locked';
                  const isSelected = selectedUserIds.includes(user.id);
                  const studentStats = user.role === 'student' ? getStudentStats(user.id) : null;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/90' : isCurrent ? 'bg-blue-50/40' : isLocked ? 'bg-slate-50/70 opacity-75' : ''
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                            {user.role === 'admin' ? (
                              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-0.5" title="Admin">
                                <ShieldCheck className="w-3 h-3" />
                              </div>
                            ) : user.role === 'teacher' ? (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5" title="Giáo viên">
                                <BookOpen className="w-3 h-3" />
                              </div>
                            ) : null}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {user.name}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold">
                                  Bạn (Đang chọn)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {user.school || 'Môn Tin học - Thầy Toàn'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-mono font-bold text-slate-800 text-xs border border-slate-200">
                          <span>{user.code}</span>
                          <button
                            onClick={() => handleCopyCode(user.code)}
                            className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Sao chép mã ID"
                          >
                            {copiedCode === user.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role & Class / Subject */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div>
                            {user.role === 'admin' && (
                              <span className="font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] border border-purple-200">
                                Quản trị viên
                              </span>
                            )}
                            {user.role === 'teacher' && (
                              <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] border border-emerald-200">
                                Giáo viên {user.subject || 'Tin học'}
                              </span>
                            )}
                            {user.role === 'student' && (
                              <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-200">
                                Học sinh {user.className || `Khối ${user.grade}`}
                              </span>
                            )}
                          </div>
                          {studentStats && (
                            <div className="text-[10px] text-slate-500">
                              Đã thi {studentStats.count} bài • ĐTB: <strong className="text-slate-800">{studentStats.avgScore}</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="text-slate-700 text-xs flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-slate-500 text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PIN / Password */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleResetPin(user)}
                          className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition-colors cursor-pointer"
                          title="Click để đổi mã PIN"
                        >
                          {user.pin || '123456'}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isLocked 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                          }`}
                          title="Click để khóa hoặc mở khóa tài khoản"
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Tạm khóa</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hoạt động</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Direct Switch to this user */}
                          <button
                            onClick={() => onSwitchUser(user)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                            title="Đăng nhập 1-chạm (Chuyển sang tài khoản này)"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin tài khoản"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              if (user.id === currentUser.id) {
                                setToastMessage('Không thể xóa tài khoản bạn đang đăng nhập!');
                                setTimeout(() => setToastMessage(null), 3500);
                                return;
                              }
                              if (user.code === 'GV-TINHOC01') {
                                setToastMessage('Tài khoản chính Thầy Toàn được bảo vệ, không thể xóa!');
                                setTimeout(() => setToastMessage(null), 3500);
                                return;
                              }
                              setUserToDelete(user);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
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

      {/* MODAL 1: CREATE / EDIT SINGLE USER */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold ${
                  formRole === 'admin' ? 'bg-purple-600' : formRole === 'teacher' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Chỉnh Sửa Thông Tin Tài Khoản' : 'Khởi Tạo Tài Khoản Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hệ thống cấp mã định danh ID, phân quyền vai trò và quyền truy cập
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="p-6 space-y-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Vai trò trên hệ thống <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('student')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      formRole === 'student' 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 ring-2 ring-indigo-500/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Học sinh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('teacher')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      formRole === 'teacher' 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Giáo viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      formRole === 'admin' 
                        ? 'bg-purple-50 border-purple-400 text-purple-800 ring-2 ring-purple-500/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Quản trị viên</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formRole === 'student' ? 'VD: Nguyễn Hải Đăng' : formRole === 'teacher' ? 'VD: Thầy Nguyễn Văn Toàn' : 'VD: Quản trị viên'}
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Dynamic inputs based on Role */}
              {formRole === 'student' ? (
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
                      onChange={(e) => {
                        setFormClass(e.target.value);
                        const gradeNum = parseInt(e.target.value.charAt(0), 10) as GradeLevel;
                        if ([6, 7, 8, 9].includes(gradeNum)) setFormGrade(gradeNum);
                        if (!editingUser && formName) setFormEmail(generateSuggestedEmail(formName, 'student', e.target.value, formSubject));
                      }}
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
              ) : formRole === 'teacher' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bộ môn giảng dạy
                    </label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => {
                        setFormSubject(e.target.value);
                        if (!editingUser && formName) setFormEmail(generateSuggestedEmail(formName, 'teacher', formClass, e.target.value));
                      }}
                      placeholder="VD: Tin học, Toán..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Trạng thái tài khoản
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'active' | 'locked')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-hidden"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="locked">Tạm khóa</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {/* Code ID & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Mã định danh (ID)</span>
                    <button
                      type="button"
                      onClick={() => setFormCode(generateSuggestedCode(formRole, formGrade, users.length, formSubject))}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Tự sinh mã
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: GV-TINHOC01 hoặc HS-20240901"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 uppercase outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="VD: toanska@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* PIN / Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã PIN / Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mặc định: 123456"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0988 123 456"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              {/* School / Unit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn vị / Trường học
                </label>
                <input
                  type="text"
                  value={formSchool}
                  onChange={(e) => setFormSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden font-medium"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn ảnh đại diện:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(formRole === 'student' ? DEFAULT_AVATARS_STUDENT : DEFAULT_AVATARS_TEACHER).map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormAvatar(url)}
                      className={`relative rounded-full p-0.5 transition-transform cursor-pointer ${
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingUser ? 'Lưu Cập Nhật' : 'Khởi Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH IMPORT */}
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
                    Khởi Tạo Tài Khoản Hàng Loạt (Batch Import)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dán danh sách từ Excel/Word hoặc tải file lên để hệ thống tự động sinh ID, Email và mã PIN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
              {/* Batch Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò khởi tạo
                  </label>
                  <select
                    value={batchRole}
                    onChange={(e) => setBatchRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold outline-hidden"
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                {batchRole === 'student' ? (
                  <>
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
                  </>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bộ môn
                    </label>
                    <input
                      type="text"
                      value={batchSubject}
                      onChange={(e) => setBatchSubject(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold outline-hidden"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 col-span-1 sm:col-span-4 pt-1">
                  <label className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải tệp Excel / CSV (.xlsx, .xls, .csv, .txt)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={downloadSampleExcel}
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tải Mẫu Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Dán danh sách họ và tên (Mỗi người một dòng):
                  </label>
                  <button
                    type="button"
                    onClick={handleParseBatchText}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Cập nhật bảng xem trước
                  </button>
                </div>
                <textarea
                  rows={5}
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
                    Xem trước kết quả ({batchPreview.length} tài khoản)
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
                          <th className="px-3 py-2">Phân loại</th>
                          <th className="px-3 py-2">Email cấp tự động</th>
                          <th className="px-3 py-2">Mã PIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchPreview.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-900">{item.name}</td>
                            <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{item.code}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-700">
                              {item.role === 'student' ? item.className : item.role === 'teacher' ? item.subject : 'Admin'}
                            </td>
                            <td className="px-3 py-1.5 text-slate-600">{item.email}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-700">123456</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    Nhấn "Cập nhật bảng xem trước" để kiểm tra danh sách tài khoản được sinh ra.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                Mật khẩu/Mã PIN mặc định là <strong>123456</strong>, người dùng có thể đổi sau khi đăng nhập.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Xác Nhận & Cấp {batchPreview.length} Tài Khoản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Vĩnh Viễn Tài Khoản
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản <strong className="text-slate-900">"{userToDelete.name}"</strong>?
              </p>
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1 font-mono">
                <div>Mã định danh (ID): <span className="font-bold text-blue-700">{userToDelete.code}</span></div>
                <div>Vai trò: <span className="font-bold text-slate-800">{userToDelete.role === 'admin' ? 'Quản trị viên' : userToDelete.role === 'teacher' ? 'Giáo viên' : `Học sinh (Lớp ${userToDelete.className || '-'})`}</span></div>
                <div>Email: <span className="text-slate-600">{userToDelete.email}</span></div>
              </div>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg mt-2 font-medium">
                ⚠️ Thao tác này không thể hoàn tác. Dữ liệu tài khoản sẽ bị xóa hoàn toàn khỏi hệ thống.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  setSelectedUserIds(selectedUserIds.filter(id => id !== userToDelete.id));
                  setToastMessage(`Đã xóa vĩnh viễn tài khoản "${userToDelete.name}" (${userToDelete.code})!`);
                  setTimeout(() => setToastMessage(null), 3500);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Hàng Loạt {selectedUserIds.length} Tài Khoản
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="text-rose-600">{selectedUserIds.length} tài khoản</strong> đã chọn khỏi hệ thống?
              </p>
              <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                {users.filter(u => selectedUserIds.includes(u.id)).map(u => (
                  <div key={u.id} className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold truncate max-w-[200px]">{u.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{u.code}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
                ⚠️ Lưu ý: Các tài khoản đang đăng nhập hoặc tài khoản được bảo vệ (như Thầy Toàn) sẽ tự động bỏ qua.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const safeToDeleteIds = selectedUserIds.filter(id => {
                    const target = users.find(u => u.id === id);
                    return id !== currentUser.id && target?.code !== 'GV-TINHOC01';
                  });

                  if (safeToDeleteIds.length === 0) {
                    setToastMessage('Các tài khoản được chọn đều được bảo vệ, không thể xóa!');
                    setTimeout(() => setToastMessage(null), 3500);
                    setShowBatchDeleteModal(false);
                    return;
                  }

                  if (onDeleteUsersBatch) {
                    onDeleteUsersBatch(safeToDeleteIds);
                  } else {
                    safeToDeleteIds.forEach(id => onDeleteUser(id));
                  }

                  setToastMessage(`Đã xóa vĩnh viễn ${safeToDeleteIds.length} tài khoản thành công!`);
                  setTimeout(() => setToastMessage(null), 3500);
                  setSelectedUserIds([]);
                  setShowBatchDeleteModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa {selectedUserIds.length} Tài Khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECALCULATE CODES CONFIRMATION MODAL */}
      {showRecalculateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 font-serif">
                Xác Nhận Cập Nhật Đồng Loạt Mã Học Sinh
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống sẽ tự động cập nhật lại mã định danh cho <strong>toàn bộ {users.filter(u => u.role === 'student').length} học sinh</strong> theo đúng quy tắc chuẩn:
              </p>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-left text-xs space-y-1.5 text-indigo-950 font-medium">
                <div className="font-bold text-indigo-900 border-b border-indigo-200/60 pb-1">
                  📐 Công thức: <span className="font-mono bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-900">HS-[Năm][MãLớp][SốThứTự]</span>
                </div>
                <div className="text-[11px] text-indigo-800 leading-relaxed">
                  • <strong>Tiền tố:</strong> HS-<br />
                  • <strong>Năm:</strong> 2026 (Năm học hiện tại)<br />
                  • <strong>Mã Lớp:</strong> 9A1 → 91, 8A2 → 82, 7A3 → 73, 6A1 → 61<br />
                  • <strong>Số Thứ Tự (STT):</strong> 01, 02, 03... (xếp theo bảng chữ cái theo lớp)
                </div>
                <div className="pt-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/60 p-2 rounded-lg border border-emerald-200/80">
                  ✨ Ví dụ: Nguyễn Văn A • Lớp 9A1 • Số thứ tự 1 <br />
                  ➡️ Mã học sinh: <strong className="font-mono text-emerald-950 text-xs">HS-20269101</strong>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRecalculateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRecalculateAllStudentCodes}
                className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Xác Nhận Cập Nhật Tất Cả</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
