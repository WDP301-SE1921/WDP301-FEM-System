import type {
  AssignmentDetail,
  AssignmentQuestion,
  SubmissionRecord,
} from '@/features/parent-dashboard/types';
import {
  canSubmitAssignment,
  countQuestionKinds,
  countUnanswered,
  findLatestSubmission,
  findStudentRecipient,
  formatAttempt,
  formatQuestionPositions,
  formatPoints,
  getAssignmentDetailStatus,
  getAssignmentMaxScore,
  getChoiceState,
  getPublishedGrade,
  getUnansweredPositions,
  getQuestionReview,
  getSubmitConfirmMessage,
  getSubmitHint,
  hasEmptyEssay,
  toAnswerDraft,
  toAssignmentDraft,
  toDraftAttachments,
  toSubmissionAnswers,
} from '@/features/parent-dashboard/utils';

const NOW = new Date(2026, 9, 16, 10, 0);

const CHOICE: AssignmentQuestion = {
  id: 'q1',
  kind: 'MULTIPLE_CHOICE',
  prompt: 'Khai triển (x + 3)² ta được:',
  choices: ['x² + 6x + 9', 'x² + 9'],
  maxScore: 4,
};
const ESSAY: AssignmentQuestion = {
  id: 'q2',
  kind: 'ESSAY',
  prompt: 'Phân tích x² − 5x + 6 thành nhân tử.',
  choices: null,
  maxScore: 6,
};
const QUESTIONS = [CHOICE, ESSAY];

const OPEN: Pick<AssignmentDetail, 'status' | 'dueAt' | 'maxAttempts'> = {
  status: 'PUBLISHED',
  dueAt: new Date(2026, 9, 18, 23, 59).toISOString(),
  maxAttempts: 2,
};

function submission(overrides: Partial<SubmissionRecord> = {}): SubmissionRecord {
  return {
    id: 'submission-1',
    recipientId: 'recipient-1',
    attemptNo: 1,
    answers: [
      { questionId: 'q1', answer: 'x² + 9' },
      { questionId: 'q2', answer: '(x − 2)(x − 3)' },
    ],
    submittedAt: new Date(2026, 9, 15, 20, 0).toISOString(),
    files: [],
    grades: [],
    ...overrides,
  };
}

const GRADE = {
  id: 'grade-1',
  scores: [
    { questionId: 'q1', score: 0, feedback: '' },
    { questionId: 'q2', score: 5.5, feedback: 'Thiếu bước tách hạng tử.' },
  ],
  totalScore: 5.5,
  feedback: 'Cần cẩn thận hơn.',
  publishedAt: new Date(2026, 9, 17, 20, 0).toISOString(),
};

describe('features/parent-dashboard/utils: chi tiet bai tap', () => {
  it('countQuestionKinds va getAssignmentMaxScore tinh tu cau hoi cua de', () => {
    expect(countQuestionKinds(QUESTIONS)).toEqual({ MULTIPLE_CHOICE: 1, ESSAY: 1 });
    expect(countQuestionKinds([])).toEqual({ MULTIPLE_CHOICE: 0, ESSAY: 0 });
    expect(getAssignmentMaxScore(QUESTIONS)).toBe(10);
  });

  it('findStudentRecipient tim recipient theo ghi danh cua con dang xem', () => {
    const recipients = [
      { id: 'recipient-1', enrollmentId: 'enrollment-1' },
      { id: 'recipient-2', enrollmentId: 'enrollment-9' },
    ];

    expect(findStudentRecipient(recipients, ['enrollment-8', 'enrollment-9'])?.id).toBe(
      'recipient-2',
    );
    expect(findStudentRecipient(recipients, ['enrollment-5'])).toBeNull();
  });

  it('findLatestSubmission lay lan nop co attemptNo lon nhat cua dung con', () => {
    const submissions = [
      submission({ id: 'a', attemptNo: 1 }),
      submission({ id: 'b', attemptNo: 2 }),
      submission({ id: 'c', attemptNo: 3, recipientId: 'recipient-2' }),
    ];

    expect(findLatestSubmission(submissions, 'recipient-1')?.id).toBe('b');
    expect(findLatestSubmission(submissions, 'recipient-3')).toBeNull();
  });

  it('getPublishedGrade lay ban diem moi nhat, null khi chua cong bo', () => {
    expect(getPublishedGrade(null)).toBeNull();
    expect(getPublishedGrade(submission())).toBeNull();
    expect(getPublishedGrade(submission({ grades: [GRADE] }))).toBe(GRADE);
  });

  it('canSubmitAssignment: bai dang mo, chua qua han va con luot nop', () => {
    expect(canSubmitAssignment(OPEN, 0, NOW)).toBe(true);
    expect(canSubmitAssignment(OPEN, 1, NOW)).toBe(true);
    expect(canSubmitAssignment(OPEN, 2, NOW)).toBe(false);
    expect(canSubmitAssignment({ ...OPEN, status: 'CLOSED' }, 0, NOW)).toBe(false);
    expect(
      canSubmitAssignment({ ...OPEN, dueAt: new Date(2026, 9, 16, 9, 59).toISOString() }, 0, NOW),
    ).toBe(false);
  });

  it('getAssignmentDetailStatus: co diem, dang cham, het han, hoac con bao nhieu ngay', () => {
    expect(getAssignmentDetailStatus(OPEN, submission({ grades: [GRADE] }), NOW).label).toBe(
      'Đã có điểm',
    );
    expect(getAssignmentDetailStatus(OPEN, submission(), NOW).label).toBe('Đang chấm bài');
    expect(getAssignmentDetailStatus({ ...OPEN, status: 'CLOSED' }, null, NOW).label).toBe(
      'Đã hết hạn nộp',
    );
    expect(getAssignmentDetailStatus(OPEN, null, NOW)).toEqual({
      label: 'Còn 2 ngày',
      tone: 'danger',
      icon: 'timer-outline',
    });
  });

  it('getUnansweredPositions ke thu tu cau con thieu de chi cho con', () => {
    expect(getUnansweredPositions(QUESTIONS, {})).toEqual([1, 2]);
    expect(getUnansweredPositions(QUESTIONS, { q1: 'x² + 9', q2: '  ' })).toEqual([2]);
    expect(getUnansweredPositions(QUESTIONS, { q1: 'x² + 9', q2: 'Bài làm' })).toEqual([]);
    expect(formatQuestionPositions([2, 5])).toBe('Câu 2, Câu 5');
  });

  it('co anh bai lam thi cau tu luan de trong duoc, cau trac nghiem van phai chon', () => {
    expect(getUnansweredPositions(QUESTIONS, {}, true)).toEqual([1]);
    expect(getUnansweredPositions(QUESTIONS, { q1: 'x² + 9' }, true)).toEqual([]);
    expect(hasEmptyEssay(QUESTIONS, { q1: 'x² + 9' })).toBe(true);
    expect(hasEmptyEssay(QUESTIONS, { q1: 'x² + 9', q2: 'Bài làm' })).toBe(false);
  });

  it('getSubmitHint nhac cau thieu, cau tu luan cham theo anh va so lan nop con lai', () => {
    expect(getSubmitHint({ unanswered: [2], remainingAttempts: 2, hasEmptyEssay: false })).toBe(
      'Còn 1 câu chưa trả lời: Câu 2.',
    );
    expect(getSubmitHint({ unanswered: [], remainingAttempts: 2, hasEmptyEssay: true })).toBe(
      'Đã trả lời đủ. Câu tự luận để trống thì giáo viên chấm theo ảnh bài làm. Sau lần này học sinh còn 1 lần nộp lại.',
    );
    expect(getSubmitHint({ unanswered: [], remainingAttempts: 1, hasEmptyEssay: false })).toBe(
      'Đã trả lời đủ. Đây là lần nộp cuối, học sinh nhớ kiểm tra lại bài trước khi nộp nhé.',
    );
  });

  it('getSubmitConfirmMessage ke so anh gui kem', () => {
    expect(getSubmitConfirmMessage(2, 2, 0)).toBe(
      'Đã trả lời đủ 2 câu. Sau khi nộp, học sinh còn 1 lần nộp lại.',
    );
    expect(getSubmitConfirmMessage(2, 1, 3)).toBe(
      'Đã trả lời đủ 2 câu, kèm 3 ảnh bài làm. Đây là lần nộp cuối, nộp xong không sửa được nữa.',
    );
  });

  it('toAssignmentDraft doc ban nhap moi, ban cu chi co cau tra loi, bo phan hong', () => {
    const attachment = { fileId: 'file-1', uri: 'file:///a.jpg' };
    expect(toAssignmentDraft({ answers: { q1: 'x² + 9' }, attachments: [attachment] })).toEqual({
      answers: { q1: 'x² + 9' },
      attachments: [attachment],
    });
    expect(toAssignmentDraft({ q1: 'x² + 9', q2: 3 })).toEqual({
      answers: { q1: 'x² + 9' },
      attachments: [],
    });
    expect(
      toAssignmentDraft({
        answers: 'hong',
        attachments: [{ fileId: 1 }, { fileId: 'f', uri: null }],
      }),
    ).toEqual({ answers: {}, attachments: [{ fileId: 'f', uri: null }] });
    expect(toAssignmentDraft(null)).toBeNull();
    expect(toAssignmentDraft([])).toBeNull();
  });

  it('toDraftAttachments lay anh cua lan nop truoc, chua co anh xem truoc', () => {
    expect(toDraftAttachments(submission({ files: [{ fileId: 'file-old' }] }))).toEqual([
      { fileId: 'file-old', uri: null },
    ]);
    expect(toDraftAttachments(null)).toEqual([]);
  });

  it('countUnanswered bo qua cau chi co khoang trang', () => {
    expect(countUnanswered(QUESTIONS, {})).toBe(2);
    expect(countUnanswered(QUESTIONS, { q1: 'x² + 9', q2: '   ' })).toBe(1);
    expect(countUnanswered(QUESTIONS, { q1: 'x² + 9', q2: 'Bài làm' })).toBe(0);
  });

  it('toSubmissionAnswers gui dung mot cau tra loi cho moi cau, cat khoang trang bai tu luan', () => {
    expect(toSubmissionAnswers(QUESTIONS, { q2: '  Bài làm  ', q1: 'x² + 9' })).toEqual([
      { questionId: 'q1', answer: 'x² + 9' },
      { questionId: 'q2', answer: 'Bài làm' },
    ]);
    expect(toSubmissionAnswers(QUESTIONS, {})).toEqual([
      { questionId: 'q1', answer: '' },
      { questionId: 'q2', answer: '' },
    ]);
  });

  it('toAnswerDraft dua bai da nop ve cau tra loi dang lam de nop lai', () => {
    expect(toAnswerDraft(submission().answers)).toEqual({ q1: 'x² + 9', q2: '(x − 2)(x − 3)' });
  });

  describe('getQuestionReview', () => {
    it('chua cong bo diem va dap an: chi co cau tra loi cua con', () => {
      expect(getQuestionReview(CHOICE, submission())).toEqual({
        answer: 'x² + 9',
        score: null,
        feedback: null,
        correctAnswer: null,
        isCorrect: null,
      });
    });

    it('da cong bo: diem, nhan xet tung cau, dap an va dung sai cua cau trac nghiem', () => {
      const graded = submission({ grades: [GRADE] });

      expect(getQuestionReview({ ...CHOICE, correctAnswer: 'x² + 6x + 9' }, graded)).toEqual({
        answer: 'x² + 9',
        score: 0,
        feedback: null,
        correctAnswer: 'x² + 6x + 9',
        isCorrect: false,
      });
      expect(getQuestionReview({ ...ESSAY, correctAnswer: '(x − 2)(x − 3).' }, graded)).toEqual({
        answer: '(x − 2)(x − 3)',
        score: 5.5,
        feedback: 'Thiếu bước tách hạng tử.',
        correctAnswer: '(x − 2)(x − 3).',
        // Cau tu luan do giao vien cham, khong so chuoi
        isCorrect: null,
      });
    });

    it('con chua nop: khong co cau tra loi va khong xet dung sai', () => {
      expect(getQuestionReview({ ...CHOICE, correctAnswer: 'x² + 6x + 9' }, null)).toMatchObject({
        answer: '',
        isCorrect: null,
      });
    });
  });

  it('getChoiceState: chua co dap an thi chi danh dau lua chon cua con', () => {
    const pending = { answer: 'x² + 9', correctAnswer: null };
    expect(getChoiceState('x² + 9', pending)).toBe('SELECTED');
    expect(getChoiceState('x² + 6x + 9', pending)).toBe('IDLE');

    const published = { answer: 'x² + 9', correctAnswer: 'x² + 6x + 9' };
    expect(getChoiceState('x² + 6x + 9', published)).toBe('CORRECT');
    expect(getChoiceState('x² + 9', published)).toBe('WRONG');
    expect(getChoiceState('x²', published)).toBe('IDLE');
  });

  it('formatPoints va formatAttempt', () => {
    expect(formatPoints(1)).toBe('1 điểm');
    expect(formatPoints(2.5)).toBe('2.5 điểm');
    expect(formatAttempt(1, 2)).toBe('Lần nộp 1/2');
  });
});
