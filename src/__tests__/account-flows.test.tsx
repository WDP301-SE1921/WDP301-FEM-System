import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { authApi } from '@/features/auth/api/auth-api';
import { AccountProfileFlow } from '@/features/auth/components/account-profile-flow';
import { ChangePasswordFlow } from '@/features/auth/components/change-password-flow';
import { ForgotPasswordFlow } from '@/features/auth/components/forgot-password-flow';
import { AppError } from '@/types/api';
import type { User } from '@/types/auth';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { updateProfile: jest.fn(), changePassword: jest.fn(), forgotPassword: jest.fn() },
}));
// Store doc SecureStore va apiClient; test chi can biet tai khoan moi co duoc ghi vao phien khong
const mockSetUser = jest.fn();
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { setUser: jest.Mock }) => unknown) =>
    selector({ setUser: mockSetUser }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const api = jest.mocked(authApi);

/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const PARENT: User = {
  id: 'cmg2x1abc0000parent',
  email: 'phuhuynh@example.com',
  displayName: 'Phạm Thu Hà',
  role: 'PARENT',
  status: 'ACTIVE',
  emailVerifiedAt: '2026-10-05T02:05:00.000Z',
  createdAt: '2026-10-05T02:00:00.000Z',
  updatedAt: '2026-10-05T02:00:00.000Z',
};

async function renderWithQuery(element: ReactElement) {
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  await render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
  return userEvent.setup();
}

beforeEach(() => jest.clearAllMocks());

describe('features/auth/ForgotPasswordFlow', () => {
  it('dien san email tu man dang nhap, gui xong thi nhac mo lien ket trong email', async () => {
    api.forgotPassword.mockResolvedValue();
    const onBack = jest.fn();
    const user = await renderWithQuery(
      <ForgotPasswordFlow defaultEmail={PARENT.email} onBack={onBack} />,
    );

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Gửi liên kết đặt lại' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByText('Kiểm tra email của bạn')).toBeOnTheScreen();
    expect(api.forgotPassword).toHaveBeenCalledWith(PARENT.email);
    expect(screen.getByText(PARENT.email)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại đăng nhập' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('chua nhap email thi bao loi, khong goi API', async () => {
    const user = await renderWithQuery(<ForgotPasswordFlow defaultEmail="" onBack={jest.fn()} />);

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Gửi liên kết đặt lại' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByText('Vui lòng nhập email')).toBeOnTheScreen();
    expect(api.forgotPassword).not.toHaveBeenCalled();
  });
});

describe('features/auth/ChangePasswordFlow', () => {
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
      await screen.findByLabelText('Mật khẩu hiện tại', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
      'MatKhauCu1',
    );
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'MatKhauMoi1');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi1');
    await user.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
  }

  it('gui mat khau cu va moi, khong gui o nhap lai; xong thi bao da dang xuat thiet bi khac', async () => {
    api.changePassword.mockResolvedValue();
    const onDone = jest.fn();
    const user = await renderWithQuery(<ChangePasswordFlow onDone={onDone} />);

    await fillAndSubmit(user);

    expect(await screen.findByText('Đã đổi mật khẩu')).toBeOnTheScreen();
    expect(api.changePassword).toHaveBeenCalledWith({
      currentPassword: 'MatKhauCu1',
      newPassword: 'MatKhauMoi1',
    });

    await user.press(screen.getByRole('button', { name: 'Xong' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sai mat khau hien tai thi hien loi cua BE va giu form', async () => {
    api.changePassword.mockRejectedValue(
      new AppError('Mật khẩu hiện tại không đúng.', 400, 'AUTH_CURRENT_PASSWORD_INVALID'),
    );
    const user = await renderWithQuery(<ChangePasswordFlow onDone={jest.fn()} />);

    await fillAndSubmit(user);

    expect(await screen.findByText('Mật khẩu hiện tại không đúng.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeOnTheScreen();
  });
});

describe('features/auth/AccountProfileFlow', () => {
  it('dien san ten; bo trong so dien thoai thi khong gui de BE giu so cu', async () => {
    const updated = { ...PARENT, displayName: 'Phạm Thu Hằng' };
    api.updateProfile.mockResolvedValue(updated);
    const onDone = jest.fn();
    const user = await renderWithQuery(<AccountProfileFlow user={PARENT} onDone={onDone} />);

    const name = await screen.findByLabelText(
      'Họ và tên',
      {},
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );
    expect(name).toHaveDisplayValue('Phạm Thu Hà');
    await user.clear(name);
    await user.type(name, 'Phạm Thu Hằng');
    await user.press(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Phạm Thu Hằng' });
    expect(mockSetUser).toHaveBeenCalledWith(updated);
  });

  it('nhap so dien thoai moi thi gui kem', async () => {
    api.updateProfile.mockResolvedValue(PARENT);
    const user = await renderWithQuery(<AccountProfileFlow user={PARENT} onDone={jest.fn()} />);

    await user.type(
      await screen.findByLabelText(
        'Số điện thoại mới (không bắt buộc)',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
      '0901 234 567',
    );
    await user.press(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith({
        displayName: 'Phạm Thu Hà',
        phone: '0901 234 567',
      }),
    );
  });
});
