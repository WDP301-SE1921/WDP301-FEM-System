import axios from 'axios';

import { Endpoints } from '@/api/endpoints';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import type { MockAttendanceRecord } from '@/api/mocks/mock-attendance';
import { SAMPLE_PARENT } from '@/api/mocks/mock-students';
import { parentRoutes } from '@/api/mocks/parent';
import { addDays, startOfDay, toDateKey } from '@/utils/date';

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

      expect(data.data.attendance).toEqual({ attendedSessions: 16, totalSessions: 17 });
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

    it('con that cua BE chua co du lieu o cac route con mock: tong quan va diem danh rong', async () => {
      const bearer = withBearer(OTHER_PARENT.accessToken);

      const dashboard = await client.get(
        Endpoints.parent.studentDashboard(REAL_STUDENT_ID),
        bearer,
      );
      expect(dashboard.data.data).toEqual({
        attendance: { attendedSessions: 0, totalSessions: 0 },
        scoreSummary: null,
        attentionItems: [],
        recentNotifications: [],
      });

      const attendance = await client.get(
        Endpoints.parent.studentAttendance(REAL_STUDENT_ID),
        bearer,
      );
      expect(attendance.data.data).toEqual([]);
    });
  });

  describe('GET /parent/students/:studentId/attendance', () => {
    const today = startOfDay(new Date());
    const OTHER_STUDENT_ID = 'mock-student-2';

    async function getAttendance(accessToken: string, studentId: string) {
      const { data } = await client.get<{ data: MockAttendanceRecord[] }>(
        Endpoints.parent.studentAttendance(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    function findRecord<T>(items: T[], predicate: (item: T) => boolean): T {
      const found = items.find(predicate);
      if (!found) throw new Error('Du lieu mau thieu buoi can kiem tra');
      return found;
    }

    function isOnDay(daysFromToday: number) {
      return ({ startsAt }: { startsAt: string }) =>
        toDateKey(new Date(startsAt)) === toDateKey(addDays(today, daysFromToday));
    }

    it('chi tra buoi da ket thuc, moi nhat truoc, khop so buoi cua trang chu', async () => {
      const { accessToken } = DEMO_PARENT;
      const records = await getAttendance(accessToken, DEMO_STUDENT_ID);
      const startTimes = records.map(({ startsAt }) => startsAt);

      expect(startTimes).toEqual([...startTimes].sort().reverse());
      expect(records.every(({ endsAt }) => new Date(endsAt) <= new Date())).toBe(true);

      // Buoi Toan toi nay chi duoc tinh khi da ket thuc, trang chu mock thi khong doi theo gio
      const beforeToday = records.filter(({ startsAt }) => new Date(startsAt) < today);
      expect(beforeToday).toHaveLength(17);
      expect(beforeToday.filter(({ attendance }) => attendance === 'PRESENT')).toHaveLength(16);
    });

    it('buoi nghi co phep kem ly do va buoi hoc bu da xep vao hai ngay toi', async () => {
      const { accessToken } = DEMO_PARENT;
      const records = await getAttendance(accessToken, DEMO_STUDENT_ID);
      const excused = findRecord(records, isOnDay(-3));

      expect(excused).toMatchObject({
        kind: 'REGULAR',
        attendance: 'EXCUSED',
        leaveReason: expect.any(String),
        makeup: { status: 'BOOKED' },
        originalSession: null,
      });
      expect(toDateKey(new Date(excused.makeup?.startsAt ?? ''))).toBe(
        toDateKey(addDays(today, 2)),
      );
    });

    it('hoc bu da xong: buoi vang ghi COMPLETED, buoi hoc bu tro ve buoi vang', async () => {
      const { accessToken } = DEMO_PARENT;
      const [records, dashboard] = await Promise.all([
        getAttendance(accessToken, OTHER_STUDENT_ID),
        client.get(Endpoints.parent.studentDashboard(OTHER_STUDENT_ID), withBearer(accessToken)),
      ]);
      const excused = findRecord(records, isOnDay(-20));
      const makeup = findRecord(records, isOnDay(-18));

      expect(excused).toMatchObject({
        attendance: 'EXCUSED',
        makeup: { status: 'COMPLETED', startsAt: makeup.startsAt },
      });
      expect(makeup).toMatchObject({
        kind: 'MAKEUP',
        attendance: 'PRESENT',
        makeup: null,
        originalSession: { startsAt: excused.startsAt },
      });
      expect(findRecord(records, isOnDay(-6))).toMatchObject({
        attendance: 'ABSENT',
        leaveReason: null,
        makeup: null,
      });
      expect(dashboard.data.data.attendance).toEqual({
        attendedSessions: records.filter(({ attendance }) => attendance === 'PRESENT').length,
        totalSessions: records.length,
      });
    });

    it('con cua phu huynh khac tra 404, thieu Bearer tra 401', async () => {
      const url = Endpoints.parent.studentAttendance(DEMO_STUDENT_ID);
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

      const { accessToken } = OTHER_PARENT;
      expect(await captureError(client.get(url, withBearer(accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
    });
  });
});
