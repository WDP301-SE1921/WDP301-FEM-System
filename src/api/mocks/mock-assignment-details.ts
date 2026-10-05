/**
 * De bai gia (AssignmentQuestion) cua bai tap gia (`./mock-assignments.ts`), dung cho cac route
 * trong `./academic.ts`. Moi mon co mot bo cau hoi mau dung chung cho moi bai cua mon do:
 * - bai trac nghiem: 5 cau, diem tung cau 1 / 1.5 / 2 / 2.5 / 3 (tong 10)
 * - bai tu luan: 2 cau, moi cau 5 diem
 * Bai lam gia cua lan nop tinh theo ngay duoc dung nguoc tu diem giao vien cong bo
 * (`findMockAssignmentScore`), nen diem tung cau cong lai dung bang diem cua bai: bai trac nghiem sai
 * dung cac cau co tong diem bang so diem bi tru, bai tu luan chia diem cho hai cau.
 */
import type { MockAnswer } from './mock-submissions';

type QuestionKind = 'MULTIPLE_CHOICE' | 'ESSAY';

/** Mot cau cua de (AssignmentQuestion). `rubric` chi giao vien thay nen khong co o day. */
export type MockQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** Cac lua chon cua cau trac nghiem; null voi cau tu luan. */
  choices: string[] | null;
  maxScore: number;
  /** Lua chon dung, hoac loi giai mau cua cau tu luan. */
  correctAnswer: string;
};

/** Diem tung cau (ScoreDto cua GradeReview). */
export type MockQuestionScore = { questionId: string; score: number; feedback: string };

type ChoiceTemplate = { prompt: string; choices: string[]; correctAnswer: string };
type EssayTemplate = {
  prompt: string;
  correctAnswer: string;
  /** Bai lam cua con trong lan nop gia. */
  sampleAnswer: string;
};
type QuestionBank = { choice: readonly ChoiceTemplate[]; essay: readonly EssayTemplate[] };

/** Cau sau kho hon nen nhieu diem hon. Moi diem cua lo trinh gia la tong cua mot so cau o day. */
const CHOICE_SCORES = [1, 1.5, 2, 2.5, 3] as const;
const ESSAY_MAX_SCORE = 5;
/** Diem tu luan lam tron toi 0.5. */
const SCORE_STEPS_PER_POINT = 2;

const MATH: QuestionBank = {
  choice: [
    {
      prompt: 'Kết quả của phép nhân 3x · (2x − 5) là:',
      choices: ['6x² − 5', '6x² − 15x', '5x² − 15x', '6x − 15'],
      correctAnswer: '6x² − 15x',
    },
    {
      prompt: 'Khai triển (x + 3)² ta được:',
      choices: ['x² + 6x + 9', 'x² + 9', 'x² + 3x + 9', 'x² + 6x + 6'],
      correctAnswer: 'x² + 6x + 9',
    },
    {
      prompt: 'Phân tích đa thức x² − 9 thành nhân tử:',
      choices: ['(x − 3)²', '(x − 9)(x + 1)', '(x − 3)(x + 3)', '(x + 3)²'],
      correctAnswer: '(x − 3)(x + 3)',
    },
    {
      prompt: 'Tứ giác có hai cặp cạnh đối song song là:',
      choices: ['Hình thang cân', 'Hình thang vuông', 'Tứ giác bất kỳ', 'Hình bình hành'],
      correctAnswer: 'Hình bình hành',
    },
    {
      prompt: 'Rút gọn phân thức (x² − 4) / (x − 2) với x ≠ 2:',
      choices: ['x − 2', 'x + 2', 'x² + 2', '2x'],
      correctAnswer: 'x + 2',
    },
  ],
  essay: [
    {
      prompt: 'Phân tích đa thức x² − 5x + 6 thành nhân tử. Trình bày đầy đủ các bước.',
      correctAnswer: 'x² − 5x + 6 = x² − 2x − 3x + 6 = x(x − 2) − 3(x − 2) = (x − 2)(x − 3).',
      sampleAnswer: 'x² − 5x + 6 = x² − 2x − 3x + 6 = x(x − 2) − 3(x − 2) = (x − 2)(x − 3)',
    },
    {
      prompt:
        'Cho hình bình hành ABCD. Gọi E, F lần lượt là trung điểm của AB và CD. Chứng minh AECF là hình bình hành.',
      correctAnswer:
        'ABCD là hình bình hành nên AB // CD và AB = CD. E, F là trung điểm của AB, CD nên AE // CF và AE = CF. Tứ giác AECF có một cặp cạnh đối song song và bằng nhau nên là hình bình hành.',
      sampleAnswer:
        'Vì ABCD là hình bình hành nên AB // CD, suy ra AE // CF. Mà AE = CF nên AECF là hình bình hành.',
    },
  ],
};

const PHYSICS: QuestionBank = {
  choice: [
    {
      prompt: 'Đơn vị của nhiệt lượng là:',
      choices: ['Niutơn (N)', 'Oát (W)', 'Jun (J)', 'Kilôgam (kg)'],
      correctAnswer: 'Jun (J)',
    },
    {
      prompt: 'Hình thức truyền nhiệt chủ yếu của chất rắn là:',
      choices: ['Dẫn nhiệt', 'Đối lưu', 'Bức xạ nhiệt', 'Bay hơi'],
      correctAnswer: 'Dẫn nhiệt',
    },
    {
      prompt: 'Theo định luật phản xạ ánh sáng, góc phản xạ:',
      choices: ['Lớn hơn góc tới', 'Bằng góc tới', 'Nhỏ hơn góc tới', 'Bằng hai lần góc tới'],
      correctAnswer: 'Bằng góc tới',
    },
    {
      prompt: 'Công thức tính nhiệt lượng vật thu vào để nóng lên là:',
      choices: ['Q = m · g · h', 'Q = U · I · t', 'Q = P · t', 'Q = m · c · Δt'],
      correctAnswer: 'Q = m · c · Δt',
    },
    {
      prompt: 'Ảnh của một vật tạo bởi gương cầu lồi là:',
      choices: [
        'Ảnh thật, lớn hơn vật',
        'Ảnh ảo, lớn hơn vật',
        'Ảnh ảo, nhỏ hơn vật',
        'Ảnh thật, bằng vật',
      ],
      correctAnswer: 'Ảnh ảo, nhỏ hơn vật',
    },
  ],
  essay: [
    {
      prompt:
        'Tính nhiệt lượng cần cung cấp để đun 2 kg nước từ 25°C lên 100°C. Biết nhiệt dung riêng của nước là 4200 J/kg.K.',
      correctAnswer: 'Q = m · c · Δt = 2 · 4200 · (100 − 25) = 630 000 J = 630 kJ.',
      sampleAnswer: 'Q = m · c · Δt = 2 · 4200 · 75 = 630 000 J',
    },
    {
      prompt: 'Giải thích vì sao về mùa đông mặc nhiều áo mỏng lại ấm hơn mặc một áo dày.',
      correctAnswer:
        'Giữa các lớp áo mỏng có các lớp không khí. Không khí dẫn nhiệt kém nên nhiệt từ cơ thể truyền ra ngoài chậm hơn, cơ thể được giữ ấm tốt hơn.',
      sampleAnswer: 'Vì giữa các lớp áo có không khí, mà không khí dẫn nhiệt kém nên giữ ấm hơn.',
    },
  ],
};

const ENGLISH: QuestionBank = {
  choice: [
    {
      prompt: 'She ___ to school every day.',
      choices: ['go', 'goes', 'going', 'is go'],
      correctAnswer: 'goes',
    },
    {
      prompt: 'My house ___ a big garden.',
      choices: ['have', 'is', 'has', 'are'],
      correctAnswer: 'has',
    },
    {
      prompt: 'Look! The children ___ football in the yard.',
      choices: ['are playing', 'plays', 'play', 'is playing'],
      correctAnswer: 'are playing',
    },
    {
      prompt: 'Which word describes a person who likes to share things with others?',
      choices: ['shy', 'lazy', 'noisy', 'generous'],
      correctAnswer: 'generous',
    },
    {
      prompt: 'There ___ two bedrooms in my house.',
      choices: ['is', 'are', 'be', 'am'],
      correctAnswer: 'are',
    },
  ],
  essay: [
    {
      prompt: 'Write 4–5 sentences about your best friend (name, appearance, personality).',
      correctAnswer:
        'My best friend is Lan. She is tall and has long black hair. She is kind and funny. We often do homework together. I like her very much.',
      sampleAnswer:
        'My best friend is Nam. He is tall and he has short hair. He is funny. We play football after school.',
    },
    {
      prompt: 'Write 4–5 sentences to describe your house (rooms, your favourite room).',
      correctAnswer:
        'My house is in a small town. There are five rooms in my house. My favourite room is my bedroom because it is quiet. There is a desk and a bookshelf in it. I love my house.',
      sampleAnswer:
        'My house is small. There are four rooms. My favourite room is the living room. There is a big TV.',
    },
  ],
};

/** Key la `subjectName` cua lop co lo trinh gia. */
const BANKS: Partial<Record<string, QuestionBank>> = {
  Toán: MATH,
  'Vật lý': PHYSICS,
  'Tiếng Anh': ENGLISH,
};

/** So cau cua de theo loai bai, dung cho `questionCounts` cua danh sach bai tap. */
export const QUESTION_COUNTS: Record<QuestionKind, number> = {
  MULTIPLE_CHOICE: MATH.choice.length,
  ESSAY: MATH.essay.length,
};

function toQuestionId(assignmentId: string, position: number): string {
  return `${assignmentId}-q${position}`;
}

/** Cau hoi cua bai tap `assignmentId` theo thu tu. Mon khong co bo cau hoi thi dung bo cua Toan. */
export function buildMockQuestions(
  assignmentId: string,
  subjectName: string,
  kind: QuestionKind,
): MockQuestion[] {
  const bank = BANKS[subjectName] ?? MATH;
  if (kind === 'ESSAY') {
    return bank.essay.map(({ prompt, correctAnswer }, index) => ({
      id: toQuestionId(assignmentId, index + 1),
      kind,
      prompt,
      choices: null,
      maxScore: ESSAY_MAX_SCORE,
      correctAnswer,
    }));
  }
  return bank.choice.map((template, index) => ({
    ...template,
    id: toQuestionId(assignmentId, index + 1),
    kind,
    maxScore: CHOICE_SCORES[index] ?? 0,
  }));
}

/** Vi tri cac cau lam sai sao cho tong diem cua chung bang `lostPoints`: mot cau, khong duoc thi hai cau. */
function pickWrongIndexes(questions: readonly MockQuestion[], lostPoints: number): number[] {
  const single = questions.findIndex(({ maxScore }) => maxScore === lostPoints);
  if (single >= 0) return [single];

  for (const [first, question] of questions.entries()) {
    const second = questions.findIndex(
      ({ maxScore }, index) => index > first && question.maxScore + maxScore === lostPoints,
    );
    if (second >= 0) return [first, second];
  }
  return [];
}

function sumMaxScores(questions: readonly MockQuestion[]): number {
  return questions.reduce((total, { maxScore }) => total + maxScore, 0);
}

function buildChoiceAnswers(questions: readonly MockQuestion[], totalScore: number): MockAnswer[] {
  const wrongIndexes = pickWrongIndexes(questions, sumMaxScores(questions) - totalScore);
  return questions.map(({ id, choices, correctAnswer }, index) => ({
    questionId: id,
    answer: wrongIndexes.includes(index)
      ? (choices?.find((choice) => choice !== correctAnswer) ?? correctAnswer)
      : correctAnswer,
  }));
}

function buildEssayAnswers(questions: readonly MockQuestion[], subjectName: string): MockAnswer[] {
  const samples = (BANKS[subjectName] ?? MATH).essay;
  return questions.map(({ id }, index) => ({
    questionId: id,
    answer: samples[index]?.sampleAnswer ?? '',
  }));
}

/** Bai lam cua con trong lan nop gia, khop voi diem `totalScore` giao vien cong bo. */
export function buildDerivedAnswers(
  questions: readonly MockQuestion[],
  subjectName: string,
  totalScore: number,
): MockAnswer[] {
  const isEssay = questions.some(({ kind }) => kind === 'ESSAY');
  return isEssay
    ? buildEssayAnswers(questions, subjectName)
    : buildChoiceAnswers(questions, totalScore);
}

/** Chia `totalScore` cho cac cau tu luan: cau dau lam tron len 0.5, cau cuoi nhan phan con lai. */
function splitEssayScore(questions: readonly MockQuestion[], totalScore: number): number[] {
  const rounded =
    Math.ceil((totalScore / questions.length) * SCORE_STEPS_PER_POINT) / SCORE_STEPS_PER_POINT;
  return questions.map((_, index) =>
    index < questions.length - 1 ? rounded : totalScore - rounded * (questions.length - 1),
  );
}

/** Diem tung cau cua lan nop gia: trac nghiem dung thi du diem, tu luan chia theo `totalScore`. */
export function buildDerivedScores(
  questions: readonly MockQuestion[],
  answers: readonly MockAnswer[],
  totalScore: number,
): MockQuestionScore[] {
  const essayScores = splitEssayScore(questions, totalScore);
  return questions.map(({ id, kind, correctAnswer, maxScore }, index) => {
    const answer = answers.find(({ questionId }) => questionId === id)?.answer;
    const choiceScore = answer === correctAnswer ? maxScore : 0;
    return {
      questionId: id,
      score: kind === 'ESSAY' ? (essayScores[index] ?? 0) : choiceScore,
      feedback: '',
    };
  });
}
