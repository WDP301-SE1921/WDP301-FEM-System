import axios from 'axios';

import { MOCK_ROUTES } from '@/api/mocks';
import {
  createMockAdapter,
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockRoute,
} from '@/api/mocks/mock-adapter';

// Test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/** Route dung rieng cho test: tu ngay 2026-10-19 app khong con endpoint nao chay bang mock. */
const TEST_ROUTES: readonly MockRoute[] = [
  {
    method: 'get',
    url: '/test/students/:studentId',
    handle: (_body, { accessToken, params, query }) =>
      accessToken
        ? mockOk({ studentId: params.studentId, page: query.page ?? null })
        : mockError(401, 'AUTH_UNAUTHORIZED', 'Unauthorized'),
  },
  {
    method: 'post',
    url: '/test/students',
    handle: (body) => {
      const input = readBody(body, ['fullName'], ['grade']);
      return input ? mockOk(input, 201) : mockValidationError();
    },
  },
];

const client = axios.create({ adapter: createMockAdapter(TEST_ROUTES, 0) });
const withBearer = { headers: { Authorization: 'Bearer access-token' } };

/** Lay status va body loi tu request bi reject. */
async function captureError(request: Promise<unknown>) {
  try {
    await request;
  } catch (error) {
    if (axios.isAxiosError(error))
      return { status: error.response?.status, body: error.response?.data };
  }
  throw new Error('Request khong bi reject');
}

describe('api/mocks', () => {
  it('moi endpoint app goi deu da wire nen chua co route mock nao', () => {
    expect(MOCK_ROUTES).toEqual([]);
  });

  it('request khong co route mock bi chan voi 404 nhu Nest, khong ra mang', async () => {
    const { status, body } = await captureError(client.get('/users'));

    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, error: { code: 'HTTP_ERROR' } });
  });

  it('khop tham so duong dan, query va Bearer, tra dung envelope cua BE', async () => {
    const { data } = await client.get('/test/students/abc', {
      ...withBearer,
      params: { page: 2 },
    });

    expect(data).toEqual({ success: true, data: { studentId: 'abc', page: '2' } });
    expect(await captureError(client.get('/test/students/abc'))).toMatchObject({
      status: 401,
      body: { error: { code: 'AUTH_UNAUTHORIZED' } },
    });
  });

  it('gia lap ValidationPipe: thua hoac thieu field thi 400 VALIDATION_ERROR', async () => {
    const { status } = await client.post('/test/students', { fullName: 'Minh Anh', grade: 7 });
    expect(status).toBe(201);

    const invalid = { status: 400, body: { error: { code: 'VALIDATION_ERROR' } } };
    expect(await captureError(client.post('/test/students', { grade: 7 }))).toMatchObject(invalid);
    expect(
      await captureError(client.post('/test/students', { fullName: 'Minh Anh', extra: true })),
    ).toMatchObject(invalid);
  });

  it('url thua doan khong khop route mock thi tra 404', async () => {
    const { status } = await captureError(client.get('/test/students/abc/extra', withBearer));

    expect(status).toBe(404);
  });
});
