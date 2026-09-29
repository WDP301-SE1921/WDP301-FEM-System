import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LinkCodeForm } from '@/features/link-invitation/components/link-code-form';
import { AppError } from '@/types/api';

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const SUBMIT_BUTTON_NAME = /^Tiếp tục/;
const SIGN_IN_BUTTON_NAME = /Đăng nhập$/;

type RenderOptions = { error?: unknown };

async function renderForm({ error = null }: RenderOptions = {}) {
  const onSubmit = jest.fn();
  const onSignIn = jest.fn();
  await render(
    <LinkCodeForm onSubmit={onSubmit} onSignIn={onSignIn} isPending={false} error={error} />,
  );
  return { onSubmit, onSignIn, user: userEvent.setup() };
}

describe('features/link-invitation/LinkCodeForm', () => {
  it('chuan hoa ma khi go roi gui ma 8 ky tu in hoa', async () => {
    const { onSubmit, user } = await renderForm();

    await user.type(screen.getByLabelText('Mã liên kết'), 'edug-2026');
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('EDUG2026'));
  });

  it('bao loi va khong gui khi ma chua du ky tu', async () => {
    const { onSubmit, user } = await renderForm();

    await user.type(screen.getByLabelText('Mã liên kết'), 'EDUG2');
    await user.press(screen.getByRole('button', { name: SUBMIT_BUTTON_NAME }));

    expect(await screen.findByText('Vui lòng nhập đủ 8 ký tự')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hien loi tu server, khong kem nut dang nhap khi loi khong lien quan tai khoan', async () => {
    await renderForm({ error: new AppError('Mã liên kết đã hết hạn.', 410, 'INVITATION_EXPIRED') });

    expect(screen.getByRole('alert')).toHaveTextContent('Mã liên kết đã hết hạn.');
    expect(screen.queryByRole('button', { name: SIGN_IN_BUTTON_NAME })).not.toBeOnTheScreen();
  });

  it('kem nut dang nhap khi ma da duoc dung', async () => {
    const { onSignIn, user } = await renderForm({
      error: new AppError('Mã đã dùng', 409, 'INVITATION_ALREADY_USED'),
    });

    await user.press(screen.getByRole('button', { name: SIGN_IN_BUTTON_NAME }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});
