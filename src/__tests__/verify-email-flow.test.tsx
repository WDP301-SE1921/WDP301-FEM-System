import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { authApi } from '@/features/auth/api/auth-api';
import { VerifyEmailFlow } from '@/features/auth/components/verify-email-flow';
import { AppError } from '@/types/api';
import type { User } from '@/types/auth';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { verifyEmail: jest.fn(), resendVerification: jest.fn(), me: jest.fn() },
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

/** BE phat ma 43 ky tu (32 byte dang base64url). */
const TOKEN = 'k3J9xQ2mVb7Lw0Zt5Yh8Nf1Rc4Ud6Sa-_pEgIoTqWzA';
/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const UNVERIFIED: User = {
  id: 'cmg2x1abc0000parent',
  email: 'phuhuynh@example.com',
  displayName: 'Phạm Thu Hà',
  role: 'PARENT',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  createdAt: '2026-10-05T02:00:00.000Z',
  updatedAt: '2026-10-05T02:00:00.000Z',
};
const VERIFIED: User = { ...UNVERIFIED, emailVerifiedAt: '2026-10-05T02:05:00.000Z' };

async function renderFlow(user: User = UNVERIFIED) {
  const onDone = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <VerifyEmailFlow user={user} onDone={onDone} />
    </QueryClientProvider>,
  );
  return { onDone, user: userEvent.setup() };
}

describe('features/auth/VerifyEmailFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.me.mockResolvedValue(UNVERIFIED);
  });

  it('bo trong ma thi bao loi o o nhap, khong goi API', async () => {
    const { user } = await renderFlow();

    expect(
      await screen.findByRole(
        'header',
        { name: 'Xác minh email' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('phuhuynh@example.com')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Xác minh email' }));

    expect(await screen.findByText('Vui lòng dán mã xác minh')).toBeOnTheScreen();
    expect(api.verifyEmail).not.toHaveBeenCalled();
  });

  it('dan ma dung: xac minh, doc lai tai khoan vao phien roi cho di tiep', async () => {
    api.verifyEmail.mockResolvedValue();
    // Lan dau la luc mo man hinh, lan sau la sau khi xac minh xong
    api.me.mockResolvedValueOnce(UNVERIFIED).mockResolvedValue(VERIFIED);
    const { onDone, user } = await renderFlow();

    await user.type(screen.getByLabelText('Mã xác minh'), ` ${TOKEN} `);
    await user.press(screen.getByRole('button', { name: 'Xác minh email' }));

    expect(
      await screen.findByRole(
        'header',
        { name: 'Email đã được xác minh' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(api.verifyEmail).toHaveBeenCalledWith({ token: TOKEN });
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(VERIFIED));
    expect(screen.queryByLabelText('Mã xác minh')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('ma sai hoac het han thi hien thong bao cua BE va giu form', async () => {
    api.verifyEmail.mockRejectedValue(
      new AppError('Mã xác minh không đúng hoặc đã hết hạn.', 400, 'AUTH_INVALID_EMAIL_TOKEN'),
    );
    const { user } = await renderFlow();

    await user.type(screen.getByLabelText('Mã xác minh'), TOKEN);
    await user.press(screen.getByRole('button', { name: 'Xác minh email' }));

    expect(
      await screen.findByRole('alert', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toHaveTextContent('Mã xác minh không đúng hoặc đã hết hạn.');
    expect(screen.getByLabelText('Mã xác minh')).toBeOnTheScreen();
  });

  it.each([
    ['BE gui duoc email', true, 'Đã gửi lại mã. Kiểm tra hộp thư đến và cả thư rác.'],
    [
      'BE khong gui duoc email',
      false,
      'Trung tâm chưa gửi được email lúc này. Vui lòng thử lại sau hoặc liên hệ trung tâm.',
    ],
  ])('gui lai ma khi %s', async (_case, sent, message) => {
    api.resendVerification.mockResolvedValue({ sent });
    const { user } = await renderFlow();

    await user.press(screen.getByRole('button', { name: 'Gửi lại mã' }));

    expect(
      await screen.findByRole('alert', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toHaveTextContent(message);
    expect(api.resendVerification).toHaveBeenCalledWith('phuhuynh@example.com');
  });

  it('de sau thi roi man hinh ma khong goi xac minh', async () => {
    const { onDone, user } = await renderFlow();

    await user.press(screen.getByRole('button', { name: 'Để sau' }));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(api.verifyEmail).not.toHaveBeenCalled();
  });

  it('tai khoan da xac minh thi khong hien form, chi cho di tiep', async () => {
    api.me.mockResolvedValue(VERIFIED);
    await renderFlow(VERIFIED);

    expect(
      await screen.findByRole(
        'header',
        { name: 'Email đã được xác minh' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Mã xác minh')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Để sau' })).not.toBeOnTheScreen();
  });
});
