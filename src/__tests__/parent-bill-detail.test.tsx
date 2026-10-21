import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentBillDetail } from '@/features/parent-dashboard/components/parent-bill-detail';
import { CENTER_NAME } from '@/features/parent-dashboard/constants';
import type { TuitionBillDetail } from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';
import { formatCurrency } from '@/utils/format';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: { getBill: jest.fn() },
}));
// Jest khong tim thay `@/assets/*`, xem `src/constants/images.ts`
jest.mock('@/constants/images', () => ({ Images: { logo: 1 } }));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const REGISTRATION_ID = 'cmg2x1abc0003order';

const UNPAID_BILL: TuitionBillDetail = {
  billNumber: REGISTRATION_ID,
  registrationId: REGISTRATION_ID,
  status: 'UNPAID',
  issuedAt: new Date(2026, 9, 6, 11, 0).toISOString(),
  parent: { displayName: 'Nguyễn Văn A', email: 'phuhuynh@example.com', phone: '0900000000' },
  student: { id: 'student-1', fullName: 'Nguyễn Minh Anh', grade: 8 },
  class: {
    id: 'class-geometry',
    name: 'Hình học 8 bổ trợ',
    subject: 'Toán',
    grade: 8,
    schedules: [{ weekday: 2, startTime: '18:00', endTime: '19:30' }],
  },
  term: { packageMonths: 2, startDate: '2026-10-13', endDate: '2026-12-13' },
  pricing: { monthlyFee: '600000.00', packageMonths: 2, total: '1200000.00', currency: 'VND' },
  payment: null,
};

const PAID_BILL: TuitionBillDetail = {
  ...UNPAID_BILL,
  status: 'PAID',
  payment: {
    receiptNumber: 'PT-1100',
    paidAmount: '1200000.00',
    confirmedAt: new Date(2026, 9, 7, 9, 30).toISOString(),
  },
};

async function renderBill() {
  const onBack = jest.fn();
  const onOpenReceipt = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentBillDetail
        registrationId={REGISTRATION_ID}
        onBack={onBack}
        onOpenReceipt={onOpenReceipt}
      />
    </QueryClientProvider>,
  );
  return { onBack, onOpenReceipt, user: userEvent.setup() };
}

function findBillHeader() {
  return screen.findByRole(
    'header',
    { name: 'Bill học phí' },
    { timeout: FIRST_RENDER_TIMEOUT_MS },
  );
}

describe('features/parent-dashboard/ParentBillDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('bill chua thanh toan: ma bill, hoc sinh, phu huynh, goi hoc, hoc phi va loi nhan dong tai trung tam', async () => {
    api.getBill.mockResolvedValue(UNPAID_BILL);
    await renderBill();

    expect(await findBillHeader()).toBeOnTheScreen();
    expect(api.getBill).toHaveBeenCalledWith(REGISTRATION_ID);
    expect(screen.getByRole('header', { name: 'Chi tiết bill học phí' })).toBeOnTheScreen();

    expect(screen.getByText(CENTER_NAME)).toBeOnTheScreen();
    expect(screen.getByText('Chưa thanh toán')).toBeOnTheScreen();
    expect(screen.getByText(REGISTRATION_ID)).toBeOnTheScreen();
    expect(screen.getByText('06/10/2026 · 11:00')).toBeOnTheScreen();

    expect(screen.getByText('Nguyễn Minh Anh')).toBeOnTheScreen();
    expect(screen.getByText('Khối 8')).toBeOnTheScreen();
    expect(
      screen.getByText('Phụ huynh: Nguyễn Văn A · phuhuynh@example.com · 0900000000'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Hình học 8 bổ trợ')).toBeOnTheScreen();
    expect(screen.getByText('Gói 2 tháng')).toBeOnTheScreen();
    expect(screen.getByText('T3 · 18:00 – 19:30')).toBeOnTheScreen();
    expect(screen.getByText('13/10/2026')).toBeOnTheScreen();
    expect(screen.getByText('13/12/2026')).toBeOnTheScreen();
    expect(screen.getByText(formatCurrency(600_000))).toBeOnTheScreen();

    expect(screen.getByText('Học phí cần đóng')).toBeOnTheScreen();
    expect(screen.getByText(formatCurrency(1_200_000))).toBeOnTheScreen();
    expect(screen.getByText('Bằng chữ: Một triệu hai trăm nghìn đồng chẵn.')).toBeOnTheScreen();
    expect(screen.getByText(/^Vui lòng đóng học phí tại trung tâm/)).toBeOnTheScreen();

    // Chua thu tien thi chua co bien lai
    expect(screen.queryByText('Mã biên lai')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Xem biên lai' })).not.toBeOnTheScreen();
  });

  it('bill da thanh toan: hien thong tin thu tien va mo bien lai cua don', async () => {
    api.getBill.mockResolvedValue(PAID_BILL);
    const { onOpenReceipt, user } = await renderBill();

    expect(await findBillHeader()).toBeOnTheScreen();
    expect(screen.getByText('Đã thanh toán')).toBeOnTheScreen();
    expect(screen.getByText('Tổng học phí đã thu')).toBeOnTheScreen();
    expect(screen.getByText('#PT-1100')).toBeOnTheScreen();
    expect(screen.getByText('07/10/2026 · 09:30')).toBeOnTheScreen();
    // Tong hoc phi va so tien da thu
    expect(screen.getAllByText(formatCurrency(1_200_000))).toHaveLength(2);

    await user.press(screen.getByRole('button', { name: 'Xem biên lai' }));
    expect(onOpenReceipt).toHaveBeenCalledTimes(1);
    expect(onOpenReceipt).toHaveBeenCalledWith(REGISTRATION_ID);
  });

  it('bill da huy khong hien nhu da thanh toan', async () => {
    api.getBill.mockResolvedValue({ ...UNPAID_BILL, status: 'CANCELLED' });
    await renderBill();

    expect(await findBillHeader()).toBeOnTheScreen();
    expect(screen.getByText('Đã huỷ')).toBeOnTheScreen();
    expect(screen.getByText('Đơn đăng ký này đã huỷ, không cần đóng học phí.')).toBeOnTheScreen();
    expect(screen.queryByText('Đã thanh toán')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Xem biên lai' })).not.toBeOnTheScreen();
  });

  it('loi tai bill thi hien thu lai, bam thu lai tai lai; bam quay lai', async () => {
    api.getBill
      .mockRejectedValueOnce(new AppError('Không tìm thấy bill học phí.'))
      .mockResolvedValueOnce(UNPAID_BILL);
    const { onBack, user } = await renderBill();

    expect(
      await screen.findByText(
        'Không tìm thấy bill học phí.',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Chưa thanh toán')).toBeOnTheScreen();
    expect(api.getBill).toHaveBeenCalledTimes(2);

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
