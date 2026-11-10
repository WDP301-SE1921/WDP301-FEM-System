import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { connectNotificationRealtime } from '@/features/parent-dashboard/api/notification-realtime';
import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { useNotificationRealtime } from '@/features/parent-dashboard/hooks/use-notification-realtime';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types/auth';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
}));
jest.mock('@/features/parent-dashboard/api/notification-realtime', () => ({
  connectNotificationRealtime: jest.fn(),
}));
jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getNotifications: jest.fn().mockResolvedValue({ items: [], page: 1, limit: 10, total: 0 }),
  },
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Store dang nhap doc SecureStore va AsyncStorage; test dat thang trang thai store
jest.mock('@/lib/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  storage: { getJson: jest.fn().mockResolvedValue([]), setJson: jest.fn(), remove: jest.fn() },
}));

const connect = jest.mocked(connectNotificationRealtime);
const getNotifications = jest.mocked(parentDashboardApi.getNotifications);
const scheduleNotification = jest.mocked(Notifications.scheduleNotificationAsync);
const channel = { open: jest.fn(), close: jest.fn() };
/** Lon hon thoi gian gom su kien cua hook. */
const DEBOUNCE_WAIT_MS = 400;

const PARENT: User = {
  id: 'parent-1',
  email: 'phuhuynh@example.com',
  displayName: 'Phạm Thu Hà',
  role: 'PARENT',
  status: 'ACTIVE',
  emailVerifiedAt: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

let appStateListener: ((status: AppStateStatus) => void) | undefined;
const removeAppStateListener = jest.fn();

async function setup(user: User | null) {
  useAuthStore.setState({ user, isAuthenticated: user !== null, isHydrated: true });
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  await renderHook(() => useNotificationRealtime(), { wrapper });
  const handlers = connect.mock.calls[0]?.[0];
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { handlers, invalidatedKeys };
}

/** Chay `trigger` (su kien realtime, doi trang thai app) roi doi het thoi gian gom su kien. */
async function fire(trigger: () => void) {
  await act(async () => {
    trigger();
    jest.advanceTimersByTime(DEBOUNCE_WAIT_MS);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  connect.mockReturnValue(channel);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener;
    return { remove: removeAppStateListener };
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('features/parent-dashboard/useNotificationRealtime', () => {
  it('chi ket noi khi phu huynh dang dang nhap', async () => {
    await setup(null);
    await setup({ ...PARENT, role: 'TEACHER' });

    expect(connect).not.toHaveBeenCalled();
  });

  it('thong bao moi thi tai lai thong bao va du lieu hoc tap, gom cac su kien gan nhau', async () => {
    const { handlers, invalidatedKeys } = await setup(PARENT);
    expect(connect).toHaveBeenCalledTimes(1);

    await fire(() => {
      handlers?.onNotificationCreated();
      handlers?.onNotificationCreated();
    });

    expect(invalidatedKeys()).toEqual([
      queryKeys.parent.all,
      queryKeys.me.all,
      queryKeys.registrations.all,
      queryKeys.academic.all,
      queryKeys.notifications.all,
    ]);
  });

  it('thiet bi khac doc thong bao hoac vua ket noi lai thi chi tai lai thong bao', async () => {
    const { handlers, invalidatedKeys } = await setup(PARENT);

    await fire(() => handlers?.onReadChanged());
    await fire(() => handlers?.onConnected());

    expect(invalidatedKeys()).toEqual([queryKeys.notifications.all, queryKeys.notifications.all]);
  });

  it('app tro lai man hinh thi mo lai ket noi va tai lai thong bao', async () => {
    const { invalidatedKeys } = await setup(PARENT);

    await fire(() => {
      appStateListener?.('background');
      appStateListener?.('active');
    });

    expect(channel.open).toHaveBeenCalledTimes(1);
    expect(invalidatedKeys()).toEqual([queryKeys.notifications.all]);
  });

  it('dang xuat thi dong ket noi va bo lang nghe app', async () => {
    await setup(PARENT);

    await act(async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    });

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });

  it('phat thong bao he dieu hanh (OS Push Notification) khi co thong bao chua doc moi', async () => {
    getNotifications.mockResolvedValueOnce({
      items: [
        {
          id: 'notif-1',
          type: 'ANNOUNCEMENT',
          title: 'Thông báo mới',
          body: 'Nội dung thông báo',
          target: { kind: 'CLASS', id: 'class-1' },
          context: { studentIds: ['student-1'] },
          createdAt: '2026-10-01T00:00:00.000Z',
          readAt: null,
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
    const { handlers } = await setup(PARENT);

    await fire(() => {
      handlers?.onNotificationCreated();
    });

    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'edugrade-notif-1',
        content: expect.objectContaining({
          title: 'Thông báo mới',
          body: 'Nội dung thông báo',
        }),
      }),
    );
  });
});
