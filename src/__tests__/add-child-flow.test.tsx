import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { queryKeys } from '@/api/query-client';
import { linkInvitationApi } from '@/features/link-invitation/api/link-invitation-api';
import { AddChildFlow } from '@/features/link-invitation/components/add-child-flow';
import { INVITATION_ERROR_MESSAGES } from '@/features/link-invitation/constants';
import type { InvitationPreview } from '@/features/link-invitation/types';
import { AppError } from '@/types/api';

jest.mock('@/features/link-invitation/api/link-invitation-api', () => ({
  linkInvitationApi: { inspect: jest.fn(), claim: jest.fn(), claimAndSignUp: jest.fn() },
}));

// Hook dang ky dung chung file, can store va router; luong them con khong dung toi hai thu nay.
// expo-router con keo theo goi ESM ma cau hinh Jest hien tai khong transform.
jest.mock('@/store/auth-store', () => ({ useAuthStore: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const api = jest.mocked(linkInvitationApi);

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const CONTINUE_BUTTON_NAME = /^Tiếp tục/;
const CONFIRM_BUTTON_NAME = /Liên kết với tài khoản$/;
const DONE_BUTTON_NAME = /Về trang chủ$/;
/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const INVITATION: InvitationPreview = {
  valid: true,
  mode: 'SIGN_IN',
  maskedEmail: 'p***@example.com',
  studentName: 'Nguyễn Gia Huy',
  subjectName: 'Tiếng Anh',
  className: 'Anh 7C',
  expiresAt: '2026-10-05T00:00:00.000Z',
};

async function renderFlow() {
  const onBack = jest.fn();
  const onDone = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  await render(
    <QueryClientProvider client={queryClient}>
      <AddChildFlow onBack={onBack} onDone={onDone} />
    </QueryClientProvider>,
  );
  return { onBack, onDone, invalidateQueries, user: userEvent.setup() };
}

async function submitCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Mã liên kết'), 'demo-add1');
  await user.press(screen.getByRole('button', { name: CONTINUE_BUTTON_NAME }));
  expect(
    await screen.findByText('Nguyễn Gia Huy', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
  ).toBeOnTheScreen();
}

describe('features/link-invitation/AddChildFlow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('nhap ma, xac nhan roi lien ket; xong thi lam moi danh sach con va ve trang chu', async () => {
    api.inspect.mockResolvedValue(INVITATION);
    api.claim.mockResolvedValue({ studentId: 'student-3', studentName: 'Nguyễn Gia Huy' });
    const { onDone, invalidateQueries, user } = await renderFlow();

    await submitCode(user);
    expect(api.inspect).toHaveBeenCalledWith('DEMOADD1', 'ADD_CHILD');
    expect(screen.getByText(/p\*\*\*@example\.com/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: CONFIRM_BUTTON_NAME }));

    expect(await screen.findByText('Đã thêm con vào tài khoản')).toBeOnTheScreen();
    expect(api.claim).toHaveBeenCalledWith('DEMOADD1');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.parent.students });

    await user.press(screen.getByRole('button', { name: DONE_BUTTON_NAME }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('ma cua email khac: bao loi, khong goi y dang nhap; nhap ma khac thi ve buoc 1', async () => {
    api.inspect.mockResolvedValue(INVITATION);
    api.claim.mockRejectedValue(
      new AppError(INVITATION_ERROR_MESSAGES.ADD_CHILD.FORBIDDEN ?? '', 403, 'FORBIDDEN'),
    );
    const { user } = await renderFlow();

    await submitCode(user);
    await user.press(screen.getByRole('button', { name: CONFIRM_BUTTON_NAME }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/được gửi tới email khác/);
    expect(screen.queryByRole('button', { name: /Đăng nhập$/ })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Nhập mã khác' }));
    expect(screen.getByLabelText('Mã liên kết')).toBeOnTheScreen();
  });

  it('o buoc nhap ma, ma da dung khong kem nut dang nhap', async () => {
    api.inspect.mockRejectedValue(new AppError('Mã đã dùng', 409, 'INVITATION_ALREADY_USED'));
    const { onBack, user } = await renderFlow();

    await user.type(screen.getByLabelText('Mã liên kết'), 'DEMOUSE1');
    await user.press(screen.getByRole('button', { name: CONTINUE_BUTTON_NAME }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Mã đã dùng');
    expect(screen.queryByRole('button', { name: /Đăng nhập$/ })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
