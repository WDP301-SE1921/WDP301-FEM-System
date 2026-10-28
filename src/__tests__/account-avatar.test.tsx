import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { authApi } from '@/features/auth/api/auth-api';
import { AccountSummary } from '@/features/auth/components/account-summary';
import { pickImage } from '@/lib/image-picker';
import { AppError } from '@/types/api';
import type { User } from '@/types/auth';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { getAvatar: jest.fn(), uploadAvatar: jest.fn(), deleteAvatar: jest.fn() },
}));
// Camera va thu vien anh la module native: test chon san ket qua tra ve
jest.mock('@/lib/image-picker', () => ({ pickImage: jest.fn() }));
// Store doc SecureStore va apiClient; test chi can biet phien duoc ghi lai co anh hay chua
const mockSetUser = jest.fn();
let mockUser: User | null = null;
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: User | null; setUser: jest.Mock }) => unknown) =>
    selector({ user: mockUser, setUser: mockSetUser }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const api = jest.mocked(authApi);
const mockedPickImage = jest.mocked(pickImage);

/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const PARENT: User = {
  id: 'cmg2x1abc0000parent',
  email: 'phuhuynh@example.com',
  displayName: 'Phạm Thu Hà',
  role: 'PARENT',
  status: 'ACTIVE',
  emailVerifiedAt: '2026-10-05T02:05:00.000Z',
  hasAvatar: false,
  createdAt: '2026-10-05T02:00:00.000Z',
  updatedAt: '2026-10-05T02:00:00.000Z',
};
const SIGNED_URL =
  'https://storage.example.com/edugrade/avatars/parent-1/7f3a.jpg?X-Amz-Signature=s';
const PICKED_PHOTO = {
  uri: 'file:///cache/anh-dai-dien.jpg',
  name: 'anh-dai-dien-1.jpg',
  mimeType: 'image/jpeg' as const,
  size: 1_000_000,
};

async function renderSummary(user: User) {
  mockUser = user;
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <AccountSummary user={user} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => jest.clearAllMocks());

describe('features/auth/AccountAvatar', () => {
  it('chua co anh: khong hoi BE; chon anh thi cat vuong, luu roi hien anh moi', async () => {
    mockedPickImage.mockResolvedValue({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadAvatar.mockResolvedValue({ url: SIGNED_URL, expiresIn: 900 });
    const user = await renderSummary(PARENT);

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Thêm ảnh đại diện' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(api.getAvatar).not.toHaveBeenCalled();
    expect(screen.getByText('Ảnh đại diện')).toBeOnTheScreen();
    // Chua co anh thi khong co gi de go
    expect(screen.queryByRole('button', { name: 'Gỡ ảnh đại diện' })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Chọn ảnh đại diện có sẵn' }));

    expect(mockedPickImage).toHaveBeenCalledWith(
      'library',
      expect.objectContaining({ aspect: [1, 1], maxBytes: 5 * 1024 * 1024 }),
    );
    expect(api.uploadAvatar).toHaveBeenCalledWith(PICKED_PHOTO);
    expect(await screen.findByLabelText('Ảnh đại diện')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Đổi ảnh đại diện' })).toBeOnTheScreen();
    expect(mockSetUser).toHaveBeenCalledWith({ ...PARENT, hasAvatar: true });
    // Luu xong thi dong sheet
    expect(screen.queryByText('Ảnh đại diện')).not.toBeOnTheScreen();
  });

  it('da co anh: hien anh tu BE; go anh thi quay ve chu cai dau', async () => {
    api.getAvatar.mockResolvedValue({ url: SIGNED_URL, expiresIn: 900 });
    api.deleteAvatar.mockResolvedValue();
    const user = await renderSummary({ ...PARENT, hasAvatar: true });

    expect(
      await screen.findByLabelText('Ảnh đại diện', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Đổi ảnh đại diện' }));
    await user.press(screen.getByRole('button', { name: 'Gỡ ảnh đại diện' }));

    expect(api.deleteAvatar).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'Thêm ảnh đại diện' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Ảnh đại diện')).not.toBeOnTheScreen();
    expect(mockSetUser).toHaveBeenCalledWith({ ...PARENT, hasAvatar: false });
  });

  it('phien luu tu truoc khi BE tra hasAvatar thi van hoi BE', async () => {
    const { hasAvatar: _hasAvatar, ...legacyUser } = PARENT;
    api.getAvatar.mockResolvedValue({ url: SIGNED_URL, expiresIn: 900 });
    await renderSummary(legacyUser);

    expect(
      await screen.findByLabelText('Ảnh đại diện', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(api.getAvatar).toHaveBeenCalledTimes(1);
  });

  it('anh qua lon hoac luu loi thi bao trong sheet, khong doi anh', async () => {
    mockedPickImage.mockResolvedValueOnce({ status: 'TOO_LARGE' });
    const user = await renderSummary(PARENT);

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Thêm ảnh đại diện' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    await user.press(screen.getByRole('button', { name: 'Chụp ảnh đại diện' }));
    expect(
      await screen.findByText('Ảnh lớn hơn 5 MB. Hãy chụp lại hoặc chọn ảnh khác.'),
    ).toBeOnTheScreen();
    expect(api.uploadAvatar).not.toHaveBeenCalled();

    mockedPickImage.mockResolvedValueOnce({ status: 'PICKED', image: PICKED_PHOTO });
    api.uploadAvatar.mockRejectedValueOnce(
      new AppError('Chưa lưu được ảnh đại diện lúc này. Vui lòng thử lại sau.', 503),
    );
    await user.press(screen.getByRole('button', { name: 'Chụp ảnh đại diện' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chưa lưu được ảnh đại diện lúc này. Vui lòng thử lại sau.',
    );
    expect(
      screen.queryByText('Ảnh lớn hơn 5 MB. Hãy chụp lại hoặc chọn ảnh khác.'),
    ).not.toBeOnTheScreen();
    await waitFor(() => expect(mockSetUser).not.toHaveBeenCalled());
    expect(screen.getByText('Ảnh đại diện')).toBeOnTheScreen();
  });
});
