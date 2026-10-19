import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { RegisterForm } from '@/features/auth/components/register-form';

jest.mock('@/features/auth/api/auth-api', () => ({ authApi: { register: jest.fn() } }));
// Store va logger doc Config -> can bien moi truong; test chi kiem tra form
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { signIn: jest.Mock }) => unknown) =>
    selector({ signIn: jest.fn() }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

async function renderForm() {
  // gcTime vo han: khong de lai timer don cache sau khi test xong
  const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  await render(<RegisterForm />, { wrapper });
  return userEvent.setup();
}

describe('features/auth/RegisterForm', () => {
  it('moi o mat khau co nut con mat rieng, hien va an doc lap', async () => {
    const user = await renderForm();
    const password = screen.getByLabelText('Mật khẩu');
    const confirmPassword = screen.getByLabelText('Xác nhận mật khẩu');
    expect(password).toHaveProp('secureTextEntry', true);
    expect(confirmPassword).toHaveProp('secureTextEntry', true);

    const [showPassword, showConfirmPassword] = screen.getAllByRole('button', {
      name: 'Hiện mật khẩu',
    });
    await user.press(showPassword!);
    expect(password).toHaveProp('secureTextEntry', false);
    expect(confirmPassword).toHaveProp('secureTextEntry', true);

    await user.press(showConfirmPassword!);
    expect(confirmPassword).toHaveProp('secureTextEntry', false);

    await user.press(screen.getAllByRole('button', { name: 'Ẩn mật khẩu' })[0]!);
    expect(password).toHaveProp('secureTextEntry', true);
    expect(confirmPassword).toHaveProp('secureTextEntry', false);
  });
});
