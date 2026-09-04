import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Video, 
  FileArchive, 
  File, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Tag, 
  Layers, 
  Youtube, 
  Info,
  ListOrdered,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { LessonMaterial, GradeLevel, Subject, User } from '../../types';
import { isTeacherToanOrAdmin } from '../../utils/authUtils';

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: LessonMaterial) => void;
  editingMaterial?: LessonMaterial | null;
  currentUser: User;
}

const INFORMATICS_UNITS: Record<GradeLevel, string[]> = {
  6: [
    'Chủ đề A: Máy tính và cộng đồng (Thông tin & Thu nhận thông tin)',
    'Chủ đề B: Mạng máy tính và Internet',
    'Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
    'Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số',
    'Chủ đề E: Ứng dụng tin học (Soạn thảo văn bản & Sơ đồ tư duy)',
    'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính (Thuật toán)'
  ],
  7: [
    'Chủ đề A: Máy tính và cộng đồng (Thiết bị vào ra & Hệ điều hành)',
    'Chủ đề B: Mạng máy tính và Internet (An toàn trên mạng)',
    'Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
    'Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số',
    'Chủ đề E: Ứng dụng tin học (Bảng tính điện tử Excel)',
    'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính (Thuật toán tìm kiếm)'
  ],
  8: [
    'Chủ đề A: Máy tính và cộng đồng (Lịch sử phát triển máy tính)',
    'Chủ đề B: Mạng máy tính và Internet (Bảo mật thông tin)',
    'Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
    'Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số',
    'Chủ đề E: Ứng dụng tin học (Xử lý dữ liệu nâng cao)',
    'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính (Lập trình trực quan Scratch)'
  ],
  9: [
    'Chủ đề A: Máy tính và xã hội tri thức (Chất lượng thông tin)',
    'Chủ đề B: Mạng máy tính và Internet (Dịch vụ đám mây)',
    'Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
    'Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số (Bản quyền số)',
    'Chủ đề E: Ứng dụng tin học (Đa phương tiện & Thiết kế web cơ bản)',
    'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính (Lập trình Python/C++)',
    'Chủ đề G: Hướng nghiệp với Tin học'
  ]
};

const TEMPLATE_5512 = `I. MỤC TIÊU BÀI HỌC:
1. Kiến thức:
- Giúp học sinh nắm vững các khái niệm trọng tâm của bài học.
- Vận dụng kiến thức vào giải quyết các bài tập thực hành trên máy tính.

2. Năng lực:
- Năng lực tự chủ và tự học: Tự giác tìm hiểu tài liệu, thực hiện nhiệm vụ cá nhân.
- Năng lực giải quyết vấn đề và sáng tạo (NLa, NLc): Ứng dụng công nghệ thông tin vào học tập và đời sống.

3. Phẩm chất:
- Chăm chỉ, cẩn thận trong thao tác thực hành máy tính.
- Có ý thức trách nhiệm và tôn trọng bản quyền số.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Kế hoạch bài dạy, bài trình chiếu PowerPoint, máy chiếu, phòng thực hành mạng LAN.
- Học sinh: SGK Tin học, vở ghi, phiếu học tập cá nhân và nhóm.

III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG):
1. Hoạt động 1: Khởi động (Mở đầu tạo tình huống có vấn đề) - 5 phút.
2. Hoạt động 2: Hình thành kiến thức mới (Khám phá kiến thức trọng tâm) - 20 phút.
3. Hoạt động 3: Luyện tập (Thực hành củng cố trên máy tính) - 15 phút.
4. Hoạt động 4: Vận dụng (Mở rộng và giao nhiệm vụ về nhà) - 5 phút.`;

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMaterial,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonMaterial['type']>('slide');
  const [grade, setGrade] = useState<GradeLevel>(9);
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [contentOutline, setContentOutline] = useState('');
  const [authorName, setAuthorName] = useState(currentUser.name || 'Thầy Nguyễn Văn Toàn');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileFormat, setFileFormat] = useState<LessonMaterial['fileFormat']>('pptx');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Tin học 9', 'PowerPoint']);
  const [isPinned, setIsPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState(false);

  useEffect(() => {
    if (editingMaterial) {
      setTitle(editingMaterial.title);
      setType(editingMaterial.type);
      setGrade(editingMaterial.grade);
      setUnit(editingMaterial.unit || '');
      setDescription(editingMaterial.description);
      setContentOutline(editingMaterial.contentOutline || '');
      setAuthorName(editingMaterial.authorName);
      setFileName(editingMaterial.fileName);
      setFileSize(editingMaterial.fileSize);
      setFileFormat(editingMaterial.fileFormat);
      setFileDataUrl(editingMaterial.fileUrl || '');
      setExternalVideoUrl(editingMaterial.externalVideoUrl || '');
      setTags(editingMaterial.tags || []);
      setIsPinned(!!editingMaterial.isPinned);
    } else {
      // Default new material
      setTitle('');
      setType('slide');
      setGrade(9);
      setUnit(INFORMATICS_UNITS[9][0]);
      setDescription('');
      setContentOutline(TEMPLATE_5512);
      setAuthorName(currentUser.name || 'Thầy Nguyễn Văn Toàn');
      setFileName('BaiGiang_TinHoc9.pptx');
      setFileSize('3.5 MB');
      setFileFormat('pptx');
      setFileDataUrl('');
      setExternalVideoUrl('');
      setTags(['Tin học 9', 'Bài giảng', 'Chủ đề A']);
      setIsPinned(false);
    }
  }, [editingMaterial, currentUser, isOpen]);

  // Update default unit when grade changes
  const handleGradeChange = (newGrade: GradeLevel) => {
    setGrade(newGrade);
    const units = INFORMATICS_UNITS[newGrade];
    if (units && units.length > 0) {
      setUnit(units[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const name = file.name;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size >= 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
    
    // Detect extension
    const ext = name.split('.').pop()?.toLowerCase() || '';
    let format: LessonMaterial['fileFormat'] = 'other';
    if (ext === 'pptx' || ext === 'ppt') format = 'pptx';
    else if (ext === 'docx' || ext === 'doc') format = 'docx';
    else if (ext === 'pdf') format = 'pdf';
    else if (ext === 'xlsx' || ext === 'xls') format = 'xlsx';
    else if (ext === 'zip' || ext === 'rar' || ext === '7z') format = 'zip';
    else if (ext === 'mp4' || ext === 'mkv' || ext === 'mov') format = 'mp4';

    setFileName(name);
    setFileSize(sizeStr);
    setFileFormat(format);

    // Auto set type based on format
    if (format === 'pptx') setType('slide');
    else if (format === 'docx') setType('lesson_plan');
    else if (format === 'pdf') setType('reference');
    else if (format === 'zip') setType('exercise');
    else if (format === 'mp4') setType('lecture');

    // Auto set title if empty
    if (!title.trim()) {
      const cleanName = name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setTitle(cleanName);
    }

    // Read base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileDataUrl(e.target.result as string);
        setUploadSuccessNotice(true);
        setTimeout(() => setUploadSuccessNotice(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài giảng / giáo án!');
      return;
    }

    const isModerator = isTeacherToanOrAdmin(currentUser);

    const material: LessonMaterial = {
      id: editingMaterial ? editingMaterial.id : `mat-${Date.now()}`,
      title: title.trim(),
      type,
      subject: 'Tin học',
      grade,
      unit: unit.trim() || undefined,
      description: description.trim() || `Tài liệu môn Tin học lớp ${grade} dành cho giáo viên và học sinh.`,
      contentOutline: contentOutline.trim() || undefined,
      authorName: authorName.trim() || currentUser.name,
      authorRole: currentUser.role === 'admin' ? 'admin' : 'teacher',
      fileName: fileName.trim() || `TaiLieu_TinHoc${grade}.${fileFormat}`,
      fileSize: fileSize || '2.5 MB',
      fileFormat,
      fileUrl: fileDataUrl || undefined,
      externalVideoUrl: externalVideoUrl.trim() || undefined,
      tags: tags.length > 0 ? tags : [`Tin học ${grade}`, 'Tài liệu'],
      isPinned,
      downloadCount: editingMaterial ? editingMaterial.downloadCount : 0,
      viewCount: editingMaterial ? editingMaterial.viewCount : 1,
      createdAt: editingMaterial ? editingMaterial.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: editingMaterial ? new Date().toISOString().split('T')[0] : undefined,
      approvalStatus: isModerator ? 'approved' : 'pending_approval',
      approvedBy: isModerator ? currentUser.name : undefined,
      approvedAt: isModerator ? new Date().toISOString() : undefined
    };

    onSave(material);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingMaterial ? 'Chỉnh Sửa Bài Giảng / Giáo Án' : 'Upload & Đăng Bài Giảng, Giáo Án Mới'}
              </h2>
              <p className="text-xs text-slate-300">
                Kho học liệu điện tử, Kế hoạch bài dạy (5512) và Slide môn Tin học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Moderation Workflow Notice */}
          {!isTeacherToanOrAdmin(currentUser) ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quy trình kiểm duyệt học liệu: </span>
                Bài giảng / Giáo án do giáo viên tải lên sẽ được chuyển đến hàng đợi phê duyệt của <strong>Thầy Toàn hoặc Quản trị viên (Admin)</strong> trước khi hiển thị cho toàn trường.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Đặc quyền Thầy Toàn / Admin: </span>
                Học liệu sẽ được tự động phê duyệt và kích hoạt tải về ngay lập tức.
              </div>
            </div>
          )}
          
          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Tệp đính kèm (PowerPoint, Word, PDF, ZIP, Video) <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="material-file-input"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                accept=".pptx,.ppt,.docx,.doc,.pdf,.xlsx,.xls,.zip,.rar,.mp4"
              />
              
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                  {fileFormat === 'pptx' && <Presentation className="w-7 h-7 text-amber-600" />}
                  {fileFormat === 'docx' && <FileText className="w-7 h-7 text-blue-600" />}
                  {fileFormat === 'pdf' && <File className="w-7 h-7 text-rose-600" />}
                  {fileFormat === 'xlsx' && <FileSpreadsheet className="w-7 h-7 text-emerald-600" />}
                  {fileFormat === 'zip' && <FileArchive className="w-7 h-7 text-purple-600" />}
                  {fileFormat === 'mp4' && <Video className="w-7 h-7 text-indigo-600" />}
                  {fileFormat === 'other' && <Upload className="w-7 h-7 text-slate-600" />}
                </div>

                <div>
                  <label
                    htmlFor="material-file-input"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn tệp từ máy tính</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-2">
                    Hoặc kéo & thả file vào khung này (Hỗ trợ: .PPTX, .DOCX, .PDF, .ZIP, .MP4 tối đa 50MB)
                  </p>
                </div>

                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tệp đã chọn: <strong>{fileName}</strong> ({fileSize})</span>
                  </div>
                )}

                {uploadSuccessNotice && (
                  <p className="text-xs text-emerald-600 font-semibold animate-pulse">
                    ✓ Đã nạp dữ liệu tệp thành công, sẵn sàng chia sẻ cho học sinh!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tên bài giảng / Giáo án */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Tên bài giảng / Kế hoạch bài dạy <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài giảng điện tử Bài 1 - Một số vấn đề về chất lượng thông tin (Tin học 9)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            {/* Loại học liệu */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Loại học liệu <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LessonMaterial['type'])}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="slide">📽️ Bài giảng điện tử (PowerPoint / Slide)</option>
                <option value="lesson_plan">📝 Kế hoạch bài dạy (Giáo án CV 5512 - Word)</option>
                <option value="lecture">🎬 Video bài giảng trực tuyến</option>
                <option value="reference">📖 Đề cương ôn tập & Tài liệu PDF</option>
                <option value="exercise">💻 Mã nguồn / Bài tập thực hành (ZIP/Code)</option>
                <option value="software">⚙️ Phần mềm / Tiện ích học tập</option>
              </select>
            </div>

            {/* Khối lớp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Khối lớp <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      grade === g
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Chủ đề chương trình */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Chủ đề trong chương trình GDPT 2018 (Tin học Khối {grade})
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {INFORMATICS_UNITS[grade]?.map((u, idx) => (
                  <option key={idx} value={u}>{u}</option>
                ))}
                <option value="Chủ đề nâng cao & Luyện thi">Chủ đề nâng cao & Luyện thi Học sinh giỏi</option>
                <option value="Ôn tập cuối kỳ & Khảo thí">Ôn tập cuối kỳ & Khảo thí</option>
              </select>
            </div>

            {/* Tóm tắt mô tả */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                6. Mô tả ngắn & Hướng dẫn sử dụng
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt ngắn gọn mục tiêu, nội dung chính và cách học sinh/giáo viên khai thác tài liệu này..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Kế hoạch bài dạy chi tiết (Khung 5512) */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-blue-600" />
                  <span>7. Khung Kế Hoạch Bài Dạy (Mục tiêu, Năng lực & 4 Hoạt động CV 5512)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setContentOutline(TEMPLATE_5512)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Điền mẫu giáo án 5512</span>
                </button>
              </div>
              <textarea
                rows={6}
                value={contentOutline}
                onChange={(e) => setContentOutline(e.target.value)}
                placeholder="Nhập mục tiêu bài dạy, năng lực cần đạt, thiết bị dạy học và tiến trình các hoạt động khởi động, khám phá, luyện tập, vận dụng..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Link Video bài giảng trực tuyến (YouTube) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Youtube className="w-4 h-4 text-rose-600" />
                <span>8. Link Video bài giảng (YouTube nếu có)</span>
              </label>
              <input
                type="url"
                value={externalVideoUrl}
                onChange={(e) => setExternalVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Tác giả / Giáo viên biên soạn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                9. Giáo viên / Tác giả biên soạn
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="VD: Thầy Nguyễn Văn Toàn"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Thẻ gắn (Tags) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                10. Thẻ gắn (Tags)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Nhập thẻ và nhấn Thêm (VD: Python, Excel, Scratch, Giáo án 5512)"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  + Thêm
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-blue-400 hover:text-rose-600 transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ghim lên đầu trang */}
            <div className="md:col-span-2 pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer bg-amber-50/70 hover:bg-amber-50 p-3 rounded-xl border border-amber-200 w-full transition-colors">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 block">
                    ⭐ Ghim bài giảng / giáo án này lên đầu trang
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Tài liệu sẽ được ưu tiên hiển thị ở vị trí nổi bật nhất cho học sinh và giáo viên.
                  </span>
                </div>
              </label>
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{editingMaterial ? 'Cập Nhật Bài Giảng' : 'Đăng & Lưu Bài Giảng Lên Hệ Thống'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
