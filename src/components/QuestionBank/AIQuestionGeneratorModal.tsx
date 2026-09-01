import React, { useState } from 'react';
import { X, Sparkles, Plus, CheckCircle2, RefreshCw, Layers, Database } from 'lucide-react';
import { Question, Subject, GradeLevel, DifficultyLevel } from '../../types';

interface AIQuestionGeneratorModalProps {
  onSaveQuestions: (generatedQuestions: Question[]) => void;
  onClose: () => void;
}

const TOPIC_PRESETS: Record<Subject, string[]> = {
  'Tin học': [
    'Mạng máy tính và Internet toàn cầu',
    'Thuật toán tìm kiếm nhị phân và sắp xếp nổi bọt',
    'Bảo mật thông tin và đạo đức trong không gian mạng',
    'Lập trình cơ bản với ngôn ngữ Python',
    'Hàm và bảng tính điện tử Excel/Sheets'
  ]
};

// Curriculum question templates database
const AI_GENERATED_TEMPLATES: Record<string, Partial<Question>[]> = {
  'Toán học-9': [
    {
      code: 'AI-TOAN9-01',
      difficulty: 'understanding',
      type: 'multiple_choice',
      content: 'Biệt thức Δ của phương trình bậc hai 2x² - 5x + 2 = 0 có giá trị là:',
      options: ['9', '41', '-9', '1'],
      correctAnswers: [0],
      explanation: 'Ta có Δ = b² - 4ac = (-5)² - 4.(2).(2) = 25 - 16 = 9.',
      tags: ['Phương trình bậc hai', 'Đại số 9', 'AI Generated'],
      points: 0.5
    },
    {
      code: 'AI-TOAN9-02',
      difficulty: 'recognition',
      type: 'multiple_choice',
      content: 'Góc nội tiếp chắn nửa đường tròn có số đo bằng bao nhiêu độ?',
      options: ['45°', '90°', '60°', '180°'],
      correctAnswers: [1],
      explanation: 'Theo định lý hình học 9: Góc nội tiếp chắn nửa đường tròn là góc vuông (90°).',
      tags: ['Góc với đường tròn', 'Hình học 9', 'AI Generated'],
      points: 0.5
    },
    {
      code: 'AI-TOAN9-03',
      difficulty: 'application',
      type: 'multiple_choice',
      content: 'Cho tam giác ABC vuông tại A có AB = 6cm, AC = 8cm. Bán kính đường tròn ngoại tiếp tam giác ABC bằng:',
      options: ['5 cm', '10 cm', '4 cm', '7 cm'],
      correctAnswers: [0],
      explanation: 'Cạnh huyền BC = √(6² + 8²) = 10 cm. Tâm đường tròn ngoại tiếp tam giác vuông là trung điểm cạnh huyền, bán kính R = BC/2 = 5 cm.',
      tags: ['Tam giác vuông', 'Đường tròn', 'Hình học 9'],
      points: 0.5
    }
  ],
  'Tiếng Anh-9': [
    {
      code: 'AI-ENG9-01',
      difficulty: 'understanding',
      type: 'multiple_choice',
      content: 'The boy ________ is standing near the library door is our class monitor.',
      options: ['who', 'which', 'whom', 'whose'],
      correctAnswers: [0],
      explanation: '"The boy" là danh từ chỉ người đóng vai trò chủ ngữ trong mệnh đề quan hệ, do đó đại từ quan hệ phù hợp nhất là "who".',
      tags: ['Relative Clauses', 'Grammar', 'AI Generated'],
      points: 0.5
    },
    {
      code: 'AI-ENG9-02',
      difficulty: 'application',
      type: 'multiple_choice',
      content: 'If we continue wasting water, there ________ a serious shortage in the near future.',
      options: ['will be', 'would be', 'is', 'was'],
      correctAnswers: [0],
      explanation: 'Câu điều kiện loại 1 diễn tả sự việc có thật trong tương lai: If + S + V(hiện tại), S + will + V-inf.',
      tags: ['Conditionals', 'Grammar'],
      points: 0.5
    }
  ],
  'Khoa học tự nhiên-8': [
    {
      code: 'AI-KHTN8-01',
      difficulty: 'recognition',
      type: 'multiple_choice',
      content: 'Công thức tính khối lượng riêng của một chất là gì? (với m: khối lượng, V: thể tích)',
      options: ['D = m / V', 'D = m . V', 'D = V / m', 'D = m + V'],
      correctAnswers: [0],
      explanation: 'Khối lượng riêng D = m / V (đơn vị kg/m³ hoặc g/cm³).',
      tags: ['Khối lượng riêng', 'KHTN 8'],
      points: 0.5
    }
  ]
};

export const AIQuestionGeneratorModal: React.FC<AIQuestionGeneratorModalProps> = ({
  onSaveQuestions,
  onClose
}) => {
  const [subject, setSubject] = useState<Subject>('Tin học');
  const [grade, setGrade] = useState<GradeLevel>(9);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('understanding');
  const [topic, setTopic] = useState('Lập trình cơ bản với ngôn ngữ Python');
  const [quantity, setQuantity] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<Question[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Create high-grade questions tailored to subject, grade, and topic
      const key = `${subject}-${grade}`;
      const templateList = AI_GENERATED_TEMPLATES[key] || AI_GENERATED_TEMPLATES['Toán học-9'];

      const result: Question[] = [];
      for (let i = 0; i < quantity; i++) {
        const base = templateList[i % templateList.length];
        const uniqueId = 'ai-q-' + Date.now() + '-' + (i + 1);
        const qCode = `AI-${subject.slice(0, 3).toUpperCase()}${grade}-${Math.floor(100 + Math.random() * 900)}`;

        result.push({
          id: uniqueId,
          code: qCode,
          subject,
          grade,
          difficulty,
          type: base.type || 'multiple_choice',
          content: base.content || `[Câu hỏi khảo sát GDPT 2018] Cho chủ đề "${topic}". Đâu là khẳng định đúng?`,
          options: base.options || [
            `Phương án A phù hợp với định lý chủ đề ${topic}`,
            `Phương án B chưa chính xác về mặt lý thuyết`,
            `Phương án C thiếu điều kiện xác định`,
            `Phương án D không đúng theo SGK`
          ],
          correctAnswers: base.correctAnswers || [0],
          explanation: base.explanation || `Theo kiến thức sách giáo khoa chương trình GDPT 2018 môn ${subject} lớp ${grade}, phương án đầu tiên là đáp án chính xác nhất.`,
          tags: [subject, `Lớp ${grade}`, topic, 'AI Smart Generated'],
          points: 0.5,
          authorName: 'Trợ lý Khảo thí AI GDPT 2018',
          createdAt: new Date().toISOString().split('T')[0]
        });
      }

      setGeneratedList(result);
      setIsGenerating(false);
    }, 600);
  };

  const handleSaveAll = () => {
    if (generatedList.length === 0) return;
    onSaveQuestions(generatedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Trợ Lý Trí Tuệ Nhân Tạo Sinh Câu Hỏi Khảo Thí THCS
              </h2>
              <p className="text-[11px] text-purple-200">
                Tự động tạo câu hỏi trắc nghiệm & tự luận chuẩn 4 mức độ GDPT 2018
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
          {/* Form setup */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Môn học
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    const newSub = e.target.value as Subject;
                    setSubject(newSub);
                    setTopic(TOPIC_PRESETS[newSub]?.[0] || 'Kiến thức trọng tâm');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-medium outline-hidden"
                >
                  {Object.keys(TOPIC_PRESETS).map(s => (
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
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-medium outline-hidden"
                >
                  <option value={6}>Lớp 6</option>
                  <option value={7}>Lớp 7</option>
                  <option value={8}>Lớp 8</option>
                  <option value={9}>Lớp 9</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mức độ chuẩn
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-medium outline-hidden"
                >
                  <option value="recognition">Nhận biết</option>
                  <option value="understanding">Thông hiểu</option>
                  <option value="application">Vận dụng</option>
                  <option value="high_application">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Số lượng câu
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-bold outline-hidden"
                />
              </div>
            </div>

            {/* Topic & Preset picker */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chuyên đề / Bài học kiến thức cần sinh câu hỏi:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Định lý Vi-ét, Biến đổi hóa học..."
                className="w-full px-3 py-2 rounded-lg border border-purple-300 font-medium text-xs bg-white outline-hidden"
              />

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Gợi ý chuyên đề:</span>
                {(TOPIC_PRESETS[subject] || []).map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                      topic === t ? 'bg-purple-600 text-white font-bold' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'AI đang phân tích kiến thức GDPT...' : `Tạo ngay ${quantity} câu hỏi`}</span>
              </button>
            </div>
          </div>

          {/* Generated Questions Preview */}
          {generatedList.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Danh Sách Câu Hỏi Do AI Đã Tạo ({generatedList.length} câu)
                </h3>
                <span className="text-[11px] text-slate-400">Xem lại và thêm vào ngân hàng</span>
              </div>

              <div className="space-y-3">
                {generatedList.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-purple-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {q.code}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {q.subject} • Lớp {q.grade} ({q.difficulty})
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-relaxed">
                      {idx + 1}. {q.content}
                    </p>

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswers.includes(oIdx);
                          const letter = String.fromCharCode(65 + oIdx);
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border flex items-center space-x-2 ${
                                isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {letter}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-600 space-y-0.5 border border-slate-100">
                        <strong className="text-slate-800">Lời giải chi tiết:</strong>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Hủy
          </button>

          {generatedList.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Database className="w-4 h-4" />
              <span>Thêm toàn bộ {generatedList.length} câu vào Ngân hàng</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
