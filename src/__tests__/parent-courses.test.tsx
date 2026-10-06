import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentSchedule } from '@/features/parent-dashboard/components/parent-schedule';
import type { LinkedStudent, StudentEnrollment } from '@/features/parent-dashboard/types';
import { formatNextSession } from '@/features/parent-dashboard/utils';
import { AppError } from '@/types/api';
import { addDays, startOfDay } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentSchedule: jest.fn(),
    getStudentEnrollments: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const MINH_ANH: LinkedStudent = {
  id: 'student-1',
  fullName: 'Nguyễn Minh Anh',
  grade: 8,
  subjectNames: ['Toán', 'Hóa học'],
};
const HOANG_LONG: LinkedStudent = {
  id: 'student-2',
  fullName: 'Nguyễn Hoàng Long',
  grade: 6,
  subjectNames: ['Tiếng Anh'],
};

const NEXT_MATH_STARTS_AT = (() => {
  const date = addDays(startOfDay(new Date()), 1);
  date.setHours(18, 0, 0, 0);
  return date.toISOString();
})();

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
    room: 'P.203',
    weeklySlots: [],
    completedSessions: 9,
    totalSessions: 24,
    averageScore: 8.6,
    nextSession: null,
    endDate: null,
    ...overrides,
  };
}

const LITERATURE_ENDED = enrollment({
  id: 'enrollment-literature',
  status: 'ENDED',
  subjectName: 'Ngữ văn',
  className: 'Ngữ văn 8 ôn hè',
  programName: 'Ngữ văn 8 – Ôn luyện hè',
  completedSessions: 20,
  totalSessions: 20,
  averageScore: 9,
  endDate: '2026-08-28',
});
const MATH_ACTIVE = enrollment({
  id: 'enrollment-math',
  weeklySlots: [
    { weekday: 5, startTime: '18:00', endTime: '19:30' },
    { weekday: 2, startTime: '18:00', endTime: '19:30' },
  ],
  nextSession: { id: 'session-next-math', startsAt: NEXT_MATH_STARTS_AT },
});
const CHEMISTRY_PAUSED = enrollment({
  id: 'enrollment-chemistry',
  pause: { fromDate: '2026-09-20', toDate: '2026-11-18' },
  subjectName: 'Hóa học',
  className: 'Hóa học 8 cơ bản',
  programName: 'Hóa học 8 – Củng cố kiến thức',
  teacherName: null,
  averageScore: null,
});
const ENGLISH_ACTIVE = enrollment({
  id: 'enrollment-english',
  subjectName: 'Tiếng Anh',
  className: 'Tiếng Anh 6A1',
  programName: 'Tiếng Anh 6 – Giao tiếp cơ bản',
});

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  api.getStudentSchedule.mockResolvedValue([]);
  // API tra lung tung thu tu, man hinh phai tu sap xep
  api.getStudentEnrollments.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id
      ? [LITERATURE_ENDED, MATH_ACTIVE, CHEMISTRY_PAUSED]
      : [ENGLISH_ACTIVE],
  );
}

async function renderCourses() {
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
      <ParentSchedule {...handlers} />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.press(
    await screen.findByRole('tab', { name: 'Môn học' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  );
  return { ...handlers, user };
}

/** Ten cac mon theo thu tu tren man hinh (tieu de the co role header). */
function courseTitles() {
  return screen
    .getAllByRole('header')
    .map((header) => header.props.children)
    .filter((title) => title !== 'Lịch học');
}

describe('features/parent-dashboard/StudentCourses', () => {
  beforeEach(() => jest.clearAllMocks());

  it('xem mon hoc cua con dau tien: tong quan, sap dang hoc truoc, an nut chon tuan', async () => {
    mockTwoChildren();
    await renderCourses();

    expect(await screen.findByText('3 môn học')).toBeOnTheScreen();
    expect(screen.getByText('1 đang học · 1 tạm nghỉ · 1 đã kết thúc')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Môn học' })).toBeSelected();
    expect(screen.queryByRole('button', { name: /^Chọn tuần/ })).not.toBeOnTheScreen();
    expect(api.getStudentEnrollments).toHaveBeenCalledWith(MINH_ANH.id);

    expect(courseTitles()).toEqual(['Toán nâng cao 8A2', 'Hóa học 8 cơ bản', 'Ngữ văn 8 ôn hè']);
    expect(screen.getByText('T3, T6 · 18:00 – 19:30')).toBeOnTheScreen();
    expect(screen.getByText('Phòng P.203')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tiến độ khóa học: 9/24 buổi (38%)')).toBeOnTheScreen();
    // Mon chua co ten giao vien (Hoa hoc) thi khong hien dong giao vien
    expect(screen.getAllByText('Đặng Hải Yến')).toHaveLength(2);
    expect(screen.getByText('Kết thúc ngày 28/08/2026')).toBeOnTheScreen();
  });

  it('bam buoi tiep theo thi mo chi tiet dung buoi cua dung con', async () => {
    mockTwoChildren();
    const { onOpenSession, user } = await renderCourses();

    await user.press(
      await screen.findByRole('button', {
        name: `Buổi tiếp theo: ${formatNextSession(NEXT_MATH_STARTS_AT)}`,
      }),
    );

    expect(onOpenSession).toHaveBeenCalledWith({
      studentId: MINH_ANH.id,
      sessionId: 'session-next-math',
      startsAt: NEXT_MATH_STARTS_AT,
    });
  });

  it('loc theo trang thai; doi con thi bo loc quay ve tat ca', async () => {
    mockTwoChildren();
    const { user } = await renderCourses();

    await user.press(await screen.findByRole('button', { name: 'Lọc: Tạm nghỉ (1)' }));

    expect(courseTitles()).toEqual(['Hóa học 8 cơ bản']);
    expect(screen.getByText('20/09/2026')).toBeOnTheScreen();
    expect(screen.getByText('18/11/2026')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }));
    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText('Tiếng Anh 6A1')).toBeOnTheScreen();
    // Con chi co mon dang hoc thi khong can chip loc
    expect(screen.queryByRole('button', { name: /^Lọc:/ })).not.toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Môn học' })).toBeSelected();
  });

  it('quay lai lich tuan thi hien lai nut chon tuan', async () => {
    mockTwoChildren();
    const { user } = await renderCourses();
    await screen.findByText('3 môn học');

    await user.press(screen.getByRole('tab', { name: 'Lịch tuần' }));

    expect(screen.getByRole('button', { name: /^Chọn tuần/ })).toBeOnTheScreen();
    expect(screen.queryByText('3 môn học')).not.toBeOnTheScreen();
  });

  it('con chua co mon thi bao rong', async () => {
    api.getStudents.mockResolvedValue([HOANG_LONG]);
    api.getStudentSchedule.mockResolvedValue([]);
    api.getStudentEnrollments.mockResolvedValue([]);
    await renderCourses();

    expect(await screen.findByText('Chưa có môn học')).toBeOnTheScreen();
    expect(screen.getByText(/^Hoàng Long chưa được xếp vào lớp nào/)).toBeOnTheScreen();
  });

  it('loi tai mon hoc thi hien thu lai, bam thu lai tai lai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule.mockResolvedValue([]);
    api.getStudentEnrollments
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce([MATH_ACTIVE]);
    const { user } = await renderCourses();

    await user.press(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('1 môn học')).toBeOnTheScreen();
    expect(api.getStudentEnrollments).toHaveBeenCalledTimes(2);
  });
});
