import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { queryKeys } from '@/api/query-client';
import { childrenApi } from '@/features/children/api/children-api';
import { AddChildFlow } from '@/features/children/components/add-child-flow';
import { AppError } from '@/types/api';

jest.mock('@/features/children/api/children-api', () => ({
  childrenApi: { create: jest.fn() },
}));

const api = jest.mocked(childrenApi);

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const SUBMIT_BUTTON_NAME = /Thêm học sinh$/;
const DONE_BUTTON_NAME = /Về trang chủ$/;
/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

async function renderFlow({ isEmailVerified = true } = {}) {
  const onBack = jest.fn();
  const onDone = jest.fn();
  const onVerifyEmail = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  await render(
    <QueryClientProvider client={queryClient}>
      <AddChildFlow
        parentEmail="phuhuynh@example.com"
        isEmailVerified={isEmailVerified}
        onVerifyEmail={onVerifyEmail}
        onBack={onBack}
        onDone={onDone}
      />
    </QueryClientProvider>,
  );
  return { onBack, onDone, onVerifyEmail, invalidateQueries, user: userEvent.setup() };
}

describe('features/children/AddChildFlow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('dien form roi tao; xong thi lam moi danh sach con va ve trang chu', async () => {
    // BE tra ban ghi StudentProfile cua con vua tao
    api.create.mockResolvedValue({
      id: 'student-3',
      fullName: 'Nguyễn Gia Huy',
      grade: 7,
      dateOfBirth: '2014-05-20T00:00:00.000Z',
    });
    const { onDone, invalidateQueries, user } = await renderFlow();

    await user.type(screen.getByLabelText('Họ và tên học sinh'), 'Nguyễn Gia Huy');
    await user.press(screen.getByRole('radio', { name: 'Khối 7' }));
    // Ban phim so khong co phim `/`: o nhap tu chen dau
    await user.type(screen.getByLabelText('Ngày sinh (không bắt buộc)'), '20052014');
    expect(screen.getByDisplayValue('20/05/2014')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(
      await screen.findByText(
        'Đã thêm học sinh vào tài khoản',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(api.create).toHaveBeenCalledWith({
      fullName: 'Nguyễn Gia Huy',
      grade: 7,
      dateOfBirth: '2014-05-20',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.parent.students,
      exact: true,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.me.students,
      exact: true,
    });

    // Ho so moi chua co mon: chi phu huynh buoc dang ky tai trung tam, kem email de nhan vien tra cuu
    expect(screen.getByText('Bước tiếp theo: đăng ký môn học')).toBeOnTheScreen();
    expect(screen.getByText('phuhuynh@example.com')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Nhân viên chọn hồ sơ của Nguyễn Gia Huy, rồi chọn môn và lớp dành cho khối 7.',
      ),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: DONE_BUTTON_NAME }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('thieu ho ten va lop thi bao loi tung o, khong goi API', async () => {
    const { user } = await renderFlow();

    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(
      await screen.findByText(
        'Vui lòng nhập họ tên học sinh',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Vui lòng chọn khối của học sinh')).toBeOnTheScreen();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('loi tu server hien o form; quay lai thi thoat khoi man hinh', async () => {
    api.create.mockRejectedValue(new AppError('Không kết nối được tới máy chủ.'));
    const { onBack, user } = await renderFlow();

    await user.type(screen.getByLabelText('Họ và tên học sinh'), 'Nguyễn Gia Huy');
    await user.press(screen.getByRole('radio', { name: 'Khối 6' }));
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(
      await screen.findByRole('alert', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toHaveTextContent('Không kết nối được tới máy chủ.');
    expect(api.create).toHaveBeenCalledWith({ fullName: 'Nguyễn Gia Huy', grade: 6 });

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('email chua xac minh: thay form bang loi nhac va dan toi man hinh xac minh', async () => {
    const { onVerifyEmail, user } = await renderFlow({ isEmailVerified: false });

    expect(
      await screen.findByText('Cần xác minh email trước', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByText('phuhuynh@example.com')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Họ và tên học sinh')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Xác minh email' }));
    expect(onVerifyEmail).toHaveBeenCalledTimes(1);
    expect(api.create).not.toHaveBeenCalled();
  });
});
