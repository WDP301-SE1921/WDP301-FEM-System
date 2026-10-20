import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import {
  ParentSchedule,
  type ParentScheduleProps,
} from '@/features/parent-dashboard/components/parent-schedule';
import type {
  ScheduleView,
  EnrollmentLesson,
  LessonAssignment,
  LessonSession,
  LinkedStudent,
  StudentEnrollment,
} from '@/features/parent-dashboard/types';
import { useStudentSelectionStore } from '@/store/student-selection-store';
import { AppError } from '@/types/api';
import { addDays, startOfDay } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentSchedule: jest.fn(),
    getStudentEnrollments: jest.fn(),
    getEnrollmentLessons: jest.fn(),
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

function enrollment(
  overrides: Partial<StudentEnrollment> & Pick<StudentEnrollment, 'id'>,
): StudentEnrollment {
  return {
    status: 'ACTIVE',
    pause: null,
    programName: 'Toán 8 – Chuyên đề nâng cao',
    subjectName: 'Toán',
    className: 'Toán nâng cao 8A2',
    teacherName: 'Đặng Hải Yến',
    room: 'Phòng P.203',
    weeklySlots: [],
    completedSessions: 2,
    totalSessions: 8,
    averageScore: 9.3,
    nextSession: null,
    endDate: null,
    ...overrides,
  };
}

const MATH_ACTIVE = enrollment({ id: 'enrollment-math' });
const PHYSICS_ACTIVE = enrollment({
  id: 'enrollment-physics',
  subjectName: 'Vật lý',
  className: 'Vật lý 8 chuyên sâu',
  programName: 'Vật lý 8 – Chuyên sâu và thí nghiệm',
});
const CHEMISTRY_PAUSED = enrollment({
  id: 'enrollment-chemistry',
  pause: { fromDate: '2026-09-20', toDate: '2026-11-18' },
  subjectName: 'Hóa học',
  className: 'Hóa học 8 cơ bản',
});

/** Gio bat dau cua buoi hoc cach hom nay `days` ngay. */
function atDay(days: number, hours = 18): string {
  const date = addDays(startOfDay(new Date()), days);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

function session(days: number, status: LessonSession['status']): LessonSession {
  return { id: `session-${days}`, startsAt: atDay(days), status };
}

function assignment(sequence: number, overrides: Partial<LessonAssignment>): LessonAssignment {
  return {
    id: `assignment-${sequence}`,
    title: `Bài tập về nhà bài ${sequence}`,
    dueAt: atDay(sequence, 23),
    submittedAt: null,
    score: null,
    ...overrides,
  };
}

function lesson(
  sequence: number,
  title: string,
  overrides: Partial<EnrollmentLesson> = {},
): EnrollmentLesson {
  return {
    id: `lesson-${sequence}`,
    sequence,
    title,
    description: null,
    kind: 'LESSON',
    session: null,
    assignment: null,
    ...overrides,
  };
}

/** 2 bai da hoc, bai 3 dang hoc (buoi ngay mai), bai 5 va bai 8 la bai kiem tra. */
const MATH_LESSONS: EnrollmentLesson[] = [
  lesson(1, 'Đơn thức và đa thức', {
    session: session(-7, 'COMPLETED'),
    assignment: assignment(1, { submittedAt: atDay(-6), score: 9.5 }),
  }),
  lesson(2, 'Hằng đẳng thức đáng nhớ', {
    session: session(-4, 'COMPLETED'),
    assignment: assignment(2, { submittedAt: atDay(-3), score: 9 }),
  }),
  lesson(3, 'Phân thức đại số', {
    description: 'Rút gọn phân thức',
    session: session(1, 'SCHEDULED'),
    assignment: assignment(3, {}),
  }),
  lesson(4, 'Hình chữ nhật', { session: session(3, 'SCHEDULED') }),
  lesson(5, 'Kiểm tra giữa khóa', { kind: 'ASSESSMENT', session: session(5, 'SCHEDULED') }),
  lesson(6, 'Cộng, trừ phân thức', { session: session(8, 'SCHEDULED') }),
  lesson(7, 'Hình vuông'),
  lesson(8, 'Kiểm tra cuối khóa', { kind: 'ASSESSMENT' }),
];

const PHYSICS_LESSONS: EnrollmentLesson[] = [
  lesson(1, 'Nhiệt năng và nhiệt lượng', { session: session(-6, 'COMPLETED') }),
  lesson(2, 'Sự truyền ánh sáng', { session: session(-3, 'COMPLETED') }),
];

function mockMinhAnh(enrollments: StudentEnrollment[]) {
  api.getStudents.mockResolvedValue([MINH_ANH]);
  api.getStudentSchedule.mockResolvedValue([]);
  api.getStudentEnrollments.mockResolvedValue(enrollments);
  api.getEnrollmentLessons.mockImplementation(async (_studentId, enrollmentId) =>
    enrollmentId === PHYSICS_ACTIVE.id ? PHYSICS_LESSONS : MATH_LESSONS,
  );
}

/** Route giu che do xem tren URL; o day giu bang state de bam chuyen che do nhu tren app. */
function ScheduleWithView(props: Omit<ParentScheduleProps, 'view' | 'onChangeView'>) {
  const [view, setView] = useState<ScheduleView>('WEEK');
  return <ParentSchedule {...props} view={view} onChangeView={setView} />;
}

// Con dang xem dung chung moi tab (store toan cuc): moi test bat dau tu con dau tien
afterEach(() => useStudentSelectionStore.setState({ selectedStudentId: null }));

async function renderRoadmap() {
  const handlers = {
    onAddChild: jest.fn(),
    onOpenAssignments: jest.fn(),
    onOpenSession: jest.fn(),
  };
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ScheduleWithView {...handlers} />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.press(
    await screen.findByRole('tab', { name: 'Lộ trình' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  );
  return { ...handlers, user };
}

describe('features/parent-dashboard/StudentRoadmap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('chi mon dang hoc co chip; tong quan tien do, moc kiem tra va bai dang hoc', async () => {
    mockMinhAnh([CHEMISTRY_PAUSED, MATH_ACTIVE, PHYSICS_ACTIVE]);
    await renderRoadmap();

    expect(await screen.findByText('Đã học 2/8 bài')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Lộ trình' })).toBeSelected();
    expect(api.getEnrollmentLessons).toHaveBeenCalledWith(MINH_ANH.id, MATH_ACTIVE.id);
    expect(screen.getByRole('button', { name: 'Lọc: Toán nâng cao 8A2' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Lọc: Vật lý 8 chuyên sâu' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Lọc: Hóa học 8 cơ bản' })).not.toBeOnTheScreen();

    expect(screen.getByText('25%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sắp tới: 5 bài')).toBeOnTheScreen();
    expect(screen.getByText('Bài 5 · Kiểm tra giữa khóa')).toBeOnTheScreen();
    expect(screen.getByText('Bài 3: Phân thức đại số')).toBeOnTheScreen();
    expect(screen.getByText('Điểm bài tập: 9.5')).toBeOnTheScreen();
  });

  it('thu gon quanh bai dang hoc, bam xem toan bo thi hien het bai', async () => {
    mockMinhAnh([MATH_ACTIVE]);
    const { user } = await renderRoadmap();
    await screen.findByText('Đã học 2/8 bài');

    // Con chi hoc mot mon thi khong can chip chon mon
    expect(screen.queryByRole('button', { name: /^Lọc:/ })).not.toBeOnTheScreen();
    expect(screen.getByText('Cộng, trừ phân thức')).toBeOnTheScreen();
    expect(screen.queryByText('Hình vuông')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: /Xem toàn bộ 8 bài$/ }));
    expect(screen.getByText('Hình vuông')).toBeOnTheScreen();
    expect(screen.getByText('Kiểm tra cuối khóa')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: /Thu gọn lộ trình$/ }));
    expect(screen.queryByText('Hình vuông')).not.toBeOnTheScreen();
  });

  it('mo buoi hoc cua bai da hoc, bai dang hoc va danh sach bai tap', async () => {
    mockMinhAnh([MATH_ACTIVE]);
    const { onOpenSession, onOpenAssignments, user } = await renderRoadmap();

    await user.press(await screen.findByRole('button', { name: /^Bài 1: Đơn thức và đa thức/ }));
    expect(onOpenSession).toHaveBeenLastCalledWith({
      studentId: MINH_ANH.id,
      sessionId: 'session--7',
    });

    await user.press(screen.getByRole('button', { name: /Xem chi tiết buổi học$/ }));
    expect(onOpenSession).toHaveBeenLastCalledWith({
      studentId: MINH_ANH.id,
      sessionId: 'session-1',
    });

    await user.press(screen.getByRole('button', { name: /^Bài tập về nhà bài 3, .*Chưa nộp$/ }));
    expect(onOpenAssignments).toHaveBeenCalledTimes(1);
  });

  it('doi mon thi tai lo trinh mon do', async () => {
    mockMinhAnh([MATH_ACTIVE, PHYSICS_ACTIVE]);
    const { user } = await renderRoadmap();
    await screen.findByText('Đã học 2/8 bài');

    await user.press(screen.getByRole('button', { name: 'Lọc: Vật lý 8 chuyên sâu' }));

    expect(await screen.findByText('Đã học 2/2 bài')).toBeOnTheScreen();
    expect(api.getEnrollmentLessons).toHaveBeenLastCalledWith(MINH_ANH.id, PHYSICS_ACTIVE.id);
    expect(screen.getByText('100%')).toBeOnTheScreen();
    // Hoc xong het thi khong con bai dang hoc
    expect(screen.queryByRole('button', { name: /Xem chi tiết buổi học$/ })).not.toBeOnTheScreen();
  });

  it('con khong co mon dang hoc hoac lop chua co bai hoc thi bao rong', async () => {
    mockMinhAnh([CHEMISTRY_PAUSED]);
    await renderRoadmap();
    expect(await screen.findByText('Chưa có môn đang học')).toBeOnTheScreen();
    expect(api.getEnrollmentLessons).not.toHaveBeenCalled();
  });

  it('lop chua cong bo bai hoc thi bao chua co lo trinh', async () => {
    mockMinhAnh([MATH_ACTIVE]);
    api.getEnrollmentLessons.mockResolvedValue([]);
    await renderRoadmap();

    expect(await screen.findByText('Chưa có lộ trình')).toBeOnTheScreen();
  });

  it('loi tai lo trinh thi hien thu lai, bam thu lai tai lai', async () => {
    mockMinhAnh([MATH_ACTIVE]);
    api.getEnrollmentLessons
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce(MATH_LESSONS);
    const { user } = await renderRoadmap();

    await user.press(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đã học 2/8 bài')).toBeOnTheScreen();
    expect(api.getEnrollmentLessons).toHaveBeenCalledTimes(2);
  });
});
