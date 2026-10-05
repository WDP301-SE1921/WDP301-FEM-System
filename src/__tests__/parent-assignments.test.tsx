import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentAssignments } from '@/features/parent-dashboard/components/parent-assignments';
import type { LinkedStudent, StudentAssignment } from '@/features/parent-dashboard/types';
import {
  formatAssignmentDue,
  formatAssignmentSubmitted,
  formatNextSession,
} from '@/features/parent-dashboard/utils';
import { AppError } from '@/types/api';
import { addDays, startOfDay } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentAssignments: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const MINH_ANH: LinkedStudent = {
  id: 'student-1',
  fullName: 'Nguyễn Minh Anh',
  grade: 8,
  subjectNames: ['Toán', 'Vật lý'],
};
const HOANG_LONG: LinkedStudent = {
  id: 'student-2',
  fullName: 'Nguyễn Hoàng Long',
  grade: 6,
  subjectNames: ['Tiếng Anh'],
};

const MATH = { subjectName: 'Toán', className: 'Toán nâng cao 8A2' };
const PHYSICS = { subjectName: 'Vật lý', className: 'Vật lý 8 chuyên sâu' };

/** Man hinh tinh han nop theo gio that, nen moc thoi gian tinh tu hom nay. */
function daysFromToday(days: number, hours: number, minutes = 0): string {
  const date = addDays(startOfDay(new Date()), days);
  date.setHours(hours, minutes);
  return date.toISOString();
}

function assignment(id: string, overrides: Partial<StudentAssignment>): StudentAssignment {
  return {
    ...MATH,
    id,
    title: `Bài ${id}`,
    instructions: 'Làm vào vở và nộp ảnh bài làm.',
    teacherName: 'Đặng Hải Yến',
    dueAt: daysFromToday(3, 23, 59),
    maxAttempts: 1,
    questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 4 },
    submission: null,
    grade: null,
    ...overrides,
  };
}

const MATH_DUE_SOON = assignment('math-12', {
  title: 'Phiếu bài tập số 12: Phân thức đại số',
  dueAt: daysFromToday(2, 23, 59),
});
const PHYSICS_QUIZ = assignment('physics-9', {
  ...PHYSICS,
  title: 'Đề trắc nghiệm: Thấu kính hội tụ',
  teacherName: 'Trần Quang Huy',
  dueAt: daysFromToday(5, 20),
  maxAttempts: 2,
  questionCounts: { MULTIPLE_CHOICE: 15, ESSAY: 0 },
});
const PHYSICS_SUBMITTED = assignment('physics-8', {
  ...PHYSICS,
  title: 'Ôn tập khúc xạ ánh sáng',
  maxAttempts: 2,
  questionCounts: { MULTIPLE_CHOICE: 15, ESSAY: 0 },
  submission: { attemptNo: 1, submittedAt: daysFromToday(-1, 16, 45) },
});
const MATH_GRADED = assignment('math-11', {
  title: 'Kiểm tra 15 phút: Hằng đẳng thức',
  submission: { attemptNo: 1, submittedAt: daysFromToday(-6, 20) },
  grade: {
    totalScore: 8.5,
    maxScore: 10,
    feedback: 'Trình bày chi tiết, tính toán chính xác.',
    publishedAt: daysFromToday(-4, 20),
  },
});
const PHYSICS_GRADED = assignment('physics-7', {
  ...PHYSICS,
  title: 'Công thức tính nhiệt lượng',
  teacherName: null,
  submission: { attemptNo: 1, submittedAt: daysFromToday(-4, 20) },
  grade: { totalScore: 6, maxScore: 10, feedback: null, publishedAt: daysFromToday(-2, 20) },
});
const ENGLISH_TODO = assignment('english-13', {
  subjectName: 'Tiếng Anh',
  className: 'Tiếng Anh 6A1',
  title: 'Unit 3: My friends – A closer look 2',
  dueAt: daysFromToday(4, 23, 59),
});

// API tra lung tung thu tu, man hinh phai tu sap xep
const MINH_ANH_ASSIGNMENTS = [
  MATH_GRADED,
  PHYSICS_QUIZ,
  PHYSICS_SUBMITTED,
  PHYSICS_GRADED,
  MATH_DUE_SOON,
];

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  api.getStudentAssignments.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? MINH_ANH_ASSIGNMENTS : [ENGLISH_TODO],
  );
}

async function renderAssignments() {
  const onAddChild = jest.fn();
  const onOpenAssignment = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentAssignments onAddChild={onAddChild} onOpenAssignment={onOpenAssignment} />
    </QueryClientProvider>,
  );
  return { onAddChild, onOpenAssignment, user: userEvent.setup() };
}

/** Tieu de cac the bai tap theo thu tu tren man hinh. */
function cardTitles() {
  return screen
    .getAllByRole('header')
    .map((header) => header.props.children)
    .filter((title) => title !== 'Điểm & Bài tập');
}

describe('features/parent-dashboard/ParentAssignments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mac dinh tab Can lam: nhac han gan nhat, so bai moi tab, han gan nhat truoc', async () => {
    mockTwoChildren();
    await renderAssignments();

    expect(
      await screen.findByText(MATH_DUE_SOON.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(api.getStudentAssignments).toHaveBeenCalledWith(MINH_ANH.id);
    expect(
      screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }),
    ).toBeOnTheScreen();

    expect(screen.getByRole('tab', { name: 'Cần làm, 2 bài' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Đã nộp, 1 bài' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Đã có điểm, 2 bài' })).toBeOnTheScreen();

    expect(
      screen.getByText(`Hạn nộp gần nhất: ${formatNextSession(MATH_DUE_SOON.dueAt)}`),
    ).toBeOnTheScreen();
    expect(screen.getByText('Gấp')).toBeOnTheScreen();
    expect(
      screen.getByText('Nhắc Minh Anh hoàn thành bài tập Toán đúng hạn nhé!'),
    ).toBeOnTheScreen();

    expect(cardTitles()).toEqual([MATH_DUE_SOON.title, PHYSICS_QUIZ.title]);
    expect(screen.getByText('Còn 2 ngày')).toBeOnTheScreen();
    expect(screen.getByText('Còn 5 ngày')).toBeOnTheScreen();
    expect(screen.getByText('Tự luận')).toBeOnTheScreen();
    expect(screen.getByText('Trắc nghiệm')).toBeOnTheScreen();
    expect(screen.getByText(formatAssignmentDue(MATH_DUE_SOON.dueAt))).toBeOnTheScreen();
    expect(screen.getByText('4 câu hỏi')).toBeOnTheScreen();
    expect(screen.getByText('15 câu hỏi')).toBeOnTheScreen();
  });

  it('tab Da nop hien gio nop va lan nop lai; tab Da co diem hien diem, xep loai, nhan xet', async () => {
    mockTwoChildren();
    const { user } = await renderAssignments();
    await screen.findByText(MATH_DUE_SOON.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS });

    await user.press(screen.getByRole('tab', { name: 'Đã nộp, 1 bài' }));
    expect(cardTitles()).toEqual([PHYSICS_SUBMITTED.title]);
    expect(screen.getByText('Đang chấm bài')).toBeOnTheScreen();
    expect(screen.getByText(/^Minh Anh đã nộp bài/)).toBeOnTheScreen();
    expect(
      screen.getByText(formatAssignmentSubmitted(PHYSICS_SUBMITTED.submission?.submittedAt ?? '')),
    ).toBeOnTheScreen();
    expect(screen.getByText('Còn 1 lần nộp lại')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Đã có điểm, 2 bài' }));
    // Moi cong bo diem truoc
    expect(cardTitles()).toEqual([PHYSICS_GRADED.title, MATH_GRADED.title]);
    expect(screen.getByLabelText('Điểm 8.5 trên 10.0')).toBeOnTheScreen();
    expect(screen.getByText('Tốt')).toBeOnTheScreen();
    expect(screen.getByText('“Trình bày chi tiết, tính toán chính xác.”')).toBeOnTheScreen();
    expect(screen.getByText('Giáo viên: Đặng Hải Yến')).toBeOnTheScreen();
    expect(screen.getByLabelText('Điểm 6.0 trên 10.0')).toBeOnTheScreen();
    expect(screen.getByText('Đạt')).toBeOnTheScreen();
    // Bai khong co nhan xet va lop chua co giao vien thi khong hien dong rong
    expect(screen.getAllByText(/^Giáo viên:/)).toHaveLength(1);
  });

  it('moi the co nut mo chi tiet bai cua con dang xem: lam bai, bai da nop, bai lam va dap an', async () => {
    mockTwoChildren();
    const { onOpenAssignment, user } = await renderAssignments();
    await screen.findByText(MATH_DUE_SOON.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS });

    await user.press(screen.getByRole('button', { name: `Làm bài: ${MATH_DUE_SOON.title}` }));
    expect(onOpenAssignment).toHaveBeenLastCalledWith({
      studentId: MINH_ANH.id,
      assignmentId: MATH_DUE_SOON.id,
    });

    await user.press(screen.getByRole('tab', { name: 'Đã nộp, 1 bài' }));
    await user.press(
      screen.getByRole('button', { name: `Xem bài đã nộp: ${PHYSICS_SUBMITTED.title}` }),
    );
    expect(onOpenAssignment).toHaveBeenLastCalledWith({
      studentId: MINH_ANH.id,
      assignmentId: PHYSICS_SUBMITTED.id,
    });

    await user.press(screen.getByRole('tab', { name: 'Đã có điểm, 2 bài' }));
    await user.press(
      screen.getByRole('button', { name: `Xem bài làm và đáp án: ${MATH_GRADED.title}` }),
    );
    expect(onOpenAssignment).toHaveBeenLastCalledWith({
      studentId: MINH_ANH.id,
      assignmentId: MATH_GRADED.id,
    });
  });

  it('loc theo mon: so bai tren tab va danh sach theo mon, nhac han nop giu nguyen', async () => {
    mockTwoChildren();
    const { user } = await renderAssignments();
    await screen.findByText(MATH_DUE_SOON.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS });

    await user.press(screen.getByRole('button', { name: 'Lọc: Vật lý' }));
    expect(screen.getByRole('tab', { name: 'Cần làm, 1 bài' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Đã có điểm, 1 bài' })).toBeOnTheScreen();
    expect(cardTitles()).toEqual([PHYSICS_QUIZ.title]);
    expect(
      screen.getByText('Nhắc Minh Anh hoàn thành bài tập Toán đúng hạn nhé!'),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Lọc: Toán' }));
    await user.press(screen.getByRole('tab', { name: 'Đã nộp, 0 bài' }));
    expect(screen.getByText('Không có bài chờ chấm')).toBeOnTheScreen();
  });

  it('doi con thi tai bai cua con do va quay ve tab Can lam; mot mon thi khong can loc', async () => {
    mockTwoChildren();
    const { user } = await renderAssignments();
    await screen.findByText(MATH_DUE_SOON.title, {}, { timeout: FIRST_RENDER_TIMEOUT_MS });
    await user.press(screen.getByRole('tab', { name: 'Đã có điểm, 2 bài' }));

    await user.press(screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }));
    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText(ENGLISH_TODO.title)).toBeOnTheScreen();
    expect(api.getStudentAssignments).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(screen.getByRole('tab', { name: 'Cần làm, 1 bài' })).toBeSelected();
    expect(screen.queryByRole('button', { name: /^Lọc:/ })).not.toBeOnTheScreen();
    // Con 4 ngay nen chua gap
    expect(
      screen.getByText('Nhắc Hoàng Long hoàn thành bài tập Tiếng Anh đúng hạn nhé!'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Gấp')).not.toBeOnTheScreen();
  });

  it('con chua co bai tap nao thi bao rong', async () => {
    api.getStudents.mockResolvedValue([HOANG_LONG]);
    api.getStudentAssignments.mockResolvedValue([]);
    await renderAssignments();

    expect(
      await screen.findByText('Chưa có bài tập nào', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Bài tập giáo viên giao cho Hoàng Long sẽ hiện ở đây.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('tab')).not.toBeOnTheScreen();
  });

  it('chua co con thi moi them con', async () => {
    api.getStudents.mockResolvedValue([]);
    const { onAddChild, user } = await renderAssignments();

    expect(
      await screen.findByText('Chưa có hồ sơ của con', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Thêm con' }));

    expect(onAddChild).toHaveBeenCalledTimes(1);
    expect(api.getStudentAssignments).not.toHaveBeenCalled();
  });

  it('loi tai bai tap thi hien thu lai, bam thu lai tai lai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentAssignments
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce(MINH_ANH_ASSIGNMENTS);
    const { user } = await renderAssignments();

    await user.press(
      await screen.findByRole('button', { name: 'Thử lại' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    expect(await screen.findByText(MATH_DUE_SOON.title)).toBeOnTheScreen();
    expect(api.getStudentAssignments).toHaveBeenCalledTimes(2);
  });
});
