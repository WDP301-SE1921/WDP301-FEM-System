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
  formatFileSize,
  formatQuestionPositions,
  formatPoints,
  getAssignmentDetailStatus,
  getAssignmentFiles,
  getAssignmentFileScope,
  getAssignmentMaxScore,
  getAssignmentProgress,
  getChoiceState,
  getMeasuredTargets,
  getOptionalOutcomeIds,
  getPublishedGrade,
  getUnansweredPositions,
  getQuestionReview,
  isImageFile,
  getAttachmentLabels,
  getBlankCoveredPositions,
  getFileKind,
  getQuestionAttachments,
  getQuestionFileLabels,
  getSubmitConfirmMessage,
  getSubmitHint,
  formatAttachmentCount,
  formatAttachmentScope,
  isCoveredByAttachments,
  isSameQuestionScope,
  toAnswerDraft,
  toAssignmentDraft,
  toDraftAttachments,
  toSubmissionAnswers,
  toSubmitAssignmentPayload,
  toSubmittedFiles,
} from '@/features/parent-dashboard/utils';

const NOW = new Date(2026, 9, 16, 10, 0);

const CHOICE: AssignmentQuestion = {
  id: 'q1',
  kind: 'MULTIPLE_CHOICE',
  prompt: 'Khai triển (x + 3)² ta được:',
  choices: ['x² + 6x + 9', 'x² + 9'],
  maxScore: 4,
  outcomeId: null,
};
const ESSAY: AssignmentQuestion = {
  id: 'q2',
  kind: 'ESSAY',
  prompt: 'Phân tích x² − 5x + 6 thành nhân tử.',
  choices: null,
  maxScore: 6,
  outcomeId: null,
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

  describe('muc tieu bai (CLO)', () => {
    const TARGETS = [
      { id: 'clo-1', code: 'MATH-8-01', title: 'Đa thức', statement: '' },
      { id: 'clo-2', code: 'MATH-8-02', title: 'Hằng đẳng thức', statement: '' },
      { id: 'clo-3', code: 'MATH-8-03', title: 'Phân tích nhân tử', statement: '' },
    ];

    it('getMeasuredTargets chi giu CLO co cau hoi do, theo thu tu trong bo', () => {
      const detail = {
        learningTargets: TARGETS,
        questions: [
          { ...ESSAY, outcomeId: 'clo-3' },
          { ...CHOICE, outcomeId: 'clo-1' },
          { ...CHOICE, id: 'q3', outcomeId: 'clo-3' },
        ],
      };

      expect(getMeasuredTargets(detail).map(({ id }) => id)).toEqual(['clo-1', 'clo-3']);
    });

    it('bai cu khong co CLO thi rong', () => {
      expect(getMeasuredTargets({ learningTargets: [], questions: QUESTIONS })).toEqual([]);
    });

    it('getOptionalOutcomeIds chi lay CLO mo rong (required: false)', () => {
      const outcomes = TARGETS.map((target) => ({ ...target, required: target.id !== 'clo-2' }));

      expect([...getOptionalOutcomeIds(outcomes)]).toEqual(['clo-2']);
      expect(getOptionalOutcomeIds([]).size).toBe(0);
    });
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

  it('getAssignmentProgress: bon buoc nhan, lam, nop, co diem theo trang thai bai', () => {
    const states = (latest: SubmissionRecord | null, detail = OPEN) =>
      getAssignmentProgress(detail, latest, NOW).steps.map(({ state }) => state);
    expect(states(null)).toEqual(['done', 'current', 'todo', 'todo']);
    expect(states(submission())).toEqual(['done', 'done', 'done', 'current']);
    expect(states(submission({ grades: [GRADE] }))).toEqual(['done', 'done', 'done', 'done']);
    expect(states(null, { ...OPEN, status: 'CLOSED' })).toEqual(['done', 'todo', 'todo', 'todo']);
    expect(getAssignmentProgress(OPEN, submission(), NOW).caption).toMatch(
      /^Đã nộp bài\. Giáo viên đang chấm/,
    );
    expect(getAssignmentProgress({ ...OPEN, status: 'CLOSED' }, null, NOW).caption).toMatch(
      /hết hạn/,
    );
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

  describe('tep bai lam gui kem', () => {
    const MC_2: AssignmentQuestion = { ...CHOICE, id: 'q3' };
    const THREE = [CHOICE, ESSAY, MC_2];
    const WHOLE = { questionIds: [] };
    const ONLY_Q2 = { questionIds: ['q2'] };

    it('tep cua ca bai: moi cau de trong duoc, ke ca trac nghiem', () => {
      expect(isCoveredByAttachments('q1', [WHOLE])).toBe(true);
      expect(getUnansweredPositions(QUESTIONS, {}, [WHOLE])).toEqual([]);
      expect(getBlankCoveredPositions(QUESTIONS, { q2: 'Bài làm' }, [WHOLE])).toEqual([1]);
    });

    it('tep chi gan voi mot cau: cau khac de trong van bi chi ra', () => {
      expect(isCoveredByAttachments('q1', [ONLY_Q2])).toBe(false);
      expect(getUnansweredPositions(THREE, {}, [ONLY_Q2])).toEqual([1, 3]);
      expect(getBlankCoveredPositions(THREE, {}, [ONLY_Q2])).toEqual([2]);
      // Them mot tep cua ca bai thi het cau thieu
      expect(getUnansweredPositions(THREE, {}, [ONLY_Q2, WHOLE])).toEqual([]);
    });

    it('khong co tep thi cau nao cung phai tra loi', () => {
      expect(getUnansweredPositions(QUESTIONS, { q1: 'x² + 9' }, [])).toEqual([2]);
      expect(getBlankCoveredPositions(QUESTIONS, {}, [])).toEqual([]);
    });

    it('nhan tep dem rieng anh va PDF, dem so tep theo loai', () => {
      const files = [
        { kind: 'IMAGE' as const },
        { kind: 'PDF' as const },
        { kind: 'IMAGE' as const },
      ];
      expect(getAttachmentLabels(files)).toEqual(['Ảnh 1', 'PDF 1', 'Ảnh 2']);
      expect(formatAttachmentCount(files)).toBe('2 ảnh và 1 tệp PDF');
      expect(formatAttachmentCount([{ kind: 'PDF' }])).toBe('1 tệp PDF');
      expect(getFileKind('application/pdf')).toBe('PDF');
      expect(getFileKind('image/png')).toBe('IMAGE');
      // BE cu khong tra loai tep: luc do chi gui duoc anh
      expect(getFileKind(undefined)).toBe('IMAGE');
    });

    it('getQuestionFileLabels va formatAttachmentScope theo thu tu de', () => {
      const files = [
        { kind: 'IMAGE' as const, questionIds: [] },
        { kind: 'PDF' as const, questionIds: ['q3', 'q1'] },
        { kind: 'IMAGE' as const, questionIds: ['q1'] },
      ];
      expect(getQuestionFileLabels('q1', files)).toEqual(['PDF 1', 'Ảnh 2']);
      expect(getQuestionFileLabels('q2', files)).toEqual([]);
      expect(formatAttachmentScope(['q3', 'q1'], THREE)).toBe('Câu 1, Câu 3');
      expect(formatAttachmentScope([], THREE)).toBe('Cả bài');
    });
  });

  it('getSubmitHint nhac cau thieu, cau de trong cham theo tep va so lan nop con lai', () => {
    expect(getSubmitHint({ unanswered: [2], remainingAttempts: 2, blankPositions: [] })).toBe(
      'Còn 1 câu chưa trả lời: Câu 2.',
    );
    expect(getSubmitHint({ unanswered: [], remainingAttempts: 2, blankPositions: [1, 2] })).toBe(
      'Câu 1, Câu 2 để trống: giáo viên chấm theo bài làm gửi kèm. Sau lần này học sinh còn 1 lần nộp lại.',
    );
    expect(
      getSubmitHint({ unanswered: [], remainingAttempts: 2, blankPositions: [1, 2, 3, 4] }),
    ).toBe(
      '4 câu để trống: giáo viên chấm theo bài làm gửi kèm. Sau lần này học sinh còn 1 lần nộp lại.',
    );
    expect(getSubmitHint({ unanswered: [], remainingAttempts: 1, blankPositions: [] })).toBe(
      'Đã trả lời đủ. Đây là lần nộp cuối, học sinh nhớ kiểm tra lại bài trước khi nộp nhé.',
    );
  });

  it('getSubmitConfirmMessage ke tep gui kem va cau de trong', () => {
    const base = { questionCount: 2, attachments: [], blankPositions: [] };
    expect(getSubmitConfirmMessage({ ...base, remainingAttempts: 2 })).toBe(
      'Đã trả lời đủ 2 câu. Sau khi nộp, học sinh còn 1 lần nộp lại.',
    );
    expect(
      getSubmitConfirmMessage({
        ...base,
        remainingAttempts: 1,
        attachments: [{ kind: 'IMAGE' }, { kind: 'IMAGE' }, { kind: 'IMAGE' }],
      }),
    ).toBe(
      'Đã trả lời đủ 2 câu, kèm 3 ảnh bài làm. Đây là lần nộp cuối, nộp xong không sửa được nữa.',
    );
    expect(
      getSubmitConfirmMessage({
        ...base,
        remainingAttempts: 2,
        attachments: [{ kind: 'PDF' }],
        blankPositions: [1],
      }),
    ).toBe(
      'Nộp 2 câu, kèm 1 tệp PDF bài làm. Câu 1 để trống, giáo viên chấm theo bài làm gửi kèm. Sau khi nộp, học sinh còn 1 lần nộp lại.',
    );
  });

  it('toAssignmentDraft doc ban nhap moi, ban cu chi co cau tra loi, bo phan hong', () => {
    const attachment = {
      fileId: 'file-1',
      uri: null,
      kind: 'PDF',
      name: 'bai-lam.pdf',
      size: 800_000,
      questionIds: ['q2'],
    };
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
        attachments: [{ fileId: 1 }, { fileId: 'f', uri: null, questionIds: ['q1', 2] }],
      }),
    ).toEqual({
      answers: {},
      attachments: [
        { fileId: 'f', uri: null, kind: 'IMAGE', name: null, size: null, questionIds: ['q1'] },
      ],
    });
    expect(toAssignmentDraft(null)).toBeNull();
    expect(toAssignmentDraft([])).toBeNull();
  });

  it('ban nhap luu truoc khi co PDF (chi fileId, uri) thanh anh cua ca bai', () => {
    expect(
      toAssignmentDraft({ answers: {}, attachments: [{ fileId: 'f', uri: 'file:///a.jpg' }] }),
    ).toEqual({
      answers: {},
      attachments: [
        {
          fileId: 'f',
          uri: 'file:///a.jpg',
          kind: 'IMAGE',
          name: null,
          size: null,
          questionIds: [],
        },
      ],
    });
  });

  it('toDraftAttachments lay tep cua lan nop truoc kem loai tep va cac cau da gan', () => {
    const previous = submission({
      answers: [
        { questionId: 'q1', answer: '', fileIds: ['file-pdf'] },
        { questionId: 'q2', answer: '' },
      ],
      files: [
        { fileId: 'file-old' },
        {
          fileId: 'file-pdf',
          file: { name: 'bai-lam.pdf', mimeType: 'application/pdf', size: 800_000 },
        },
      ],
    });

    expect(toDraftAttachments(previous)).toEqual([
      { fileId: 'file-old', uri: null, kind: 'IMAGE', name: null, size: null, questionIds: [] },
      {
        fileId: 'file-pdf',
        uri: null,
        kind: 'PDF',
        name: 'bai-lam.pdf',
        size: 800_000,
        questionIds: ['q1'],
      },
    ]);
    expect(toSubmittedFiles(previous.files).map(({ label }) => label)).toEqual(['Ảnh 1', 'PDF 1']);
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

  it('toSubmitAssignmentPayload: fileIds theo thu tu chon, cau nao co tep gan rieng thi kem fileIds', () => {
    const file = (fileId: string, questionIds: string[]) => ({
      fileId,
      uri: null,
      kind: 'IMAGE' as const,
      name: null,
      size: null,
      questionIds,
    });

    expect(
      toSubmitAssignmentPayload('recipient-1', QUESTIONS, {
        answers: { q2: '  ' },
        attachments: [file('file-a', []), file('file-b', ['q1', 'q2']), file('file-c', ['q2'])],
      }),
    ).toEqual({
      recipientId: 'recipient-1',
      answers: [
        { questionId: 'q1', answer: '', fileIds: ['file-b'] },
        { questionId: 'q2', answer: '', fileIds: ['file-b', 'file-c'] },
      ],
      fileIds: ['file-a', 'file-b', 'file-c'],
    });
    // Khong co tep thi khong gui fileIds
    expect(
      toSubmitAssignmentPayload('recipient-1', QUESTIONS, { answers: {}, attachments: [] }),
    ).not.toHaveProperty('fileIds');
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
        criteria: [],
        fileLabels: [],
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
        criteria: [],
        fileLabels: [],
      });
      expect(getQuestionReview({ ...ESSAY, correctAnswer: '(x − 2)(x − 3).' }, graded)).toEqual({
        answer: '(x − 2)(x − 3)',
        score: 5.5,
        feedback: 'Thiếu bước tách hạng tử.',
        correctAnswer: '(x − 2)(x − 3).',
        // Cau tu luan do giao vien cham, khong so chuoi
        isCorrect: null,
        criteria: [],
        fileLabels: [],
      });
    });

    it('cham theo tieu chi: ten va diem toi da lay tu rubric luc cham, giu thu tu cua ban diem', () => {
      const graded = submission({
        grades: [
          {
            ...GRADE,
            scores: [
              { questionId: 'q1', score: 0, feedback: '' },
              {
                questionId: 'q2',
                score: 5,
                feedback: '',
                criteria: [
                  { criterionId: 'c2', score: 2, feedback: 'Thiếu kết luận.' },
                  { criterionId: 'c1', score: 3, feedback: '' },
                ],
              },
            ],
            rubricSnapshot: [
              {
                questionId: 'q2',
                maxScore: 6,
                criteria: [
                  { id: 'c1', title: 'Phương pháp', description: 'Tách hạng tử', maxScore: 4 },
                  { id: 'c2', title: 'Trình bày', description: '', maxScore: 2 },
                ],
              },
            ],
          },
        ],
      });

      expect(getQuestionReview(ESSAY, graded).criteria).toEqual([
        { id: 'c2', title: 'Trình bày', score: 2, maxScore: 2, feedback: 'Thiếu kết luận.' },
        { id: 'c1', title: 'Phương pháp', score: 3, maxScore: 4, feedback: null },
      ]);
    });

    it('ban diem khong co rubric chup lai: van hien diem tung tieu chi voi ten mac dinh', () => {
      const graded = submission({
        grades: [
          {
            ...GRADE,
            scores: [
              {
                questionId: 'q2',
                score: 3,
                feedback: '',
                criteria: [{ criterionId: 'c9', score: 3, feedback: '' }],
              },
            ],
            rubricSnapshot: null,
          },
        ],
      });

      expect(getQuestionReview(ESSAY, graded).criteria).toEqual([
        { id: 'c9', title: 'Tiêu chí 1', score: 3, maxScore: null, feedback: null },
      ]);
    });

    it('cau trac nghiem de trong vi lam trong tep: khong bao sai, kem nhan tep da gan', () => {
      const graded = submission({
        answers: [
          { questionId: 'q1', answer: '', fileIds: ['file-pdf'] },
          { questionId: 'q2', answer: '' },
        ],
        files: [
          { fileId: 'file-img' },
          { fileId: 'file-pdf', file: { name: 'a.pdf', mimeType: 'application/pdf', size: 1 } },
        ],
        grades: [GRADE],
      });

      expect(getQuestionReview({ ...CHOICE, correctAnswer: 'x² + 6x + 9' }, graded)).toMatchObject({
        answer: '',
        isCorrect: null,
        fileLabels: ['PDF 1'],
      });
      expect(getQuestionReview(ESSAY, graded).fileLabels).toEqual([]);
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

  describe('tep giao vien dinh kem bai', () => {
    const file = (
      fileId: string,
      questionPosition: number | null,
      mimeType = 'application/pdf',
      teacherOnly = false,
    ) => ({
      fileId,
      teacherOnly,
      questionPosition,
      file: { name: `${fileId}.pdf`, mimeType, size: 1000 },
    });

    it('getAssignmentFiles: bo tep chi giao vien xem, tep ca bai truoc roi theo cau', () => {
      const files = getAssignmentFiles({
        files: [
          file('q2', 1),
          file('key', null, 'application/pdf', true),
          file('all', null),
          file('q1', 0),
        ],
      });
      expect(files.map(({ fileId }) => fileId)).toEqual(['all', 'q1', 'q2']);
      // BE truoc PR #12 khong tra `files`
      expect(getAssignmentFiles({})).toEqual([]);
    });

    it('getAssignmentFileScope, isImageFile va formatFileSize', () => {
      expect(getAssignmentFileScope({ questionPosition: null })).toBe('Cả bài');
      expect(getAssignmentFileScope({ questionPosition: 1 })).toBe('Câu 2');
      expect(isImageFile(file('a', null, 'image/png'))).toBe(true);
      expect(isImageFile(file('b', null))).toBe(false);
      expect(formatFileSize(300)).toBe('1 KB');
      expect(formatFileSize(850 * 1024)).toBe('850 KB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 MB');
    });
  });

  it('formatPoints va formatAttempt', () => {
    expect(formatPoints(1)).toBe('1 điểm');
    expect(formatPoints(2.5)).toBe('2.5 điểm');
    expect(formatAttempt(1, 2)).toBe('Lần nộp 1/2');
  });
});

describe('khu tep rieng cua cau tu luan', () => {
  const forQ2 = { fileId: 'f-q2', questionIds: ['q2'] };
  const forQ3 = { fileId: 'f-q3', questionIds: ['q3'] };
  const wholeAssignment = { fileId: 'f-all', questionIds: [] };
  const files = [forQ2, wholeAssignment, forQ3];

  it('getQuestionAttachments: tep gan voi cau, cau tu luan dau tien hien them tep cua ca bai', () => {
    expect(getQuestionAttachments('q2', files, true)).toEqual([forQ2, wholeAssignment]);
    expect(getQuestionAttachments('q3', files, false)).toEqual([forQ3]);
    expect(getQuestionAttachments('q4', files, false)).toEqual([]);
  });

  it('isSameQuestionScope: so khop dung danh sach cau, ke ca danh sach rong', () => {
    expect(isSameQuestionScope(['q2'], ['q2'])).toBe(true);
    expect(isSameQuestionScope([], [])).toBe(true);
    expect(isSameQuestionScope(['q2'], ['q3'])).toBe(false);
    expect(isSameQuestionScope(['q2'], [])).toBe(false);
  });
});
