import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { apiClient, refreshSession, setUnauthorizedHandler } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { ErrorMessages } from '@/constants/messages';
import { StorageKeys } from '@/constants/storage-keys';
import { AppError } from '@/types/api';

/**
 * apiClient voi adapter mang gia: kiem tra request cua endpoint da wire ra mang voi dung URL (kem dia
 * chi BE), header va body, con endpoint chua wire thi khong ra mang. Moi truong Jest khong co adapter
 * mang dung duoc nen day khong phai goi BE that, chi xac nhan hinh dang request apiClient gui di.
 */

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockSecureValues = new Map<string, string>();
jest.mock('@/lib/storage', () => ({
  secureStorage: {
    get: jest.fn((key: string) => Promise.resolve(mockSecureValues.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      mockSecureValues.set(key, value);
      return Promise.resolve();
    }),
    remove: jest.fn((key: string) => {
      mockSecureValues.delete(key);
      return Promise.resolve();
    }),
  },
}));

type SentRequest = {
  method: string;
  /** URL day du sau khi axios ghep `baseURL`. */
  url: string;
  authorization: string | undefined;
  body: unknown;
};
type Reply = { status: number; body: unknown } | 'NETWORK_ERROR';

/** Dia chi BE dat trong `jest.setup.js`. */
const API_URL = 'http://localhost:3000/api/v1';
const STUDENT_ID = 'cmg2x1abc0001student';
const NEW_TOKENS = {
  accessToken: 'access-moi',
  refreshToken: 'refresh-moi',
  tokenType: 'Bearer',
  expiresIn: 900,
};

let sent: SentRequest[] = [];
let respond: (request: SentRequest) => Reply = () => ok(null);

function ok(data: unknown, status = 200): Reply {
  return { status, body: { success: true, data } };
}

function fail(status: number, code: string): Reply {
  return {
    status,
    body: { success: false, error: { code, message: 'English message', requestId: 'req-1' } },
  };
}

function readAuthorization(config: InternalAxiosRequestConfig): string | undefined {
  const header: unknown = config.headers.get('Authorization');
  return typeof header === 'string' ? header : undefined;
}

/** Dong vai adapter mang cua axios: ghi lai request va tra loi nhu mot server HTTP. */
function networkAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const request: SentRequest = {
    method: config.method ?? '',
    url: axios.getUri(config),
    authorization: readAuthorization(config),
    // transformRequest cua axios da stringify body truoc khi toi adapter
    body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
  };
  sent.push(request);

  const reply = respond(request);
  if (reply === 'NETWORK_ERROR') {
    return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));
  }

  const response: AxiosResponse = {
    data: reply.body,
    status: reply.status,
    statusText: '',
    headers: {},
    config,
  };
  if (config.validateStatus?.(reply.status)) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, undefined, response),
  );
}

beforeEach(() => {
  sent = [];
  mockSecureValues.clear();
  respond = () => ok(null);
  setUnauthorizedHandler(jest.fn());
  jest.spyOn(axios, 'getAdapter').mockReturnValue(networkAdapter);
});

afterEach(() => jest.restoreAllMocks());

describe('api/client', () => {
  it('dang nhap toi dia chi BE kem duong dan, gui body JSON va chua co Bearer', async () => {
    respond = () => ok({ user: { id: 'user-1' }, tokens: NEW_TOKENS });
    const credentials = { email: 'phuhuynh@example.com', password: 'Matkhau123' };

    const { data } = await apiClient.post(Endpoints.auth.login, credentials);

    expect(data).toEqual({ success: true, data: { user: { id: 'user-1' }, tokens: NEW_TOKENS } });
    expect(sent).toEqual([
      { method: 'post', url: `${API_URL}/auth/login`, authorization: undefined, body: credentials },
    ]);
  });

  it('gan Bearer da luu va ghep tham so duong dan vao URL', async () => {
    mockSecureValues.set(StorageKeys.accessToken, 'access-cu');
    respond = () => ok([]);

    await apiClient.get(Endpoints.me.studentEnrollments(STUDENT_ID));
    await apiClient.patch(Endpoints.me.student(STUDENT_ID), { grade: 7 });

    expect(sent).toMatchObject([
      {
        method: 'get',
        url: `${API_URL}/me/students/${STUDENT_ID}/enrollments`,
        authorization: 'Bearer access-cu',
      },
      {
        method: 'patch',
        url: `${API_URL}/me/students/${STUDENT_ID}`,
        authorization: 'Bearer access-cu',
        body: { grade: 7 },
      },
    ]);
  });

  it('loi cua BE thanh AppError tieng Viet theo `error.code`, giu status va code', async () => {
    mockSecureValues.set(StorageKeys.accessToken, 'access-cu');
    respond = () => fail(409, 'PARENT_EMAIL_UNVERIFIED');

    const error: unknown = await apiClient
      .post(Endpoints.me.students, { fullName: 'Nguyễn Gia Huy', grade: 7 })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      status: 409,
      code: 'PARENT_EMAIL_UNVERIFIED',
      message: 'Cần xác minh email trước khi tạo hoặc sửa hồ sơ học sinh.',
    });
  });

  it('gap 401 thi refresh mot lan, luu cap token moi roi goi lai request cu', async () => {
    mockSecureValues.set(StorageKeys.accessToken, 'access-het-han');
    mockSecureValues.set(StorageKeys.refreshToken, 'refresh-cu');
    respond = ({ url, authorization }) => {
      if (url === `${API_URL}/auth/refresh`)
        return ok({ user: { id: 'user-1' }, tokens: NEW_TOKENS });
      return authorization === `Bearer ${NEW_TOKENS.accessToken}`
        ? ok([{ id: STUDENT_ID }])
        : fail(401, 'AUTH_UNAUTHORIZED');
    };

    const { data } = await apiClient.get(Endpoints.me.students);

    expect(data).toEqual({ success: true, data: [{ id: STUDENT_ID }] });
    expect(sent.map(({ method, url }) => `${method} ${url}`)).toEqual([
      `get ${API_URL}/me/students`,
      `post ${API_URL}/auth/refresh`,
      `get ${API_URL}/me/students`,
    ]);
    // Refresh gui dung refresh token dang luu va khong mang Bearer het han
    expect(sent[1]).toMatchObject({
      authorization: undefined,
      body: { refreshToken: 'refresh-cu' },
    });
    expect(mockSecureValues.get(StorageKeys.accessToken)).toBe(NEW_TOKENS.accessToken);
    expect(mockSecureValues.get(StorageKeys.refreshToken)).toBe(NEW_TOKENS.refreshToken);
  });

  it('refresh that bai thi bao dang xuat va tra loi 401 cho noi goi', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockSecureValues.set(StorageKeys.accessToken, 'access-het-han');
    mockSecureValues.set(StorageKeys.refreshToken, 'refresh-da-thu-hoi');
    respond = ({ url }) =>
      url === `${API_URL}/auth/refresh`
        ? fail(401, 'AUTH_INVALID_REFRESH_TOKEN')
        : fail(401, 'AUTH_UNAUTHORIZED');

    const error: unknown = await apiClient
      .get(Endpoints.me.students)
      .catch((reason: unknown) => reason);

    expect(error).toMatchObject({ status: 401, code: 'AUTH_UNAUTHORIZED' });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('endpoint chua wire bi server gia chan voi 404, khong ra mang', async () => {
    const error: unknown = await apiClient
      .get(`/parent/students/${STUDENT_ID}/dashboard`)
      .catch((reason: unknown) => reason);

    expect(error).toMatchObject({ status: 404, code: 'HTTP_ERROR' });
    expect(sent).toEqual([]);
  });

  it('refreshSession gom cac lan refresh dong thoi vao mot request', async () => {
    mockSecureValues.set(StorageKeys.refreshToken, 'refresh-cu');
    respond = () => ok({ user: { id: 'user-1' }, tokens: NEW_TOKENS });

    const tokens = await Promise.all([refreshSession(), refreshSession()]);

    expect(tokens).toEqual([NEW_TOKENS.accessToken, NEW_TOKENS.accessToken]);
    expect(sent.map(({ url }) => url)).toEqual([`${API_URL}/auth/refresh`]);
  });

  it('refreshSession tra null khi khong refresh duoc, khong tu dang xuat', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockSecureValues.set(StorageKeys.refreshToken, 'refresh-da-thu-hoi');
    respond = () => fail(401, 'AUTH_INVALID_REFRESH_TOKEN');

    await expect(refreshSession()).resolves.toBeNull();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('khong ket noi duoc toi BE thi bao loi mang', async () => {
    respond = () => 'NETWORK_ERROR';

    const error: unknown = await apiClient
      .post(Endpoints.auth.login, { email: 'a@b.vn', password: '12345678' })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ message: ErrorMessages.network });
  });
});
