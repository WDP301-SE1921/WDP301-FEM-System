import axios, { type AxiosAdapter } from 'axios';

import { Endpoints } from '@/api/endpoints';
import { authRoutes } from '@/api/mocks/auth';
import { linkInvitationRoutes } from '@/api/mocks/link-invitations';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import type { MockScheduleSession } from '@/api/mocks/mock-schedule';
import { parentRoutes } from '@/api/mocks/parent';
import { addDays, startOfDay, toDateKey } from '@/utils/date';

// logger doc Config -> can bien moi truong; test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const networkAdapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>(
  async (config) => ({ data: 'network', status: 200, statusText: 'OK', headers: {}, config }),
);

const client = axios.create({
  baseURL: 'http://mock.test/api/v1',
  adapter: createMockAdapter(
    [...authRoutes, ...linkInvitationRoutes, ...parentRoutes],
    networkAdapter,
    0,
  ),
});

const DEMO_PARENT = { email: 'phuhuynh@example.com', password: 'Matkhau123' };
const DEMO_STUDENT_ID = 'mock-student-1';

type TokenPair = { accessToken: string; refreshToken: string };
type SessionBody = { data: { tokens: TokenPair } };

function withBearer(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

async function loginAs(email: string): Promise<TokenPair> {
  const { data } = await client.post<SessionBody>(Endpoints.auth.login, {
    email,
    password: DEMO_PARENT.password,
  });
  return data.data.tokens;
}

function loginDemoParent(): Promise<TokenPair> {
  return loginAs(DEMO_PARENT.email);
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
  beforeEach(() => networkAdapter.mockClear());

  it('chuyen request khong co mock sang adapter mang', async () => {
    const { data } = await client.get(Endpoints.users.list);
    expect(data).toBe('network');
    expect(networkAdapter).toHaveBeenCalledTimes(1);
  });

  describe('auth', () => {
    it('dang nhap tai khoan mau, chuan hoa email va tra phien theo AuthResponseDto', async () => {
      const { status, data } = await client.post(Endpoints.auth.login, {
        email: ' PhuHuynh@Example.com ',
        password: DEMO_PARENT.password,
      });

      expect(status).toBe(200);
      expect(data.data.user).toMatchObject({ email: DEMO_PARENT.email, role: 'PARENT' });
      expect(data.data.tokens).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it.each([
      [
        'sai mat khau',
        { ...DEMO_PARENT, password: 'SaiMatKhau1' },
        401,
        'AUTH_INVALID_CREDENTIALS',
      ],
      [
        'tai khoan bi khoa',
        { ...DEMO_PARENT, email: 'khoa@example.com' },
        401,
        'AUTH_INVALID_CREDENTIALS',
      ],
      ['mat khau duoi 8 ky tu', { ...DEMO_PARENT, password: '1234567' }, 400, 'VALIDATION_ERROR'],
      ['thua field', { ...DEMO_PARENT, remember: true }, 400, 'VALIDATION_ERROR'],
    ])('login %s -> %i %s', async (_case, body, status, code) => {
      const error = await captureError(client.post(Endpoints.auth.login, body));
      expect(error).toMatchObject({ status, body: { success: false, error: { code } } });
    });

    it('register bao VALIDATION_ERROR khi gui fullName thay vi displayName', async () => {
      const error = await captureError(
        client.post(Endpoints.auth.register, { ...DEMO_PARENT, fullName: 'Nguyễn Văn A' }),
      );
      expect(error).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } });
    });

    it('register tao PARENT dang nhap lai duoc, email trung tra 409', async () => {
      const account = { email: 'moi.dangky@example.com', password: '12345678' };
      const { status, data } = await client.post(Endpoints.auth.register, {
        ...account,
        displayName: ' Nguyễn Văn A ',
      });

      expect(status).toBe(201);
      expect(data.data.user).toMatchObject({ role: 'PARENT', displayName: 'Nguyễn Văn A' });
      await expect(client.post(Endpoints.auth.login, account)).resolves.toMatchObject({
        status: 200,
      });

      const duplicate = await captureError(client.post(Endpoints.auth.register, account));
      expect(duplicate).toMatchObject({
        status: 409,
        body: { error: { code: 'AUTH_EMAIL_EXISTS' } },
      });
    });

    it('me va logout can Bearer cua phien con hieu luc', async () => {
      const { accessToken } = await loginDemoParent();

      const me = await client.get(Endpoints.auth.me, withBearer(accessToken));
      expect(me.data.data).toMatchObject({ email: DEMO_PARENT.email });

      const anonymous = await captureError(client.get(Endpoints.auth.me));
      expect(anonymous).toMatchObject({
        status: 401,
        body: { error: { code: 'AUTH_UNAUTHORIZED' } },
      });

      const logout = await client.post(Endpoints.auth.logout, undefined, withBearer(accessToken));
      expect(logout.data.data).toEqual({ revoked: true });

      const revoked = await captureError(client.get(Endpoints.auth.me, withBearer(accessToken)));
      expect(revoked).toMatchObject({ status: 401 });
    });

    it('refresh doi cap token, dung lai refresh token cu thi thu hoi ca phien', async () => {
      const first = await loginDemoParent();
      const { data } = await client.post<SessionBody>(Endpoints.auth.refresh, {
        refreshToken: first.refreshToken,
      });
      const second = data.data.tokens;
      expect(second.refreshToken).not.toBe(first.refreshToken);

      const reused = await captureError(
        client.post(Endpoints.auth.refresh, { refreshToken: first.refreshToken }),
      );
      expect(reused).toMatchObject({
        status: 401,
        body: { error: { code: 'AUTH_INVALID_REFRESH_TOKEN' } },
      });

      // Phien da bi thu hoi nen cap token moi cung het hieu luc
      const afterRevoke = await captureError(
        client.get(Endpoints.auth.me, withBearer(second.accessToken)),
      );
      expect(afterRevoke).toMatchObject({ status: 401 });
    });
  });

  describe('parent', () => {
    it('GET /parent/students tra cac con cua phu huynh dang nhap', async () => {
      const { accessToken } = await loginDemoParent();
      const { data } = await client.get(Endpoints.parent.students, withBearer(accessToken));

      expect(data.data).toEqual([
        {
          id: DEMO_STUDENT_ID,
          fullName: 'Nguyễn Minh Anh',
          grade: 8,
          subjectNames: ['Toán', 'Vật lý'],
        },
        {
          id: 'mock-student-2',
          fullName: 'Nguyễn Hoàng Long',
          grade: 6,
          subjectNames: ['Tiếng Anh'],
        },
      ]);
    });

    it('dem thong bao chua doc theo phu huynh dang nhap', async () => {
      const demo = await loginDemoParent();
      const demoCount = await client.get(
        Endpoints.parent.unreadNotificationCount,
        withBearer(demo.accessToken),
      );
      expect(demoCount.data.data).toEqual({ unreadCount: 2 });

      const other = await loginAs('phuhuynh.cu@example.com');
      const otherCount = await client.get(
        Endpoints.parent.unreadNotificationCount,
        withBearer(other.accessToken),
      );
      expect(otherCount.data.data).toEqual({ unreadCount: 0 });
    });

    it('khop tham so duong dan va tra tong quan cua dung con', async () => {
      const { accessToken } = await loginDemoParent();
      const { data } = await client.get(
        Endpoints.parent.studentDashboard(DEMO_STUDENT_ID),
        withBearer(accessToken),
      );

      expect(data.data.todaySessions).toHaveLength(1);
      expect(data.data.attendance).toEqual({ attendedSessions: 16, totalSessions: 17 });
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('url thua doan khong khop route mock ma di qua mang', async () => {
      const { accessToken } = await loginDemoParent();
      const url = `${Endpoints.parent.studentDashboard(DEMO_STUDENT_ID)}/extra`;
      const { data } = await client.get(url, withBearer(accessToken));

      expect(data).toBe('network');
    });

    it('con cua phu huynh khac tra 404, phu huynh chua lien ket con nhan mang rong', async () => {
      const { accessToken } = await loginAs('phuhuynh.cu@example.com');

      const students = await client.get(Endpoints.parent.students, withBearer(accessToken));
      expect(students.data.data).toEqual([]);

      const error = await captureError(
        client.get(Endpoints.parent.studentDashboard(DEMO_STUDENT_ID), withBearer(accessToken)),
      );
      expect(error).toMatchObject({ status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND' } } });
    });

    it('thieu Bearer tra 401, tai khoan khong phai PARENT tra 403', async () => {
      const anonymous = await captureError(client.get(Endpoints.parent.students));
      expect(anonymous).toMatchObject({
        status: 401,
        body: { error: { code: 'AUTH_UNAUTHORIZED' } },
      });

      const { accessToken } = await loginAs('giaovien@example.com');
      const teacher = await captureError(
        client.get(Endpoints.parent.students, withBearer(accessToken)),
      );
      expect(teacher).toMatchObject({ status: 403, body: { error: { code: 'FORBIDDEN' } } });
    });
  });

  describe('GET /parent/students/:studentId/schedule', () => {
    const today = startOfDay(new Date());
    const nextSevenDays = { from: toDateKey(today), to: toDateKey(addDays(today, 6)) };
    const scheduleUrl = Endpoints.parent.studentSchedule(DEMO_STUDENT_ID);

    function getSchedule(accessToken: string, params: Record<string, string>) {
      return client.get<{ data: MockScheduleSession[] }>(scheduleUrl, {
        ...withBearer(accessToken),
        params,
      });
    }

    function dayKeyOf({ startsAt }: { startsAt: string }) {
      return toDateKey(new Date(startsAt));
    }

    it('tra buoi hoc trong khoang ngay theo gio tang dan, hom nay khop voi trang chu', async () => {
      const { accessToken } = await loginDemoParent();
      const [schedule, dashboard] = await Promise.all([
        getSchedule(accessToken, nextSevenDays),
        client.get(Endpoints.parent.studentDashboard(DEMO_STUDENT_ID), withBearer(accessToken)),
      ]);
      const sessions = schedule.data.data;
      const pickTime = ({ startsAt, endsAt }: { startsAt: string; endsAt: string }) => ({
        startsAt,
        endsAt,
      });

      expect(sessions.every((session) => dayKeyOf(session) >= nextSevenDays.from)).toBe(true);
      expect(sessions.every((session) => dayKeyOf(session) <= nextSevenDays.to)).toBe(true);
      const startTimes = sessions.map((session) => session.startsAt);
      expect(startTimes).toEqual([...startTimes].sort());
      expect(sessions.map((session) => session.type)).toEqual(
        expect.arrayContaining(['REGULAR', 'MAKEUP', 'RESCHEDULED']),
      );
      expect(
        sessions.filter((session) => dayKeyOf(session) === nextSevenDays.from).map(pickTime),
      ).toEqual(dashboard.data.data.todaySessions.map(pickTime));
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it.each([
      ['thieu to', { from: '2026-10-12' }],
      ['thua field', { from: '2026-10-12', to: '2026-10-18', week: '1' }],
      ['sai dinh dang ngay', { from: '12/10/2026', to: '2026-10-18' }],
      ['ngay khong ton tai', { from: '2026-02-30', to: '2026-03-01' }],
      ['from sau to', { from: '2026-10-18', to: '2026-10-12' }],
    ])('%s -> 400 VALIDATION_ERROR', async (_case, params) => {
      const { accessToken } = await loginDemoParent();
      const error = await captureError(getSchedule(accessToken, params));
      expect(error).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } });
    });

    it('xac thuc truoc khi kiem tra query; con cua phu huynh khac tra 404', async () => {
      const anonymous = await captureError(client.get(scheduleUrl));
      expect(anonymous).toMatchObject({ status: 401 });

      const { accessToken } = await loginAs('phuhuynh.cu@example.com');
      const error = await captureError(getSchedule(accessToken, nextSevenDays));
      expect(error).toMatchObject({ status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND' } } });
    });
  });

  describe('POST /link-invitations/inspect', () => {
    it('tra envelope thanh cong voi email da che', async () => {
      const { status, data } = await client.post(Endpoints.linkInvitations.inspect, {
        token: 'DEMONEW1',
      });

      expect(status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: { valid: true, mode: 'CREATE_ACCOUNT', maskedEmail: 'p***@example.com' },
      });
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('tra mode SIGN_IN khi email cua ma da co tai khoan', async () => {
      const { data } = await client.post(Endpoints.linkInvitations.inspect, { token: 'DEMOOLD1' });
      expect(data.data).toMatchObject({ valid: true, mode: 'SIGN_IN' });
    });

    it.each([
      ['DEMOEXP1', 410, 'INVITATION_EXPIRED'],
      ['DEMOUSE1', 409, 'INVITATION_ALREADY_USED'],
      ['DEMOLIMT', 429, 'HTTP_ERROR'],
      ['DEMOFAIL', 500, 'INTERNAL_ERROR'],
      ['demonew1', 404, 'RESOURCE_NOT_FOUND'],
    ])('ma %s tra %i %s theo envelope loi', async (token, status, code) => {
      const error = await captureError(client.post(Endpoints.linkInvitations.inspect, { token }));
      expect(error).toMatchObject({ status, body: { success: false, error: { code } } });
    });

    it('bao VALIDATION_ERROR khi gui thua field', async () => {
      const error = await captureError(
        client.post(Endpoints.linkInvitations.inspect, { token: 'DEMONEW1', extra: true }),
      );
      expect(error).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } });
    });
  });

  describe('POST /link-invitations/claim-and-sign-up', () => {
    it('bao VALIDATION_ERROR khi gui confirmPassword', async () => {
      const error = await captureError(
        client.post(Endpoints.linkInvitations.claimAndSignUp, {
          token: 'DEMONEW1',
          password: '12345678',
          confirmPassword: '12345678',
        }),
      );
      expect(error).toMatchObject({ status: 400 });
    });

    it('bao VALIDATION_ERROR khi gui email (BE lay email tu ma)', async () => {
      const error = await captureError(
        client.post(Endpoints.linkInvitations.claimAndSignUp, {
          token: 'DEMONEW1',
          password: '12345678',
          email: 'phuhuynh.moi@example.com',
        }),
      );
      expect(error).toMatchObject({ status: 400 });
    });

    it('tra 409 ACCOUNT_ALREADY_EXISTS khi email da co tai khoan', async () => {
      const error = await captureError(
        client.post(Endpoints.linkInvitations.claimAndSignUp, {
          token: 'DEMOOLD1',
          password: '12345678',
        }),
      );
      expect(error).toMatchObject({
        status: 409,
        body: { error: { code: 'ACCOUNT_ALREADY_EXISTS' } },
      });
    });

    // Chay cuoi: sau khi dung, DEMONEW1 thanh "da dung" trong module mock
    it('tao phien theo AuthResponseDto va khong cho dung lai ma', async () => {
      // Dung payload ma form tao tai khoan gui: khong co displayName
      const payload = { token: 'DEMONEW1', password: '12345678' };
      const { status, data } = await client.post(Endpoints.linkInvitations.claimAndSignUp, payload);

      expect(status).toBe(201);
      expect(data.data.user).toMatchObject({ role: 'PARENT', displayName: null });
      expect(data.data.tokens).toMatchObject({ tokenType: 'Bearer' });

      const me = await client.get(Endpoints.auth.me, withBearer(data.data.tokens.accessToken));
      expect(me.data.data).toMatchObject({ email: 'phuhuynh.moi@example.com' });

      // Tai khoan moi da duoc lien ket voi hoc sinh cua ma
      const students = await client.get(
        Endpoints.parent.students,
        withBearer(data.data.tokens.accessToken),
      );
      expect(students.data.data).toEqual([
        expect.objectContaining({ fullName: 'Nguyễn Văn An', grade: 8 }),
      ]);

      const reused = await captureError(
        client.post(Endpoints.linkInvitations.claimAndSignUp, payload),
      );
      expect(reused).toMatchObject({
        status: 409,
        body: { error: { code: 'INVITATION_ALREADY_USED' } },
      });
    });
  });

  // Dat cuoi file: lien ket thanh cong lam phuhuynh@example.com co them con trong module mock
  describe('POST /link-invitations/claim', () => {
    const payload = { token: 'DEMOADD1' };

    it('can Bearer cua tai khoan PARENT', async () => {
      const anonymous = await captureError(client.post(Endpoints.linkInvitations.claim, payload));
      expect(anonymous).toMatchObject({ status: 401 });

      const { accessToken } = await loginAs('giaovien@example.com');
      const teacher = await captureError(
        client.post(Endpoints.linkInvitations.claim, payload, withBearer(accessToken)),
      );
      expect(teacher).toMatchObject({ status: 403, body: { error: { code: 'FORBIDDEN' } } });
    });

    it('tra 403 khi email cua ma khac email tai khoan, 400 khi gui thua field', async () => {
      const { accessToken } = await loginAs('phuhuynh.cu@example.com');

      const otherEmail = await captureError(
        client.post(Endpoints.linkInvitations.claim, payload, withBearer(accessToken)),
      );
      expect(otherEmail).toMatchObject({ status: 403, body: { error: { code: 'FORBIDDEN' } } });

      const extraField = await captureError(
        client.post(
          Endpoints.linkInvitations.claim,
          { ...payload, studentId: DEMO_STUDENT_ID },
          withBearer(accessToken),
        ),
      );
      expect(extraField).toMatchObject({ status: 400 });
    });

    it('lien ket them con vao tai khoan dang nhap va khong cho dung lai ma', async () => {
      const { accessToken } = await loginDemoParent();

      const { data } = await client.post(
        Endpoints.linkInvitations.claim,
        payload,
        withBearer(accessToken),
      );
      expect(data.data).toMatchObject({ studentName: 'Nguyễn Gia Huy' });

      const students = await client.get(Endpoints.parent.students, withBearer(accessToken));
      expect(students.data.data).toHaveLength(3);
      expect(students.data.data).toContainEqual({
        id: data.data.studentId,
        fullName: 'Nguyễn Gia Huy',
        grade: 7,
        subjectNames: ['Tiếng Anh'],
      });

      const reused = await captureError(
        client.post(Endpoints.linkInvitations.claim, payload, withBearer(accessToken)),
      );
      expect(reused).toMatchObject({
        status: 409,
        body: { error: { code: 'INVITATION_ALREADY_USED' } },
      });
    });
  });
});
