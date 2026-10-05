/**
 * Bai tap gia cua hoc sinh mau, dung cho route bai tap trong `./parent.ts`. Lay tu bai tap gan voi
 * bai hoc cua lo trinh gia (`./mock-lessons.ts`) nen trung voi bai tap tren lo trinh: cung id, ten,
 * han nop, lan nop va diem. Chi mon dang hoc moi co lo trinh nen moi co bai tap. Them vao:
 * - so cau theo `QuestionKind`: Tieng Anh toan trac nghiem; Toan va Vat ly xen ke trac nghiem (bai
 *   le) va tu luan (bai chan); bai kiem tra dinh ky la tu luan. So cau khop voi de bai gia
 *   (`./mock-assignment-details.ts`)
 * - so lan duoc nop (`Assignment.maxAttempts`): bai trac nghiem 2 lan, bai tu luan 1 lan
 * - diem thang 10, nhan xet theo diem va ngay cong bo diem (`GRADED_AFTER_DAYS` sau khi nop)
 * Theo lich gia, Minh Anh con 2 bai can lam (Toan han 23:59 hom nay + 2, Vat ly han 23:59 hom nay
 * + 3), bai Toan hoc hom nay - 2 da nop va dang cho cham, cac bai cu hon da co diem. Hoang Long con
 * bai Tieng Anh han 23:59 hom nay + 3. Bai con nop trong app (`./mock-submissions.ts`) chuyen sang
 * da nop, cho cham.
 */
import { addDays } from '@/utils/date';

import { QUESTION_COUNTS } from './mock-assignment-details';
import { buildMockEnrollments, type MockEnrollment } from './mock-enrollments';
import { buildMockLessons, GRADED_AFTER_DAYS, type MockEnrollmentLesson } from './mock-lessons';
import { ENGLISH_6A1 } from './mock-schedule';
import { findLatestStoredSubmission } from './mock-submissions';

type QuestionKind = 'MULTIPLE_CHOICE' | 'ESSAY';

type AssignmentStyle = {
  maxAttempts: number;
  getInstructions: (lessonTitle: string) => string;
};

const MAX_SCORE = 10;

const ASSIGNMENT_STYLES: Record<QuestionKind, AssignmentStyle> = {
  MULTIPLE_CHOICE: {
    maxAttempts: 2,
    getInstructions: (lessonTitle) =>
      `Gồm ${QUESTION_COUNTS.MULTIPLE_CHOICE} câu trắc nghiệm ôn tập bài "${lessonTitle}", làm trực tiếp trên EduGrade. Được nộp lại 1 lần.`,
  },
  ESSAY: {
    maxAttempts: 1,
    getInstructions: (lessonTitle) =>
      `Gồm ${QUESTION_COUNTS.ESSAY} câu tự luận vận dụng bài "${lessonTitle}". Nhập bài làm trực tiếp trên EduGrade.`,
  },
};

/** Nhan xet theo diem, sap tu cao xuong thap. */
const FEEDBACKS: readonly { minScore: number; text: string }[] = [
  { minScore: 9, text: 'Bài làm tốt, trình bày rõ ràng và chính xác. Tiếp tục phát huy nhé!' },
  { minScore: 8, text: 'Nắm chắc kiến thức của bài, cần cẩn thận hơn ở các bước tính toán.' },
  { minScore: 7, text: 'Hiểu bài nhưng còn nhầm ở phần vận dụng, nên xem lại ví dụ trên lớp.' },
  { minScore: 0, text: 'Chưa nắm vững nội dung bài, cần ôn lại phần lý thuyết trước khi làm bài.' },
];

/** Response bai tap. */
export type MockAssignment = {
  id: string;
  title: string;
  instructions: string;
  subjectName: string;
  className: string;
  teacherName: string | null;
  dueAt: string;
  maxAttempts: number;
  questionCounts: Record<QuestionKind, number>;
  submission: { attemptNo: number; submittedAt: string } | null;
  grade: {
    totalScore: number;
    maxScore: number;
    feedback: string | null;
    publishedAt: string;
  } | null;
};

function getQuestionKind(
  className: string,
  { kind, sequence }: MockEnrollmentLesson,
): QuestionKind {
  if (kind === 'ASSESSMENT') return 'ESSAY';
  if (className === ENGLISH_6A1.className) return 'MULTIPLE_CHOICE';
  return sequence % 2 === 1 ? 'MULTIPLE_CHOICE' : 'ESSAY';
}

function getFeedback(score: number): string | null {
  return FEEDBACKS.find(({ minScore }) => score >= minScore)?.text ?? null;
}

function toAssignment(
  studentId: string,
  { className, subjectName, teacherName }: MockEnrollment,
  lesson: MockEnrollmentLesson,
): MockAssignment | null {
  const { assignment } = lesson;
  if (!assignment) return null;

  const kind = getQuestionKind(className, lesson);
  const style = ASSIGNMENT_STYLES[kind];
  const { submittedAt, score } = assignment;
  // Bai nop trong app co the la lan nop lai; bai nop tinh theo ngay luon la lan dau
  const attemptNo = findLatestStoredSubmission(studentId, assignment.id)?.attemptNo ?? 1;
  return {
    id: assignment.id,
    title: assignment.title,
    instructions: style.getInstructions(lesson.title),
    subjectName,
    className,
    teacherName,
    dueAt: assignment.dueAt,
    maxAttempts: style.maxAttempts,
    questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 0, [kind]: QUESTION_COUNTS[kind] },
    submission: submittedAt ? { attemptNo, submittedAt } : null,
    grade:
      submittedAt && score !== null
        ? {
            totalScore: score,
            maxScore: MAX_SCORE,
            feedback: getFeedback(score),
            publishedAt: addDays(new Date(submittedAt), GRADED_AFTER_DAYS).toISOString(),
          }
        : null,
  };
}

/** Bai tap cua hoc sinh o cac mon dang hoc, theo mon roi theo thu tu bai (BE chua chot cach sap xep). */
export function buildMockAssignments(studentId: string, now: Date = new Date()): MockAssignment[] {
  return buildMockEnrollments(studentId, now).flatMap((enrollment) =>
    buildMockLessons(studentId, enrollment.className, now).flatMap((lesson) => {
      const assignment = toAssignment(studentId, enrollment, lesson);
      return assignment ? [assignment] : [];
    }),
  );
}
