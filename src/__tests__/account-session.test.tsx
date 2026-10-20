import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { authApi } from '@/features/auth/api/auth-api';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { SessionExpiredNotice } from '@/features/auth/components/session-expired-notice';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { logout: jest.fn() },
}));
// Store doc SecureStore va apiClient; test chi can trang thai phien va lenh dang xuat
const mockAuthState = { isSessionExpired: false, signOut: jest.fn() };
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const api = jest.mocked(authApi);

async function renderWithQueryClient(element: ReactElement) {
  // gcTime vo han: khong de lai timer don cache sau khi test xong
  const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
  await render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
  return userEvent.setup();
}

describe('features/auth/LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.logout.mockResolvedValue();
  });

  it('hoi lai truoc khi dang xuat; o lai thi khong dang xuat', async () => {
    const user = await renderWithQueryClient(<LogoutButton />);

    await user.press(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(screen.getByText('Đăng xuất khỏi ứng dụng?')).toBeOnTheScreen();
    expect(api.logout).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Ở lại' }));
    expect(screen.queryByText('Đăng xuất khỏi ứng dụng?')).not.toBeOnTheScreen();
    expect(api.logout).not.toHaveBeenCalled();
  });

  it('xac nhan thi goi BE dang xuat roi xoa phien', async () => {
    const user = await renderWithQueryClient(<LogoutButton />);

    await user.press(screen.getByRole('button', { name: 'Đăng xuất' }));
    // Nut thu hai la nut xac nhan trong sheet
    const [, confirm] = screen.getAllByRole('button', { name: 'Đăng xuất' });
    if (!confirm) throw new Error('Thieu nut xac nhan');
    await user.press(confirm);

    expect(api.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockAuthState.signOut).toHaveBeenCalledTimes(1));
  });
});

describe('features/auth/SessionExpiredNotice', () => {
  afterEach(() => {
    mockAuthState.isSessionExpired = false;
  });

  it('chi bao khi app vua tu dang xuat vi het phien', async () => {
    await render(<SessionExpiredNotice />);
    expect(screen.queryByText('Phiên đăng nhập đã hết hạn')).not.toBeOnTheScreen();
  });

  it('het phien thi nhac dang nhap lai', async () => {
    mockAuthState.isSessionExpired = true;
    await render(<SessionExpiredNotice />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Phiên đăng nhập đã hết hạn/);
  });
});
