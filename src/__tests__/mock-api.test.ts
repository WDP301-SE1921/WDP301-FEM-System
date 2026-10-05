import axios from 'axios';

import { Endpoints } from '@/api/endpoints';
import { authRoutes } from '@/api/mocks/auth';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import type { MockAssignment } from '@/api/mocks/mock-assignments';
import type { MockAttendanceRecord } from '@/api/mocks/mock-attendance';
import type { MockEnrollment } from '@/api/mocks/mock-enrollments';
import type { MockEnrollmentLesson } from '@/api/mocks/mock-lessons';
import type {
  MockReceipt,
  MockRegistration,
  MockTuitionEnrollment,
} from '@/api/mocks/mock-registrations';
import type { MockScheduleSession } from '@/api/mocks/mock-schedule';
import type { MockSessionDetail } from '@/api/mocks/mock-session-details';
import { parentRoutes } from '@/api/mocks/parent';
import { registrationFlowRoutes } from '@/api/mocks/registration-flow';
import { addDays, startOfDay, toDateKey } from '@/utils/date';
import { formatDayMonth } from '@/utils/format';

// logger doc Config -> can bien moi truong; test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const client = axios.create({
  adapter: createMockAdapter([...authRoutes, ...parentRoutes, ...registrationFlowRoutes], 0),
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
  it('request khong co route mock bi chan voi 404 nhu Nest, khong ra mang', async () => {
    const { status, body } = await captureError(client.get('/users'));

    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, error: { code: 'HTTP_ERROR' } });
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
          subjectNames: ['Toán', 'Vật lý', 'Hóa học'],
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
    });

    it('url thua doan khong khop route mock thi tra 404', async () => {
      const { accessToken } = await loginDemoParent();
      const url = `${Endpoints.parent.studentDashboard(DEMO_STUDENT_ID)}/extra`;
      const { status } = await captureError(client.get(url, withBearer(accessToken)));

      expect(status).toBe(404);
    });

    it('con cua phu huynh khac tra 404, phu huynh chua co con nhan mang rong', async () => {
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

  describe('GET /parent/students/:studentId/sessions/:sessionId', () => {
    const today = startOfDay(new Date());
    const MINUTE_MS = 60 * 1000;

    /** Cac buoi cua con trong ngay (hom nay + `daysFromToday`), lay tu route lich hoc. */
    async function sessionsOn(accessToken: string, studentId: string, daysFromToday: number) {
      const day = toDateKey(addDays(today, daysFromToday));
      const { data } = await client.get<{ data: MockScheduleSession[] }>(
        Endpoints.parent.studentSchedule(studentId),
        { ...withBearer(accessToken), params: { from: day, to: day } },
      );
      return data.data;
    }

    async function getDetail(accessToken: string, studentId: string, sessionId: string) {
      const { data } = await client.get<{ data: MockSessionDetail }>(
        Endpoints.parent.studentSession(studentId, sessionId),
        withBearer(accessToken),
      );
      return data.data;
    }

    it('buoi da qua da chot diem danh, thong tin buoi khop voi the trong lich', async () => {
      const { accessToken } = await loginDemoParent();
      const [lateSession] = await sessionsOn(accessToken, DEMO_STUDENT_ID, -2);
      const [excusedSession] = await sessionsOn(accessToken, DEMO_STUDENT_ID, -3);
      if (!lateSession || !excusedSession) throw new Error('Lich mau phai co buoi hoc');

      const late = await getDetail(accessToken, DEMO_STUDENT_ID, lateSession.id);
      expect(late).toMatchObject({
        ...lateSession,
        status: 'COMPLETED',
        attendance: 'PRESENT',
        lesson: { sequence: 9, title: 'Luyện đề: Phân tích đa thức thành nhân tử' },
        materials: [{ note: 'Đã phát trên lớp' }],
      });
      expect(new Date(late.checkedInAt ?? '').getTime()).toBe(
        new Date(late.startsAt).getTime() + 10 * MINUTE_MS,
      );

      const excused = await getDetail(accessToken, DEMO_STUDENT_ID, excusedSession.id);
      expect(excused).toMatchObject({
        attendance: 'EXCUSED',
        checkedInAt: null,
        teacherComment: null,
      });
    });

    it('buoi hoc bu sap toi chua diem danh va ghi ro buoi duoc bu', async () => {
      const { accessToken } = await loginDemoParent();
      const [makeupSession] = await sessionsOn(accessToken, DEMO_STUDENT_ID, 2);
      if (!makeupSession) throw new Error('Lich mau phai co buoi hoc bu');

      expect(await getDetail(accessToken, DEMO_STUDENT_ID, makeupSession.id)).toMatchObject({
        type: 'MAKEUP',
        status: 'SCHEDULED',
        attendance: 'UNMARKED',
        checkedInAt: null,
        teacherComment: null,
        materials: [],
        note: `Bù cho buổi nghỉ ngày ${formatDayMonth(addDays(today, -3))}`,
      });
    });

    it('buoi cua con khac, id la hoac phu huynh khac tra 404; thieu Bearer tra 401', async () => {
      const { accessToken } = await loginDemoParent();
      const [otherChildSession] = await sessionsOn(accessToken, 'mock-student-2', 1);
      if (!otherChildSession) throw new Error('Lich mau phai co buoi hoc');
      const url = Endpoints.parent.studentSession(DEMO_STUDENT_ID, otherChildSession.id);
      const notFound = { status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND' } } };

      expect(await captureError(client.get(url, withBearer(accessToken)))).toMatchObject(notFound);
      expect(
        await captureError(
          client.get(
            Endpoints.parent.studentSession(DEMO_STUDENT_ID, 'khong-ton-tai'),
            withBearer(accessToken),
          ),
        ),
      ).toMatchObject(notFound);

      const other = await loginAs('phuhuynh.cu@example.com');
      expect(await captureError(client.get(url, withBearer(other.accessToken)))).toMatchObject(
        notFound,
      );
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });
    });
  });

  describe('GET /parent/students/:studentId/enrollments', () => {
    const today = startOfDay(new Date());

    async function getEnrollments(accessToken: string, studentId: string) {
      const { data } = await client.get<{ data: MockEnrollment[] }>(
        Endpoints.parent.studentEnrollments(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    function findByClass(enrollments: MockEnrollment[], className: string) {
      const found = enrollments.find((enrollment) => enrollment.className === className);
      if (!found) throw new Error(`Thieu mon ${className}`);
      return found;
    }

    it('tra mon dang hoc, dang bao luu va da ket thuc cua dung con', async () => {
      const { accessToken } = await loginDemoParent();
      const enrollments = await getEnrollments(accessToken, DEMO_STUDENT_ID);

      expect(enrollments).toHaveLength(4);
      expect(findByClass(enrollments, 'Hóa học 8 cơ bản')).toMatchObject({
        status: 'ACTIVE',
        pause: {
          fromDate: toDateKey(addDays(today, -10)),
          toDate: toDateKey(addDays(today, 49)),
        },
        weeklySlots: [],
        nextSession: null,
        averageScore: null,
      });
      expect(findByClass(enrollments, 'Ngữ văn 8 ôn hè')).toMatchObject({
        status: 'ENDED',
        pause: null,
        nextSession: null,
        endDate: toDateKey(addDays(today, -33)),
      });

      const otherChild = await getEnrollments(accessToken, 'mock-student-2');
      expect(otherChild.map(({ className }) => className)).toEqual(['Tiếng Anh 6A1']);
    });

    it('lich co dinh va buoi tiep theo khop voi lich tuan, mo duoc chi tiet buoi', async () => {
      const { accessToken } = await loginDemoParent();
      const [enrollments, schedule] = await Promise.all([
        getEnrollments(accessToken, DEMO_STUDENT_ID),
        client.get<{ data: MockScheduleSession[] }>(
          Endpoints.parent.studentSchedule(DEMO_STUDENT_ID),
          {
            ...withBearer(accessToken),
            params: { from: toDateKey(today), to: toDateKey(addDays(today, 13)) },
          },
        ),
      ]);
      const math = findByClass(enrollments, 'Toán nâng cao 8A2');

      // Toan hoc 3 buoi moi tuan: hai buoi toi va mot buoi sang
      expect(
        math.weeklySlots.map(({ startTime, endTime }) => `${startTime}-${endTime}`).sort(),
      ).toEqual(['08:00-09:30', '18:00-19:30', '18:00-19:30']);
      const weekdays = math.weeklySlots.map(({ weekday }) => weekday);
      expect(weekdays).toEqual([...weekdays].sort((a, b) => a - b));

      const nextMath = schedule.data.data.find(
        (session) => session.className === math.className && new Date(session.endsAt) > new Date(),
      );
      expect(math.nextSession).toEqual({ id: nextMath?.id, startsAt: nextMath?.startsAt });

      const detail = await client.get(
        Endpoints.parent.studentSession(DEMO_STUDENT_ID, math.nextSession?.id ?? ''),
        withBearer(accessToken),
      );
      expect(detail.data.data).toMatchObject({ className: math.className });
    });

    it('con cua phu huynh khac tra 404, thieu Bearer tra 401', async () => {
      const url = Endpoints.parent.studentEnrollments(DEMO_STUDENT_ID);
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

      const { accessToken } = await loginAs('phuhuynh.cu@example.com');
      expect(await captureError(client.get(url, withBearer(accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
    });
  });

  describe('GET /parent/students/:studentId/enrollments/:enrollmentId/lessons', () => {
    const today = startOfDay(new Date());
    const MATH_ENROLLMENT_ID = 'mock-enrollment-1';
    const PHYSICS_ENROLLMENT_ID = 'mock-enrollment-2';

    async function getLessons(accessToken: string, enrollmentId: string) {
      const { data } = await client.get<{ data: MockEnrollmentLesson[] }>(
        Endpoints.parent.enrollmentLessons(DEMO_STUDENT_ID, enrollmentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    async function getDetail(accessToken: string, sessionId: string) {
      const { data } = await client.get<{ data: MockSessionDetail }>(
        Endpoints.parent.studentSession(DEMO_STUDENT_ID, sessionId),
        withBearer(accessToken),
      );
      return data.data;
    }

    it('bai dang hoc la buoi tiep theo cua mon, bai da hoc khop lich su diem danh', async () => {
      const { accessToken } = await loginDemoParent();
      const [lessons, enrollments, attendance] = await Promise.all([
        getLessons(accessToken, MATH_ENROLLMENT_ID),
        client.get<{ data: MockEnrollment[] }>(
          Endpoints.parent.studentEnrollments(DEMO_STUDENT_ID),
          withBearer(accessToken),
        ),
        client.get<{ data: MockAttendanceRecord[] }>(
          Endpoints.parent.studentAttendance(DEMO_STUDENT_ID),
          withBearer(accessToken),
        ),
      ]);
      const math = enrollments.data.data.find(({ id }) => id === MATH_ENROLLMENT_ID);

      expect(lessons.map(({ sequence }) => sequence)).toEqual(
        Array.from({ length: math?.totalSessions ?? 0 }, (_, index) => index + 1),
      );
      expect(lessons.find(({ sequence }) => sequence === 12)).toMatchObject({
        kind: 'ASSESSMENT',
        title: 'Kiểm tra giữa khóa',
      });

      // Buoi Toan hom nay tinh la da hoc khi ket thuc, giong lich su diem danh
      const completed = lessons.filter(({ session }) => session?.status === 'COMPLETED');
      const mathRecords = attendance.data.data.filter(
        ({ className, kind }) => className === math?.className && kind === 'REGULAR',
      );
      expect(completed).toHaveLength(mathRecords.length);

      const [current, ...later] = lessons.slice(completed.length);
      expect(current?.session).toMatchObject({ id: math?.nextSession?.id, status: 'SCHEDULED' });
      expect(current?.assignment).toMatchObject({ submittedAt: null, score: null });
      expect(later.every(({ assignment }) => assignment === null)).toBe(true);

      const lastDone = completed.at(-1);
      const [doneDetail, currentDetail] = await Promise.all([
        getDetail(accessToken, lastDone?.session?.id ?? ''),
        getDetail(accessToken, current?.session?.id ?? ''),
      ]);
      expect(doneDetail.lesson).toEqual({
        sequence: lastDone?.sequence,
        title: lastDone?.title,
        description: lastDone?.description,
      });
      expect(currentDetail.lesson).toMatchObject({ sequence: current?.sequence });
    });

    it('bai da hoc co bai tap da nop va da cham, buoi hoc bu day lai bai con nghi', async () => {
      const { accessToken } = await loginDemoParent();
      const physics = await getLessons(accessToken, PHYSICS_ENROLLMENT_ID);
      const missed = physics.find(({ sequence }) => sequence === 8);

      expect(physics.find(({ sequence }) => sequence === 1)?.assignment).toMatchObject({
        submittedAt: expect.any(String),
        score: 7.5,
      });
      expect(missed?.session?.startsAt).toBe(
        new Date(addDays(today, -3).setHours(17, 30)).toISOString(),
      );

      const makeupDay = toDateKey(addDays(today, 2));
      const schedule = await client.get<{ data: MockScheduleSession[] }>(
        Endpoints.parent.studentSchedule(DEMO_STUDENT_ID),
        { ...withBearer(accessToken), params: { from: makeupDay, to: makeupDay } },
      );
      const makeup = schedule.data.data.find(({ type }) => type === 'MAKEUP');
      expect(makeup?.topic).toBe('Quang học');
      expect((await getDetail(accessToken, makeup?.id ?? '')).lesson).toMatchObject({
        sequence: 8,
        title: 'Khúc xạ ánh sáng',
      });
    });

    it('mon dang bao luu chua co lo trinh; ghi danh cua con khac tra 404, thieu Bearer 401', async () => {
      const { accessToken } = await loginDemoParent();
      expect(await getLessons(accessToken, 'mock-enrollment-3')).toEqual([]);

      const otherChildUrl = Endpoints.parent.enrollmentLessons(
        DEMO_STUDENT_ID,
        'mock-enrollment-5',
      );
      expect(await captureError(client.get(otherChildUrl, withBearer(accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
      expect(await captureError(client.get(otherChildUrl))).toMatchObject({ status: 401 });
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
      const { accessToken } = await loginDemoParent();
      const records = await getAttendance(accessToken, DEMO_STUDENT_ID);
      const startTimes = records.map(({ startsAt }) => startsAt);

      expect(startTimes).toEqual([...startTimes].sort().reverse());
      expect(records.every(({ endsAt }) => new Date(endsAt) <= new Date())).toBe(true);

      // Buoi Toan toi nay chi duoc tinh khi da ket thuc, trang chu mock thi khong doi theo gio
      const beforeToday = records.filter(({ startsAt }) => new Date(startsAt) < today);
      expect(beforeToday).toHaveLength(17);
      expect(beforeToday.filter(({ attendance }) => attendance === 'PRESENT')).toHaveLength(16);
    });

    it('buoi nghi co phep kem ly do va buoi hoc bu da xep trong lich tuan', async () => {
      const { accessToken } = await loginDemoParent();
      const [records, schedule] = await Promise.all([
        getAttendance(accessToken, DEMO_STUDENT_ID),
        client.get<{ data: MockScheduleSession[] }>(
          Endpoints.parent.studentSchedule(DEMO_STUDENT_ID),
          {
            ...withBearer(accessToken),
            params: { from: toDateKey(addDays(today, 2)), to: toDateKey(addDays(today, 2)) },
          },
        ),
      ]);
      const makeupSession = findRecord(schedule.data.data, ({ type }) => type === 'MAKEUP');

      expect(findRecord(records, isOnDay(-3))).toMatchObject({
        kind: 'REGULAR',
        attendance: 'EXCUSED',
        leaveReason: expect.any(String),
        makeup: { status: 'BOOKED', startsAt: makeupSession.startsAt },
        originalSession: null,
      });
    });

    it('hoc bu da xong: buoi vang ghi COMPLETED, buoi hoc bu tro ve buoi vang', async () => {
      const { accessToken } = await loginDemoParent();
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

    it('moi buoi mo duoc chi tiet voi cung ket qua diem danh', async () => {
      const { accessToken } = await loginDemoParent();
      const records = await getAttendance(accessToken, OTHER_STUDENT_ID);
      const details = await Promise.all(
        records.map(({ sessionId }) =>
          client.get<{ data: MockSessionDetail }>(
            Endpoints.parent.studentSession(OTHER_STUDENT_ID, sessionId),
            withBearer(accessToken),
          ),
        ),
      );

      expect(details.map(({ data }) => data.data.attendance)).toEqual(
        records.map(({ attendance }) => attendance),
      );
    });

    it('con cua phu huynh khac tra 404, thieu Bearer tra 401', async () => {
      const url = Endpoints.parent.studentAttendance(DEMO_STUDENT_ID);
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

      const { accessToken } = await loginAs('phuhuynh.cu@example.com');
      expect(await captureError(client.get(url, withBearer(accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
    });
  });

  describe('GET /parent/students/:studentId/assignments', () => {
    const today = startOfDay(new Date());
    const MATH_CLASS = 'Toán nâng cao 8A2';

    async function getAssignments(accessToken: string, studentId = DEMO_STUDENT_ID) {
      const { data } = await client.get<{ data: MockAssignment[] }>(
        Endpoints.parent.studentAssignments(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    function dueOn(daysFromToday: number): string {
      return new Date(addDays(today, daysFromToday).setHours(23, 59)).toISOString();
    }

    it('trung voi bai tap tren lo trinh: cung id, han nop, lan nop va diem', async () => {
      const { accessToken } = await loginDemoParent();
      const [assignments, lessons] = await Promise.all([
        getAssignments(accessToken),
        client.get<{ data: MockEnrollmentLesson[] }>(
          Endpoints.parent.enrollmentLessons(DEMO_STUDENT_ID, 'mock-enrollment-1'),
          withBearer(accessToken),
        ),
      ]);
      const mathAssignments = assignments.filter(({ className }) => className === MATH_CLASS);
      const lessonAssignments = lessons.data.data.flatMap(({ assignment }) =>
        assignment ? [assignment] : [],
      );

      expect(
        mathAssignments.map(({ id, title, dueAt, submission, grade }) => ({
          id,
          title,
          dueAt,
          submittedAt: submission?.submittedAt ?? null,
          score: grade?.totalScore ?? null,
        })),
      ).toEqual(
        lessonAssignments.map(({ id, title, dueAt, submittedAt, score }) => ({
          id,
          title,
          dueAt,
          submittedAt,
          score,
        })),
      );
    });

    it('Minh Anh con bai Toan va Vat ly can lam, bai Toan gan nhat dang cho cham', async () => {
      const { accessToken } = await loginDemoParent();
      const assignments = await getAssignments(accessToken);
      const todo = assignments.filter(({ submission }) => submission === null);

      expect(todo).toEqual([
        expect.objectContaining({
          className: MATH_CLASS,
          dueAt: dueOn(2),
          questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 2 },
          maxAttempts: 1,
        }),
        expect.objectContaining({
          className: 'Vật lý 8 chuyên sâu',
          dueAt: dueOn(3),
          questionCounts: { MULTIPLE_CHOICE: 5, ESSAY: 0 },
          maxAttempts: 2,
        }),
      ]);

      const waitingMath = assignments.filter(
        ({ className, submission, grade }) =>
          className === MATH_CLASS && submission !== null && grade === null,
      );
      expect(waitingMath.map(({ id }) => id)).toEqual(['mock-assignment-math-8-9']);
    });

    it('diem cong bo hai ngay sau khi nop, thang 10 va kem nhan xet', async () => {
      const { accessToken } = await loginDemoParent();
      const graded = (await getAssignments(accessToken)).filter(({ grade }) => grade !== null);

      expect(graded.length).toBeGreaterThan(0);
      graded.forEach(({ submission, grade }) => {
        const publishedAt = addDays(new Date(submission?.submittedAt ?? ''), 2);
        expect(grade).toMatchObject({
          maxScore: 10,
          feedback: expect.any(String),
          publishedAt: publishedAt.toISOString(),
        });
        expect(publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    it('moi con chi thay bai cua minh; con cua phu huynh khac 404, thieu Bearer 401', async () => {
      const { accessToken } = await loginDemoParent();
      const english = await getAssignments(accessToken, 'mock-student-2');
      expect(new Set(english.map(({ className }) => className))).toEqual(
        new Set(['Tiếng Anh 6A1']),
      );

      const url = Endpoints.parent.studentAssignments(DEMO_STUDENT_ID);
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

      const other = await loginAs('phuhuynh.cu@example.com');
      expect(await captureError(client.get(url, withBearer(other.accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
    });
  });

  describe('registration-flow: hoc phi cua con', () => {
    const today = startOfDay(new Date());
    const MATH_ORDER_ID = 'mock-order-1';
    const DRAFT_ORDER_ID = 'mock-order-5';

    /** Cot `@db.Date` cua Prisma ra JSON la 00:00 UTC. */
    function dateColumn(daysFromToday: number): string {
      return `${toDateKey(addDays(today, daysFromToday))}T00:00:00.000Z`;
    }

    async function getTuitionEnrollments(accessToken: string, studentId = DEMO_STUDENT_ID) {
      const { data } = await client.get<{ data: MockTuitionEnrollment[] }>(
        Endpoints.me.studentEnrollments(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    async function getRegistrations(accessToken: string, studentId = DEMO_STUDENT_ID) {
      const { data } = await client.get<{ data: MockRegistration[] }>(
        Endpoints.me.studentRegistrations(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    function getReceipt(accessToken: string, registrationId: string) {
      return client.get<{ data: MockReceipt }>(
        Endpoints.registrations.receipt(registrationId),
        withBearer(accessToken),
      );
    }

    it('GET /me/students/:id/enrollments tra ghi danh kem lop va thanh toan nhu ban ghi Prisma', async () => {
      const { accessToken } = await loginDemoParent();
      const enrollments = await getTuitionEnrollments(accessToken);
      const math = enrollments.find(
        ({ registrationOrderId }) => registrationOrderId === MATH_ORDER_ID,
      );

      // Decimal ra chuoi, cot ngay ra 00:00 UTC, hoc phi = hoc phi thang x so thang
      expect(math).toMatchObject({
        id: 'mock-enrollment-1',
        studentProfileId: DEMO_STUDENT_ID,
        packageMonths: 3,
        status: 'ACTIVE',
        startDate: dateColumn(-21),
        class: {
          name: 'Toán nâng cao 8A2',
          monthlyFee: '1200000',
          program: { name: 'Toán 8 – Chuyên đề nâng cao', subject: 'Toán', grade: 8 },
        },
        registrationOrder: {
          id: MATH_ORDER_ID,
          status: 'COMPLETED',
          quotedAmount: '3600000',
          payment: {
            amount: '3600000',
            currency: 'VND',
            status: 'CONFIRMED',
            receiptNumber: 'PT-1082',
          },
        },
      });
      expect(math?.activatedAt).toBe(math?.registrationOrder.payment?.confirmedAt);
      // Hoc phi thu truoc ngay bat dau hoc
      expect(new Date(math?.activatedAt ?? '') < new Date(math?.startDate ?? '')).toBe(true);

      const createdTimes = enrollments.map(({ createdAt }) => createdAt);
      expect(createdTimes).toEqual([...createdTimes].sort().reverse());
    });

    it('ghi danh trung id, lop, lich co dinh va ngay ket thuc voi mock mon hoc', async () => {
      const { accessToken } = await loginDemoParent();
      const [enrollments, courses] = await Promise.all([
        getTuitionEnrollments(accessToken),
        client.get<{ data: MockEnrollment[] }>(
          Endpoints.parent.studentEnrollments(DEMO_STUDENT_ID),
          withBearer(accessToken),
        ),
      ]);
      const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
      const pickSlot = ({
        weekday,
        startTime,
        endTime,
      }: MockEnrollment['weeklySlots'][number]) => ({
        weekday,
        startTime,
        endTime,
      });

      expect(
        [...enrollments].sort(byId).map(({ id, status, class: classroom }) => ({
          id,
          status,
          className: classroom.name,
        })),
      ).toEqual(
        [...courses.data.data].sort(byId).map(({ id, status, className }) => ({
          id,
          status,
          className,
        })),
      );

      const math = enrollments.find(({ id }) => id === 'mock-enrollment-1');
      const mathCourse = courses.data.data.find(({ id }) => id === 'mock-enrollment-1');
      expect(math?.class.weeklySchedules.map(pickSlot)).toEqual(mathCourse?.weeklySlots);

      // Mon dang bao luu va mon da ket thuc van co lich co dinh cua lop
      expect(
        enrollments.every(({ class: classroom }) => classroom.weeklySchedules.length > 0),
      ).toBe(true);
      expect(enrollments.find(({ id }) => id === 'mock-enrollment-4')).toMatchObject({
        status: 'ENDED',
        endDate: dateColumn(-33),
      });
    });

    it('GET /me/students/:id/registrations (TAM) tra moi don, don DRAFT chua co thanh toan', async () => {
      const { accessToken } = await loginDemoParent();
      const registrations = await getRegistrations(accessToken);

      expect(registrations).toHaveLength(5);
      // Don nhap vua lap hom qua nen dung dau
      expect(registrations[0]).toMatchObject({
        id: DRAFT_ORDER_ID,
        status: 'DRAFT',
        packageMonths: 2,
        quotedAmount: '1200000',
        startDate: dateColumn(6),
        confirmedAt: null,
        payment: null,
        enrollment: null,
        targetStudent: { id: DEMO_STUDENT_ID, fullName: 'Nguyễn Minh Anh', grade: 8 },
        class: { name: 'Hình học 8 bổ trợ', program: { subject: 'Toán', grade: 8 } },
      });
      expect(
        registrations.slice(1).every(({ status, payment, enrollment }) => {
          return status === 'COMPLETED' && payment !== null && enrollment !== null;
        }),
      ).toBe(true);

      const otherChild = await getRegistrations(accessToken, 'mock-student-2');
      expect(otherChild.map(({ id }) => id)).toEqual(['mock-order-6']);
    });

    it('GET /registrations/:id/receipt tra bien lai khop voi ghi danh, so tien la number', async () => {
      const { accessToken } = await loginDemoParent();
      const [receipt, enrollments] = await Promise.all([
        getReceipt(accessToken, MATH_ORDER_ID),
        getTuitionEnrollments(accessToken),
      ]);
      const math = enrollments.find(
        ({ registrationOrderId }) => registrationOrderId === MATH_ORDER_ID,
      );

      expect(receipt.data.data).toEqual({
        registrationId: MATH_ORDER_ID,
        status: 'COMPLETED',
        parentEmail: DEMO_PARENT.email,
        student: { fullName: 'Nguyễn Minh Anh', grade: 8 },
        class: {
          id: math?.class.id,
          name: 'Toán nâng cao 8A2',
          subject: 'Toán',
          grade: 8,
          schedules: math?.class.weeklySchedules,
        },
        term: {
          packageMonths: 3,
          startDate: toDateKey(addDays(today, -21)),
          endDate: math?.endDate.slice(0, 10),
          label: 'Đang học',
        },
        payment: {
          id: math?.registrationOrder.payment?.id,
          receiptNumber: 'PT-1082',
          amount: 3_600_000,
          currency: 'VND',
          confirmedAt: math?.registrationOrder.payment?.confirmedAt,
        },
        enrollment: { id: 'mock-enrollment-1', status: 'ACTIVE' },
        quotedAmount: 3_600_000,
        currency: 'VND',
      });
    });

    it('bien lai: don chua thu tien hoac khong ton tai 404, khong so huu 403, thieu Bearer 401', async () => {
      const { accessToken } = await loginDemoParent();
      const notFound = { status: 404, body: { error: { code: 'RECEIPT_NOT_FOUND' } } };
      const forbidden = { status: 403, body: { error: { code: 'FORBIDDEN' } } };

      expect(await captureError(getReceipt(accessToken, DRAFT_ORDER_ID))).toMatchObject(notFound);
      expect(await captureError(getReceipt(accessToken, 'khong-ton-tai'))).toMatchObject(notFound);

      const other = await loginAs('phuhuynh.cu@example.com');
      expect(await captureError(getReceipt(other.accessToken, MATH_ORDER_ID))).toMatchObject(
        forbidden,
      );
      const teacher = await loginAs('giaovien@example.com');
      expect(await captureError(getReceipt(teacher.accessToken, MATH_ORDER_ID))).toMatchObject(
        forbidden,
      );
      expect(
        await captureError(client.get(Endpoints.registrations.receipt(MATH_ORDER_ID))),
      ).toMatchObject({ status: 401, body: { error: { code: 'AUTH_UNAUTHORIZED' } } });
    });

    it.each([
      ['ghi danh', Endpoints.me.studentEnrollments],
      ['don dang ky', Endpoints.me.studentRegistrations],
    ])(
      '%s: con khong ton tai 404, con cua phu huynh khac 403, giao vien 403, thieu Bearer 401',
      async (_case, endpoint) => {
        const forbidden = { status: 403, body: { error: { code: 'FORBIDDEN' } } };
        const url = endpoint(DEMO_STUDENT_ID);

        expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

        const demo = await loginDemoParent();
        expect(
          await captureError(client.get(endpoint('khong-ton-tai'), withBearer(demo.accessToken))),
        ).toMatchObject({ status: 404, body: { error: { code: 'STUDENT_NOT_FOUND' } } });

        const other = await loginAs('phuhuynh.cu@example.com');
        expect(await captureError(client.get(url, withBearer(other.accessToken)))).toMatchObject(
          forbidden,
        );
        const teacher = await loginAs('giaovien@example.com');
        expect(await captureError(client.get(url, withBearer(teacher.accessToken)))).toMatchObject(
          forbidden,
        );
      },
    );
  });

  // Dat cuoi file: tao con thanh cong lam phu huynh co them con trong module mock
  describe('POST /parent/students', () => {
    const payload = { fullName: 'Nguyễn Gia Huy', grade: 7, dateOfBirth: '2014-05-20' };

    it('can Bearer cua tai khoan PARENT', async () => {
      const anonymous = await captureError(client.post(Endpoints.parent.students, payload));
      expect(anonymous).toMatchObject({ status: 401 });

      const { accessToken } = await loginAs('giaovien@example.com');
      const teacher = await captureError(
        client.post(Endpoints.parent.students, payload, withBearer(accessToken)),
      );
      expect(teacher).toMatchObject({ status: 403, body: { error: { code: 'FORBIDDEN' } } });
    });

    it.each([
      ['thua field', { ...payload, subjectNames: [] }],
      ['thieu lop', { fullName: payload.fullName }],
      ['ho ten chi co khoang trang', { ...payload, fullName: '   ' }],
      ['lop ngoai 6-9', { ...payload, grade: 10 }],
      ['lop khong phai so nguyen', { ...payload, grade: '7' }],
      ['ngay sinh sai dinh dang', { ...payload, dateOfBirth: '20/05/2014' }],
      ['ngay sinh khong ton tai', { ...payload, dateOfBirth: '2014-02-30' }],
    ])('bao VALIDATION_ERROR khi %s', async (_case, body) => {
      const { accessToken } = await loginDemoParent();
      const error = await captureError(
        client.post(Endpoints.parent.students, body, withBearer(accessToken)),
      );
      expect(error).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } });
    });

    it('tao con cho phu huynh dang nhap, tra 201 va con moi co trong danh sach', async () => {
      const { accessToken } = await loginDemoParent();

      const { status, data } = await client.post(
        Endpoints.parent.students,
        { ...payload, fullName: '  Nguyễn Gia Huy ' },
        withBearer(accessToken),
      );
      expect(status).toBe(201);
      const created = {
        id: expect.any(String),
        fullName: 'Nguyễn Gia Huy',
        grade: 7,
        subjectNames: [],
      };
      expect(data.data).toEqual(created);

      const students = await client.get(Endpoints.parent.students, withBearer(accessToken));
      expect(students.data.data).toHaveLength(3);
      expect(students.data.data).toContainEqual({ ...created, id: data.data.id });

      // Con moi chua ghi danh nen chua co du lieu hoc tap
      const enrollments = await client.get(
        Endpoints.parent.studentEnrollments(data.data.id),
        withBearer(accessToken),
      );
      expect(enrollments.data.data).toEqual([]);
    });

    it('ngay sinh khong bat buoc; con moi chi thuoc phu huynh da tao', async () => {
      const { accessToken } = await loginAs('phuhuynh.cu@example.com');

      const { data } = await client.post(
        Endpoints.parent.students,
        { fullName: 'Trần Minh Khang', grade: 6 },
        withBearer(accessToken),
      );
      const own = await client.get(Endpoints.parent.students, withBearer(accessToken));
      expect(own.data.data).toEqual([expect.objectContaining({ fullName: 'Trần Minh Khang' })]);

      const demo = await loginDemoParent();
      const error = await captureError(
        client.get(Endpoints.parent.studentDashboard(data.data.id), withBearer(demo.accessToken)),
      );
      expect(error).toMatchObject({ status: 404 });
    });
  });
});
