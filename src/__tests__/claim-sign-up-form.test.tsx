import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { ClaimSignUpForm } from '@/features/link-invitation/components/claim-sign-up-form';
import { AppError } from '@/types/api';

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const SUBMIT_BUTTON_NAME = /^Tạo tài khoản/;
const PASSWORD = 'Matkhau123';

type RenderOptions = { error?: unknown };

async function renderForm({ error = null }: RenderOptions = {}) {
  const onSubmit = jest.fn();
  const onSignIn = jest.fn();
  await render(
    <ClaimSignUpForm
      maskedEmail="p***@example.com"
      onSubmit={onSubmit}
      onSignIn={onSignIn}
      isPending={false}
      error={error}
    />,
  );
  return { onSubmit, onSignIn, user: userEvent.setup() };
}

describe('features/link-invitation/ClaimSignUpForm', () => {
  it('hien email cua ma o dang chi doc', async () => {
    await renderForm();

    const email = screen.getByLabelText('Email phụ huynh');
    expect(email).toHaveDisplayValue('p***@example.com');
    expect(email).toHaveProp('editable', false);
  });

  it('chi gui mat khau khi hop le va da dong y dieu khoan', async () => {
    const { onSubmit, user } = await renderForm();

    await user.type(screen.getByLabelText('Mật khẩu'), PASSWORD);
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), PASSWORD);
    await user.press(screen.getByRole('checkbox'));
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(PASSWORD));
  });

  it('khong gui khi chua dong y dieu khoan', async () => {
    const { onSubmit, user } = await renderForm();

    await user.type(screen.getByLabelText('Mật khẩu'), PASSWORD);
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), PASSWORD);
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(await screen.findByText('Vui lòng đồng ý với điều khoản để tiếp tục')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hien dau tich khi mat khau xac nhan khop', async () => {
    const { user } = await renderForm();

    await user.type(screen.getByLabelText('Mật khẩu'), PASSWORD);
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), PASSWORD.slice(0, -1));
    expect(screen.queryByLabelText('Mật khẩu xác nhận đã khớp')).not.toBeOnTheScreen();

    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), PASSWORD.slice(-1));
    expect(screen.getByLabelText('Mật khẩu xác nhận đã khớp')).toBeOnTheScreen();
  });

  it('nut con mat bat tat an mat khau', async () => {
    const { user } = await renderForm();
    const password = screen.getByLabelText('Mật khẩu');
    expect(password).toHaveProp('secureTextEntry', true);

    await user.press(screen.getByRole('button', { name: 'Hiện mật khẩu' }));

    expect(password).toHaveProp('secureTextEntry', false);
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toBeOnTheScreen();
  });

  it('chuyen sang dang nhap tu dong "Đã có tài khoản?"', async () => {
    const { onSignIn, user } = await renderForm();

    await user.press(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('hien loi tu server', async () => {
    await renderForm({ error: new AppError('Mã liên kết đã hết hạn.', 410, 'INVITATION_EXPIRED') });

    expect(screen.getByRole('alert')).toHaveTextContent('Mã liên kết đã hết hạn.');
  });
});
