import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentAssignmentDetail } from '@/features/parent-dashboard/components/parent-assignment-detail';
import type {
  AssignmentDetail,
  AssignmentQuestion,
  SubmissionRecord,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';
import { addDays, startOfDay } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getAssignmentDetail: jest.fn(),
    getAssignmentSubmissions: jest.fn(),
    getTuitionEnrollments: jest.fn(),
    submitAssignment: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const STUDENT_ID = 'student-1';
const ASSIGNMENT_ID = 'assignment-1';
const RECIPIENT_ID = 'recipient-1';
const CORRECT_CHOICE = 'x² + 6x + 9';
const WRONG_CHOICE = 'x² + 9';
const MODEL_ANSWER = 'x² − 5x + 6 = (x − 2)(x − 3).';

/** Man hinh tinh han nop theo gio that, nen moc thoi gian tinh tu hom nay. */
function daysFromToday(days: number): string {
  const date = addDays(startOfDay(new Date()), days);
  date.setHours(23, 59);
  return date.toISOString();
}

const ENROLLMENT: TuitionEnrollment = {
  id: 'enrollment-1',
  registrationOrderId: 'order-1',
  packageMonths: 3,
  status: 'ACTIVE',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: '2026-12-01T00:00:00.000Z',
  activatedAt: '2026-09-01T02:00:00.000Z',
  placements: [],
  class: {
    id: 'class-1',
    name: 'Toán nâng cao 8A2',
    roomId: null,
    program: { name: 'Toán 8', subject: 'Toán', grade: 8 },
    weeklySchedules: [],
  },
  registrationOrder: { payment: null },
};

const CHOICE_QUESTION: AssignmentQuestion = {
  id: 'q1',
  kind: 'MULTIPLE_CHOICE',
  prompt: 'Khai triển (x + 3)² ta được:',
  choices: [WRONG_CHOICE, CORRECT_CHOICE],
  maxScore: 4,
};
const ESSAY_QUESTION: AssignmentQuestion = {
  id: 'q2',
  kind: 'ESSAY',
  prompt: 'Phân tích x² − 5x + 6 thành nhân tử.',
  choices: null,
  maxScore: 6,
};

const DETAIL: AssignmentDetail = {
  id: ASSIGNMENT_ID,
  classId: 'class-1',
  kind: 'HOMEWORK',
  testType: null,
  title: 'Bài tập về nhà bài 10',
  instructions: 'Làm trực tiếp trên EduGrade.',
  dueAt: daysFromToday(3),
  status: 'PUBLISHED',
  maxAttempts: 2,
  recipients: [{ id: RECIPIENT_ID, enrollmentId: ENROLLMENT.id }],
  questions: [CHOICE_QUESTION, ESSAY_QUESTION],
};

const SUBMITTED: SubmissionRecord = {
  id: 'submission-1',
  recipientId: RECIPIENT_ID,
  attemptNo: 1,
  answers: [
    { questionId: 'q1', answer: WRONG_CHOICE },
    { questionId: 'q2', answer: '(x − 2)(x − 3)' },
  ],
  submittedAt: daysFromToday(-1),
  grades: [],
};

async function renderDetail() {
  const onBack = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentAssignmentDetail studentId={STUDENT_ID} assignmentId={ASSIGNMENT_ID} onBack={onBack} />
    </QueryClientProvider>,
  );
  return { onBack, user: userEvent.setup() };
}

describe('features/parent-dashboard/ParentAssignmentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getAssignmentDetail.mockResolvedValue(DETAIL);
    api.getTuitionEnrollments.mockResolvedValue([ENROLLMENT]);
  });

  it('bai chua nop: tra loi du moi cau moi nop duoc, nop xong chuyen sang bai da nop', async () => {
    api.getAssignmentSubmissions.mockResolvedValueOnce([]).mockResolvedValue([SUBMITTED]);
    api.submitAssignment.mockResolvedValue({
      id: SUBMITTED.id,
      recipientId: RECIPIENT_ID,
      attemptNo: 1,
      submittedAt: SUBMITTED.submittedAt,
    });
    const { user } = await renderDetail();

    expect(
      await screen.findByText(DETAIL.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(api.getTuitionEnrollments).toHaveBeenCalledWith(STUDENT_ID);
    expect(screen.getByText('Toán nâng cao 8A2')).toBeOnTheScreen();
    expect(screen.getByText('Trắc nghiệm & tự luận')).toBeOnTheScreen();
    expect(screen.getByText('Còn 3 ngày')).toBeOnTheScreen();
    expect(screen.getByText('Còn 2 câu chưa trả lời.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Nộp bài' })).toBeDisabled();

    await user.press(screen.getByRole('radio', { name: WRONG_CHOICE }));
    expect(screen.getByRole('radio', { name: WRONG_CHOICE })).toBeChecked();
    expect(screen.getByText('Còn 1 câu chưa trả lời.')).toBeOnTheScreen();
    await user.type(screen.getByLabelText('Bài làm câu 2'), '(x − 2)(x − 3)');
    expect(
      screen.getByText(/^Đã trả lời đủ\. Sau lần này học sinh còn 1 lần nộp lại/),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));

    expect(await screen.findByText('Đã nộp bài')).toBeOnTheScreen();
    expect(api.submitAssignment).toHaveBeenCalledWith({
      recipientId: RECIPIENT_ID,
      answers: SUBMITTED.answers,
    });
    expect(screen.getByText('Đang chấm bài')).toBeOnTheScreen();
    expect(screen.getByText('Lần nộp 1/2')).toBeOnTheScreen();
    // Chua cong bo dap an: chi danh dau lua chon cua con, khong bao dung sai
    expect(screen.getByLabelText(`${WRONG_CHOICE}, học sinh đã chọn`)).toBeOnTheScreen();
    expect(screen.queryByText(/^Học sinh trả lời/)).not.toBeOnTheScreen();
  });

  it('bai da nop con luot: lam lai tu bai cu, bo nop lai thi quay ve bai da nop', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([SUBMITTED]);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Làm lại và nộp lại' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(screen.getByRole('radio', { name: WRONG_CHOICE })).toBeChecked();
    expect(screen.getByDisplayValue('(x − 2)(x − 3)')).toBeOnTheScreen();
    expect(screen.getByText(/^Đã trả lời đủ\. Đây là lần nộp cuối/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Giữ bài đã nộp' }));
    expect(screen.getByText('Bài làm của học sinh')).toBeOnTheScreen();
    expect(api.submitAssignment).not.toHaveBeenCalled();
  });

  it('bai da co diem: diem, nhan xet, dap an dung va dung sai tung cau, khong nop lai duoc', async () => {
    api.getAssignmentDetail.mockResolvedValue({
      ...DETAIL,
      status: 'CLOSED',
      questions: [
        { ...CHOICE_QUESTION, correctAnswer: CORRECT_CHOICE },
        { ...ESSAY_QUESTION, correctAnswer: MODEL_ANSWER },
      ],
    });
    api.getAssignmentSubmissions.mockResolvedValue([
      {
        ...SUBMITTED,
        grades: [
          {
            id: 'grade-1',
            scores: [
              { questionId: 'q1', score: 0, feedback: '' },
              { questionId: 'q2', score: 5.5, feedback: 'Thiếu bước tách hạng tử.' },
            ],
            totalScore: 5.5,
            feedback: 'Cần cẩn thận hơn ở phần trắc nghiệm.',
            publishedAt: daysFromToday(0),
          },
        ],
      },
    ]);
    await renderDetail();

    expect(
      await screen.findByText('Kết quả', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Đã có điểm')).toBeOnTheScreen();
    expect(screen.getByLabelText('Điểm 5.5 trên 10.0')).toBeOnTheScreen();
    expect(screen.getByText('“Cần cẩn thận hơn ở phần trắc nghiệm.”')).toBeOnTheScreen();

    expect(screen.getByLabelText(`${CORRECT_CHOICE}, đáp án đúng`)).toBeOnTheScreen();
    expect(screen.getByLabelText(`${WRONG_CHOICE}, học sinh đã chọn, chưa đúng`)).toBeOnTheScreen();
    expect(screen.getByText('Học sinh trả lời chưa đúng')).toBeOnTheScreen();
    expect(screen.getByText('0 / 4 điểm')).toBeOnTheScreen();
    expect(screen.getByText('5.5 / 6 điểm')).toBeOnTheScreen();
    expect(screen.getByText('Đáp án tham khảo')).toBeOnTheScreen();
    expect(screen.getByText(MODEL_ANSWER)).toBeOnTheScreen();
    expect(screen.getByText('Nhận xét: Thiếu bước tách hạng tử.')).toBeOnTheScreen();

    expect(screen.queryByRole('button', { name: 'Làm lại và nộp lại' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeOnTheScreen();
  });

  it('loi khi nop hien o form va giu nguyen bai dang lam', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    api.submitAssignment.mockRejectedValue(new AppError('Bài tập đã hết hạn nộp.', 409));
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'radio',
        { name: CORRECT_CHOICE },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    await user.type(screen.getByLabelText('Bài làm câu 2'), 'Bài làm');
    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bài tập đã hết hạn nộp.');
    expect(screen.getByDisplayValue('Bài làm')).toBeOnTheScreen();
  });

  it('bai khong giao cho con dang xem thi khong hien de', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    api.getTuitionEnrollments.mockResolvedValue([{ ...ENROLLMENT, id: 'enrollment-khac' }]);
    const { onBack, user } = await renderDetail();

    expect(
      await screen.findByText(
        'Bài này không giao cho học sinh',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(DETAIL.title)).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
