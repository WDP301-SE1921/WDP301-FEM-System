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
import { pickImage } from '@/lib/image-picker';
import { storage } from '@/lib/storage';
import { AppError } from '@/types/api';
import { addDays, startOfDay } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getAssignmentDetail: jest.fn(),
    getAssignmentSubmissions: jest.fn(),
    getTuitionEnrollments: jest.fn(),
    submitAssignment: jest.fn(),
    uploadSubmissionImage: jest.fn(),
    getFilePreview: jest.fn(),
    getOutcomeSet: jest.fn(),
  },
}));
// Camera va thu vien anh la module native: test chon san ket qua tra ve
jest.mock('@/lib/image-picker', () => ({ pickImage: jest.fn() }));

/** Bo nho may gia: ban nhap bai lam doc, ghi qua `storage`. */
const mockSavedDrafts = new Map<string, unknown>();
jest.mock('@/lib/storage', () => ({
  storage: {
    getJson: jest.fn(async (key: string) => mockSavedDrafts.get(key) ?? null),
    setJson: jest.fn(async (key: string, value: unknown) => {
      mockSavedDrafts.set(key, value);
    }),
    remove: jest.fn(async (key: string) => {
      mockSavedDrafts.delete(key);
    }),
  },
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

const api = jest.mocked(parentDashboardApi);
const savedStorage = jest.mocked(storage);
const mockedPickImage = jest.mocked(pickImage);

const PICKED_PHOTO = {
  uri: 'file:///cache/bai-lam.jpg',
  name: 'bai-lam-1.jpg',
  mimeType: 'image/jpeg' as const,
  size: 2_000_000,
};
const UPLOADED_PHOTO = {
  id: 'file-1',
  name: 'bai-lam-1.jpg',
  mimeType: 'image/jpeg',
  size: 2_000_000,
};

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const STUDENT_ID = 'student-1';
const ASSIGNMENT_ID = 'assignment-1';
const RECIPIENT_ID = 'recipient-1';
const CORRECT_CHOICE = 'x² + 6x + 9';
const WRONG_CHOICE = 'x² + 9';
const MODEL_ANSWER = 'x² − 5x + 6 = (x − 2)(x − 3).';
/** Key ban nhap cua con dang xem cho bai nay, xem `StorageKeyFactory.assignmentDraft`. */
const DRAFT_KEY = 'fem.assignment_draft.student-1.assignment-1';

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
    programId: 'program-math',
    roomId: null,
    program: { name: 'Toán 8', subject: 'Toán', grade: 8 },
    weeklySchedules: [],
    teacher: null,
  },
  registrationOrder: { payment: null },
};

const CHOICE_QUESTION: AssignmentQuestion = {
  id: 'q1',
  kind: 'MULTIPLE_CHOICE',
  prompt: 'Khai triển (x + 3)² ta được:',
  choices: [WRONG_CHOICE, CORRECT_CHOICE],
  maxScore: 4,
  outcomeId: null,
};
const ESSAY_QUESTION: AssignmentQuestion = {
  id: 'q2',
  kind: 'ESSAY',
  prompt: 'Phân tích x² − 5x + 6 thành nhân tử.',
  choices: null,
  maxScore: 6,
  outcomeId: null,
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
  outcomeSetId: null,
  learningTargets: [],
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
  files: [],
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
    mockSavedDrafts.clear();
    api.getAssignmentDetail.mockResolvedValue(DETAIL);
    api.getTuitionEnrollments.mockResolvedValue([ENROLLMENT]);
    api.getFilePreview.mockImplementation(async (fileId) => ({
      url: `https://storage.example.com/edugrade/submissions/parent-1/${fileId}.jpg?X-Amz-Signature=s`,
      expiresIn: 300,
    }));
  });

  it('bai chua nop: chi ra cau con thieu, hoi lai truoc khi nop, nop xong chuyen sang bai da nop', async () => {
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
    expect(screen.getByText('Còn 2 câu chưa trả lời: Câu 1, Câu 2.')).toBeOnTheScreen();

    // Bam nop khi con thieu cau: danh dau cau thieu, khong hoi lai va khong goi BE
    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(screen.getAllByText('Chưa trả lời')).toHaveLength(2);
    expect(screen.queryByText('Nộp bài?')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: WRONG_CHOICE }));
    expect(screen.getByRole('radio', { name: WRONG_CHOICE })).toBeChecked();
    expect(screen.getByText('Còn 1 câu chưa trả lời: Câu 2.')).toBeOnTheScreen();
    expect(screen.getAllByText('Chưa trả lời')).toHaveLength(1);
    // Bai lam luu tren may sau moi lan sua
    expect(savedStorage.setJson).toHaveBeenLastCalledWith(DRAFT_KEY, {
      answers: { q1: WRONG_CHOICE },
      attachments: [],
    });
    await user.type(screen.getByLabelText('Bài làm câu 2'), '(x − 2)(x − 3)');
    expect(
      screen.getByText(/^Đã trả lời đủ\. Sau lần này học sinh còn 1 lần nộp lại/),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(screen.getByText('Nộp bài?')).toBeOnTheScreen();
    expect(
      screen.getByText('Đã trả lời đủ 2 câu. Sau khi nộp, học sinh còn 1 lần nộp lại.'),
    ).toBeOnTheScreen();
    expect(api.submitAssignment).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'Xác nhận nộp' }));

    expect(await screen.findByText('Đã nộp bài')).toBeOnTheScreen();
    // Nop xong thi xoa ban nhap tren may
    expect(savedStorage.remove).toHaveBeenCalledWith(DRAFT_KEY);
    expect(mockSavedDrafts.has(DRAFT_KEY)).toBe(false);
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
    expect(await screen.findByText('Bài làm của học sinh')).toBeOnTheScreen();
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
    await user.press(screen.getByRole('button', { name: 'Xác nhận nộp' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bài tập đã hết hạn nộp.');
    expect(screen.getByDisplayValue('Bài làm')).toBeOnTheScreen();
    // Nop loi thi van giu ban nhap tren may
    expect(mockSavedDrafts.get(DRAFT_KEY)).toEqual({
      answers: { q1: CORRECT_CHOICE, q2: 'Bài làm' },
      attachments: [],
    });
  });

  it('mo lai bai dang lam do thi khoi phuc cau tra loi da luu tren may', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockSavedDrafts.set(DRAFT_KEY, { q1: CORRECT_CHOICE, q2: 'Bài đang làm dở' });
    await renderDetail();

    expect(
      await screen.findByText(
        'Đã mở lại bài làm đang dở. Bài làm được tự lưu trên máy này cho tới khi nộp.',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: CORRECT_CHOICE })).toBeChecked();
    expect(screen.getByDisplayValue('Bài đang làm dở')).toBeOnTheScreen();
  });

  it('gui anh bai lam: cau tu luan de trong van nop duoc, bai nop kem id anh', async () => {
    api.getAssignmentSubmissions.mockResolvedValueOnce([]).mockResolvedValue([
      {
        ...SUBMITTED,
        answers: [
          { questionId: 'q1', answer: WRONG_CHOICE },
          { questionId: 'q2', answer: '' },
        ],
        files: [{ fileId: 'file-1' }],
      },
    ]);
    api.submitAssignment.mockResolvedValue({
      id: SUBMITTED.id,
      recipientId: RECIPIENT_ID,
      attemptNo: 1,
      submittedAt: SUBMITTED.submittedAt,
    });
    mockedPickImage.mockResolvedValue({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionImage.mockResolvedValue(UPLOADED_PHOTO);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'radio',
        { name: WRONG_CHOICE },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(screen.getByText('Còn 1 câu chưa trả lời: Câu 2.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Chọn ảnh bài làm có sẵn' }));

    expect(mockedPickImage).toHaveBeenCalledWith('library');
    expect(api.uploadSubmissionImage).toHaveBeenCalledWith(PICKED_PHOTO);
    expect(await screen.findByLabelText('Ảnh bài làm 1')).toBeOnTheScreen();
    // Co anh thi cau tu luan duoc de trong; anh luu vao ban nhap cung cau tra loi
    expect(
      screen.getByText(
        'Đã trả lời đủ. Câu tự luận để trống thì giáo viên chấm theo ảnh bài làm. Sau lần này học sinh còn 1 lần nộp lại.',
      ),
    ).toBeOnTheScreen();
    expect(mockSavedDrafts.get(DRAFT_KEY)).toEqual({
      answers: { q1: WRONG_CHOICE },
      attachments: [{ fileId: 'file-1', uri: PICKED_PHOTO.uri }],
    });

    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(
      screen.getByText(
        'Đã trả lời đủ 2 câu, kèm 1 ảnh bài làm. Sau khi nộp, học sinh còn 1 lần nộp lại.',
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Xác nhận nộp' }));

    expect(await screen.findByText('Đã nộp bài')).toBeOnTheScreen();
    expect(api.submitAssignment).toHaveBeenCalledWith({
      recipientId: RECIPIENT_ID,
      answers: [
        { questionId: 'q1', answer: WRONG_CHOICE },
        { questionId: 'q2', answer: '' },
      ],
      fileIds: ['file-1'],
    });
    // Xem lai bai da nop: bao so anh da gui, cau tu luan tra loi bang anh
    expect(screen.getByText(/^Đã gửi kèm 1 ảnh bài làm/)).toBeOnTheScreen();
    expect(screen.getByText('Học sinh trả lời bằng ảnh bài làm gửi kèm.')).toBeOnTheScreen();
  });

  it('xoa anh vua gui; tu choi quyen camera thi chi cach mo Cai dat', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickImage.mockResolvedValueOnce({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionImage.mockResolvedValue(UPLOADED_PHOTO);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chụp ảnh bài làm' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(mockedPickImage).toHaveBeenLastCalledWith('camera');
    expect(await screen.findByLabelText('Ảnh bài làm 1')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Xoá ảnh bài làm 1' }));
    expect(screen.queryByLabelText('Ảnh bài làm 1')).not.toBeOnTheScreen();
    expect(mockSavedDrafts.get(DRAFT_KEY)).toEqual({ answers: {}, attachments: [] });

    mockedPickImage.mockResolvedValueOnce({ status: 'PERMISSION_DENIED' });
    await user.press(screen.getByRole('button', { name: 'Chụp ảnh bài làm' }));
    expect(await screen.findByText(/^Ứng dụng chưa được phép dùng camera/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Mở Cài đặt' })).toBeOnTheScreen();
    expect(api.uploadSubmissionImage).toHaveBeenCalledTimes(1);
  });

  it('gui anh loi thi bao loi, khong them anh vao bai', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickImage.mockResolvedValue({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionImage.mockRejectedValue(
      new AppError('Chỉ gửi được ảnh JPG hoặc PNG.', 409),
    );
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chọn ảnh bài làm có sẵn' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Chỉ gửi được ảnh JPG hoặc PNG.');
    expect(screen.queryByLabelText('Ảnh bài làm 1')).not.toBeOnTheScreen();
  });

  it('nop lai giu anh cua lan truoc', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([
      { ...SUBMITTED, files: [{ fileId: 'file-old' }] },
    ]);
    const { user } = await renderDetail();

    expect(
      await screen.findByText(
        /^Đã gửi kèm 1 ảnh bài làm/,
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Làm lại và nộp lại' }));

    // Anh khong con tren may: tai lai tu BE theo id
    expect(await screen.findByLabelText('Ảnh bài làm 1, đã gửi ở lần nộp trước')).toBeOnTheScreen();
    expect(api.getFilePreview).toHaveBeenCalledWith('file-old');
  });

  it('xem lai anh bai lam da nop: anh nho, bam de xem tron anh va chuyen anh', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([
      { ...SUBMITTED, files: [{ fileId: 'file-a' }, { fileId: 'file-b' }] },
    ]);
    const { user } = await renderDetail();

    expect(
      await screen.findByText(
        /^Đã gửi kèm 2 ảnh bài làm/,
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(await screen.findByLabelText('Ảnh bài làm 2')).toBeOnTheScreen();
    expect(api.getFilePreview).toHaveBeenCalledWith('file-a');
    expect(api.getFilePreview).toHaveBeenCalledWith('file-b');

    await user.press(screen.getByRole('button', { name: 'Xem ảnh bài làm 1' }));
    expect(screen.getByText('Ảnh bài làm 1/2')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Ảnh trước' })).toBeDisabled();

    await user.press(screen.getByRole('button', { name: 'Ảnh sau' }));
    expect(screen.getByText('Ảnh bài làm 2/2')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Ảnh sau' })).toBeDisabled();

    await user.press(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByText('Ảnh bài làm 2/2')).not.toBeOnTheScreen();
  });

  it('khong lay duoc link anh da nop thi bao trong khung anh, van xem duoc bai', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([
      { ...SUBMITTED, files: [{ fileId: 'file-gone' }] },
    ]);
    api.getFilePreview.mockRejectedValue(new AppError('Không tìm thấy dữ liệu yêu cầu.', 404));
    await renderDetail();

    expect(
      await screen.findByLabelText(
        'Ảnh bài làm 1, không tải được ảnh',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Bài làm của học sinh')).toBeOnTheScreen();
  });

  describe('bai co CLO', () => {
    // BE tra ca bo CLO; bai chi do MATH-8-02 va MATH-8-03
    const LEARNING_TARGETS = [
      { id: 'clo-1', code: 'MATH-8-01', title: 'Đa thức nhiều biến', statement: '…' },
      { id: 'clo-2', code: 'MATH-8-02', title: 'Hằng đẳng thức', statement: '…' },
      { id: 'clo-3', code: 'MATH-8-03', title: 'Phân tích nhân tử', statement: '…' },
    ];

    beforeEach(() => {
      api.getAssignmentSubmissions.mockResolvedValue([]);
      api.getAssignmentDetail.mockResolvedValue({
        ...DETAIL,
        outcomeSetId: 'set-1',
        learningTargets: LEARNING_TARGETS,
        questions: [
          { ...CHOICE_QUESTION, outcomeId: 'clo-3' },
          { ...ESSAY_QUESTION, outcomeId: 'clo-2' },
        ],
      });
    });

    it('chi hien muc tieu cau hoi do, ghi chu muc tieu mo rong, gan ma CLO canh cau', async () => {
      api.getOutcomeSet.mockResolvedValue({
        id: 'set-1',
        programId: 'program-math',
        level: 'Lớp 8 - cơ bản',
        version: 1,
        outcomes: LEARNING_TARGETS.map((target) => ({
          ...target,
          required: target.id !== 'clo-3',
        })),
      });
      await renderDetail();

      expect(
        await screen.findByLabelText(
          'MATH-8-03: Phân tích nhân tử. Mục tiêu mở rộng, không bắt buộc',
          {},
          { timeout: FIRST_RENDER_TIMEOUT_MS },
        ),
      ).toBeOnTheScreen();
      expect(api.getOutcomeSet).toHaveBeenCalledWith('set-1');
      expect(screen.getByText('Mục tiêu bài')).toBeOnTheScreen();
      // Giu thu tu trong bo, khong theo thu tu cau
      expect(
        screen.getAllByLabelText(/^MATH-8-0\d: /).map((row) => row.props.accessibilityLabel),
      ).toEqual([
        'MATH-8-02: Hằng đẳng thức',
        'MATH-8-03: Phân tích nhân tử. Mục tiêu mở rộng, không bắt buộc',
      ]);
      expect(screen.queryByText('Đa thức nhiều biến')).not.toBeOnTheScreen();
      expect(screen.getByLabelText('Mục tiêu MATH-8-03')).toBeOnTheScreen();
      expect(screen.getByLabelText('Mục tiêu MATH-8-02')).toBeOnTheScreen();
    });

    it('khong tai duoc bo CLO thi van hien muc tieu, chi khong co ghi chu', async () => {
      api.getOutcomeSet.mockRejectedValue(new AppError('Lỗi máy chủ', 500, 'INTERNAL_ERROR'));
      await renderDetail();

      expect(
        await screen.findByText('Mục tiêu bài', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
      ).toBeOnTheScreen();
      expect(
        screen.getAllByLabelText(/^MATH-8-0\d: /).map((row) => row.props.accessibilityLabel),
      ).toEqual(['MATH-8-02: Hằng đẳng thức', 'MATH-8-03: Phân tích nhân tử']);
      expect(screen.queryByText('Mục tiêu mở rộng, không bắt buộc')).not.toBeOnTheScreen();
    });
  });

  it('bai cu khong co CLO thi khong hien khoi muc tieu', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    await renderDetail();

    expect(
      await screen.findByText(DETAIL.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Mục tiêu bài')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Mục tiêu /)).not.toBeOnTheScreen();
    expect(api.getOutcomeSet).not.toHaveBeenCalled();
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
