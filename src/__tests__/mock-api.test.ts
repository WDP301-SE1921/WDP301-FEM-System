import axios from 'axios';

import { Endpoints } from '@/api/endpoints';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import { SAMPLE_PARENT } from '@/api/mocks/mock-students';
import { parentRoutes } from '@/api/mocks/parent';

// Test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const client = axios.create({ adapter: createMockAdapter(parentRoutes, 0) });

const DEMO_STUDENT_ID = 'mock-student-1';
/** Id ho so con do BE that cap: khong co trong du lieu mau cua server gia. */
const REAL_STUDENT_ID = 'cmg2x1abc0001studentreal';

function encodeJwtSegment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * Access token dang JWT nhu BE phat sau khi dang nhap. Server gia chi doc payload nen chu ky de gia.
 */
function issueAccessToken(userId: string, role: string, type = 'access'): string {
  return [
    encodeJwtSegment({ alg: 'HS256', typ: 'JWT' }),
    encodeJwtSegment({ sub: userId, sid: 'test-session', jti: 'test-jti', type, role }),
    'chu-ky-gia',
  ].join('.');
}

/** Phu huynh mau: so huu hai hoc sinh mau. */
const DEMO_PARENT = { accessToken: issueAccessToken(SAMPLE_PARENT.id, 'PARENT') };
/** Phu huynh that cua BE: khong so huu hoc sinh mau nao. */
const OTHER_PARENT = { accessToken: issueAccessToken('cmg2x1abc0000parentreal', 'PARENT') };
const TEACHER = { accessToken: issueAccessToken('cmg2x1abc0002teacher', 'TEACHER') };

function withBearer(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

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
  it('request khong co route mock bi chan voi 404 nhu Nest, khong ra mang', async () => {
    const { status, body } = await captureError(client.get('/users'));

    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, error: { code: 'HTTP_ERROR' } });
  });

  describe('guard cua server gia', () => {
    const url = Endpoints.parent.unreadNotificationCount;

    it('thieu Bearer hoac token khong phai access token cua BE tra 401', async () => {
      const unauthorized = { status: 401, body: { error: { code: 'AUTH_UNAUTHORIZED' } } };
      const refreshToken = issueAccessToken(SAMPLE_PARENT.id, 'PARENT', 'refresh');

      expect(await captureError(client.get(url))).toMatchObject(unauthorized);
      expect(await captureError(client.get(url, withBearer('khong-phai-jwt')))).toMatchObject(
        unauthorized,
      );
      expect(await captureError(client.get(url, withBearer(refreshToken)))).toMatchObject(
        unauthorized,
      );
    });

    it('tai khoan khong phai PARENT tra 403', async () => {
      const teacher = await captureError(client.get(url, withBearer(TEACHER.accessToken)));
      expect(teacher).toMatchObject({ status: 403, body: { error: { code: 'FORBIDDEN' } } });
    });
  });

  describe('parent', () => {
    it('dem thong bao chua doc theo phu huynh dang nhap', async () => {
      const demoCount = await client.get(
        Endpoints.parent.unreadNotificationCount,
        withBearer(DEMO_PARENT.accessToken),
      );
      expect(demoCount.data.data).toEqual({ unreadCount: 2 });

      const otherCount = await client.get(
        Endpoints.parent.unreadNotificationCount,
        withBearer(OTHER_PARENT.accessToken),
      );
      expect(otherCount.data.data).toEqual({ unreadCount: 0 });
    });

    it('khop tham so duong dan va tra tong quan cua dung con', async () => {
      const { accessToken } = DEMO_PARENT;
      const { data } = await client.get(
        Endpoints.parent.studentDashboard(DEMO_STUDENT_ID),
        withBearer(accessToken),
      );

      expect(data.data.scoreSummary).toEqual({ average: 8.2, changeFromLastMonth: 0.4 });
      expect(data.data).not.toHaveProperty('attendance');
    });

    it('url thua doan khong khop route mock thi tra 404', async () => {
      const { accessToken } = DEMO_PARENT;
      const url = `${Endpoints.parent.studentDashboard(DEMO_STUDENT_ID)}/extra`;
      const { status } = await captureError(client.get(url, withBearer(accessToken)));

      expect(status).toBe(404);
    });

    it('hoc sinh mau cua phu huynh khac tra 404', async () => {
      const error = await captureError(
        client.get(
          Endpoints.parent.studentDashboard(DEMO_STUDENT_ID),
          withBearer(OTHER_PARENT.accessToken),
        ),
      );
      expect(error).toMatchObject({ status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND' } } });
    });

    it('con that cua BE chua co du lieu o route con mock: tong quan rong', async () => {
      const dashboard = await client.get(
        Endpoints.parent.studentDashboard(REAL_STUDENT_ID),
        withBearer(OTHER_PARENT.accessToken),
      );
      expect(dashboard.data.data).toEqual({
        scoreSummary: null,
        attentionItems: [],
        recentNotifications: [],
      });
    });

    it('diem danh da noi BE that nen server gia khong con route', async () => {
      const url = `/parent/students/${DEMO_STUDENT_ID}/attendance`;
      const { status, body } = await captureError(
        client.get(url, withBearer(DEMO_PARENT.accessToken)),
      );

      expect(status).toBe(404);
      expect(body).toMatchObject({ error: { code: 'HTTP_ERROR' } });
    });
  });
});
