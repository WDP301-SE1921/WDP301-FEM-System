// FILE TAM de kiem tra interceptor voi mock, se xoa ngay sau khi chay.
const memory = new Map<string, string>();

jest.mock('@/lib/storage', () => ({
  secureStorage: {
    get: async (key: string) => memory.get(key) ?? null,
    set: async (key: string, value: string) => void memory.set(key, value),
    remove: async (key: string) => void memory.delete(key),
  },
  storage: {},
}));

const debugLog = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: (...args: unknown[]) => debugLog(...args),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

process.env.EXPO_PUBLIC_API_URL = 'http://mock.test/api/v1';
process.env.EXPO_PUBLIC_API_MOCK = 'true';

/* eslint-disable @typescript-eslint/no-require-imports */
const { apiClient, setUnauthorizedHandler } = require('@/api/client');
const { Endpoints } = require('@/api/endpoints');
const { StorageKeys } = require('@/constants/storage-keys');

const refreshCalls = () =>
  debugLog.mock.calls.filter(([msg]) => String(msg).includes('POST /auth/refresh')).length;

describe('probe interceptor + mock', () => {
  beforeEach(() => {
    memory.clear();
    debugLog.mockClear();
  });

  it('401 -> refresh -> luu cap moi -> retry thanh cong, gom 3 request vao 1 refresh', async () => {
    const { data } = await apiClient.post(Endpoints.auth.login, {
      email: 'phuhuynh@example.com',
      password: 'Matkhau123',
    });
    const oldRefresh = data.data.tokens.refreshToken;
    memory.set(StorageKeys.refreshToken, oldRefresh);
    memory.set(StorageKeys.accessToken, 'expired-token');

    const results = await Promise.all([
      apiClient.get(Endpoints.parent.students),
      apiClient.get(Endpoints.parent.unreadNotificationCount),
      apiClient.get(Endpoints.parent.studentDashboard('mock-student-1')),
    ]);

    expect(results.map((r: { status: number }) => r.status)).toEqual([200, 200, 200]);
    expect(results[0].data.data).toHaveLength(2);
    expect(refreshCalls()).toBe(1);
    expect(memory.get(StorageKeys.refreshToken)).not.toBe(oldRefresh);
    expect(memory.get(StorageKeys.accessToken)).toMatch(/^mock-access\./);
  }, 20_000);

  it('dang nhap sai mat khau (401) co goi onUnauthorized khong', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    memory.set(StorageKeys.refreshToken, 'stale-refresh-token-from-old-session-xxxxxxxx');

    const error = await apiClient
      .post(Endpoints.auth.login, { email: 'phuhuynh@example.com', password: 'SaiMatKhau1' })
      .catch((e: unknown) => e);

    // eslint-disable-next-line no-console
    console.log('login sai:', {
      code: error.code,
      message: error.message,
      refreshCalls: refreshCalls(),
      onUnauthorizedCalled: onUnauthorized.mock.calls.length,
    });
  }, 20_000);
});
