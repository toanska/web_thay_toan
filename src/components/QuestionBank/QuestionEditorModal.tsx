import React, { useState } from 'react';
import { X, Save, Plus, Trash2, HelpCircle, Sparkles, Tag, Layers } from 'lucide-react';
import { Question, Subject, GradeLevel, DifficultyLevel, QuestionType, User } from '../../types';

interface QuestionEditorModalProps {
  questionToEdit?: Question | null;
  currentUser: User;
  onSave: (question: Question) => void;
  onClose: () => void;
}

const SUBJECT_LIST: Subject[] = [
  'Tin học'
];

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  questionToEdit,
  currentUser,
  onSave,
  onClose
}) => {
  const [subject, setSubject] = useState<Subject>(questionToEdit?.subject || 'Tin học');
  const [grade, setGrade] = useState<GradeLevel>(questionToEdit?.grade || 9);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(questionToEdit?.difficulty || 'understanding');
  const [type, setType] = useState<QuestionType>(questionToEdit?.type || 'multiple_choice');
  const [code, setCode] = useState(questionToEdit?.code || `${subject.slice(0, 3).toUpperCase()}${grade}-Q${Date.now().toString().slice(-3)}`);
  const [content, setContent] = useState(questionToEdit?.content || '');
  const [options, setOptions] = useState<string[]>(
    questionToEdit?.options || ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']
  );
  const [correctAnswers, setCorrectAnswers] = useState<any[]>(
    questionToEdit?.correctAnswers || [0]
  );
  const [explanation, setExplanation] = useState(questionToEdit?.explanation || '');
  const [tagInput, setTagInput] = useState(questionToEdit?.tags.join(', ') || 'GDPT 2018, Ôn tập');
  const [points, setPoints] = useState(questionToEdit?.points || 0.5);

  const handleOptionTextChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, `Lựa chọn ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần tối thiểu 2 lựa chọn.');
      return;
    }
    const updated = options.filter((_, idx) => idx !== index);
    setOptions(updated);
    setCorrectAnswers(correctAnswers.filter(ans => ans !== index).map(ans => (ans > index ? ans - 1 : ans)));
  };

  const toggleCorrectOption = (index: number) => {
    if (type === 'multiple_choice' || type === 'true_false') {
      setCorrectAnswers([index]);
    } else if (type === 'multi_select') {
      if (correctAnswers.includes(index)) {
        setCorrectAnswers(correctAnswers.filter(i => i !== index));
      } else {
        setCorrectAnswers([...correctAnswers, index]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updatedQuestion: Question = {
      id: questionToEdit?.id || 'q-' + Date.now(),
      code: code.trim(),
      subject,
      grade,
      difficulty,
      type,
      content: content.trim(),
      options: (type === 'fill_in' || type === 'essay') ? undefined : options,
      correctAnswers,
      explanation: explanation.trim(),
      tags,
      points: Number(points),
      authorName: questionToEdit?.authorName || currentUser.name,
      createdAt: questionToEdit?.createdAt || new Date().toISOString().split('T')[0]
    };

    onSave(updatedQuestion);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {questionToEdit ? 'Chỉnh sửa câu hỏi ngân hàng' : 'Thêm câu hỏi mới vào ngân hàng'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 text-xs">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium outline-hidden"
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
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium outline-hidden"
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium outline-hidden"
              >
                <option value="recognition">Nhận biết</option>
                <option value="understanding">Thông hiểu</option>
                <option value="application">Vận dụng</option>
                <option value="high_application">Vận dụng cao</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dạng câu hỏi
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  setType(newType);
                  if (newType === 'true_false') {
                    setOptions(['Đúng', 'Sai']);
                    setCorrectAnswers([0]);
                  } else if (newType === 'fill_in') {
                    setCorrectAnswers(['']);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium outline-hidden"
              >
                <option value="multiple_choice">Trắc nghiệm 1 đáp án</option>
                <option value="multi_select">Nhiều lựa chọn đúng</option>
                <option value="true_false">Đúng / Sai</option>
                <option value="fill_in">Điền khuyết</option>
                <option value="essay">Tự luận ngắn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mã câu hỏi
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold uppercase outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Điểm số mặc định
              </label>
              <input
                type="number"
                step={0.25}
                min={0.25}
                max={10}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold outline-hidden"
              />
            </div>
          </div>

          {/* Question content */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nội dung câu hỏi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nhập nội dung câu hỏi, bài toán hoặc đoạn văn đọc hiểu..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Dynamic Options Area */}
          {(type === 'multiple_choice' || type === 'multi_select' || type === 'true_false') && (
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Danh sách đáp án lựa chọn (Click tròn xanh để chọn đáp án ĐÚNG)
                </span>
                {type !== 'true_false' && options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm phương án</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect = correctAnswers.includes(idx);
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <div key={idx} className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleCorrectOption(idx)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Đánh dấu đáp án ĐÚNG"
                      >
                        {letter}
                      </button>

                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs outline-hidden ${
                          isCorrect ? 'border-emerald-500 bg-emerald-50/50 font-semibold text-emerald-950' : 'border-slate-300 bg-white'
                        }`}
                      />

                      {type !== 'true_false' && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Xóa lựa chọn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fill-in / Essay Answer field */}
          {type === 'fill_in' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Đáp án chuẩn điền khuyết (từ khóa hoặc số chính xác)
              </label>
              <input
                type="text"
                required
                placeholder="VD: 5 hoặc Hà Nội"
                value={correctAnswers[0] || ''}
                onChange={(e) => setCorrectAnswers([e.target.value])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs"
              />
            </div>
          )}

          {type === 'essay' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Hướng dẫn chấm / Tiêu chí cho điểm tự luận
              </label>
              <textarea
                rows={2}
                placeholder="Nêu các ý chính cần có trong bài làm của học sinh..."
                value={correctAnswers[0] || ''}
                onChange={(e) => setCorrectAnswers([e.target.value])}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lời giải chi tiết & Các bước chứng minh / giải thích
            </label>
            <textarea
              rows={3}
              placeholder="Giải thích từng bước vì sao chọn đáp án đó để học sinh xem lại sau khi nộp bài..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-hidden"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thẻ từ khóa (Tags)
            </label>
            <input
              type="text"
              placeholder="VD: Căn thức, Đại số 9, Học kỳ 1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{questionToEdit ? 'Lưu cập nhật câu hỏi' : 'Thêm vào ngân hàng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
