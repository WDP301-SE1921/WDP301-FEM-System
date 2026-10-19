import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentDashboard } from '@/features/parent-dashboard/components/parent-dashboard';
import type {
  LinkedStudent,
  ScheduleSession,
  StudentDashboard,
} from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';
import { toDateKey } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentDashboard: jest.fn(),
    getStudentSchedule: jest.fn(),
    getAttendanceSummary: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
  },
}));

// Jest khong tim thay `@/assets/*`, xem dau `src/constants/images.ts`
jest.mock('@/constants/images', () => ({ Images: { logo: 1 } }));

const api = jest.mocked(parentDashboardApi);

/**
 * Lan render day du dau tien phai transform nhieu module; khi cache cua Jest con trong (CI)
 * mat hon 1 giay mac dinh cua findBy.
 */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const HOUR_MS = 60 * 60 * 1000;

/** Nut "Chuẩn bị bài" chi hien voi buoi sap dien ra nen gio hoc tinh tu thoi diem chay test. */
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * HOUR_MS).toISOString();
}

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

/** Buoi hom nay lay tu lich hoc cua BE: chua co phong va ten giao vien. */
const MINH_ANH_TODAY: ScheduleSession[] = [
  {
    id: 'session-1',
    className: 'Toán nâng cao 8A2',
    subjectName: 'Toán',
    startsAt: hoursFromNow(2),
    endsAt: hoursFromNow(3),
    room: null,
    teacherName: null,
    type: 'REGULAR',
    topic: 'Phương trình bậc nhất',
    note: null,
  },
];

const MINH_ANH_DASHBOARD: StudentDashboard = {
  scoreSummary: { average: 8.2, changeFromLastMonth: 0.4 },
  attentionItems: [
    { id: 'attention-1', type: 'TUITION', title: 'Học phí tháng 10', description: 'Chưa đóng' },
    {
      id: 'attention-2',
      type: 'ASSIGNMENT',
      title: 'Bài tập Toán Đại số',
      description: 'Hạn nộp: 23:59, 20/10',
    },
  ],
  recentNotifications: [
    {
      id: 'notification-1',
      type: 'ATTENDANCE',
      title: 'Đã điểm danh buổi học Toán',
      message: 'Minh Anh đã có mặt đúng giờ.',
      createdAt: hoursFromNow(-2),
    },
  ],
};

const EMPTY_DASHBOARD: StudentDashboard = {
  scoreSummary: null,
  attentionItems: [],
  recentNotifications: [],
};

const MINH_ANH_BUTTON = 'Nguyễn Minh Anh, lớp 8';
const HOANG_LONG_BUTTON = 'Nguyễn Hoàng Long, lớp 6';
const SHEET_SUBTITLE = 'Chuyển hồ sơ để theo dõi tình hình học tập';
/**
 * Nut them con trong sheet: icon trong Button la Text chua glyph nen ten co ky tu dung truoc chu,
 * phan biet voi o "Thêm học sinh" cua thanh chon con.
 */
const SHEET_ADD_CHILD_BUTTON_NAME = /.Thêm học sinh$/;

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  api.getStudentDashboard.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? MINH_ANH_DASHBOARD : EMPTY_DASHBOARD,
  );
}

/** Ty le di hoc lay tu diem danh cua BE, khong nam trong tong quan mock. */
function mockAttendance() {
  api.getAttendanceSummary.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id
      ? { attendedSessions: 16, totalSessions: 17 }
      : { attendedSessions: 0, totalSessions: 0 },
  );
}

function mockTodaySessions(sessions: ScheduleSession[] = MINH_ANH_TODAY) {
  api.getStudentSchedule.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? sessions : [],
  );
}

async function renderDashboard() {
  const handlers = {
    onAddChild: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenAssignments: jest.fn(),
  };
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentDashboard parentName="Phạm Thu Hà" parentEmail="phuhuynh@example.com" {...handlers} />
    </QueryClientProvider>,
  );
  return { ...handlers, user: userEvent.setup() };
}

async function waitForMinhAnhDashboard() {
  expect(
    await screen.findByText('Toán nâng cao 8A2', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  ).toBeOnTheScreen();
}

describe('features/parent-dashboard/ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 0 });
    mockTodaySessions();
    mockAttendance();
  });

  it('xem con dau tien, bam con khac thi tai tong quan cua con do', async () => {
    mockTwoChildren();
    const { user } = await renderDashboard();

    await waitForMinhAnhDashboard();
    expect(screen.getByText('Chào Hà 👋')).toBeOnTheScreen();
    // Buoi hom nay lay tu lich hoc cua BE, chua co ten giao vien nen chi hien mon
    expect(api.getStudentSchedule).toHaveBeenCalledWith(MINH_ANH.id, {
      from: toDateKey(new Date()),
      to: toDateKey(new Date()),
    });
    expect(screen.getByText('Môn Toán')).toBeOnTheScreen();
    expect(screen.getByText('94%')).toBeOnTheScreen();
    expect(screen.getByText('Đã học 16/17 buổi')).toBeOnTheScreen();
    expect(api.getAttendanceSummary).toHaveBeenCalledWith(MINH_ANH.id);
    expect(screen.getByText('Tốt')).toBeOnTheScreen();
    expect(screen.getByText('Học phí tháng 10')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: MINH_ANH_BUTTON })).toBeSelected();

    await user.press(screen.getByRole('button', { name: HOANG_LONG_BUTTON }));

    expect(await screen.findByText('Hôm nay học sinh không có buổi học nào.')).toBeOnTheScreen();
    expect(api.getStudentSchedule).toHaveBeenLastCalledWith(HOANG_LONG.id, {
      from: toDateKey(new Date()),
      to: toDateKey(new Date()),
    });
    expect(screen.getByText('Chưa có điểm')).toBeOnTheScreen();
    expect(screen.getByText('Chưa có buổi học nào')).toBeOnTheScreen();
    expect(screen.queryByText('Cần chú ý')).not.toBeOnTheScreen();
    expect(api.getStudentDashboard).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(screen.getByRole('button', { name: HOANG_LONG_BUTTON })).toBeSelected();
  });

  it('mo sheet tu avatar tren cung, chon con khac thi dong sheet va doi tong quan', async () => {
    mockTwoChildren();
    const { user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(
      screen.getByRole('button', { name: 'Chọn học sinh, đang xem Nguyễn Minh Anh' }),
    );

    expect(screen.getByText(SHEET_SUBTITLE)).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Nguyễn Minh Anh, khối 8' })).toBeChecked();
    expect(screen.getByText('Vật lý')).toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText('Hôm nay học sinh không có buổi học nào.')).toBeOnTheScreen();
    expect(screen.queryByText(SHEET_SUBTITLE)).not.toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Chọn học sinh, đang xem Nguyễn Hoàng Long' }),
    ).toBeOnTheScreen();
  });

  it('them con tu thanh chon con va tu sheet, sheet dong truoc khi roi trang', async () => {
    mockTwoChildren();
    const { onAddChild, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(screen.getByRole('button', { name: 'Thêm học sinh' }));
    expect(onAddChild).toHaveBeenCalledTimes(1);

    await user.press(
      screen.getByRole('button', { name: 'Chọn học sinh, đang xem Nguyễn Minh Anh' }),
    );
    await user.press(screen.getByRole('button', { name: SHEET_ADD_CHILD_BUTTON_NAME }));

    expect(onAddChild).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(SHEET_SUBTITLE)).not.toBeOnTheScreen();
  });

  it('chuong bao so chua doc; cac nut tren the mo trang thong bao va bai tap', async () => {
    mockTwoChildren();
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 2 });
    const { onOpenNotifications, onOpenAssignments, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' }));
    await user.press(screen.getByRole('button', { name: 'Xem tất cả thông báo' }));
    expect(onOpenNotifications).toHaveBeenCalledTimes(2);

    await user.press(
      screen.getByRole('button', { name: 'Chuẩn bị bài cho buổi Toán nâng cao 8A2' }),
    );
    await user.press(screen.getByRole('button', { name: 'Xem bài: Bài tập Toán Đại số' }));
    expect(onOpenAssignments).toHaveBeenCalledTimes(2);

    // Hoc phi dong tai trung tam nen khong co nut thanh toan
    expect(screen.queryByRole('button', { name: /Học phí/ })).not.toBeOnTheScreen();
  });

  it('khong co nut chuan bi bai khi buoi hoc da bat dau', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentDashboard.mockResolvedValue(MINH_ANH_DASHBOARD);
    mockTodaySessions(
      MINH_ANH_TODAY.map((session) => ({ ...session, startsAt: hoursFromNow(-1) })),
    );
    await renderDashboard();
    await waitForMinhAnhDashboard();

    expect(screen.getByText('Đang diễn ra')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Chuẩn bị bài/ })).not.toBeOnTheScreen();
  });

  it('con chua co mon dang hoc thi chi cach dang ky tai trung tam kem email phu huynh', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH, { ...HOANG_LONG, subjectNames: [] }]);
    api.getStudentDashboard.mockImplementation(async (studentId) =>
      studentId === MINH_ANH.id ? MINH_ANH_DASHBOARD : EMPTY_DASHBOARD,
    );
    const { user } = await renderDashboard();
    await waitForMinhAnhDashboard();
    expect(screen.queryByText('Chưa có môn đang học')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: HOANG_LONG_BUTTON }));

    expect(await screen.findByText('Chưa có môn đang học')).toBeOnTheScreen();
    expect(screen.getByText(/^Để đăng ký môn cho Hoàng Long, đến trung tâm/)).toBeOnTheScreen();
    expect(screen.getByText('phuhuynh@example.com')).toBeOnTheScreen();
  });

  it('chua co con: man hinh rong kem nut them con, dem thong bao loi khong chan trang', async () => {
    api.getStudents.mockResolvedValue([]);
    api.getUnreadNotificationCount.mockRejectedValue(new AppError('Lỗi máy chủ', 500));
    const { onAddChild, user } = await renderDashboard();

    expect(await screen.findByText('Chưa có hồ sơ học sinh')).toBeOnTheScreen();
    expect(api.getStudentDashboard).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Thông báo' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Chọn học sinh/ })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Thêm học sinh' }));
    expect(onAddChild).toHaveBeenCalledTimes(1);
  });

  it('hien loi va tai lai khi bam thu lai', async () => {
    api.getStudents
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce([]);
    const { user } = await renderDashboard();

    await user.press(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Chưa có hồ sơ học sinh')).toBeOnTheScreen();
    expect(api.getStudents).toHaveBeenCalledTimes(2);
  });
});
