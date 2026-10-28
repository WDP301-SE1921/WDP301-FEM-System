import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { authApi } from '@/features/auth/api/auth-api';

/**
 * Anh dai dien trong `authApi` voi adapter mang gia (xem `api-client.test.ts`): dung route, multipart
 * va thong bao loi cho phu huynh. Khong phai goi BE that.
 */

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/lib/storage', () => ({
  secureStorage: {
    get: jest.fn(() => Promise.resolve('access-token')),
    set: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
  },
}));

/** Dia chi BE dat trong `jest.setup.js`. */
const API_URL = 'http://localhost:3000/api/v1';
const AVATAR_PATH = '/auth/me/avatar';
const SIGNED_URL =
  'https://storage.example.com/edugrade/avatars/parent-1/7f3a.jpg?X-Amz-Signature=s';

const IMAGE = {
  uri: 'file:///cache/anh-dai-dien.jpg',
  name: 'anh-dai-dien-1.jpg',
  mimeType: 'image/jpeg' as const,
  size: 1_000_000,
};

/** `respond` tra gia tri nay thi BE tra loi voi envelope loi. */
class BeError {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {}
}

type SentRequest = { method: string; path: string; config: InternalAxiosRequestConfig };

let sent: SentRequest[] = [];
let respond: () => unknown = () => null;

function networkAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = new URL(axios.getUri(config));
  sent.push({ method: config.method ?? '', path: url.href.slice(API_URL.length), config });

  const reply = respond();
  if (reply instanceof BeError) {
    const response: AxiosResponse = {
      data: { success: false, error: { code: reply.code, message: 'BE error', requestId: 'r1' } },
      status: reply.status,
      statusText: '',
      headers: {},
      config,
    };
    return Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, undefined, response),
    );
  }
  return Promise.resolve({
    data: { success: true, data: reply },
    status: 200,
    statusText: '',
    headers: {},
    config,
  });
}

beforeEach(() => {
  sent = [];
  respond = () => null;
  jest.spyOn(axios, 'getAdapter').mockReturnValue(networkAdapter);
});

afterEach(() => jest.restoreAllMocks());

describe('features/auth/api/authApi: anh dai dien', () => {
  it('GET /auth/me/avatar tra link xem anh, hoac null khi chua co anh', async () => {
    respond = () => ({ url: SIGNED_URL, expiresIn: 900 });
    await expect(authApi.getAvatar()).resolves.toEqual({ url: SIGNED_URL, expiresIn: 900 });

    respond = () => ({ url: null, expiresIn: null });
    await expect(authApi.getAvatar()).resolves.toEqual({ url: null, expiresIn: null });
    expect(sent.map(({ method, path }) => `${method} ${path}`)).toEqual([
      `get ${AVATAR_PATH}`,
      `get ${AVATAR_PATH}`,
    ]);
  });

  it('PUT multipart truong file, cho lau hon request thuong', async () => {
    respond = () => ({ url: SIGNED_URL, expiresIn: 900 });
    const append = jest.spyOn(FormData.prototype, 'append');

    await expect(authApi.uploadAvatar(IMAGE)).resolves.toEqual({
      url: SIGNED_URL,
      expiresIn: 900,
    });
    const [request] = sent;
    expect(request?.method).toBe('put');
    expect(request?.path).toBe(AVATAR_PATH);
    expect(request?.config.data).toBeInstanceOf(FormData);
    // BE tu choi moi truong khac `file` (multer `fields: 0`)
    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith('file', {
      uri: IMAGE.uri,
      name: IMAGE.name,
      type: IMAGE.mimeType,
    });
    expect(request?.config.headers['Content-Type']).toBe('multipart/form-data');
    expect(request?.config.timeout).toBe(60_000);
  });

  it('anh qua 5 MB, kho anh loi, hai lan doi cung luc: bao dung cho anh dai dien', async () => {
    // Cung ma voi anh bai lam nhung gioi han khac
    respond = () => new BeError(400, 'INVALID_FILE_SIZE');
    await expect(authApi.uploadAvatar(IMAGE)).rejects.toMatchObject({
      code: 'INVALID_FILE_SIZE',
      message: 'Ảnh đại diện phải nhỏ hơn 5 MB.',
    });

    respond = () => new BeError(413, 'HTTP_ERROR');
    await expect(authApi.uploadAvatar(IMAGE)).rejects.toMatchObject({
      message: 'Ảnh đại diện phải nhỏ hơn 5 MB.',
    });

    respond = () => new BeError(503, 'HTTP_ERROR');
    await expect(authApi.uploadAvatar(IMAGE)).rejects.toMatchObject({
      status: 503,
      message: 'Chưa lưu được ảnh đại diện lúc này. Vui lòng thử lại sau.',
    });

    respond = () => new BeError(409, 'AVATAR_CONFLICT');
    await expect(authApi.uploadAvatar(IMAGE)).rejects.toMatchObject({
      message: 'Ảnh đại diện vừa được đổi ở nơi khác. Vui lòng thử lại.',
    });

    respond = () => new BeError(400, 'INVALID_FILE_TYPE');
    await expect(authApi.uploadAvatar(IMAGE)).rejects.toMatchObject({
      message: 'Chỉ gửi được ảnh JPG hoặc PNG.',
    });
  });

  it('DELETE /auth/me/avatar de go anh', async () => {
    respond = () => ({ deleted: true });

    await expect(authApi.deleteAvatar()).resolves.toBeUndefined();
    expect(sent.map(({ method, path }) => `${method} ${path}`)).toEqual([`delete ${AVATAR_PATH}`]);
  });
});
