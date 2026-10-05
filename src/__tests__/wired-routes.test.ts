import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import { Endpoints } from '@/api/endpoints';
import { MOCK_ROUTES } from '@/api/mocks';
import { matchPath } from '@/api/route-pattern';
import { createApiAdapter, isWiredRequest, WIRED_ROUTES } from '@/api/wired-routes';

// Test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const STUDENT_ID = 'cmg2x1abc0001student';

describe('api/wired-routes', () => {
  describe('isWiredRequest', () => {
    it.each([
      ['post', Endpoints.auth.login],
      ['post', Endpoints.auth.register],
      ['post', Endpoints.auth.refresh],
      ['post', Endpoints.auth.logout],
      ['get', Endpoints.auth.me],
      ['post', Endpoints.auth.verifyEmail],
      ['post', Endpoints.auth.resendVerification],
      ['get', Endpoints.me.students],
      ['post', Endpoints.me.students],
      ['patch', Endpoints.me.student(STUDENT_ID)],
      ['get', Endpoints.me.studentEnrollments(STUDENT_ID)],
      ['get', Endpoints.registrations.receipt('cmg2x1abc0003order')],
    ])('%s %s ra BE that', (method, url) => {
      expect(isWiredRequest(method, url)).toBe(true);
    });

    it.each([
      ['BE chua co route nay', 'get', Endpoints.parent.studentDashboard(STUDENT_ID)],
      ['route TAM, BE chua co', 'get', Endpoints.me.studentRegistrations(STUDENT_ID)],
      ['chua wire', 'get', Endpoints.academic.assignment('assignment-1')],
      ['chua wire', 'post', Endpoints.academic.submissions],
      ['sai method', 'delete', Endpoints.me.student(STUDENT_ID)],
      ['sai method', 'get', Endpoints.auth.login],
      ['thua doan duong dan', 'get', `${Endpoints.me.students}/${STUDENT_ID}/extra`],
      ['duong dan la', 'get', '/users'],
    ])('%s: %s %s khong ra mang', (_case, method, url) => {
      expect(isWiredRequest(method, url)).toBe(false);
    });

    it('thieu method hoac url thi khong ra mang', () => {
      expect(isWiredRequest(undefined, Endpoints.auth.login)).toBe(false);
      expect(isWiredRequest('post', undefined)).toBe(false);
    });
  });

  it('khong endpoint nao vua wire vua con route mock', () => {
    const overlapping = WIRED_ROUTES.filter((wired) =>
      MOCK_ROUTES.some(
        (mock) => mock.method === wired.method && matchPath(mock.url, wired.url) !== null,
      ),
    );

    expect(overlapping).toEqual([]);
  });

  describe('createApiAdapter', () => {
    const response = { data: null, status: 200, statusText: '', headers: {}, config: {} };

    function setup() {
      const mockAdapter = jest.fn().mockResolvedValue({ ...response, data: 'mock' });
      const networkAdapter = jest.fn().mockResolvedValue({ ...response, data: 'network' });
      const resolveNetworkAdapter = jest.fn((): AxiosAdapter => networkAdapter);
      const adapter = createApiAdapter(mockAdapter, resolveNetworkAdapter);
      return { adapter, mockAdapter, networkAdapter, resolveNetworkAdapter };
    }

    function request(method: string, url: string) {
      // Adapter chi doc `method` va `url`, khong can du InternalAxiosRequestConfig
      return { method, url } as InternalAxiosRequestConfig;
    }

    it('endpoint da wire di qua adapter mang', async () => {
      const { adapter, mockAdapter, networkAdapter } = setup();
      const config = request('post', Endpoints.auth.login);

      await expect(adapter(config)).resolves.toMatchObject({ data: 'network' });
      expect(networkAdapter).toHaveBeenCalledWith(config);
      expect(mockAdapter).not.toHaveBeenCalled();
    });

    it('endpoint chua wire do server gia tra loi, khong lay adapter mang', async () => {
      const { adapter, mockAdapter, resolveNetworkAdapter } = setup();
      const config = request('get', Endpoints.parent.studentDashboard(STUDENT_ID));

      await expect(adapter(config)).resolves.toMatchObject({ data: 'mock' });
      expect(mockAdapter).toHaveBeenCalledWith(config);
      expect(resolveNetworkAdapter).not.toHaveBeenCalled();
    });
  });
});
