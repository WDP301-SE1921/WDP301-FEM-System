import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { authApi } from '@/features/auth/api/auth-api';
import { DeleteAccountFlow } from '@/features/auth/components/delete-account-flow';
import { AppError } from '@/types/api';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { deleteAccount: jest.fn() },
}));
// Store doc SecureStore va apiClient; test chi can biet app co xoa phien kem ly do khong
const mockSignOut = jest.fn(() => Promise.resolve());
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { signOut: jest.Mock }) => unknown) =>
    selector({ signOut: mockSignOut }),
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const api = jest.mocked(authApi);

/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const PASSWORD = 'MatKhau123';

async function renderFlow(onCancel = jest.fn()) {
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <DeleteAccountFlow onCancel={onCancel} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

async function submitPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByLabelText('Mật khẩu hiện tại', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    PASSWORD,
  );
  await user.press(screen.getByRole('button', { name: 'Xóa tài khoản' }));
}

beforeEach(() => jest.clearAllMocks());

describe('features/auth/DeleteAccountFlow', () => {
  it('hoi lai lan cuoi; xac nhan thi xoa, dang xuat kem ly do va ve man chao', async () => {
    api.deleteAccount.mockResolvedValue();
    const user = await renderFlow();

    await submitPassword(user);
    expect(api.deleteAccount).not.toHaveBeenCalled();
    expect(await screen.findByText('Xóa vĩnh viễn tài khoản?')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(auth)/welcome'));
    expect(api.deleteAccount).toHaveBeenCalledWith(PASSWORD);
    expect(mockSignOut).toHaveBeenCalledWith('ACCOUNT_DELETED');
  });

  it('sai mat khau thi dong hoi lai, hien loi cua BE va khong dang xuat', async () => {
    api.deleteAccount.mockRejectedValue(
      new AppError('Mật khẩu hiện tại không đúng.', 400, 'AUTH_CURRENT_PASSWORD_INVALID'),
    );
    const user = await renderFlow();

    await submitPassword(user);
    await user.press(await screen.findByRole('button', { name: 'Xóa vĩnh viễn' }));

    expect(await screen.findByText('Mật khẩu hiện tại không đúng.')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('Xóa vĩnh viễn tài khoản?')).toBeNull());
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('chua nhap mat khau thi bao loi, khong hoi lai', async () => {
    const user = await renderFlow();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Xóa tài khoản' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(await screen.findByText('Mật khẩu tối thiểu 8 ký tự')).toBeOnTheScreen();
    expect(screen.queryByText('Xóa vĩnh viễn tài khoản?')).toBeNull();
  });

  it('giu tai khoan thi quay lai, khong goi API', async () => {
    const onCancel = jest.fn();
    const user = await renderFlow(onCancel);

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Giữ tài khoản' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });
});
