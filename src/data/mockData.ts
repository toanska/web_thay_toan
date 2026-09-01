import { User, Question, Exam, ExamAttempt, NewsArticle, NotificationItem, LessonMaterial } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-student-1',
    name: 'Nguyễn Hải Đăng',
    role: 'student',
    code: 'HS-20240901',
    className: '9A1',
    grade: 9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'haidang.9a1@thcs.edu.vn',
    school: 'Trường THCS Nguyễn Du',
  },
  {
    id: 'user-student-2',
    name: 'Trần Phương Linh',
    role: 'student',
    code: 'HS-20240902',
    className: '9A1',
    grade: 9,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    email: 'phuonglinh.9a1@thcs.edu.vn',
    school: 'Trường THCS Nguyễn Du',
  },
  {
    id: 'user-student-3',
    name: 'Lê Minh Khang',
    role: 'student',
    code: 'HS-20240801',
    className: '8A2',
    grade: 8,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    email: 'minhkhang.8a2@thcs.edu.vn',
    school: 'Trường THCS Nguyễn Du',
  },
  {
    id: 'user-student-4',
    name: 'Vũ Hoàng Mai',
    role: 'student',
    code: 'HS-20240701',
    className: '7A3',
    grade: 7,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    email: 'hoangmai.7a3@thcs.edu.vn',
    school: 'Trường THCS Nguyễn Du',
  },
  {
    id: 'user-student-5',
    name: 'Đặng Quốc Bảo',
    role: 'student',
    code: 'HS-20240601',
    className: '6A1',
    grade: 6,
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    email: 'quocbao.6a1@thcs.edu.vn',
    school: 'Trường THCS Nguyễn Du',
  },
  {
    id: 'user-teacher-1',
    name: 'Thầy Toàn',
    role: 'teacher',
    code: 'GV-TINHOC01',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    email: 'toanska@gmail.com',
    phone: '0988 123 456',
    school: 'Môn Tin học - Thầy Toàn',
  },
  {
    id: 'user-teacher-2',
    name: 'Cô Mai',
    role: 'teacher',
    code: 'GV-TINHOC02',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    email: 'mai.tinhoc@thcs.edu.vn',
    phone: '0912 345 678',
    school: 'Môn Tin học - Thầy Toàn',
  },
  {
    id: 'user-admin-1',
    name: 'Quản Trị Viên Hệ Thống',
    role: 'admin',
    code: 'ADMIN-TINHOC',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'admin.tinhoc@thcs.edu.vn',
    school: 'Môn Tin học - Thầy Toàn',
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // TIN HOC 9 - PYTHON & THUẬT TOÁN
  {
    id: 'q-tin9-01',
    code: 'TIN9-NB-01',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'recognition',
    type: 'multiple_choice',
    content: 'Trong ngôn ngữ lập trình Python, hàm nào sau đây được dùng để xuất dữ liệu ra màn hình?',
    options: ['cin >>', 'print()', 'output()', 'echo()'],
    correctAnswers: [1],
    explanation: 'Hàm print() trong Python được dùng để in/xuất giá trị hoặc chuỗi ký tự ra màn hình chuẩn.',
    tags: ['Python cơ bản', 'Lập trình 9', 'Học kỳ 2'],
    points: 1.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-10',
  },
  {
    id: 'q-tin9-02',
    code: 'TIN9-TH-02',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'understanding',
    type: 'multiple_choice',
    content: 'Đoạn mã Python sau in ra kết quả gì?\n\nx = 10\ny = 3\nprint(x % y)',
    options: ['3', '1', '3.33', '0'],
    correctAnswers: [1],
    explanation: 'Toán tử % trong Python lấy phần dư của phép chia nguyên: 10 chia 3 được 3 dư 1 => kết quả là 1.',
    tags: ['Toán tử Python', 'Biến & Biểu thức'],
    points: 1.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-12',
  },
  {
    id: 'q-tin9-03',
    code: 'TIN9-VD-03',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'application',
    type: 'multiple_choice',
    content: 'Cho đoạn mã:\ns = 0\nfor i in range(1, 5):\n    s += i\nprint(s)\nKết quả in ra là:',
    options: ['10', '15', '4', '6'],
    correctAnswers: [0],
    explanation: 'range(1, 5) sinh ra các giá trị 1, 2, 3, 4. Tổng s = 1 + 2 + 3 + 4 = 10.',
    tags: ['Vòng lặp for', 'Thuật toán Python'],
    points: 1.5,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-15',
  },
  {
    id: 'q-tin9-04',
    code: 'TIN9-VDC-04',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'high_application',
    type: 'multiple_choice',
    content: 'Thiết bị nào sau đây đóng vai trò định tuyến và chuyển tiếp các gói tin giữa các mạng máy tính khác nhau qua môi trường Internet?',
    options: ['Router (Bộ định tuyến)', 'Switch (Bộ chuyển mạch)', 'Hub (Bộ tập trung)', 'Repeater (Bộ lặp)'],
    correctAnswers: [0],
    explanation: 'Router làm việc ở tầng mạng, có chức năng tìm đường đi tối ưu và định tuyến gói tin giữa các mạng máy tính.',
    tags: ['Mạng máy tính', 'Internet', 'Tin học 9'],
    points: 1.5,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-18',
  },
  {
    id: 'q-tin9-05',
    code: 'TIN9-TF-05',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'understanding',
    type: 'true_false',
    content: 'Xét tính Đúng/Sai của khẳng định sau: "Trong Python, kiểu dữ liệu int dùng để lưu trữ số nguyên có kích thước tùy ý và không bị tràn số như trong C/C++."',
    options: ['Đúng', 'Sai'],
    correctAnswers: [0],
    explanation: 'Trong Python 3, kiểu số nguyên int có độ chính xác tùy biến (arbitrary precision), tự động cấp phát bộ nhớ theo độ lớn của số.',
    tags: ['Kiểu dữ liệu', 'Lý thuyết Python'],
    points: 1.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-20',
  },
  {
    id: 'q-tin9-06',
    code: 'TIN9-FILL-06',
    subject: 'Tin học',
    grade: 9,
    difficulty: 'application',
    type: 'fill_in',
    content: 'Để kiểm tra một số nguyên n có chia hết cho 2 hay không trong Python, ta dùng điều kiện n % 2 == ... (nhập số)',
    correctAnswers: ['0'],
    explanation: 'Nếu n chia cho 2 có số dư bằng 0 (n % 2 == 0) thì n là số chẵn (chia hết cho 2).',
    tags: ['Cấu trúc rẽ nhánh', 'Python 9'],
    points: 1.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-22',
  },

  // TIN HOC 8 - BẢNG TÍNH & LẬP TRÌNH TRỰC QUAN
  {
    id: 'q-tin8-01',
    code: 'TIN8-NB-01',
    subject: 'Tin học',
    grade: 8,
    difficulty: 'recognition',
    type: 'multiple_choice',
    content: 'Trong phần mềm bảng tính Excel/Google Sheets, hàm nào sau đây dùng để tính giá trị trung bình cộng của một khối ô?',
    options: ['SUM', 'AVERAGE', 'COUNT', 'MAX'],
    correctAnswers: [1],
    explanation: 'Hàm AVERAGE(number1, number2,...) dùng để tính trung bình cộng của các ô chứa số.',
    tags: ['Bảng tính điện tử', 'Tin học 8'],
    points: 1.5,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-14',
  },
  {
    id: 'q-tin8-02',
    code: 'TIN8-TH-02',
    subject: 'Tin học',
    grade: 8,
    difficulty: 'understanding',
    type: 'multiple_choice',
    content: 'Địa chỉ ô $A$1 trong bảng tính là loại địa chỉ nào?',
    options: ['Địa chỉ tương đối', 'Địa chỉ tuyệt đối', 'Địa chỉ hỗn hợp', 'Địa chỉ mạng'],
    correctAnswers: [1],
    explanation: 'Địa chỉ $A$1 có dấu $ trước cả tên cột và chỉ số hàng, là địa chỉ tuyệt đối không đổi khi sao chép công thức.',
    tags: ['Địa chỉ ô tính', 'Excel 8'],
    points: 1.5,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-16',
  },

  // TIN HOC 7 - BẢNG TÍNH & DỮ LIỆU SỐ
  {
    id: 'q-tin7-01',
    code: 'TIN7-NB-01',
    subject: 'Tin học',
    grade: 7,
    difficulty: 'recognition',
    type: 'multiple_choice',
    content: 'Để lưu bài trình chiếu đang soạn thảo trong Microsoft PowerPoint, em sử dụng tổ hợp phím tắt nào?',
    options: ['Ctrl + P', 'Ctrl + S', 'Ctrl + C', 'Ctrl + Z'],
    correctAnswers: [1],
    explanation: 'Tổ hợp phím Ctrl + S (Save) dùng để lưu tệp tin trong hầu hết các ứng dụng văn phòng.',
    tags: ['Kỹ năng tin học', 'Tin học 7'],
    points: 2.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-15',
  },

  // TIN HOC 6 - INTERNET & AN TOÀN THÔNG TIN
  {
    id: 'q-tin6-01',
    code: 'TIN6-NB-01',
    subject: 'Tin học',
    grade: 6,
    difficulty: 'recognition',
    type: 'multiple_choice',
    content: 'Mật khẩu nào sau đây có độ an toàn và bảo mật cao nhất?',
    options: ['12345678', 'abcdef', 'Toan@2026#Secure', 'nguyenvana'],
    correctAnswers: [2],
    explanation: 'Mật khẩu mạnh cần có ít nhất 8 ký tự, gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
    tags: ['An toàn thông tin', 'Tin học 6'],
    points: 2.0,
    authorName: 'Thầy Toàn',
    createdAt: '2026-02-18',
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-tin9-midterm',
    title: 'Khảo Sát Chất Lượng Giữa Học Kỳ II - Môn Tin Học 9',
    code: 'KT-TIN9-GK2',
    description: 'Đề kiểm tra chuẩn cấu trúc GDPT 2018 môn Tin học 9. Gồm các chủ đề Lập trình Python (biến, kiểu dữ liệu, vòng lặp for, rẽ nhánh) và Mạng máy tính.',
    subject: 'Tin học',
    grade: 9,
    durationMinutes: 45,
    totalQuestions: 6,
    passingScore: 5.0,
    maxScore: 10.0,
    maxAttempts: 2,
    targetClasses: ['9A1', '9A2', '9A3', '9A4'],
    shuffleQuestions: true,
    shuffleOptions: true,
    showAnswerAfterSubmit: true,
    isPublished: true,
    status: 'active',
    accessCode: 'TIN9GK2',
    createdAt: '2026-02-20',
    startDate: '2026-02-20',
    endDate: '2026-03-31',
    createdBy: 'Thầy Toàn',
    questions: [
      INITIAL_QUESTIONS[0],
      INITIAL_QUESTIONS[1],
      INITIAL_QUESTIONS[2],
      INITIAL_QUESTIONS[3],
      INITIAL_QUESTIONS[4],
      INITIAL_QUESTIONS[5],
    ]
  },
  {
    id: 'exam-tin8-review',
    title: 'Kiểm Tra Đánh Giá Thường Xuyên - Tin Học 8 (Bảng Tính & Lập Trình)',
    code: 'KT-TIN8-TX',
    description: 'Đề kiểm tra thực hành và lý thuyết: Hàm thống kê tính toán bảng tính điện tử, địa chỉ ô tuyệt đối/tương đối.',
    subject: 'Tin học',
    grade: 8,
    durationMinutes: 30,
    totalQuestions: 2,
    passingScore: 5.0,
    maxScore: 10.0,
    maxAttempts: 3,
    targetClasses: ['8A1', '8A2'],
    shuffleQuestions: true,
    shuffleOptions: false,
    showAnswerAfterSubmit: true,
    isPublished: true,
    status: 'active',
    createdAt: '2026-02-22',
    startDate: '2026-02-22',
    endDate: '2026-04-15',
    createdBy: 'Thầy Toàn',
    questions: [
      INITIAL_QUESTIONS[6],
      INITIAL_QUESTIONS[7],
    ]
  },
  {
    id: 'exam-tin7-test',
    title: 'Đề Khảo Sát Kỹ Năng Ứng Dụng Tin Học 7',
    code: 'KT-TIN7-KN',
    description: 'Kiểm tra kỹ năng ứng dụng phần mềm bảng tính và soạn thảo trình chiếu đa phương tiện.',
    subject: 'Tin học',
    grade: 7,
    durationMinutes: 20,
    totalQuestions: 1,
    passingScore: 5.0,
    maxScore: 10.0,
    maxAttempts: 1,
    targetClasses: ['7A1', '7A2', '7A3'],
    shuffleQuestions: true,
    shuffleOptions: true,
    showAnswerAfterSubmit: true,
    isPublished: true,
    status: 'active',
    createdAt: '2026-02-25',
    startDate: '2026-02-25',
    endDate: '2026-03-25',
    createdBy: 'Thầy Toàn',
    questions: [
      INITIAL_QUESTIONS[8],
    ]
  },
  {
    id: 'exam-tin6-final',
    title: 'Kiểm Tra Chuyên Đề: An Toàn Thông Tin & Mạng Máy Tính - Tin Học 6',
    code: 'KT-TIN6-AT',
    description: 'Kiểm tra kiến thức về Internet, an toàn dữ liệu cá nhân trên không gian mạng và văn hóa ứng xử số.',
    subject: 'Tin học',
    grade: 6,
    durationMinutes: 25,
    totalQuestions: 1,
    passingScore: 5.0,
    maxScore: 10.0,
    maxAttempts: 1,
    targetClasses: ['6A1', '6A2', '6A3'],
    shuffleQuestions: false,
    shuffleOptions: false,
    showAnswerAfterSubmit: true,
    isPublished: true,
    status: 'active',
    createdAt: '2026-02-26',
    startDate: '2026-02-26',
    endDate: '2026-04-01',
    createdBy: 'Thầy Toàn',
    questions: [
      INITIAL_QUESTIONS[9],
    ]
  }
];

export const INITIAL_ATTEMPTS: ExamAttempt[] = [
  {
    id: 'attempt-01',
    examId: 'exam-tin9-midterm',
    examTitle: 'Khảo Sát Chất Lượng Giữa Học Kỳ II - Môn Tin Học 9',
    subject: 'Tin học',
    grade: 9,
    studentId: 'user-student-1',
    studentName: 'Nguyễn Hải Đăng',
    studentClass: '9A1',
    studentCode: 'HS-20240901',
    startTime: '2026-02-28T08:00:00Z',
    endTime: '2026-02-28T08:32:15Z',
    durationSeconds: 1935,
    answers: {
      'q-tin9-01': 1,
      'q-tin9-02': 1,
      'q-tin9-03': 0,
      'q-tin9-04': 0,
      'q-tin9-05': 0,
      'q-tin9-06': '0'
    },
    score: 10.0,
    maxScore: 10.0,
    percentage: 100,
    passed: true,
    tabSwitchCount: 0,
    submittedAt: '2026-02-28T08:32:15Z',
    feedback: 'Bài làm xuất sắc! Nắm rất vững kiến thức lập trình Python và mạng máy tính.',
    questionResults: [
      { questionId: 'q-tin9-01', studentAnswer: 1, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-02', studentAnswer: 1, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-03', studentAnswer: 0, isCorrect: true, pointsAwarded: 1.5, maxPoints: 1.5 },
      { questionId: 'q-tin9-04', studentAnswer: 0, isCorrect: true, pointsAwarded: 1.5, maxPoints: 1.5 },
      { questionId: 'q-tin9-05', studentAnswer: 0, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-06', studentAnswer: '0', isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
    ]
  },
  {
    id: 'attempt-02',
    examId: 'exam-tin9-midterm',
    examTitle: 'Khảo Sát Chất Lượng Giữa Học Kỳ II - Môn Tin Học 9',
    subject: 'Tin học',
    grade: 9,
    studentId: 'user-student-2',
    studentName: 'Trần Phương Linh',
    studentClass: '9A1',
    studentCode: 'HS-20240902',
    startTime: '2026-02-28T09:10:00Z',
    endTime: '2026-02-28T09:44:00Z',
    durationSeconds: 2040,
    answers: {
      'q-tin9-01': 1,
      'q-tin9-02': 1,
      'q-tin9-03': 1, // wrong
      'q-tin9-04': 0,
      'q-tin9-05': 0,
      'q-tin9-06': '0'
    },
    score: 8.5,
    maxScore: 10.0,
    percentage: 85,
    passed: true,
    tabSwitchCount: 0,
    submittedAt: '2026-02-28T09:44:00Z',
    feedback: 'Làm tốt lý thuyết mạng và cú pháp, cần lưu ý giá trị kết thúc của hàm range() trong vòng lặp for.',
    questionResults: [
      { questionId: 'q-tin9-01', studentAnswer: 1, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-02', studentAnswer: 1, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-03', studentAnswer: 1, isCorrect: false, pointsAwarded: 0, maxPoints: 1.5 },
      { questionId: 'q-tin9-04', studentAnswer: 0, isCorrect: true, pointsAwarded: 1.5, maxPoints: 1.5 },
      { questionId: 'q-tin9-05', studentAnswer: 0, isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
      { questionId: 'q-tin9-06', studentAnswer: '0', isCorrect: true, pointsAwarded: 1.0, maxPoints: 1.0 },
    ]
  },
  {
    id: 'attempt-03',
    examId: 'exam-tin8-review',
    examTitle: 'Kiểm Tra Đánh Giá Thường Xuyên - Tin Học 8 (Bảng Tính & Lập Trình)',
    subject: 'Tin học',
    grade: 8,
    studentId: 'user-student-3',
    studentName: 'Lê Minh Khang',
    studentClass: '8A2',
    studentCode: 'HS-20240801',
    startTime: '2026-02-27T14:00:00Z',
    endTime: '2026-02-27T14:15:30Z',
    durationSeconds: 930,
    answers: {
      'q-tin8-01': 1,
      'q-tin8-02': 1
    },
    score: 10.0,
    maxScore: 10.0,
    percentage: 100,
    passed: true,
    tabSwitchCount: 0,
    submittedAt: '2026-02-27T14:15:30Z',
    feedback: 'Kỹ năng làm việc với bảng tính Excel rất thành thạo!',
    questionResults: [
      { questionId: 'q-tin8-01', studentAnswer: 1, isCorrect: true, pointsAwarded: 5.0, maxPoints: 5.0 },
      { questionId: 'q-tin8-02', studentAnswer: 1, isCorrect: true, pointsAwarded: 5.0, maxPoints: 5.0 },
    ]
  }
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'news-01',
    title: 'Kế hoạch tổ chức Khảo sát chất lượng Giữa Học kỳ II năm học 2025 - 2026',
    slug: 'ke-hoach-khao-sat-chat-luong-giua-ki-2',
    category: 'Thông báo chung',
    summary: 'Ban Giám hiệu nhà trường thông báo kế hoạch chi tiết, lịch thi trực tuyến và trực tiếp cho toàn thể học sinh khối 6, 7, 8, 9.',
    content: `Trường THCS Nguyễn Du trân trọng thông báo đến toàn thể cán bộ giáo viên, phụ huynh và học sinh kế hoạch khảo sát chất lượng giữa học kỳ II năm học 2025 - 2026 như sau:

1. **Mục đích:**
- Đánh giá mức độ tiếp thu kiến thức của học sinh theo chương trình GDPT 2018 sau nửa chặng đường của Học kỳ II.
- Giúp giáo viên bộ môn và nhà trường phân loại học sinh, từ đó xây dựng kế hoạch bồi dưỡng nâng cao và phụ đạo kịp thời, đặc biệt là công tác ôn thi vào lớp 10 cho khối 9.

2. **Hình thức thi:**
- Kết hợp thi khảo thí trực tuyến trên hệ thống e-Testing của trường (đối với các môn trắc nghiệm như Tiếng Anh, GDCD, Tin học, KHTN) và thi kết hợp trực tiếp trên lớp đối với Toán & Ngữ Văn.
- Thời gian mở phòng thi trực tuyến: từ 07h30 đến 21h00 các ngày trong tuần.

3. **Yêu cầu đối với học sinh:**
- Học sinh đăng nhập đúng tài khoản được cấp, kiểm tra đường truyền Internet trước giờ thi.
- Nghiêm túc thực hiện quy chế thi, không sử dụng tài liệu, không rời khỏi màn hình làm bài kiểm tra. Hệ thống tự động ghi nhận cảnh báo chuyển tab.

Chúc các em học sinh ôn tập thật tốt và đạt kết quả cao nhất!`,
    featuredImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-02-28',
    authorName: 'Ban Giám Hiệu',
    authorTitle: 'Hiệu trưởng',
    views: 1420,
    likes: 128,
    isPinned: true,
    tags: ['Lịch thi', 'Khảo thí', 'Học kỳ 2', 'Khối 6-9'],
    attachments: [
      { name: 'Ke_hoach_thi_GK2_2026.pdf', size: '1.8 MB' },
      { name: 'Huong_dan_lam_bai_eTesting.docx', size: '640 KB' }
    ],
    comments: [
      {
        id: 'c-01',
        authorName: 'Nguyễn Hải Đăng',
        authorRole: 'student',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Em cảm ơn thầy cô, lớp 9A1 chúng em đã sẵn sàng ôn thi ạ!',
        createdAt: '2026-02-28 10:15'
      },
      {
        id: 'c-02',
        authorName: 'Cô Nguyễn Thị Mai',
        authorRole: 'teacher',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        content: 'Các bạn học sinh chú ý làm đầy đủ các đề ôn tập trong mục Bài kiểm tra trước ngày 05/03 nhé.',
        createdAt: '2026-02-28 11:30'
      }
    ]
  },
  {
    id: 'news-02',
    title: 'Hội thi "Học sinh nghiên cứu Khoa học Kỹ thuật STEM 2026" cấp trường thành công rực rỡ',
    slug: 'hoi-thi-stem-nghien-cuu-khoa-hoc-2026',
    category: 'Thông báo chung',
    summary: 'Hơn 30 dự án sáng tạo của các chi đội từ khối 6 đến khối 9 đã mang đến nhiều sản phẩm ứng dụng thiết thực, bảo vệ môi trường và chuyển đổi số.',
    content: `Ngày 26/02/2026, Trường THCS Nguyễn Du đã tưng bừng tổ chức Vòng chung kết Ngày hội STEM và Nghiên cứu Khoa học Kỹ thuật dành cho học sinh THCS.

Hội thi năm nay ghi nhận sự tham gia của 32 dự án xuất sắc thuộc 4 lĩnh vực chính:
- Hệ thống nhúng và Trí tuệ nhân tạo học đường
- Năng lượng tái tạo và giải pháp giảm thiểu rác thải nhựa
- Chế phẩm sinh học thân thiện với môi trường
- Ứng dụng công nghệ hỗ trợ người khuyết tật

Giải Nhất toàn đoàn đã thuộc về Chi đội 9A1 với đề tài "Thùng rác thông minh phân loại tự động bằng camera AI và năng lượng mặt trời". Ban giám khảo đánh giá cao tính ứng dụng thực tế và sự tự tin thuyết trình của các em.`,
    featuredImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-02-27',
    authorName: 'Thầy Trần Văn Bình',
    authorTitle: 'Tổng phụ trách Đội',
    views: 980,
    likes: 85,
    isPinned: true,
    tags: ['STEM', 'Sáng tạo khoa học', 'Hoạt động ngoại khóa'],
    attachments: [
      { name: 'Tong_ket_giai_thuong_STEM_2026.pdf', size: '2.1 MB' }
    ],
    comments: []
  },
  {
    id: 'news-03',
    title: 'Bí quyết ôn luyện môn Toán & Tin học vào lớp 10 đạt điểm 9+: Chia sẻ từ Tổ Chuyên môn',
    slug: 'bi-quyet-on-luyen-toan-vao-10',
    category: 'Góc học tập',
    summary: 'Những lưu ý quan trọng khi trình bày bài toán rút gọn, phương trình bậc hai, định lý Vi-ét và tư duy thuật toán.',
    content: `Kỳ thi tuyển sinh vào lớp 10 THPT công lập là bước ngoặt quan trọng đối với các em học sinh lớp 9. Tổ Chuyên môn xin gửi tới các em một số bí quyết ôn luyện hiệu quả:

1. **Nắm vững cấu trúc đề thi chuẩn:**
- Bài 1 (2.0 điểm): Rút gọn biểu thức và câu hỏi phụ. Chú ý đặt điều kiện xác định và đối chiếu nghiệm.
- Bài 2 (2.0 điểm): Giải bài toán bằng cách lập phương trình hoặc hệ phương trình. Đọc kỹ đại lượng biến thiên.
- Bài 3 (2.5 điểm): Giải hệ phương trình và sự tương giao giữa Parabol & Đường thẳng (Định lý Vi-ét).
- Bài 4 (3.0 điểm): Hình học tổng hợp (tứ giác nội tiếp, chứng minh tiếp tuyến, ba điểm thẳng hàng).
- Bài 5 (0.5 điểm): Bất đẳng thức hoặc phương trình vô tỉ nâng cao.

2. **Luyện tập thường xuyên trên ngân hàng đề thi:**
Học sinh nên dành 45 phút mỗi ngày làm đề kiểm tra trực tuyến trên hệ thống để rèn kỹ năng phản xạ và bấm giờ chính xác.`,
    featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-02-25',
    authorName: 'Thầy Toàn - Môn Tin học',
    authorTitle: 'Giáo viên bộ môn',
    views: 2150,
    likes: 245,
    isPinned: false,
    tags: ['Ôn thi vào 10', 'Môn Toán', 'Tin học', 'Kinh nghiệm học tập'],
    comments: []
  },
  {
    id: 'news-04',
    title: 'Phát động phong trào Học tập và Sáng tạo Công nghệ số 2026',
    slug: 'phong-trao-hoc-tap-sang-tao-cong-nghe-so',
    category: 'Góc học tập',
    summary: 'Chương trình nhằm lan tỏa niềm đam mê lập trình, tin học và ứng dụng công nghệ thông tin trong học tập.',
    content: `Hưởng ứng phong trào chuyển đổi số trong giáo dục, bộ môn Tin học phát động phong trào "Học tập và Sáng tạo Công nghệ số 2026".
Mỗi bạn học sinh tích cực tham gia các bài thực hành trực tuyến, rèn luyện tư duy lập trình và sử dụng công nghệ thông tin an toàn, hiệu quả.

Thời gian diễn ra: Xuyên suốt học kỳ II năm học 2025 - 2026.`,
    featuredImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-02-22',
    authorName: 'Thầy Toàn',
    authorTitle: 'Giáo viên Tin học',
    views: 650,
    likes: 54,
    isPinned: false,
    tags: ['Tin học', 'Công nghệ số', 'Góc học tập'],
    comments: []
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'Bài kiểm tra mới được kích hoạt',
    message: 'Đề Khảo sát Toán 9 Giữa HK2 đã mở. Thời gian làm bài 45 phút.',
    type: 'exam',
    timestamp: '2026-02-28 07:30',
    read: false,
    targetLink: 'exam-toan9-midterm'
  },
  {
    id: 'notif-02',
    title: 'Thông báo khảo thí mới',
    message: 'Ban Giám hiệu vừa ban hành kế hoạch thi Giữa học kỳ II năm học 2025-2026.',
    type: 'news',
    timestamp: '2026-02-28 08:00',
    read: true,
    targetLink: 'news-01'
  },
  {
    id: 'notif-03',
    title: 'Kết quả bài kiểm tra Tiếng Anh',
    message: 'Bạn đạt 10.0/10 điểm bài Đề Luyện Thi Vào Lớp 10 môn Tiếng Anh.',
    type: 'result',
    timestamp: '2026-02-27 14:16',
    read: true
  }
];

export const INITIAL_MATERIALS: LessonMaterial[] = [
  {
    id: 'mat-01',
    title: 'Bài giảng điện tử: Bài 1 - Một số vấn đề về chất lượng thông tin khi tìm kiếm trên Internet',
    type: 'slide',
    subject: 'Tin học',
    grade: 9,
    unit: 'Chủ đề A: Máy tính và xã hội tri thức',
    description: 'Slide trình chiếu PowerPoint đầy đủ hiệu ứng, câu hỏi thảo luận và ví dụ thực tế giúp học sinh nhận diện độ tin cậy của thông tin trên không gian mạng.',
    authorName: 'Thầy Nguyễn Văn Toàn',
    authorRole: 'teacher',
    fileName: 'TinHoc9_ChuDeA_Bai1_ChatLuongThongTin.pptx',
    fileSize: '4.8 MB',
    fileFormat: 'pptx',
    downloadCount: 142,
    viewCount: 389,
    createdAt: '2026-02-25',
    isPinned: true,
    tags: ['Tin học 9', 'PowerPoint', 'Chủ đề A', 'Chất lượng thông tin'],
    contentOutline: `1. Mục tiêu bài học:
- Nêu được các tiêu chí đánh giá chất lượng thông tin khi tìm kiếm trên Internet.
- Biết cách chọn lọc và kiểm chứng thông tin trước khi sử dụng.
2. Thiết bị dạy học: Máy chiếu, máy tính kết nối mạng, phiếu học tập số 1.
3. Tiến trình bài dạy: Khởi động (Tình huống tin giả) -> Khám phá (3 tiêu chí) -> Luyện tập -> Vận dụng.`
  },
  {
    id: 'mat-02',
    title: 'Kế hoạch bài dạy (Giáo án) 5512: Bài 3 - Thực hành thiết kế cây thư mục và tổ chức dữ liệu',
    type: 'lesson_plan',
    subject: 'Tin học',
    grade: 9,
    unit: 'Chủ đề B: Mạng máy tính và Internet',
    description: 'Giáo án chuẩn hóa theo Công văn 5512/BGDĐT, phân bổ 2 tiết học với đầy đủ 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng.',
    authorName: 'Thầy Nguyễn Văn Toàn',
    authorRole: 'teacher',
    fileName: 'GiaoAn_5512_TinHoc9_Bai3_ToChucDuLieu.docx',
    fileSize: '850 KB',
    fileFormat: 'docx',
    downloadCount: 98,
    viewCount: 245,
    createdAt: '2026-02-20',
    isPinned: true,
    tags: ['Giáo án 5512', 'Tin học 9', 'Cây thư mục', 'Tổ chức dữ liệu'],
    contentOutline: `I. MỤC TIÊU
1. Về kiến thức: Hiểu cấu trúc hình cây của thư mục, phân cấp dữ liệu khoa học.
2. Về năng lực: Năng lực tự học, giải quyết vấn đề với sự trợ giúp của CNTT (NLa, NLc).
3. Về phẩm chất: Cẩn thận, ngăn nắp khi lưu trữ tệp số.
II. THIẾT BỊ VÀ HỌC LIỆU
- Phòng máy tính cài sẵn Windows 10/11.
III. TIẾN TRÌNH DẠY HỌC`
  },
  {
    id: 'mat-03',
    title: 'Bài giảng & Code mẫu: Lập trình thuật toán tìm kiếm và sắp xếp với Python',
    type: 'lecture',
    subject: 'Tin học',
    grade: 9,
    unit: 'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính',
    description: 'Bài giảng chi tiết kèm mã nguồn mẫu Python trực quan về thuật toán Tìm kiếm tuần tự (Linear Search), Tìm kiếm nhị phân (Binary Search) và Sắp xếp nổi bọt (Bubble Sort).',
    authorName: 'Thầy Nguyễn Văn Toàn',
    authorRole: 'teacher',
    fileName: 'TinHoc9_Python_ThuatToan_TimKiem_SapXep.zip',
    fileSize: '12.4 MB',
    fileFormat: 'zip',
    downloadCount: 230,
    viewCount: 512,
    createdAt: '2026-02-18',
    isPinned: false,
    tags: ['Lập trình Python', 'Thuật toán', 'Tin học 9', 'Code mẫu'],
    externalVideoUrl: 'https://www.youtube.com/watch?v=kPRA0W1kECg',
    contentOutline: `1. Thuật toán tìm kiếm tuần tự: Ý tưởng, cài đặt Python và phân tích độ phức tạp.
2. Thuật toán tìm kiếm nhị phân trên dãy đã sắp xếp.
3. Thuật toán sắp xếp nổi bọt và sắp xếp chọn.
4. Các bài tập thực hành trên nền tảng chấm tự động.`
  },
  {
    id: 'mat-04',
    title: 'Giáo án Tin học 8: Bài 5 - Xử lý bảng tính và công thức nâng cao trong Microsoft Excel',
    type: 'lesson_plan',
    subject: 'Tin học',
    grade: 8,
    unit: 'Chủ đề E: Ứng dụng tin học',
    description: 'Kế hoạch bài dạy chi tiết hướng dẫn học sinh lớp 8 thành thạo các hàm VLOOKUP, HLOOKUP, IF lồng nhau và vẽ biểu đồ phân tích dữ liệu.',
    authorName: 'Cô Lê Thị Mai',
    authorRole: 'teacher',
    fileName: 'GiaoAn_TinHoc8_Bai5_Excel_NangCao.docx',
    fileSize: '1.2 MB',
    fileFormat: 'docx',
    downloadCount: 165,
    viewCount: 420,
    createdAt: '2026-02-15',
    isPinned: false,
    tags: ['Tin học 8', 'Giáo án', 'Excel', 'Bảng tính'],
    contentOutline: `I. Mục tiêu bài học:
- Áp dụng các hàm logic và tìm kiếm trong quản lý điểm số.
- Tạo biểu đồ trực quan hóa dữ liệu thống kê.
II. Hoạt động luyện tập: Bài tập tính học bổng và xếp loại học sinh theo tổ.`
  },
  {
    id: 'mat-05',
    title: 'Bài giảng điện tử: Lập trình điều khiển nhân vật với Scratch 3.0',
    type: 'slide',
    subject: 'Tin học',
    grade: 8,
    unit: 'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính',
    description: 'Slide trình chiếu trực quan sinh động hướng dẫn tạo chuyển động, biến số và cấu trúc rẽ nhánh trong môi trường Scratch.',
    authorName: 'Cô Lê Thị Mai',
    authorRole: 'teacher',
    fileName: 'TinHoc8_Scratch_LapTrinhTrucQuan.pptx',
    fileSize: '8.6 MB',
    fileFormat: 'pptx',
    downloadCount: 188,
    viewCount: 470,
    createdAt: '2026-02-10',
    isPinned: false,
    tags: ['Tin học 8', 'Scratch', 'Lập trình trực quan', 'PowerPoint'],
    contentOutline: `1. Giao diện và các khối lệnh cơ bản của Scratch 3.0.
2. Thiết kế kịch bản trò chơi Mèo bắt chuột.
3. Xử lý va chạm và tính điểm tự động.`
  },
  {
    id: 'mat-06',
    title: 'Giáo án Tin học 7: Bài 2 - Phần mềm ứng dụng và an toàn thiết bị',
    type: 'lesson_plan',
    subject: 'Tin học',
    grade: 7,
    unit: 'Chủ đề A: Máy tính và cộng đồng',
    description: 'Giáo án định hướng phát triển năng lực, hướng dẫn học sinh nhận biết virus máy tính, mã độc và các biện pháp bảo vệ dữ liệu cá nhân.',
    authorName: 'Thầy Nguyễn Văn Toàn',
    authorRole: 'teacher',
    fileName: 'GiaoAn_Tin7_AnToanThietBi.docx',
    fileSize: '760 KB',
    fileFormat: 'docx',
    downloadCount: 75,
    viewCount: 190,
    createdAt: '2026-02-05',
    isPinned: false,
    tags: ['Tin học 7', 'Giáo án', 'An toàn thiết bị', 'Bảo mật'],
    contentOutline: `I. Mục tiêu: Nhận biết nguy cơ lây nhiễm virus và cách quét mã độc.
II. Thực hành: Cài đặt và cập nhật phần mềm diệt virus trên Windows Defender.`
  },
  {
    id: 'mat-07',
    title: 'Tài liệu tham khảo: Đề cương ôn tập và Bộ câu hỏi trắc nghiệm Tin học 6 - Học kỳ II',
    type: 'reference',
    subject: 'Tin học',
    grade: 6,
    unit: 'Tổng hợp kiến thức HK2',
    description: 'Bộ tài liệu ôn tập toàn diện gồm tóm tắt lý thuyết, 100 câu hỏi trắc nghiệm kèm đáp án và các bài tập thực hành gõ bàn phím 10 ngón.',
    authorName: 'Thầy Nguyễn Văn Toàn',
    authorRole: 'teacher',
    fileName: 'DeCuong_OnTap_TinHoc6_HK2.pdf',
    fileSize: '2.1 MB',
    fileFormat: 'pdf',
    downloadCount: 310,
    viewCount: 680,
    createdAt: '2026-02-01',
    isPinned: true,
    tags: ['Tin học 6', 'Ôn tập HK2', 'Đề cương', 'Trắc nghiệm'],
    contentOutline: `Phần 1: Tóm tắt lý thuyết Chủ đề A, B, C, D, E.
Phần 2: 100 câu trắc nghiệm 4 mức độ nhận thức.
Phần 3: Đáp án và thang điểm chi tiết.`
  }
];

