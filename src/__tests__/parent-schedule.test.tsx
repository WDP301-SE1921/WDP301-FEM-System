import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentSchedule } from '@/features/parent-dashboard/components/parent-schedule';
import type { LinkedStudent, ScheduleSession } from '@/features/parent-dashboard/types';
import { formatWeekRange, getWeekRange } from '@/features/parent-dashboard/utils';
import { AppError } from '@/types/api';
import { addDays, startOfDay, startOfWeek, toDateKey } from '@/utils/date';
import { formatWeekdayDate } from '@/utils/format';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentSchedule: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const DAYS_PER_WEEK = 7;

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

// Lich tinh theo ngay chay test: hom nay co buoi Toan, mot ngay khac trong tuan co buoi hoc bu
const TODAY = startOfDay(new Date());
const WEEK_START = startOfWeek(TODAY);
const OTHER_DAY = toDateKey(WEEK_START) === toDateKey(TODAY) ? addDays(TODAY, 1) : WEEK_START;
const FREE_DAY = Array.from({ length: DAYS_PER_WEEK }, (_, offset) =>
  addDays(WEEK_START, offset),
).find((date) => ![TODAY, OTHER_DAY].some((busy) => toDateKey(busy) === toDateKey(date)));

function at(date: Date, hours: number, minutes = 0): string {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

const MATH_TODAY: ScheduleSession = {
  id: 'session-math',
  className: 'Toán nâng cao 8A2',
  subjectName: 'Toán',
  startsAt: at(TODAY, 18),
  endsAt: at(TODAY, 19, 30),
  room: 'P.203',
  teacherName: 'Đặng Hải Yến',
  type: 'REGULAR',
  topic: 'Đại số',
  note: null,
};
const PHYSICS_MAKEUP: ScheduleSession = {
  id: 'session-physics',
  className: 'Vật lý 8 chuyên sâu',
  subjectName: 'Vật lý',
  startsAt: at(OTHER_DAY, 8, 30),
  endsAt: at(OTHER_DAY, 10),
  room: 'Lab 102',
  teacherName: 'Trần Quang Huy',
  type: 'MAKEUP',
  topic: null,
  note: 'Bù cho buổi nghỉ ngày 12/10',
};

/** Nut ngay tren thanh chon ngay; nhan bat dau bang "Hôm nay, " neu la hom nay. */
function dayButton(date: Date) {
  return screen.getByRole('button', {
    name: new RegExp(`^(Hôm nay, )?${formatWeekdayDate(date)}`),
  });
}

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  api.getStudentSchedule.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? [PHYSICS_MAKEUP, MATH_TODAY] : [],
  );
}

async function renderSchedule() {
  const handlers = { onAddChild: jest.fn(), onOpenAssignments: jest.fn() };
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentSchedule {...handlers} />
    </QueryClientProvider>,
  );
  return { ...handlers, user: userEvent.setup() };
}

async function waitForTodaySession() {
  expect(
    await screen.findByText('Toán nâng cao 8A2 – Đại số', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  ).toBeOnTheScreen();
}

describe('features/parent-dashboard/ParentSchedule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mo tuan hien tai cua con dau tien, chon san hom nay', async () => {
    mockTwoChildren();
    await renderSchedule();
    await waitForTodaySession();

    expect(api.getStudentSchedule).toHaveBeenCalledWith(MINH_ANH.id, getWeekRange(WEEK_START));
    expect(screen.getByText(`Tuần: ${formatWeekRange(WEEK_START)}`)).toBeOnTheScreen();
    expect(screen.getByText('Hôm nay')).toBeOnTheScreen();
    expect(screen.getByText('1 buổi học')).toBeOnTheScreen();
    expect(screen.getByText('Phòng P.203')).toBeOnTheScreen();
    expect(dayButton(TODAY)).toBeSelected();
    // Buoi hoc bu cua ngay khac chi hien khi chon ngay do
    expect(screen.queryByText('Học bù')).not.toBeOnTheScreen();
  });

  it('chon ngay khac xem buoi hoc bu; ngay nghi goi y xem bai tap', async () => {
    mockTwoChildren();
    const { onOpenAssignments, user } = await renderSchedule();
    await waitForTodaySession();

    await user.press(dayButton(OTHER_DAY));

    expect(dayButton(OTHER_DAY)).toBeSelected();
    expect(screen.getByText('Học bù')).toBeOnTheScreen();
    expect(screen.getByText('Bù cho buổi nghỉ ngày 12/10')).toBeOnTheScreen();
    expect(screen.queryByText('Toán nâng cao 8A2 – Đại số')).not.toBeOnTheScreen();

    if (!FREE_DAY) throw new Error('Tuan phai con ngay nghi');
    await user.press(dayButton(FREE_DAY));

    expect(screen.getByText('Ngày này con không có buổi học')).toBeOnTheScreen();
    expect(screen.getByText('0 buổi học')).toBeOnTheScreen();
    // Ten nut co ky tu icon dung truoc chu
    await user.press(screen.getByRole('button', { name: /Xem bài tập về nhà$/ }));
    expect(onOpenAssignments).toHaveBeenCalledTimes(1);
    // Chuyen ngay trong tuan khong goi lai API
    expect(api.getStudentSchedule).toHaveBeenCalledTimes(1);
  });

  it('doi tuan tu sheet: tai lich tuan sau va chon san Thu Hai', async () => {
    mockTwoChildren();
    const { user } = await renderSchedule();
    await waitForTodaySession();
    const nextWeekStart = addDays(WEEK_START, DAYS_PER_WEEK);
    const nextWeekRange = formatWeekRange(nextWeekStart);

    await user.press(screen.getByRole('button', { name: /^Chọn tuần/ }));
    expect(
      screen.getByRole('radio', { name: `Tuần này, ${formatWeekRange(WEEK_START)}` }),
    ).toBeChecked();

    await user.press(screen.getByRole('radio', { name: `Tuần sau, ${nextWeekRange}` }));

    expect(await screen.findByText(`Tuần: ${nextWeekRange}`)).toBeOnTheScreen();
    expect(screen.queryByText('Xem lịch học của con theo từng tuần')).not.toBeOnTheScreen();
    expect(api.getStudentSchedule).toHaveBeenLastCalledWith(
      MINH_ANH.id,
      getWeekRange(nextWeekStart),
    );
    expect(dayButton(nextWeekStart)).toBeSelected();
  });

  it('doi con tu nut tren cung thi tai lich cua con do', async () => {
    mockTwoChildren();
    const { user } = await renderSchedule();
    await waitForTodaySession();

    await user.press(screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }));
    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText('Hôm nay con không có buổi học')).toBeOnTheScreen();
    expect(screen.getByText(/^Hoàng Long có thể dành thời gian nghỉ ngơi/)).toBeOnTheScreen();
    expect(api.getStudentSchedule).toHaveBeenLastCalledWith(
      HOANG_LONG.id,
      getWeekRange(WEEK_START),
    );
    expect(
      screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Hoàng Long' }),
    ).toBeOnTheScreen();
  });

  it('chua lien ket con: an nut chon tuan, hien nut nhap ma', async () => {
    api.getStudents.mockResolvedValue([]);
    const { onAddChild, user } = await renderSchedule();

    expect(await screen.findByText('Chưa liên kết học sinh')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Chọn tuần/ })).not.toBeOnTheScreen();
    expect(api.getStudentSchedule).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Nhập mã liên kết' }));
    expect(onAddChild).toHaveBeenCalledTimes(1);
  });

  it('loi tai lich thi hien thu lai, bam thu lai tai lai lich', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce([MATH_TODAY]);
    const { user } = await renderSchedule();

    await user.press(
      await screen.findByRole('button', { name: 'Thử lại' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    await waitForTodaySession();
    expect(api.getStudentSchedule).toHaveBeenCalledTimes(2);
  });
});
