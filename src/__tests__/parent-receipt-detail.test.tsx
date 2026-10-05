import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Share } from 'react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentReceiptDetail } from '@/features/parent-dashboard/components/parent-receipt-detail';
import { CENTER_NAME } from '@/features/parent-dashboard/constants';
import type { TuitionReceipt } from '@/features/parent-dashboard/types';
import { logger } from '@/lib/logger';
import { AppError } from '@/types/api';
import { formatCurrency } from '@/utils/format';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: { getReceipt: jest.fn() },
}));
// Jest khong tim thay `@/assets/*`, xem `src/constants/images.ts`
jest.mock('@/constants/images', () => ({ Images: { logo: 1 } }));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const api = jest.mocked(parentDashboardApi);
const shareSpy = jest.spyOn(Share, 'share');

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const REGISTRATION_ID = 'order-1';

const RECEIPT: TuitionReceipt = {
  registrationId: REGISTRATION_ID,
  status: 'COMPLETED',
  parentEmail: 'phuhuynh@example.com',
  student: { fullName: 'Nguyễn Minh Anh', grade: 8 },
  class: {
    id: 'class-1',
    name: 'Toán nâng cao 8A2',
    subject: 'Toán',
    grade: 8,
    schedules: [
      { weekday: 4, startTime: '18:00', endTime: '19:30' },
      { weekday: 1, startTime: '18:00', endTime: '19:30' },
      { weekday: 6, startTime: '08:00', endTime: '09:30' },
    ],
  },
  term: { packageMonths: 3, startDate: '2026-10-05', endDate: '2027-01-05' },
  payment: {
    id: 'payment-1',
    receiptNumber: 'PT-1082',
    amount: 3_600_000,
    currency: 'VND',
    confirmedAt: new Date(2026, 9, 2, 9, 30).toISOString(),
  },
  quotedAmount: 3_600_000,
  currency: 'VND',
};

async function renderReceipt() {
  const onBack = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentReceiptDetail registrationId={REGISTRATION_ID} onBack={onBack} />
    </QueryClientProvider>,
  );
  return { onBack, user: userEvent.setup() };
}

describe('features/parent-dashboard/ParentReceiptDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy.mockResolvedValue({ action: 'sharedAction' });
  });

  it('hien bien lai: ma, thoi gian thu, hoc sinh, goi hoc, so tien bang so va bang chu', async () => {
    api.getReceipt.mockResolvedValue(RECEIPT);
    await renderReceipt();

    expect(
      await screen.findByRole(
        'header',
        { name: 'Biên lai thu học phí' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(api.getReceipt).toHaveBeenCalledWith(REGISTRATION_ID);
    expect(screen.getByRole('header', { name: 'Chi tiết biên lai' })).toBeOnTheScreen();

    expect(screen.getByText(CENTER_NAME)).toBeOnTheScreen();
    expect(screen.getByText('Đã thanh toán')).toBeOnTheScreen();
    expect(screen.getByText('#PT-1082')).toBeOnTheScreen();
    expect(screen.getByText('02/10/2026 · 09:30')).toBeOnTheScreen();
    expect(screen.getByText('Đóng tại trung tâm')).toBeOnTheScreen();

    expect(screen.getByText('Nguyễn Minh Anh')).toBeOnTheScreen();
    expect(screen.getByText('Khối 8')).toBeOnTheScreen();
    expect(screen.getByText('Phụ huynh: phuhuynh@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Toán nâng cao 8A2')).toBeOnTheScreen();
    expect(screen.getByText('Gói 3 tháng')).toBeOnTheScreen();
    // Cac buoi cung gio gom mot dong, sap theo thu
    expect(screen.getByText('T2, T5 · 18:00 – 19:30\nT7 · 08:00 – 09:30')).toBeOnTheScreen();
    expect(screen.getByText('05/10/2026')).toBeOnTheScreen();
    expect(screen.getByText('05/01/2027')).toBeOnTheScreen();
    expect(screen.getByText(formatCurrency(1_200_000))).toBeOnTheScreen();

    // Hoc phi bao gia va tong so tien da thu
    expect(screen.getAllByText(formatCurrency(3_600_000))).toHaveLength(2);
    expect(screen.getByText('Bằng chữ: Ba triệu sáu trăm nghìn đồng chẵn.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Đã thu tiền ngày 02/10/2026')).toBeOnTheScreen();
  });

  it('bam chia se thi mo bang chia se voi noi dung bien lai; bam quay lai', async () => {
    api.getReceipt.mockResolvedValue(RECEIPT);
    const { onBack, user } = await renderReceipt();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chia sẻ biên lai' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      message: expect.stringContaining('Biên lai thu học phí #PT-1082'),
    });
    expect(screen.queryByText(/^Không mở được bảng chia sẻ/)).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('khong mo duoc bang chia se thi bao loi va ghi log', async () => {
    api.getReceipt.mockResolvedValue(RECEIPT);
    shareSpy.mockRejectedValue(new Error('Share is not supported'));
    const { user } = await renderReceipt();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Chia sẻ biên lai' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(
      await screen.findByText('Không mở được bảng chia sẻ. Vui lòng thử lại.'),
    ).toBeOnTheScreen();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('loi tai bien lai thi hien thu lai, bam thu lai tai lai', async () => {
    api.getReceipt
      .mockRejectedValueOnce(new AppError('Không tìm thấy biên lai.'))
      .mockResolvedValueOnce(RECEIPT);
    const { user } = await renderReceipt();

    expect(
      await screen.findByText('Không tìm thấy biên lai.', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Chia sẻ biên lai' })).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('#PT-1082')).toBeOnTheScreen();
    expect(api.getReceipt).toHaveBeenCalledTimes(2);
  });
});
