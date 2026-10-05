import { render, screen, userEvent } from '@testing-library/react-native';

import { LoginFooter } from '@/features/auth/components/login-footer';

describe('features/auth/LoginFooter', () => {
  it('hien du chu "Đăng ký" va bam vao thi sang man hinh dang ky', async () => {
    const onRegister = jest.fn();
    await render(<LoginFooter onRegister={onRegister} />);

    await userEvent.setup().press(screen.getByText('Đăng ký'));

    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it('ca dong "Chưa có tài khoản? Đăng ký" la mot nut', async () => {
    await render(<LoginFooter onRegister={jest.fn()} />);

    expect(screen.getByRole('button', { name: /Chưa có tài khoản\? Đăng ký/ })).toBeOnTheScreen();
  });
});
