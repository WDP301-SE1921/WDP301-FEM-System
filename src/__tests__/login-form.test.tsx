import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { authApi } from '@/features/auth/api/auth-api';
import { LoginForm } from '@/features/auth/components/login-form';
import { AppError } from '@/types/api';

jest.mock('@/features/auth/api/auth-api', () => ({ authApi: { login: jest.fn() } }));
// Store va logger doc Config -> can bien moi truong; test chi kiem tra form
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { signIn: jest.Mock }) => unknown) =>
    selector({ signIn: jest.fn() }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const mockLogin = jest.mocked(authApi.login);

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const SUBMIT_BUTTON_NAME = /^Đăng nhập/;
const CREDENTIALS = { email: 'phuhuynh@example.com', password: 'Matkhau123' };

async function renderForm(onForgotPassword = jest.fn()) {
  // gcTime vo han: khong de lai timer don cache sau khi test xong
  const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  await render(<LoginForm onForgotPassword={onForgotPassword} />, { wrapper });
  return userEvent.setup();
}

describe('features/auth/LoginForm', () => {
  beforeEach(() => mockLogin.mockReset());

  it('bao loi tung o va khong goi API khi bo trong', async () => {
    const user = await renderForm();

    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(await screen.findByText('Vui lòng nhập email')).toBeOnTheScreen();
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeOnTheScreen();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('gui dung email va mat khau da nhap', async () => {
    // Treo request de khong chay nhanh luu phien va dieu huong
    mockLogin.mockReturnValue(new Promise(() => {}));
    const user = await renderForm();

    await user.type(screen.getByLabelText('Email'), CREDENTIALS.email);
    await user.type(screen.getByLabelText('Mật khẩu'), CREDENTIALS.password);
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(CREDENTIALS));
  });

  it('hien thong bao loi tu server', async () => {
    mockLogin.mockRejectedValue(
      new AppError('Email hoặc mật khẩu không đúng.', 401, 'AUTH_INVALID_CREDENTIALS'),
    );
    const user = await renderForm();

    await user.type(screen.getByLabelText('Email'), CREDENTIALS.email);
    await user.type(screen.getByLabelText('Mật khẩu'), 'SaiMatKhau1');
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(await screen.findByText('Email hoặc mật khẩu không đúng.')).toBeOnTheScreen();
  });

  it('hien va an mat khau khi bam nut con mat', async () => {
    const user = await renderForm();
    const password = screen.getByLabelText('Mật khẩu');
    expect(password).toHaveProp('secureTextEntry', true);

    await user.press(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveProp('secureTextEntry', false);

    await user.press(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(password).toHaveProp('secureTextEntry', true);
  });

  it('quen mat khau thi mo man quen mat khau kem email da nhap', async () => {
    const onForgotPassword = jest.fn();
    const user = await renderForm(onForgotPassword);

    await user.type(screen.getByLabelText('Email'), `  ${CREDENTIALS.email} `);
    await user.press(screen.getByRole('button', { name: 'Quên mật khẩu?' }));

    expect(onForgotPassword).toHaveBeenCalledWith(CREDENTIALS.email);
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
