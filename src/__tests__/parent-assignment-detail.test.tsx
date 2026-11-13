import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { openBrowserAsync } from 'expo-web-browser';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentAssignmentDetail } from '@/features/parent-dashboard/components/parent-assignment-detail';
import type {
  AssignmentDetail,
  AssignmentQuestion,
  SubmissionRecord,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';
import { pickPdf } from '@/lib/document-picker';
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
    uploadSubmissionFile: jest.fn(),
    getFilePreview: jest.fn(),
    getOutcomeSet: jest.fn(),
  },
}));
// Camera, thu vien anh va trinh chon tep la module native: test chon san ket qua tra ve
jest.mock('@/lib/image-picker', () => ({ pickImage: jest.fn() }));
jest.mock('@/lib/document-picker', () => ({ pickPdf: jest.fn() }));
// Trinh duyet trong app la module native: chi kiem link duoc mo
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

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
const mockedPickPdf = jest.mocked(pickPdf);

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
const PICKED_PDF = {
  uri: 'file:///cache/DocumentPicker/bai-kiem-tra.pdf',
  name: 'bai-kiem-tra.pdf',
  mimeType: 'application/pdf' as const,
  size: 800_000,
};
const UPLOADED_PDF = {
  id: 'file-pdf',
  name: 'bai-kiem-tra.pdf',
  mimeType: 'application/pdf',
  size: 800_000,
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
    expect(screen.getByLabelText('Điểm 5.5 trên 10')).toBeOnTheScreen();
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

  it('gui anh rieng cho cau tu luan: cau do de trong van nop duoc, anh gui kem dung cau', async () => {
    const submittedWithPhoto: SubmissionRecord = {
      ...SUBMITTED,
      answers: [
        { questionId: 'q1', answer: WRONG_CHOICE },
        { questionId: 'q2', answer: '', fileIds: ['file-1'] },
      ],
      files: [{ fileId: 'file-1' }],
    };
    api.getAssignmentSubmissions.mockResolvedValueOnce([]).mockResolvedValue([submittedWithPhoto]);
    api.submitAssignment.mockResolvedValue({
      id: SUBMITTED.id,
      recipientId: RECIPIENT_ID,
      attemptNo: 1,
      submittedAt: SUBMITTED.submittedAt,
    });
    mockedPickImage.mockResolvedValue({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionFile.mockResolvedValue(UPLOADED_PHOTO);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'radio',
        { name: WRONG_CHOICE },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(screen.getByText('Còn 1 câu chưa trả lời: Câu 2.')).toBeOnTheScreen();
    // Cau trac nghiem khong co khu tep, cau tu luan co khu tep rieng
    expect(screen.queryByRole('button', { name: 'Chọn tệp PDF bài làm' })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Chọn ảnh bài làm câu 2 có sẵn' }));

    expect(mockedPickImage).toHaveBeenCalledWith('library');
    expect(api.uploadSubmissionFile).toHaveBeenCalledWith(PICKED_PHOTO);
    expect(await screen.findByLabelText('Ảnh bài làm câu 2 số 1')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Câu 2 để trống: giáo viên chấm theo bài làm gửi kèm. Sau lần này học sinh còn 1 lần nộp lại.',
      ),
    ).toBeOnTheScreen();
    // Anh gan san voi cau 2, luu vao ban nhap cung cau tra loi
    expect(mockSavedDrafts.get(DRAFT_KEY)).toEqual({
      answers: { q1: WRONG_CHOICE },
      attachments: [
        {
          fileId: 'file-1',
          uri: PICKED_PHOTO.uri,
          kind: 'IMAGE',
          name: UPLOADED_PHOTO.name,
          size: UPLOADED_PHOTO.size,
          questionIds: ['q2'],
        },
      ],
    });

    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(
      screen.getByText(
        'Nộp 2 câu, kèm 1 ảnh bài làm. Câu 2 để trống, giáo viên chấm theo bài làm gửi kèm. Sau khi nộp, học sinh còn 1 lần nộp lại.',
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Xác nhận nộp' }));

    expect(await screen.findByText('Đã nộp bài')).toBeOnTheScreen();
    expect(api.submitAssignment).toHaveBeenCalledWith({
      recipientId: RECIPIENT_ID,
      answers: submittedWithPhoto.answers,
      fileIds: ['file-1'],
    });
    expect(screen.getByText(/^Đã gửi kèm 1 ảnh bài làm/)).toBeOnTheScreen();
    expect(screen.getByText('Học sinh trả lời bằng bài làm gửi kèm.')).toBeOnTheScreen();
  });

  it('gui PDF rieng cho cau tu luan: cau trac nghiem van phai tra loi, xem lai mo duoc PDF', async () => {
    const submittedWithPdf: SubmissionRecord = {
      ...SUBMITTED,
      answers: [
        { questionId: 'q1', answer: CORRECT_CHOICE },
        { questionId: 'q2', answer: '', fileIds: [UPLOADED_PDF.id] },
      ],
      files: [
        {
          fileId: UPLOADED_PDF.id,
          file: { name: UPLOADED_PDF.name, mimeType: UPLOADED_PDF.mimeType, size: 800_000 },
        },
      ],
    };
    api.getAssignmentSubmissions.mockResolvedValueOnce([]).mockResolvedValue([submittedWithPdf]);
    api.submitAssignment.mockResolvedValue({
      id: SUBMITTED.id,
      recipientId: RECIPIENT_ID,
      attemptNo: 1,
      submittedAt: SUBMITTED.submittedAt,
    });
    mockedPickPdf.mockResolvedValue({ status: 'PICKED', file: PICKED_PDF });
    api.uploadSubmissionFile.mockResolvedValue(UPLOADED_PDF);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chọn file PDF bài làm câu 2' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(api.uploadSubmissionFile).toHaveBeenCalledWith(PICKED_PDF);
    expect(
      await screen.findByLabelText(`File PDF bài làm câu 2 số 1: ${UPLOADED_PDF.name}`),
    ).toBeOnTheScreen();
    // PDF chi co cau 2: cau 1 chua tra loi van bi chi ra
    expect(screen.getByText(/^Còn 1 câu chưa trả lời: Câu 1\./)).toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: CORRECT_CHOICE }));
    await user.press(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(
      screen.getByText(
        'Nộp 2 câu, kèm 1 tệp PDF bài làm. Câu 2 để trống, giáo viên chấm theo bài làm gửi kèm. Sau khi nộp, học sinh còn 1 lần nộp lại.',
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Xác nhận nộp' }));

    expect(await screen.findByText('Đã nộp bài')).toBeOnTheScreen();
    expect(api.submitAssignment).toHaveBeenCalledWith({
      recipientId: RECIPIENT_ID,
      answers: submittedWithPdf.answers,
      fileIds: [UPLOADED_PDF.id],
    });

    expect(screen.getByText(/^Đã gửi kèm 1 tệp PDF bài làm/)).toBeOnTheScreen();
    await user.press(
      screen.getByRole('button', { name: `Mở tệp PDF 1 bài làm, ${UPLOADED_PDF.name}` }),
    );
    expect(api.getFilePreview).toHaveBeenCalledWith(UPLOADED_PDF.id);
    expect(openBrowserAsync).toHaveBeenCalledWith(
      expect.stringContaining(`${UPLOADED_PDF.id}.jpg`),
      expect.anything(),
    );
  });

  it('de chi co trac nghiem: van gui duoc tep o khu tep chung, cau do de trong duoc', async () => {
    api.getAssignmentDetail.mockResolvedValue({ ...DETAIL, questions: [CHOICE_QUESTION] });
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickPdf.mockResolvedValue({ status: 'PICKED', file: PICKED_PDF });
    api.uploadSubmissionFile.mockResolvedValue(UPLOADED_PDF);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chọn tệp PDF bài làm' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByText(UPLOADED_PDF.name)).toBeOnTheScreen();
    expect(screen.getByText('Bài làm cho: Cả bài')).toBeOnTheScreen();
    expect(
      screen.getByText(/^Câu 1 để trống: giáo viên chấm theo bài làm gửi kèm\./),
    ).toBeOnTheScreen();
  });

  it('chon tep khong phai PDF thi bao o dung cau, khong gui', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickPdf.mockResolvedValue({ status: 'UNSUPPORTED' });
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chọn file PDF bài làm câu 2' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByText(/^Chỉ gửi được tệp PDF\./)).toBeOnTheScreen();
    expect(api.uploadSubmissionFile).not.toHaveBeenCalled();
  });

  it('xoa anh vua gui; tu choi quyen camera thi chi cach mo Cai dat', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickImage.mockResolvedValueOnce({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionFile.mockResolvedValue(UPLOADED_PHOTO);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chụp ảnh bài làm câu 2' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(mockedPickImage).toHaveBeenLastCalledWith('camera');
    expect(await screen.findByLabelText('Ảnh bài làm câu 2 số 1')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Xoá ảnh bài làm câu 2 số 1' }));
    expect(screen.queryByLabelText('Ảnh bài làm câu 2 số 1')).not.toBeOnTheScreen();
    expect(mockSavedDrafts.get(DRAFT_KEY)).toEqual({ answers: {}, attachments: [] });

    mockedPickImage.mockResolvedValueOnce({ status: 'PERMISSION_DENIED' });
    await user.press(screen.getByRole('button', { name: 'Chụp ảnh bài làm câu 2' }));
    expect(await screen.findByText(/^Ứng dụng chưa được phép dùng camera/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Mở Cài đặt' })).toBeOnTheScreen();
    expect(api.uploadSubmissionFile).toHaveBeenCalledTimes(1);
  });

  it('gui anh loi thi bao loi, khong them anh vao bai', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    mockedPickImage.mockResolvedValue({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadSubmissionFile.mockRejectedValue(new AppError('Chỉ gửi được ảnh JPG hoặc PNG.', 409));
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chọn ảnh bài làm câu 2 có sẵn' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Chỉ gửi được ảnh JPG hoặc PNG.');
    expect(screen.queryByLabelText('Ảnh bài làm câu 2 số 1')).not.toBeOnTheScreen();
  });

  it('nop lai giu anh cua lan truoc: anh cua ca bai hien o cau tu luan dau tien', async () => {
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
    expect(
      await screen.findByLabelText('Ảnh bài làm câu 2 số 1, đã gửi ở lần nộp trước'),
    ).toBeOnTheScreen();
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
    // BE tra ca bo CLO, xep theo ma; bai chi do "Hằng đẳng thức" va "Phân tích nhân tử"
    const LEARNING_TARGETS = [
      { id: 'clo-1', code: 'MATH-8-01', title: 'Đa thức nhiều biến', statement: '…' },
      { id: 'clo-2', code: 'MATH-8-02', title: 'Hằng đẳng thức', statement: '…' },
      { id: 'clo-3', code: 'MATH-8-03', title: 'Phân tích nhân tử', statement: '…' },
    ];
    const TARGET_ROW_LABEL = /^(Đa thức nhiều biến|Hằng đẳng thức|Phân tích nhân tử)/;
    /** Ma CLO la ma ky thuat: khong duoc hien o dau ca, ke ca nhan doc man hinh. */
    const expectNoOutcomeCode = () => {
      expect(screen.queryAllByText(/MATH-8-0\d/)).toHaveLength(0);
      expect(screen.queryAllByLabelText(/MATH-8-0\d/)).toHaveLength(0);
    };

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

    it('chi hien ten muc tieu cau hoi do, ghi chu muc tieu mo rong, khong hien ma CLO', async () => {
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
          'Phân tích nhân tử. Mục tiêu mở rộng, không bắt buộc',
          {},
          { timeout: FIRST_RENDER_TIMEOUT_MS },
        ),
      ).toBeOnTheScreen();
      expect(api.getOutcomeSet).toHaveBeenCalledWith('set-1');
      expect(screen.getByText('Mục tiêu bài')).toBeOnTheScreen();
      // Giu thu tu trong bo, khong theo thu tu cau
      expect(
        screen.getAllByLabelText(TARGET_ROW_LABEL).map((row) => row.props.accessibilityLabel),
      ).toEqual(['Hằng đẳng thức', 'Phân tích nhân tử. Mục tiêu mở rộng, không bắt buộc']);
      expect(screen.queryByText('Đa thức nhiều biến')).not.toBeOnTheScreen();
      // Ca khung cau hoi luc lam bai cung khong gan ma CLO canh "Câu N"
      expect(screen.getByText('Câu 1')).toBeOnTheScreen();
      expectNoOutcomeCode();
    });

    it('khong tai duoc bo CLO thi van hien muc tieu, chi khong co ghi chu', async () => {
      api.getOutcomeSet.mockRejectedValue(new AppError('Lỗi máy chủ', 500, 'INTERNAL_ERROR'));
      await renderDetail();

      expect(
        await screen.findByText('Mục tiêu bài', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
      ).toBeOnTheScreen();
      expect(
        screen.getAllByLabelText(TARGET_ROW_LABEL).map((row) => row.props.accessibilityLabel),
      ).toEqual(['Hằng đẳng thức', 'Phân tích nhân tử']);
      expect(screen.queryByText('Mục tiêu mở rộng, không bắt buộc')).not.toBeOnTheScreen();
    });

    it('xem lai bai da cham cung khong hien ma CLO canh cau', async () => {
      api.getOutcomeSet.mockRejectedValue(new AppError('Lỗi máy chủ', 500, 'INTERNAL_ERROR'));
      api.getAssignmentSubmissions.mockResolvedValue([
        {
          ...SUBMITTED,
          grades: [
            {
              id: 'grade-1',
              scores: [
                { questionId: 'q1', score: 0, feedback: '' },
                { questionId: 'q2', score: 5.5, feedback: '' },
              ],
              totalScore: 5.5,
              feedback: '',
              publishedAt: daysFromToday(0),
            },
          ],
        },
      ]);
      await renderDetail();

      expect(
        await screen.findByText('Kết quả', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
      ).toBeOnTheScreen();
      expect(screen.getByText('Bài làm của học sinh')).toBeOnTheScreen();
      expect(screen.getByText('5.5 / 6 điểm')).toBeOnTheScreen();
      expect(screen.getByLabelText('Hằng đẳng thức')).toBeOnTheScreen();
      expectNoOutcomeCode();
    });
  });

  it('tai lieu giao vien gui kem va diem theo tieu chi (BE PR #12)', async () => {
    api.getAssignmentDetail.mockResolvedValue({
      ...DETAIL,
      status: 'CLOSED',
      files: [
        {
          fileId: 'file-de',
          teacherOnly: false,
          questionPosition: null,
          file: { name: 'de-bai-10.pdf', mimeType: 'application/pdf', size: 1.5 * 1024 * 1024 },
        },
        {
          fileId: 'file-hinh',
          teacherOnly: false,
          questionPosition: 1,
          file: { name: 'hinh-cau-2.png', mimeType: 'image/png', size: 300 * 1024 },
        },
      ],
    });
    api.getAssignmentSubmissions.mockResolvedValue([
      {
        ...SUBMITTED,
        grades: [
          {
            id: 'grade-1',
            scores: [
              { questionId: 'q1', score: 4, feedback: '' },
              {
                questionId: 'q2',
                score: 5,
                feedback: '',
                criteria: [
                  { criterionId: 'c1', score: 3, feedback: '' },
                  { criterionId: 'c2', score: 2, feedback: 'Thiếu kết luận.' },
                ],
              },
            ],
            rubricSnapshot: [
              {
                questionId: 'q2',
                maxScore: 6,
                criteria: [
                  { id: 'c1', title: 'Phương pháp', description: '', maxScore: 4 },
                  { id: 'c2', title: 'Trình bày', description: '', maxScore: 2 },
                ],
              },
            ],
            totalScore: 9,
            feedback: '',
            publishedAt: daysFromToday(0),
          },
        ],
      },
    ]);
    const { user } = await renderDetail();

    expect(
      await screen.findByText('Tài liệu của bài', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Cả bài · 1,5 MB')).toBeOnTheScreen();
    expect(screen.getByText('Câu 2 · 300 KB')).toBeOnTheScreen();

    // PDF mo bang trinh duyet voi link ky moi lay tu BE
    await user.press(screen.getByRole('button', { name: 'Mở tệp de-bai-10.pdf, Cả bài' }));
    expect(api.getFilePreview).toHaveBeenCalledWith('file-de');
    expect(openBrowserAsync).toHaveBeenCalledWith(
      expect.stringContaining('/file-de.jpg'),
      expect.anything(),
    );
    // Anh xem ngay trong app
    await user.press(screen.getByRole('button', { name: 'Xem ảnh hinh-cau-2.png, Câu 2' }));
    expect(screen.getByText('Ảnh đề bài 1/1')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Đóng' }));

    expect(screen.getByText('Điểm theo tiêu chí')).toBeOnTheScreen();
    expect(screen.getByText('Phương pháp')).toBeOnTheScreen();
    expect(screen.getByText('3 / 4 điểm')).toBeOnTheScreen();
    expect(screen.getByText('2 / 2 điểm')).toBeOnTheScreen();
    expect(screen.getByText('Thiếu kết luận.')).toBeOnTheScreen();
  });

  it('bai cu khong co CLO thi khong hien khoi muc tieu', async () => {
    api.getAssignmentSubmissions.mockResolvedValue([]);
    await renderDetail();

    expect(
      await screen.findByText(DETAIL.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Mục tiêu bài')).not.toBeOnTheScreen();
    expect(api.getOutcomeSet).not.toHaveBeenCalled();
    // Bai khong co tep giao vien gui kem thi khong hien khoi tai lieu
    expect(screen.queryByText('Tài liệu của bài')).not.toBeOnTheScreen();
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
