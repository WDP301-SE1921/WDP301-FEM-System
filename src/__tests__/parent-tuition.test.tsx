import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentTuition } from '@/features/parent-dashboard/components/parent-tuition';
import type {
  LinkedStudent,
  StudentRegistration,
  TuitionClass,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';
import { addDays, startOfDay, toDateKey } from '@/utils/date';
import { formatCurrency, formatDate } from '@/utils/format';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getTuitionEnrollments: jest.fn(),
    getStudentRegistrations: jest.fn(),
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

const today = startOfDay(new Date());

/** Man hinh xet ky hoc theo ngay that, nen ngay cua du lieu tinh tu hom nay. */
function dateColumn(daysFromToday: number): string {
  return `${toDateKey(addDays(today, daysFromToday))}T00:00:00.000Z`;
}

function morningOf(daysFromToday: number): string {
  return new Date(addDays(today, daysFromToday).setHours(9, 30)).toISOString();
}

function classroom(name: string, subject: string, slotsPerWeek: number): TuitionClass {
  return {
    id: `class-${name}`,
    name,
    program: { name: `Chương trình ${subject}`, subject, grade: 8 },
    weeklySchedules: Array.from({ length: slotsPerWeek }, (_, index) => ({
      weekday: index + 1,
      startTime: '18:00',
      endTime: '19:30',
    })),
  };
}

type EnrollmentInput = Pick<TuitionEnrollment, 'id' | 'class' | 'packageMonths'> & {
  status?: TuitionEnrollment['status'];
  /** Ngay bat dau, ngay het han va ngay xac nhan thu tien, tinh tu hom nay. */
  days: readonly [start: number, end: number, confirmed: number];
  receiptNumber: string;
  amount: string;
};

function enrollment({ days, receiptNumber, amount, ...rest }: EnrollmentInput): TuitionEnrollment {
  const [startDay, endDay, confirmedDay] = days;
  return {
    status: 'ACTIVE',
    ...rest,
    registrationOrderId: `order-${rest.id}`,
    startDate: dateColumn(startDay),
    endDate: dateColumn(endDay),
    activatedAt: morningOf(confirmedDay),
    registrationOrder: {
      payment: {
        id: `payment-${rest.id}`,
        amount,
        currency: 'VND',
        status: 'CONFIRMED',
        confirmedAt: morningOf(confirmedDay),
        receiptNumber,
      },
    },
  };
}

const MATH = enrollment({
  id: 'math',
  class: classroom('Toán nâng cao 8A2', 'Toán', 3),
  packageMonths: 3,
  days: [-21, 70, -24],
  receiptNumber: 'PT-1082',
  amount: '3600000',
});
const PHYSICS_UPCOMING = enrollment({
  id: 'physics',
  class: classroom('Vật lý 8 chuyên sâu', 'Vật lý', 2),
  packageMonths: 3,
  days: [5, 96, -1],
  receiptNumber: 'PT-1090',
  amount: '2400000',
});
const LITERATURE_ENDED = enrollment({
  id: 'literature',
  status: 'ENDED',
  class: classroom('Ngữ văn 8 ôn hè', 'Ngữ văn', 2),
  packageMonths: 2,
  days: [-94, -33, -97],
  receiptNumber: 'PT-0741',
  amount: '1800000',
});
const ENGLISH = enrollment({
  id: 'english',
  class: classroom('Tiếng Anh 6A1', 'Tiếng Anh', 2),
  packageMonths: 3,
  days: [-42, 50, -45],
  receiptNumber: 'PT-0893',
  amount: '3000000',
});

const GEOMETRY_DRAFT: StudentRegistration = {
  id: 'order-geometry',
  status: 'DRAFT',
  packageMonths: 2,
  quotedAmount: '1200000',
  currency: 'VND',
  startDate: dateColumn(6),
  endDate: dateColumn(67),
  createdAt: morningOf(-1),
  class: classroom('Hình học 8 bổ trợ', 'Toán', 1),
};
/** Don da thu tien da co goi hoc, khong con cho xac nhan. */
const MATH_COMPLETED: StudentRegistration = {
  ...GEOMETRY_DRAFT,
  id: MATH.registrationOrderId,
  status: 'COMPLETED',
  class: MATH.class,
};

function mockTwoChildren() {
  api.getStudents.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  // API tra lung tung thu tu, man hinh phai tu sap xep lich su
  api.getTuitionEnrollments.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? [LITERATURE_ENDED, MATH, PHYSICS_UPCOMING] : [ENGLISH],
  );
  api.getStudentRegistrations.mockImplementation(async (studentId) =>
    studentId === MINH_ANH.id ? [MATH_COMPLETED, GEOMETRY_DRAFT] : [],
  );
}

async function renderTuition() {
  const onAddChild = jest.fn();
  const onOpenReceipt = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentTuition onAddChild={onAddChild} onOpenReceipt={onOpenReceipt} />
    </QueryClientProvider>,
  );
  return { onAddChild, onOpenReceipt, user: userEvent.setup() };
}

/** Nhan cua cac the trong lich su dong hoc phi theo thu tu tren man hinh. */
function receiptButtonLabels() {
  return screen
    .getAllByRole('button', { name: /^Xem biên lai/ })
    .map((button) => button.props.accessibilityLabel);
}

describe('features/parent-dashboard/ParentTuition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hien don cho xac nhan, goi con hieu luc va lich su moi xac nhan truoc', async () => {
    mockTwoChildren();
    await renderTuition();

    expect(
      await screen.findByRole(
        'header',
        { name: 'Hình học 8 bổ trợ' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(api.getTuitionEnrollments).toHaveBeenCalledWith(MINH_ANH.id);
    expect(api.getStudentRegistrations).toHaveBeenCalledWith(MINH_ANH.id);
    expect(
      screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }),
    ).toBeOnTheScreen();

    // Chi don DRAFT la dang cho trung tam xac nhan thu hoc phi
    expect(screen.getAllByText('Chờ xác nhận')).toHaveLength(1);
    expect(
      screen.getByText(
        `Trung tâm đã lập đăng ký gói 2 tháng ngày ${formatDate(GEOMETRY_DRAFT.createdAt)}, dự kiến bắt đầu học ${formatDate(addDays(today, 6))}. Gói học được kích hoạt sau khi trung tâm xác nhận đã thu đủ học phí.`,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(formatCurrency(1_200_000))).toBeOnTheScreen();

    // Goi da het han khong con nam trong "Gói học đang áp dụng"
    expect(screen.getByRole('header', { name: 'Gói học đang áp dụng' })).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: 'Gói 3 tháng · Toán nâng cao 8A2' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: 'Gói 3 tháng · Vật lý 8 chuyên sâu' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: /Ngữ văn 8 ôn hè/ })).not.toBeOnTheScreen();
    expect(screen.getByText('Đang học')).toBeOnTheScreen();
    expect(screen.getByText('Sắp học')).toBeOnTheScreen();
    expect(screen.getByText('3 buổi / tuần')).toBeOnTheScreen();
    expect(screen.getByText('2 buổi / tuần')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/^Tiến độ theo lịch học: \d+\/\d+ buổi/)).toHaveLength(2);
    expect(screen.getByText(formatDate(addDays(today, 70)))).toBeOnTheScreen();
    // So tien cua goi dang hoc hien o the goi hoc va o lich su
    expect(screen.getAllByText(formatCurrency(3_600_000))).toHaveLength(2);

    expect(screen.getByRole('header', { name: 'Lịch sử đóng học phí' })).toBeOnTheScreen();
    expect(screen.getByText('3 lần đóng')).toBeOnTheScreen();
    expect(receiptButtonLabels()).toEqual([
      'Xem biên lai PT-1090',
      'Xem biên lai PT-1082',
      'Xem biên lai PT-0741',
    ]);
    expect(screen.getByText('#PT-0741')).toBeOnTheScreen();
    expect(screen.getByText(formatCurrency(1_800_000))).toBeOnTheScreen();
    expect(screen.getByText('Quy định xác nhận học phí')).toBeOnTheScreen();
  });

  it('bam mot lan dong hoc phi thi mo bien lai cua don dang ky do', async () => {
    mockTwoChildren();
    const { onOpenReceipt, user } = await renderTuition();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Xem biên lai PT-1082' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(onOpenReceipt).toHaveBeenCalledTimes(1);
    expect(onOpenReceipt).toHaveBeenCalledWith(MATH.registrationOrderId);
  });

  it('doi con thi tai hoc phi cua con do', async () => {
    mockTwoChildren();
    const { user } = await renderTuition();
    await screen.findByRole(
      'header',
      { name: 'Hình học 8 bổ trợ' },
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );

    await user.press(screen.getByRole('button', { name: 'Chọn con, đang xem Nguyễn Minh Anh' }));
    await user.press(screen.getByRole('radio', { name: 'Nguyễn Hoàng Long, khối 6' }));

    expect(
      await screen.findByRole('header', { name: 'Gói 3 tháng · Tiếng Anh 6A1' }),
    ).toBeOnTheScreen();
    expect(api.getTuitionEnrollments).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(api.getStudentRegistrations).toHaveBeenLastCalledWith(HOANG_LONG.id);
    expect(screen.queryByText('Chờ xác nhận')).not.toBeOnTheScreen();
    expect(receiptButtonLabels()).toEqual(['Xem biên lai PT-0893']);
    expect(screen.getByText('1 lần đóng')).toBeOnTheScreen();
  });

  it('moi co don cho xac nhan thi chua co goi hoc va lich su', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getTuitionEnrollments.mockResolvedValue([]);
    api.getStudentRegistrations.mockResolvedValue([GEOMETRY_DRAFT]);
    await renderTuition();

    expect(
      await screen.findByRole(
        'header',
        { name: 'Hình học 8 bổ trợ' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Gói học đang áp dụng' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Lịch sử đóng học phí' })).not.toBeOnTheScreen();
    expect(screen.getByText('Quy định xác nhận học phí')).toBeOnTheScreen();
  });

  it('con chua co goi hoc va don nao thi bao rong', async () => {
    api.getStudents.mockResolvedValue([HOANG_LONG]);
    api.getTuitionEnrollments.mockResolvedValue([]);
    api.getStudentRegistrations.mockResolvedValue([]);
    await renderTuition();

    expect(
      await screen.findByText('Chưa có gói học nào', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Gói học và biên lai của Hoàng Long sẽ hiện ở đây sau khi trung tâm xác nhận đã thu học phí.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Xem biên lai/ })).not.toBeOnTheScreen();
  });

  it('chua co con thi moi them con', async () => {
    api.getStudents.mockResolvedValue([]);
    const { onAddChild, user } = await renderTuition();

    expect(
      await screen.findByText('Chưa có hồ sơ của con', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Thêm con' }));

    expect(onAddChild).toHaveBeenCalledTimes(1);
    expect(api.getTuitionEnrollments).not.toHaveBeenCalled();
    expect(api.getStudentRegistrations).not.toHaveBeenCalled();
  });

  it('loi tai hoc phi thi hien thu lai, bam thu lai tai lai', async () => {
    api.getStudents.mockResolvedValue([MINH_ANH]);
    api.getStudentRegistrations.mockResolvedValue([]);
    api.getTuitionEnrollments
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce([MATH]);
    const { user } = await renderTuition();

    await user.press(
      await screen.findByRole('button', { name: 'Thử lại' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    expect(
      await screen.findByRole('header', { name: 'Gói 3 tháng · Toán nâng cao 8A2' }),
    ).toBeOnTheScreen();
    expect(api.getTuitionEnrollments).toHaveBeenCalledTimes(2);
  });
});
