import mammoth from 'mammoth';
import { Question, Subject, GradeLevel, DifficultyLevel } from '../types';

export interface ParsedExamResult {
  title?: string;
  questions: Question[];
  rawText: string;
  warnings: string[];
}

/**
 * Parses raw text extracted from a Word (.docx) file or pasted by user
 */
export function parseExamText(
  text: string, 
  defaultSubject: Subject = 'Tin học', 
  defaultGrade: GradeLevel = 9
): ParsedExamResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) {
    return { questions: [], rawText: text, warnings: ['Tài liệu trống hoặc không có nội dung chữ.'] };
  }

  // Check for title in the first 2-3 lines
  let extractedTitle = '';
  if (lines[0] && !lines[0].toLowerCase().startsWith('câu') && !lines[0].toLowerCase().startsWith('bài')) {
    extractedTitle = lines[0].replace(/^(đề thi|đề kiểm tra|khảo sát)[:\s]*/i, '').trim();
  }

  // Look for answer keys at the bottom (e.g. "BẢNG ĐÁP ÁN", "1.A 2.B 3.C", "1-A, 2-B")
  const answerKeyMap: Record<number, number> = {};
  const fullText = text;
  const answerKeyRegex = /(?:bảng\s*đáp\s*án|đáp\s*án|key)[:\s\n]+([\s\S]+?)$/i;
  const keyMatch = fullText.match(answerKeyRegex);
  if (keyMatch) {
    const keySection = keyMatch[1];
    const pairRegex = /(\d+)[\.\s:\-_]+([A-Da-d])/g;
    let m;
    while ((m = pairRegex.exec(keySection)) !== null) {
      const qNum = parseInt(m[1], 10);
      const letter = m[2].toUpperCase();
      const optIdx = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (optIdx >= 0 && optIdx <= 3) {
        answerKeyMap[qNum] = optIdx;
      }
    }
  }

  // Regex to detect start of a question: "Câu 1:", "Câu 1.", "Câu 1 -", "Bài 1:", "1.", "1)"
  const qStartRegex = /^(?:câu|bài|question)\s*(\d+)[\.\s:–-]+/i;
  
  // Split into question blocks
  const rawBlocks: { qNum?: number; lines: string[] }[] = [];
  let currentBlock: string[] = [];
  let currentQNum: number | undefined = undefined;

  for (const line of lines) {
    const match = line.match(qStartRegex);
    if (match) {
      if (currentBlock.length > 0) {
        rawBlocks.push({ qNum: currentQNum, lines: currentBlock });
      }
      currentQNum = parseInt(match[1], 10);
      currentBlock = [line];
    } else {
      // Check if it's the answer table header - if so, stop accumulating questions
      if (/^(?:bảng\s*đáp\s*án|bảng\s*tra\s*đáp\s*án)/i.test(line)) {
        if (currentBlock.length > 0) {
          rawBlocks.push({ qNum: currentQNum, lines: currentBlock });
          currentBlock = [];
        }
        break;
      }
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    rawBlocks.push({ qNum: currentQNum, lines: currentBlock });
  }

  // If no "Câu X" was found, try splitting by numbering "1.", "2.", "3."
  if (rawBlocks.length === 0 || (rawBlocks.length === 1 && rawBlocks[0].qNum === undefined)) {
    const numStartRegex = /^(\d+)[\.\)]\s+/;
    const fallbackBlocks: { qNum?: number; lines: string[] }[] = [];
    let fBlock: string[] = [];
    let fNum: number | undefined = undefined;

    for (const line of lines) {
      const match = line.match(numStartRegex);
      if (match) {
        if (fBlock.length > 0) {
          fallbackBlocks.push({ qNum: fNum, lines: fBlock });
        }
        fNum = parseInt(match[1], 10);
        fBlock = [line];
      } else {
        fBlock.push(line);
      }
    }
    if (fBlock.length > 0) {
      fallbackBlocks.push({ qNum: fNum, lines: fBlock });
    }

    if (fallbackBlocks.length > 1) {
      rawBlocks.length = 0;
      rawBlocks.push(...fallbackBlocks);
    }
  }

  const parsedQuestions: Question[] = [];

  rawBlocks.forEach((block, blockIdx) => {
    const qNumber = block.qNum || (blockIdx + 1);
    const blockText = block.lines.join('\n');

    // Extract Question Content, Options, Answers, and Explanation
    let questionContent = '';
    const options: string[] = [];
    let correctAnswers: number[] = [];
    let explanation = '';
    let difficulty: DifficultyLevel = 'understanding';
    let points = 1.0;

    // Detect level keywords like [NB], [TH], [VD], [VDC], (Nhận biết), (Thông hiểu)
    if (/\[NB\]|\(Nhận biết\)|\(NB\)/i.test(blockText)) difficulty = 'recognition';
    else if (/\[TH\]|\(Thông hiểu\)|\(TH\)/i.test(blockText)) difficulty = 'understanding';
    else if (/\[VD\]|\(Vận dụng\)|\(VD\)/i.test(blockText)) difficulty = 'application';
    else if (/\[VDC\]|\(Vận dụng cao\)|\(VDC\)/i.test(blockText)) difficulty = 'high_application';

    // Separate explanation if present: "Lời giải:", "Hướng dẫn:", "Giải thích:"
    const explMatch = blockText.match(/(?:lời\s*giải|hướng\s*dẫn|giải\s*thích)[:\s]+([\s\S]+)$/i);
    if (explMatch) {
      explanation = explMatch[1].trim();
    }

    // Check inline "Đáp án: A" or "Đáp án đúng: B" or "Chọn A"
    const ansMatch = blockText.match(/(?:đáp\s*án(?:\s*đúng)?|chọn|key|da)[:\s]+([A-Da-d1-4])/i);
    if (ansMatch) {
      const val = ansMatch[1].toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(val)) {
        correctAnswers = [val.charCodeAt(0) - 65];
      } else if (['1', '2', '3', '4'].includes(val)) {
        correctAnswers = [parseInt(val, 10) - 1];
      }
    } else if (answerKeyMap[qNumber] !== undefined) {
      correctAnswers = [answerKeyMap[qNumber]];
    }

    // Now extract options A, B, C, D
    // Options can be on individual lines or multiple options on one line (e.g. "A. 10   B. 20   C. 30   D. 40")
    // Let's normalize options by inserting line breaks before [A-D][\.\)] or \([A-D]\)
    let processedBlock = block.lines
      .filter(l => !/^(?:lời\s*giải|hướng\s*dẫn|giải\s*thích)[:\s]/i.test(l))
      .filter(l => !/^(?:đáp\s*án(?:\s*đúng)?|chọn|key|da)[:\s]+[A-Da-d]/i.test(l))
      .join('\n');

    // Split options: pattern matching for A., B., C., D.
    const optionMatches = [...processedBlock.matchAll(/(?:^|[\s\t]+)(\*?[A-D])[\.\)]\s+([\s\S]*?)(?=(?:[\s\t]+\*?[A-D][\.\)]\s+)|$)/gi)];

    if (optionMatches.length >= 2) {
      // The text before the first option is the question statement
      const firstOptIndex = optionMatches[0].index || 0;
      questionContent = processedBlock.substring(0, firstOptIndex).trim();

      // Clean prefix "Câu 1: ", "Bài 1. " from question content
      questionContent = questionContent.replace(/^(?:câu|bài|question)\s*\d+[\.\s:–-]+\s*/i, '').trim();

      optionMatches.forEach((opt, idx) => {
        let optLabel = opt[1].trim();
        let optText = opt[2].trim();

        // Check if marked with asterisk (*A. or A.*)
        if (optLabel.startsWith('*') || optText.endsWith('*')) {
          correctAnswers = [idx];
          optLabel = optLabel.replace('*', '');
          optText = optText.replace(/\*$/, '').trim();
        }

        // Remove trailing "Đáp án: X" if caught inside option
        optText = optText.replace(/(?:đáp\s*án|key)[:\s]+[A-D]$/i, '').trim();

        options.push(optText);
      });
    } else {
      // Fallback: check line by line
      const contentLines: string[] = [];
      for (const line of block.lines) {
        const optLineMatch = line.match(/^(\*?[A-D])[\.\)]\s+(.*)/i);
        if (optLineMatch) {
          const isMarked = optLineMatch[1].startsWith('*');
          if (isMarked) correctAnswers = [options.length];
          options.push(optLineMatch[2].replace(/\*$/, '').trim());
        } else if (!/^(?:lời\s*giải|hướng\s*dẫn|đáp\s*án)/i.test(line)) {
          contentLines.push(line);
        }
      }
      questionContent = contentLines.join('\n')
        .replace(/^(?:câu|bài|question)\s*\d+[\.\s:–-]+\s*/i, '')
        .trim();
    }

    if (options.length === 0) {
      // If no options, treat as short question / fill_in / essay
      questionContent = block.lines.join('\n')
        .replace(/^(?:câu|bài|question)\s*\d+[\.\s:–-]+\s*/i, '')
        .trim();
    }

    // Default correct answer to A (0) if still not detected
    if (correctAnswers.length === 0 && options.length > 0) {
      correctAnswers = [0];
    }

    if (questionContent.length > 0) {
      parsedQuestions.push({
        id: `q-doc-${Date.now()}-${blockIdx + 1}`,
        code: `TIN${defaultGrade}-${difficulty === 'recognition' ? 'NB' : difficulty === 'understanding' ? 'TH' : difficulty === 'application' ? 'VD' : 'VDC'}-${String(qNumber).padStart(2, '0')}`,
        subject: defaultSubject,
        grade: defaultGrade,
        difficulty,
        type: options.length >= 2 ? 'multiple_choice' : 'fill_in',
        content: questionContent,
        options: options.length >= 2 ? options : undefined,
        correctAnswers: options.length >= 2 ? correctAnswers : ['Đáp án chuẩn'],
        explanation: explanation || undefined,
        points,
        tags: [`Tin học ${defaultGrade}`, 'Đề thi Word'],
        authorName: 'Giáo viên bộ môn',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
  });

  if (parsedQuestions.length === 0) {
    warnings.push('Không nhận diện được câu hỏi nào từ nội dung. Vui lòng kiểm tra lại định dạng câu hỏi (Ví dụ: "Câu 1: ... A. ... B. ...").');
  }

  return {
    title: extractedTitle,
    questions: parsedQuestions,
    rawText: text,
    warnings
  };
}

/**
 * Parses a Word (.docx) file binary array buffer into text and questions
 */
export async function parseDocxFile(
  file: File,
  defaultSubject: Subject = 'Tin học',
  defaultGrade: GradeLevel = 9
): Promise<ParsedExamResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value;
    
    const parsed = parseExamText(rawText, defaultSubject, defaultGrade);
    
    // If the file name looks like a test title, use it if title was not extracted
    if (!parsed.title) {
      parsed.title = file.name.replace(/\.(docx|doc|txt)$/i, '').replace(/[-_]/g, ' ');
    }

    if (result.messages && result.messages.length > 0) {
      result.messages.forEach(m => {
        if (m.type === 'warning') parsed.warnings.push(m.message);
      });
    }

    return parsed;
  } catch (err: any) {
    console.error('Error parsing docx with mammoth:', err);
    throw new Error(err.message || 'Không thể đọc nội dung file Word. Vui lòng đảm bảo file định dạng .docx hợp lệ.');
  }
}
