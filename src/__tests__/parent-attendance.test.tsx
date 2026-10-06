import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentSchedule } from '@/features/parent-dashboard/components/parent-schedule';
import type { AttendanceRecord, LinkedStudent } from '@/features/parent-dashboard/types';
import { formatNextSession } from '@/features/parent-dashboard/utils';
import { AppError } from '@/types/api';
import { formatWeekdayDate } from '@/utils/format';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getStudentSchedule: jest.fn(),
    getStudentAttendance: jest.fn(),
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

const MATH = { className: 'Toán nâng cao 8A2', subjectName: 'Toán', room: 'P.203' };
const PHYSICS = { className: 'Vật lý 8 chuyên sâu', subjectName: 'Vật lý', room: 'Lab 102' };

/** Gio dia phuong nam 2026, de ngay va thang hien tren man hinh khong phu thuoc mui gio. */
function at(month: number, day: number, hours = 18): string {
  return new Date(2026, month - 1, day, hours, 0).toISOString();
}

function record(
  sessionId: string,
  startsAt: string,
  overrides: Partial<AttendanceRecord> = {},
): AttendanceRecord {
  return {
    ...MATH,
    sessionId,
    startsAt,
    endsAt: startsAt,
    kind: 'REGULAR',
    attendance: 'PRESENT',
    leaveReason: null,
    makeup: null,
    originalSession: null,
    ...overrides,
  };
}

const MADE_UP_AT = at(10, 14, 17);
const BOOKED_MAKEUP_AT = at(10, 20, 8);
const MATH_OCT_16 = record('math-oct-16', at(10, 16));

// API tra lung tung thu tu, man hinh phai tu sap xep
const MINH_ANH_RECORDS: AttendanceRecord[] = [
  record('math-sep-26', at(9, 26), { attendance: 'ABSENT' }),
  MATH_OCT_16,
  record('physics-oct-12', at(10, 12, 17), {
    ...PHYSICS,
    attendance: 'EXCUSED',
    leaveReason: 'Con bị ốm, đã báo giáo vụ',
    makeup: { status: 'COMPLETED', startsAt: MADE_UP_AT },
  }),
  record('physics-oct-14', MADE_UP_AT, {
    ...PHYSICS,
    kind: 'MAKEUP',
    originalSession: { startsAt: at(10, 12, 17) },
  }),
  record('physics-oct-05', at(10, 5, 17), {
    ...PHYSICS,
    attendance: 'EXCUSED',
    leaveReason: 'Gia đình có việc',
    makeup: { status: 'BOOKED', startsAt: BOOKED_MAKEUP_AT },
  }),
  record('math-oct-09', at(10, 9)),
  record('math-sep-30', at(9, 30)),
];

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  api.getStudentSchedule.mockResolvedValue([]);
  api.getStudentAttendance.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id
      ? MINH_ANH_RECORDS
      : [
          record('english-oct-15', at(10, 15), {
            className: 'Tiếng Anh 6A1',
            subjectName: 'Tiếng Anh',
          }),
        ],
  );
}

async function renderAttendance() {
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
    await screen.findByRole('tab', { name: 'Điểm danh' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  );
  return { ...handlers, user };
}

/** Tieu de cac thang theo thu tu tren man hinh. */
function monthTitles() {
  return screen
    .getAllByRole('header')
    .map((header) => header.props.children)
    .filter((title) => title !== 'Lịch học');
}

describe('features/parent-dashboard/StudentAttendance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tong quan chuyen can, chia theo thang moi nhat truoc, an nut chon tuan', async () => {
    mockTwoChildren();
    await renderAttendance();

    // 3 buoi co mat + 1 buoi hoc bu tren 7 buoi da diem danh
    expect(await screen.findByText('57%')).toBeOnTheScreen();
    expect(screen.getByText('Vắng nhiều')).toBeOnTheScreen();
    expect(screen.getByText('Tỷ lệ đi học từ 26/09/2026')).toBeOnTheScreen();
    expect(screen.getByLabelText('Có mặt: 3, buổi')).toBeOnTheScreen();
    expect(screen.getByLabelText('Vắng: 3, 2 có phép')).toBeOnTheScreen();
    expect(screen.getByLabelText('Học bù: 1, hoàn thành')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Điểm danh' })).toBeSelected();
    expect(screen.queryByRole('button', { name: /^Chọn tuần/ })).not.toBeOnTheScreen();
    expect(api.getStudentAttendance).toHaveBeenCalledWith(MINH_ANH.id);

    expect(monthTitles()).toEqual(['Tháng 10/2026', 'Tháng 09/2026']);
    expect(screen.getByText('5 buổi · 2 có mặt, 2 vắng, 1 học bù')).toBeOnTheScreen();
    expect(screen.getByText('2 buổi · 1 có mặt, 1 vắng')).toBeOnTheScreen();
  });

  it('the buoi vang ghi ro ly do, lich hoc bu; buoi hoc bu tro ve buoi vang', async () => {
    mockTwoChildren();
    await renderAttendance();
    await screen.findByText('57%');

    // Buoi 12/10 da hoc bu xong nen chi con buoi 05/10 hien nghi co phep
    expect(screen.getByText('Đã học bù')).toBeOnTheScreen();
    expect(screen.getAllByText('Nghỉ có phép')).toHaveLength(1);
    expect(screen.getByText('Vắng mặt')).toBeOnTheScreen();

    expect(screen.getByText('Con bị ốm, đã báo giáo vụ')).toBeOnTheScreen();
    expect(
      screen.getByText(`Đã hoàn thành học bù: ${formatNextSession(MADE_UP_AT)}`),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(`Lịch học bù: ${formatNextSession(BOOKED_MAKEUP_AT)}`),
    ).toBeOnTheScreen();
    expect(screen.getByText('Học bù cho buổi nghỉ ngày 12/10')).toBeOnTheScreen();
    expect(screen.getAllByText('Phòng Lab 102')).toHaveLength(3);
  });

  it('loc theo mon: chi con buoi cua mon do, tong quan giu nguyen', async () => {
    mockTwoChildren();
    const { user } = await renderAttendance();

    expect(await screen.findByText('2 môn')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Lọc: Vật lý' }));

    expect(monthTitles()).toEqual(['Tháng 10/2026']);
    expect(screen.getByText('3 buổi · 2 vắng, 1 học bù')).toBeOnTheScreen();
    expect(screen.queryByText('Vắng mặt')).not.toBeOnTheScreen();
    expect(screen.getByText('57%')).toBeOnTheScreen();
  });

  it('bam mot buoi thi mo chi tiet dung buoi cua dung con', async () => {
    mockTwoChildren();
    const { onOpenSession, user } = await renderAttendance();
    await screen.findByText('57%');

    // Ten nut ghep tu chu trong the, co ca ky tu icon
    await user.press(
      screen.getByRole('button', { name: new RegExp(formatWeekdayDate(MATH_OCT_16.startsAt)) }),
    );

    expect(onOpenSession).toHaveBeenCalledWith({
      studentId: MINH_ANH.id,
      sessionId: MATH_OCT_16.sessionId,
      startsAt: MATH_OCT_16.startsAt,
    });
  });

  it('doi con thi tai diem danh cua con do; con hoc mot mon thi khong can loc', async () => {
    mockTwoChildren();
    const { user } = await renderAttendance();
    await screen.findByText('57%');

    await user.press(screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }));
    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(await screen.findByText('100%')).toBeOnTheScreen();
    expect(screen.getByText('Chuyên cần tốt')).toBeOnTheScreen();
    expect(api.getStudentAttendance).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(screen.queryByRole('button', { name: /^Lọc:/ })).not.toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Điểm danh' })).toBeSelected();
  });

  it('con chua co buoi hoc nao thi bao rong', async () => {
    api.getStudents.mockResolvedValue([HOANG_LONG]);
    api.getStudentSchedule.mockResolvedValue([]);
    api.getStudentAttendance.mockResolvedValue([]);
    await renderAttendance();

    expect(await screen.findByText('Chưa có buổi học nào')).toBeOnTheScreen();
    expect(screen.getByText(/^Kết quả điểm danh của Hoàng Long/)).toBeOnTheScreen();
  });

  it('loi tai diem danh thi hien thu lai, bam thu lai tai lai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentSchedule.mockResolvedValue([]);
    api.getStudentAttendance
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce(MINH_ANH_RECORDS);
    const { user } = await renderAttendance();

    await user.press(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('57%')).toBeOnTheScreen();
    expect(api.getStudentAttendance).toHaveBeenCalledTimes(2);
  });
});
