/**
 * Mock module `academic` cua BE (nhanh `dev`: academic.controller.ts, assessment.service.ts,
 * academic.dto.ts), phan phu huynh xem de, nop bai va xem ket qua. BE da co cac route nay nhung
 * mobile chua duoc noi that: chi xoa route khi nguoi dung yeu cau wire (Luat so 2 trong CLAUDE.md cua
 * workspace).
 * - GET /academic/assignments/:assignmentId
 *     De bai: `id, classId, title, instructions, dueAt, status, maxAttempts`, `recipients`
 *     (`{ id, enrollmentId }` cua cac con thuoc phu huynh) va `questions` (`id, kind, prompt, choices,
 *     maxScore`). `correctAnswer` chi co sau khi giao vien cong bo dap an (`answersPublishedAt`).
 *     Bai khong giao cho con nao cua phu huynh thi 403 FORBIDDEN. BE tra 404 RESOURCE_NOT_FOUND khi id
 *     khong ton tai; mock khong phan biet duoc nen cung tra 403.
 * - GET /academic/assignments/:assignmentId/submissions?page&limit
 *     Cac lan nop cua con phu huynh, moi nop truoc: `id, recipientId, attemptNo, answers, submittedAt,
 *     files`, `grades` (chi GradeReview `PUBLISHED`: `id, revision, status, scores, totalScore,
 *     feedback, publishedAt`; `scores` la `{ questionId, score, feedback }[]`). Mock bo qua phan trang.
 * - POST /academic/submissions
 *     Body SubmissionDto: `recipientId`, `answers` (`{ questionId, answer }[]`, 1-100 phan tu),
 *     `fileIds?` (toi da 5). Tra 201 voi `id, recipientId, attemptNo, submittedAt`. Loi: 400 khi sai
 *     body; 404 RESOURCE_NOT_FOUND khi khong co recipient (BE tra 403 neu recipient cua phu huynh
 *     khac, mock gop vao 404); 409 SUBMISSION_CLOSED khi bai da dong, qua han hoac ghi danh het hieu
 *     luc; 409 ATTEMPTS_EXHAUSTED; 409 INVALID_ANSWERS khi khong dung mot cau tra loi cho moi cau hoi;
 *     409 INVALID_CHOICE khi cau trac nghiem tra loi ngoai cac lua chon; 409 INVALID_FILES (mock chua
 *     co route tai file nen moi `fileIds` deu bi tu choi).
 * Chi role PARENT duoc goi (BE con cho TEACHER, mobile chua co role nay).
 *
 * De bai gia: `./mock-assignment-details.ts`. Bai da co diem (`./mock-assignments.ts`) thi da dong
 * (`CLOSED`) va da cong bo dap an; bai con lai dang mo (`PUBLISHED`). Bai nop trong app luu o
 * `./mock-submissions.ts`, khong co diem vi khong ai cham. Tai khoan dung thu (mat khau `Matkhau123`):
 * - phuhuynh@example.com : Minh Anh co bai Toan tu luan va bai Vat ly trac nghiem can lam; bai Toan
 *                          gan nhat da nop, con han va con 1 lan nop lai; cac bai cu hon da co diem
 *                          va dap an
 */
import { Endpoints } from '@/api/endpoints';

import { authorizeParent, FORBIDDEN, UNAUTHORIZED } from './auth';
import { authenticate } from './mock-accounts';
import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import {
  buildDerivedAnswers,
  buildDerivedScores,
  buildMockQuestions,
  type MockQuestion,
  type MockQuestionScore,
} from './mock-assignment-details';
import { buildMockAssignments, type MockAssignment } from './mock-assignments';
import { buildMockEnrollments, type MockEnrollment } from './mock-enrollments';
import { findMockAssignmentScore } from './mock-lessons';
import { buildMockTuitionEnrollments } from './mock-registrations';
import { findStudentsByParent, type MockStudent } from './mock-students';
import {
  findStoredSubmissions,
  storeSubmission,
  type MockAnswer,
  type MockStoredSubmission,
} from './mock-submissions';

const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const ASSIGNMENT_ID_PARAM = ':assignmentId';
/** Gioi han cua SubmissionDto va AnswerDto. */
const MAX_ANSWERS = 100;
const MAX_ANSWER_LENGTH = 20000;
const MAX_FILES = 5;
/** Thang diem cua bai tap gia. */
const MAX_SCORE = 10;

const RECIPIENT_NOT_FOUND = mockError(HTTP_NOT_FOUND, 'RESOURCE_NOT_FOUND', 'Resource not found');
const SUBMISSION_CLOSED = mockError(
  HTTP_CONFLICT,
  'SUBMISSION_CLOSED',
  'Submission window or enrollment is closed',
);
const ATTEMPTS_EXHAUSTED = mockError(
  HTTP_CONFLICT,
  'ATTEMPTS_EXHAUSTED',
  'Maximum submission attempts reached',
);
const INVALID_ANSWERS = mockError(
  HTTP_CONFLICT,
  'INVALID_ANSWERS',
  'Provide exactly one answer for every question',
);
const INVALID_CHOICE = mockError(
  HTTP_CONFLICT,
  'INVALID_CHOICE',
  'Answer must match an available choice',
);
const INVALID_FILES = mockError(
  HTTP_CONFLICT,
  'INVALID_FILES',
  'Files must be uploaded by the submitting parent',
);

/** Mot bai tap giao cho mot con cua phu huynh (AssignmentRecipient). */
type ParentAssignment = {
  student: MockStudent;
  enrollment: MockEnrollment;
  assignment: MockAssignment;
  recipientId: string;
  questions: MockQuestion[];
};

type SubmissionInput = { recipientId: string; answers: MockAnswer[]; fileIds: string[] };

/** Response mot lan nop. */
export type MockSubmission = MockStoredSubmission & {
  recipientId: string;
  files: { fileId: string }[];
  grades: {
    id: string;
    revision: number;
    status: 'PUBLISHED';
    scores: MockQuestionScore[];
    totalScore: number;
    feedback: string;
    publishedAt: string;
  }[];
};

function toParentAssignment(
  student: MockStudent,
  enrollment: MockEnrollment,
  assignment: MockAssignment,
): ParentAssignment {
  const kind = assignment.questionCounts.MULTIPLE_CHOICE > 0 ? 'MULTIPLE_CHOICE' : 'ESSAY';
  return {
    student,
    enrollment,
    assignment,
    recipientId: `mock-recipient-${enrollment.id}-${assignment.id}`,
    questions: buildMockQuestions(assignment.id, assignment.subjectName, kind),
  };
}

/** Moi bai tap cua moi con thuoc phu huynh, giong dieu kien `recipients.some` cua BE. */
function findParentAssignments(parentUserId: string, now: Date): ParentAssignment[] {
  return findStudentsByParent(parentUserId).flatMap((student) => {
    const enrollments = buildMockEnrollments(student.id, now);
    return buildMockAssignments(student.id, now).flatMap((assignment) => {
      const enrollment = enrollments.find(({ className }) => className === assignment.className);
      return enrollment ? [toParentAssignment(student, enrollment, assignment)] : [];
    });
  });
}

/** Lan nop tinh theo ngay cua lo trinh gia (luon la lan dau), kem diem neu giao vien da cong bo. */
function toDerivedSubmission({
  assignment,
  recipientId,
  questions,
}: ParentAssignment): MockSubmission | null {
  const { submission, grade, subjectName } = assignment;
  if (!submission) return null;

  const finalScore = findMockAssignmentScore(assignment.id) ?? MAX_SCORE;
  const answers = buildDerivedAnswers(questions, subjectName, finalScore);
  return {
    id: `mock-submission-${recipientId}-1`,
    recipientId,
    attemptNo: 1,
    answers,
    submittedAt: submission.submittedAt,
    files: [],
    grades: grade
      ? [
          {
            id: `mock-grade-${recipientId}-1`,
            revision: 1,
            status: 'PUBLISHED',
            scores: buildDerivedScores(questions, answers, grade.totalScore),
            totalScore: grade.totalScore,
            feedback: grade.feedback ?? '',
            publishedAt: grade.publishedAt,
          },
        ]
      : [],
  };
}

/** Cac lan nop cua mot con: bai nop trong app neu co, khong thi lan nop tinh theo ngay. */
function buildSubmissions(entry: ParentAssignment): MockSubmission[] {
  const stored = findStoredSubmissions(entry.student.id, entry.assignment.id);
  if (stored.length > 0) {
    return stored.map((submission) => ({
      ...submission,
      recipientId: entry.recipientId,
      files: [],
      grades: [],
    }));
  }
  const derived = toDerivedSubmission(entry);
  return derived ? [derived] : [];
}

function getAssignment(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const now = new Date();
  const entries = findParentAssignments(check.parent.id, now).filter(
    ({ assignment }) => assignment.id === params.assignmentId,
  );
  const [first] = entries;
  if (!first) return FORBIDDEN;

  const { assignment, student, enrollment, questions } = first;
  // Giao vien dong bai va cong bo dap an cung luc voi cong bo diem
  const isClosed = assignment.grade !== null;
  const classId = buildMockTuitionEnrollments(student, now).find(
    ({ id }) => id === enrollment.id,
  )?.classId;

  return mockOk({
    id: assignment.id,
    classId: classId ?? `mock-class-${enrollment.id}`,
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt,
    status: isClosed ? 'CLOSED' : 'PUBLISHED',
    maxAttempts: assignment.maxAttempts,
    recipients: entries.map(({ recipientId, enrollment: { id } }) => ({
      id: recipientId,
      enrollmentId: id,
    })),
    questions: questions.map(({ correctAnswer, ...question }) =>
      isClosed ? { ...question, correctAnswer } : question,
    ),
  });
}

function listSubmissions(_body: unknown, { accessToken, params, query }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  if (!readBody(query, [], ['page', 'limit'])) return mockValidationError();

  const submissions = findParentAssignments(check.parent.id, new Date())
    .filter(({ assignment }) => assignment.id === params.assignmentId)
    .flatMap(buildSubmissions)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return mockOk(submissions);
}

function readAnswer(value: unknown): MockAnswer | null {
  const input = readBody(value, ['questionId', 'answer']);
  const questionId = input?.questionId;
  const answer = input?.answer;
  if (typeof questionId !== 'string' || questionId.length === 0) return null;
  if (typeof answer !== 'string' || answer.length > MAX_ANSWER_LENGTH) return null;
  return { questionId, answer };
}

function readFileIds(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_FILES) return null;

  const fileIds = value.filter((item): item is string => typeof item === 'string');
  const isValid = fileIds.length === value.length && new Set(fileIds).size === fileIds.length;
  return isValid ? fileIds : null;
}

/** Giong SubmissionDto qua ValidationPipe. Tra null khi body khong hop le. */
function readSubmission(body: unknown): SubmissionInput | null {
  const input = readBody(body, ['recipientId', 'answers'], ['fileIds']);
  const recipientId = input?.recipientId;
  const rawAnswers = input?.answers;
  const fileIds = readFileIds(input?.fileIds);
  if (typeof recipientId !== 'string' || recipientId.length === 0) return null;
  if (!Array.isArray(rawAnswers) || rawAnswers.length === 0 || rawAnswers.length > MAX_ANSWERS) {
    return null;
  }

  const answers = rawAnswers.flatMap((item) => readAnswer(item) ?? []);
  return answers.length === rawAnswers.length && fileIds ? { recipientId, answers, fileIds } : null;
}

function hasOneAnswerPerQuestion(
  questions: readonly MockQuestion[],
  answers: readonly MockAnswer[],
): boolean {
  const answeredIds = new Set(answers.map(({ questionId }) => questionId));
  return (
    answeredIds.size === answers.length &&
    answeredIds.size === questions.length &&
    questions.every(({ id }) => answeredIds.has(id))
  );
}

function hasValidChoices(
  questions: readonly MockQuestion[],
  answers: readonly MockAnswer[],
): boolean {
  return questions.every(({ id, choices }) => {
    const answer = answers.find(({ questionId }) => questionId === id)?.answer ?? '';
    return choices === null || choices.includes(answer);
  });
}

/** Loi nghiep vu cua lan nop theo thu tu BE kiem tra, null khi nop duoc. */
function findSubmissionError(
  { assignment, enrollment, questions }: ParentAssignment,
  { answers, fileIds }: SubmissionInput,
  now: Date,
): MockReply | null {
  const isOpen =
    assignment.grade === null &&
    new Date(assignment.dueAt) >= now &&
    enrollment.status === 'ACTIVE';
  if (!isOpen) return SUBMISSION_CLOSED;
  if ((assignment.submission?.attemptNo ?? 0) >= assignment.maxAttempts) return ATTEMPTS_EXHAUSTED;
  if (!hasOneAnswerPerQuestion(questions, answers)) return INVALID_ANSWERS;
  if (!hasValidChoices(questions, answers)) return INVALID_CHOICE;
  return fileIds.length > 0 ? INVALID_FILES : null;
}

function submit(body: unknown, { accessToken }: MockRequest): MockReply {
  // Guard chay truoc ValidationPipe, con kiem tra role nam trong service
  const current = authenticate(accessToken);
  if (!current) return UNAUTHORIZED;
  const input = readSubmission(body);
  if (!input) return mockValidationError();
  if (current.user.role !== 'PARENT') return FORBIDDEN;

  const now = new Date();
  const entry = findParentAssignments(current.user.id, now).find(
    ({ recipientId }) => recipientId === input.recipientId,
  );
  if (!entry) return RECIPIENT_NOT_FOUND;

  const error = findSubmissionError(entry, input, now);
  if (error) return error;

  const { student, assignment, recipientId } = entry;
  // Lan nop tinh theo ngay chua nam trong bo nho: luu lai truoc de lan nop moi khong lam mat no
  if (findStoredSubmissions(student.id, assignment.id).length === 0) {
    const derived = toDerivedSubmission(entry);
    if (derived) {
      const { id, attemptNo, answers, submittedAt } = derived;
      storeSubmission(student.id, assignment.id, { id, attemptNo, answers, submittedAt });
    }
  }

  const attemptNo = (assignment.submission?.attemptNo ?? 0) + 1;
  const submission: MockStoredSubmission = {
    id: `mock-submission-${recipientId}-${attemptNo}`,
    attemptNo,
    answers: input.answers,
    submittedAt: now.toISOString(),
  };
  storeSubmission(student.id, assignment.id, submission);

  const { id, submittedAt } = submission;
  return mockOk({ id, recipientId, attemptNo, submittedAt }, HTTP_CREATED);
}

export const academicRoutes: readonly MockRoute[] = [
  { method: 'get', url: Endpoints.academic.assignment(ASSIGNMENT_ID_PARAM), handle: getAssignment },
  {
    method: 'get',
    url: Endpoints.academic.assignmentSubmissions(ASSIGNMENT_ID_PARAM),
    handle: listSubmissions,
  },
  { method: 'post', url: Endpoints.academic.submissions, handle: submit },
];
