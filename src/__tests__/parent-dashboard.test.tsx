import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { NotificationBell } from '@/features/parent-dashboard/components/notification-bell';
import { ParentDashboard } from '@/features/parent-dashboard/components/parent-dashboard';
import type {
  AppNotification,
  LinkedStudent,
  ScheduleSession,
  StudentAssignment,
  StudentGrades,
  TuitionBill,
} from '@/features/parent-dashboard/types';
import { useStudentSelectionStore } from '@/store/student-selection-store';
import { AppError } from '@/types/api';
import { toDateKey } from '@/utils/date';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentSchedule: jest.fn(),
    getAttendanceSummary: jest.fn(),
    getStudentGrades: jest.fn(),
    getStudentAssignments: jest.fn(),
    getStudentBills: jest.fn(),
    getRecentNotifications: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
    markNotificationRead: jest.fn(),
  },
}));

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

const MINH_ANH_TODAY: ScheduleSession[] = [
  {
    id: 'session-1',
    className: 'Toán nâng cao 8A2',
    subjectName: 'Toán',
    startsAt: hoursFromNow(2),
    endsAt: hoursFromNow(3),
    room: 'Phòng A101',
    teacherName: 'Đặng Hải Yến',
    type: 'REGULAR',
    topic: 'Phương trình bậc nhất',
    note: null,
  },
];

const MINH_ANH_GRADES: StudentGrades = {
  summary: { average: 8.2, gradedCount: 3, changeFromLastMonth: 0.4 },
  subjects: [{ subject: 'Toán', count: 3, averageOutOf10: 8.2 }],
};
const NO_GRADES: StudentGrades = { summary: null, subjects: [] };

const UNPAID_BILL: TuitionBill = {
  registrationId: 'order-1',
  status: 'UNPAID',
  issuedAt: hoursFromNow(-24),
  student: { id: MINH_ANH.id, fullName: MINH_ANH.fullName, grade: 8 },
  class: { id: 'class-math', name: 'Toán nâng cao 8A2', subject: 'Toán', grade: 8, schedules: [] },
  term: { packageMonths: 3, startDate: '2026-10-06', endDate: '2027-01-06' },
  pricing: { monthlyFee: '800000.00', packageMonths: 3, total: '2400000.00', currency: 'VND' },
  payment: null,
};

/** Bai chua nop, het han trong ngay mai nen la viec can chu y. */
const DUE_SOON: StudentAssignment = {
  id: 'assignment-1',
  testType: null,
  title: 'Bài tập Toán Đại số',
  subjectName: 'Toán',
  className: 'Toán nâng cao 8A2',
  teacherName: 'Đặng Hải Yến',
  dueAt: hoursFromNow(24),
  maxAttempts: 1,
  questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 1 },
  submission: null,
  grade: null,
};

const GRADE_NOTIFICATION: AppNotification = {
  id: 'notification-1',
  type: 'GRADE_PUBLISHED',
  title: 'Cập nhật học tập',
  body: 'Bài tập Toán Đại số: Giáo viên đã công bố kết quả bài làm.',
  target: { kind: 'ASSIGNMENT', id: 'assignment-1' },
  context: { classId: 'class-math', studentIds: [MINH_ANH.id] },
  createdAt: hoursFromNow(-2),
  readAt: null,
};

const SHEET_SUBTITLE = 'Chuyển hồ sơ để theo dõi tình hình học tập';
/** Nut them con trong sheet: icon trong Button la Text chua glyph nen ten co ky tu dung truoc chu. */
const SHEET_ADD_CHILD_BUTTON_NAME = /.Thêm học sinh$/;

/** Ten nut thanh chon con dau trang, mo sheet chon con. */
function switcherName(student: LinkedStudent): string {
  return `Chọn học sinh, đang xem ${student.fullName}`;
}

/** Minh Anh co diem, bill chua dong, bai sap het han va thong bao; Hoang Long chua co gi. */
function mockStudentData() {
  const isMinhAnh = (studentId: string) => studentId === MINH_ANH.id;
  api.getStudentSchedule.mockImplementation(async (studentId) =>
    isMinhAnh(studentId) ? MINH_ANH_TODAY : [],
  );
  api.getAttendanceSummary.mockImplementation(async (studentId) =>
    isMinhAnh(studentId)
      ? { attendedSessions: 16, totalSessions: 17 }
      : { attendedSessions: 0, totalSessions: 0 },
  );
  api.getStudentGrades.mockImplementation(async (studentId) =>
    isMinhAnh(studentId) ? MINH_ANH_GRADES : NO_GRADES,
  );
  api.getStudentBills.mockImplementation(async (studentId) =>
    isMinhAnh(studentId) ? [UNPAID_BILL] : [],
  );
  api.getStudentAssignments.mockImplementation(async (studentId) =>
    isMinhAnh(studentId) ? [DUE_SOON] : [],
  );
  api.getRecentNotifications.mockImplementation(async (studentId) =>
    isMinhAnh(studentId) ? [GRADE_NOTIFICATION] : [],
  );
}

async function renderWithQueryClient(element: ReactElement) {
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  await render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
}

async function renderDashboard() {
  const handlers = {
    onAddChild: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenDestination: jest.fn(),
  };
  await renderWithQueryClient(<ParentDashboard parentEmail="phuhuynh@example.com" {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
}

/** Doi con qua thanh chon con dau trang roi chon trong sheet. */
async function switchStudent(
  user: ReturnType<typeof userEvent.setup>,
  from: LinkedStudent,
  to: LinkedStudent,
) {
  await user.press(screen.getByRole('button', { name: switcherName(from) }));
  await user.press(screen.getByRole('radio', { name: `${to.fullName}, khối ${to.grade}` }));
}

/**
 * Phan phu (diem, viec can chu y, thong bao) tu tai sau phan chinh: doi tai xong de lan cap nhat cuoi
 * khong roi ra ngoai test.
 */
async function waitForSecondarySections() {
  await waitFor(() => expect(screen.queryByText(/^Đang tải/)).not.toBeOnTheScreen());
}

async function waitForMinhAnhDashboard() {
  expect(
    await screen.findByText('Phòng A101', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  ).toBeOnTheScreen();
  // Minh Anh luon co bai sap het han nen the "Cần chú ý" luon hien khi tai xong
  expect(await screen.findByText('Cần chú ý')).toBeOnTheScreen();
  await waitForSecondarySections();
}

// Con dang xem dung chung moi tab (store toan cuc): moi test bat dau tu con dau tien
afterEach(() => useStudentSelectionStore.setState({ selectedStudentId: null }));

describe('features/parent-dashboard/ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 0 });
    api.markNotificationRead.mockResolvedValue({ ...GRADE_NOTIFICATION, readAt: hoursFromNow(0) });
    mockStudentData();
  });

  it('xem con dau tien, doi con thi tai tong quan cua con do', async () => {
    const { user } = await renderDashboard();

    await waitForMinhAnhDashboard();
    expect(api.getStudentSchedule).toHaveBeenCalledWith(MINH_ANH.id, {
      from: toDateKey(new Date()),
      to: toDateKey(new Date()),
    });
    expect(screen.getByText('Đặng Hải Yến')).toBeOnTheScreen();
    expect(screen.getByText('94%')).toBeOnTheScreen();
    expect(screen.getByText('Đã học 16/17 buổi')).toBeOnTheScreen();
    // Phan phu tu tai sau phan chinh
    expect(await screen.findByText('8.2')).toBeOnTheScreen();
    expect(screen.getByText('+0.4 so với tháng trước')).toBeOnTheScreen();
    // Viec can chu y ghep tu bill chua thanh toan va bai sap het han
    expect(await screen.findByText('Học phí lớp Toán nâng cao 8A2')).toBeOnTheScreen();
    expect(screen.getByText('Bài tập Toán Đại số')).toBeOnTheScreen();
    expect(await screen.findByText(GRADE_NOTIFICATION.body)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: switcherName(MINH_ANH) })).toBeOnTheScreen();

    await switchStudent(user, MINH_ANH, HOANG_LONG);

    expect(await screen.findByText('Hôm nay học sinh không có buổi học nào.')).toBeOnTheScreen();
    expect(api.getStudentSchedule).toHaveBeenLastCalledWith(HOANG_LONG.id, {
      from: toDateKey(new Date()),
      to: toDateKey(new Date()),
    });
    expect(await screen.findByText('Chưa có điểm')).toBeOnTheScreen();
    expect(screen.getByText('Chưa có buổi học nào')).toBeOnTheScreen();
    expect(await screen.findByText('Chưa có thông báo mới.')).toBeOnTheScreen();
    expect(screen.queryByText('Cần chú ý')).not.toBeOnTheScreen();
    expect(api.getRecentNotifications).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(screen.getByRole('button', { name: switcherName(HOANG_LONG) })).toBeOnTheScreen();
  });

  it('mo sheet tu thanh chon con, chon con khac thi dong sheet va doi tong quan', async () => {
    const { user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(screen.getByRole('button', { name: switcherName(MINH_ANH) }));

    expect(screen.getByText(SHEET_SUBTITLE)).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Nguyễn Minh Anh, khối 8' })).toBeChecked();
    expect(screen.getByText('Vật lý')).toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText('Hôm nay học sinh không có buổi học nào.')).toBeOnTheScreen();
    expect(screen.queryByText(SHEET_SUBTITLE)).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: switcherName(HOANG_LONG) })).toBeOnTheScreen();
    await waitForSecondarySections();
  });

  it('them con tu sheet chon con, sheet dong truoc khi roi trang', async () => {
    const { onAddChild, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(screen.getByRole('button', { name: switcherName(MINH_ANH) }));
    await user.press(screen.getByRole('button', { name: SHEET_ADD_CHILD_BUTTON_NAME }));

    expect(onAddChild).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(SHEET_SUBTITLE)).not.toBeOnTheScreen();
  });

  it('cac nut tren the mo trang thong bao va bai tap', async () => {
    const { onOpenNotifications, onOpenDestination, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(screen.getByRole('button', { name: 'Xem tất cả thông báo' }));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);

    await user.press(
      screen.getByRole('button', { name: 'Chuẩn bị bài cho buổi Toán nâng cao 8A2' }),
    );
    expect(onOpenDestination).toHaveBeenLastCalledWith({
      kind: 'ASSIGNMENTS',
      studentId: MINH_ANH.id,
      tab: 'TODO',
    });
  });

  it('bam the nao cung mo dung phan chi tiet cua con dang xem', async () => {
    const { onOpenDestination, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(screen.getByRole('button', { name: /^Buổi học hôm nay: Toán nâng cao 8A2/ }));
    expect(onOpenDestination).toHaveBeenLastCalledWith({
      kind: 'SESSION',
      studentId: MINH_ANH.id,
      sessionId: 'session-1',
    });

    await user.press(screen.getByRole('button', { name: 'Tỷ lệ đi học 94%' }));
    expect(onOpenDestination).toHaveBeenLastCalledWith({
      kind: 'SCHEDULE',
      studentId: MINH_ANH.id,
      view: 'ATTENDANCE',
    });

    await user.press(
      await screen.findByRole('button', {
        name: 'Điểm trung bình 8.2, Tốt. Trung bình 3 bài đã chấm',
      }),
    );
    expect(onOpenDestination).toHaveBeenLastCalledWith({
      kind: 'ASSIGNMENTS',
      studentId: MINH_ANH.id,
      tab: 'GRADED',
    });
    expect(screen.getByText('Trung bình 3 bài đã chấm')).toBeOnTheScreen();

    // Viec can chu y mo thang bai tap va bill, khong mo danh sach chung
    await user.press(screen.getByRole('button', { name: 'Làm bài: Bài tập Toán Đại số' }));
    expect(onOpenDestination).toHaveBeenLastCalledWith({
      kind: 'ASSIGNMENT',
      studentId: MINH_ANH.id,
      assignmentId: 'assignment-1',
    });
    await user.press(
      screen.getByRole('button', { name: 'Xem bill: Học phí lớp Toán nâng cao 8A2' }),
    );
    expect(onOpenDestination).toHaveBeenLastCalledWith({ kind: 'BILL', registrationId: 'order-1' });
  });

  it('bam thong bao moi: danh dau da doc va mo bai tap cua con', async () => {
    const { onOpenDestination, user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    await user.press(await screen.findByRole('button', { name: /^Chưa đọc\. Cập nhật học tập/ }));

    expect(api.markNotificationRead).toHaveBeenCalledWith('notification-1');
    expect(onOpenDestination).toHaveBeenCalledWith({
      kind: 'ASSIGNMENT',
      studentId: MINH_ANH.id,
      assignmentId: 'assignment-1',
    });
  });

  it('khong co nut chuan bi bai khi buoi hoc da bat dau', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule.mockResolvedValue(
      MINH_ANH_TODAY.map((session) => ({ ...session, startsAt: hoursFromNow(-1) })),
    );
    await renderDashboard();
    await waitForMinhAnhDashboard();

    expect(screen.getByText('Đang diễn ra')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Chuẩn bị bài/ })).not.toBeOnTheScreen();
  });

  it('buoi hom nay bi huy: bao huy kem ly do, khong co nut chuan bi bai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule.mockResolvedValue(
      MINH_ANH_TODAY.map((session) => ({ ...session, type: 'CANCELLED', note: 'Giáo viên ốm' })),
    );
    await renderDashboard();
    await waitForMinhAnhDashboard();

    expect(screen.getByText('Đã huỷ')).toBeOnTheScreen();
    expect(screen.getByText('Lý do huỷ buổi: Giáo viên ốm')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Chuẩn bị bài/ })).not.toBeOnTheScreen();
  });

  it('diem, hoc phi hay thong bao tai loi thi chi phan do bao loi, cac phan khac van hien', async () => {
    const serverError = new AppError('Lỗi máy chủ', 500);
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentGrades.mockRejectedValueOnce(serverError).mockResolvedValueOnce(MINH_ANH_GRADES);
    api.getRecentNotifications
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce([GRADE_NOTIFICATION]);
    api.getStudentBills.mockRejectedValue(serverError);
    const { user } = await renderDashboard();
    await waitForMinhAnhDashboard();

    expect(await screen.findByText('Không tải được điểm.')).toBeOnTheScreen();
    expect(await screen.findByText('Không tải được thông báo.')).toBeOnTheScreen();
    // Bill loi nhung bai sap het han van hien trong "Cần chú ý"
    expect(await screen.findByText('Không tải được học phí.')).toBeOnTheScreen();
    expect(screen.getByText('Bài tập Toán Đại số')).toBeOnTheScreen();
    expect(screen.getByText('Đã học 16/17 buổi')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Thử lại: Không tải được điểm.' }));
    expect(await screen.findByText('8.2')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Thử lại: Không tải được thông báo.' }));
    expect(await screen.findByText(GRADE_NOTIFICATION.body)).toBeOnTheScreen();
    expect(screen.getByText('Không tải được học phí.')).toBeOnTheScreen();
  });

  it('buoi hom nay tai loi thi ca khoi tong quan bao loi, thu lai thi tai lai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce(MINH_ANH_TODAY);
    const { user } = await renderDashboard();

    const retry = await screen.findByRole(
      'button',
      { name: 'Thử lại' },
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );
    // Phan chinh loi thi chua hien, cung chua tai, cac phan phu
    expect(api.getStudentGrades).not.toHaveBeenCalled();
    await user.press(retry);

    await waitForMinhAnhDashboard();
    expect(screen.getByText('8.2')).toBeOnTheScreen();
  });

  it('con chua co mon dang hoc thi chi cach dang ky tai trung tam kem email phu huynh', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH, { ...HOANG_LONG, subjectNames: [] }]);
    const { user } = await renderDashboard();
    await waitForMinhAnhDashboard();
    expect(screen.queryByText('Chưa có môn đang học')).not.toBeOnTheScreen();

    await switchStudent(user, MINH_ANH, HOANG_LONG);

    expect(await screen.findByText('Chưa có môn đang học')).toBeOnTheScreen();
    expect(screen.getByText(/^Để đăng ký môn cho Hoàng Long, đến trung tâm/)).toBeOnTheScreen();
    expect(screen.getByText('phuhuynh@example.com')).toBeOnTheScreen();
    await waitForSecondarySections();
  });

  it('chua co con: man hinh rong kem nut them con, khong co thanh chon con', async () => {
    api.getStudents.mockResolvedValue([]);
    const { onAddChild, user } = await renderDashboard();

    expect(await screen.findByText('Chưa có hồ sơ học sinh')).toBeOnTheScreen();
    expect(api.getStudentGrades).not.toHaveBeenCalled();
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

describe('features/parent-dashboard/NotificationBell', () => {
  beforeEach(() => jest.clearAllMocks());

  it('bao so thong bao chua doc, bam thi mo trang thong bao', async () => {
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 2 });
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithQueryClient(<NotificationBell onPress={onPress} />);

    await user.press(await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('dem thong bao loi thi chi an so chua doc, nut van bam duoc', async () => {
    api.getUnreadNotificationCount.mockRejectedValue(new AppError('Lỗi máy chủ', 500));
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithQueryClient(<NotificationBell onPress={onPress} />);
    await waitFor(() => expect(api.getUnreadNotificationCount).toHaveBeenCalled());

    await user.press(screen.getByRole('button', { name: 'Thông báo' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
