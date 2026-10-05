import axios from 'axios';

import { Endpoints } from '@/api/endpoints';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import type { MockAssignment } from '@/api/mocks/mock-assignments';
import type { MockAttendanceRecord } from '@/api/mocks/mock-attendance';
import type { MockEnrollment } from '@/api/mocks/mock-enrollments';
import type { MockEnrollmentLesson } from '@/api/mocks/mock-lessons';
import type { MockRegistration } from '@/api/mocks/mock-registrations';
import type { MockScheduleSession } from '@/api/mocks/mock-schedule';
import type { MockSessionDetail } from '@/api/mocks/mock-session-details';
import { SAMPLE_PARENT } from '@/api/mocks/mock-students';
import { parentRoutes } from '@/api/mocks/parent';
import { registrationFlowRoutes } from '@/api/mocks/registration-flow';
import { addDays, startOfDay, toDateKey } from '@/utils/date';
import { formatDayMonth } from '@/utils/format';

// Test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const client = axios.create({
  adapter: createMockAdapter([...parentRoutes, ...registrationFlowRoutes], 0),
});

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

      expect(data.data.todaySessions).toHaveLength(1);
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

    it('con that cua BE chua co du lieu hoc tap: tong quan rong, cac danh sach rong', async () => {
      const bearer = withBearer(OTHER_PARENT.accessToken);
      const today = toDateKey(startOfDay(new Date()));

      const dashboard = await client.get(
        Endpoints.parent.studentDashboard(REAL_STUDENT_ID),
        bearer,
      );
      expect(dashboard.data.data).toEqual({
        todaySessions: [],
        attendance: { attendedSessions: 0, totalSessions: 0 },
        scoreSummary: null,
        attentionItems: [],
        recentNotifications: [],
      });

      const schedule = await client.get(Endpoints.parent.studentSchedule(REAL_STUDENT_ID), {
        ...bearer,
        params: { from: today, to: today },
      });
      expect(schedule.data.data).toEqual([]);

      const lists = await Promise.all(
        [
          Endpoints.parent.studentEnrollments,
          Endpoints.parent.studentAttendance,
          Endpoints.parent.studentAssignments,
          Endpoints.me.studentRegistrations,
        ].map((endpoint) => client.get(endpoint(REAL_STUDENT_ID), bearer)),
      );
      expect(lists.map(({ data }) => data.data)).toEqual([[], [], [], []]);
    });

    it('con that cua BE: buoi hoc va lo trinh khong ton tai tra 404', async () => {
      const bearer = withBearer(OTHER_PARENT.accessToken);
      const notFound = { status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND' } } };

      expect(
        await captureError(
          client.get(Endpoints.parent.studentSession(REAL_STUDENT_ID, 'buoi-bat-ky'), bearer),
        ),
      ).toMatchObject(notFound);
      expect(
        await captureError(
          client.get(
            Endpoints.parent.enrollmentLessons(REAL_STUDENT_ID, 'ghi-danh-bat-ky'),
            bearer,
          ),
        ),
      ).toMatchObject(notFound);
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
      const error = await captureError(getSchedule(accessToken, params));
      expect(error).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } });
    });

    it('xac thuc truoc khi kiem tra query; con cua phu huynh khac tra 404', async () => {
      const anonymous = await captureError(client.get(scheduleUrl));
      expect(anonymous).toMatchObject({ status: 401 });

      const { accessToken } = OTHER_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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

      const other = OTHER_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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

      const { accessToken } = OTHER_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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

    it('buoi nghi co phep kem ly do va buoi hoc bu da xep trong lich tuan', async () => {
      const { accessToken } = DEMO_PARENT;
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

    it('moi buoi mo duoc chi tiet voi cung ket qua diem danh', async () => {
      const { accessToken } = DEMO_PARENT;
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

      const { accessToken } = OTHER_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
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
      const { accessToken } = DEMO_PARENT;
      const english = await getAssignments(accessToken, 'mock-student-2');
      expect(new Set(english.map(({ className }) => className))).toEqual(
        new Set(['Tiếng Anh 6A1']),
      );

      const url = Endpoints.parent.studentAssignments(DEMO_STUDENT_ID);
      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });

      const other = OTHER_PARENT;
      expect(await captureError(client.get(url, withBearer(other.accessToken)))).toMatchObject({
        status: 404,
        body: { error: { code: 'RESOURCE_NOT_FOUND' } },
      });
    });
  });

  describe('registration-flow: don dang ky cua con (TAM)', () => {
    const today = startOfDay(new Date());
    const DRAFT_ORDER_ID = 'mock-order-5';

    /** Cot `@db.Date` cua Prisma ra JSON la 00:00 UTC. */
    function dateColumn(daysFromToday: number): string {
      return `${toDateKey(addDays(today, daysFromToday))}T00:00:00.000Z`;
    }

    async function getRegistrations(accessToken: string, studentId = DEMO_STUDENT_ID) {
      const { data } = await client.get<{ data: MockRegistration[] }>(
        Endpoints.me.studentRegistrations(studentId),
        withBearer(accessToken),
      );
      return data.data;
    }

    it('GET /me/students/:id/registrations tra moi don, don DRAFT chua co thanh toan', async () => {
      const { accessToken } = DEMO_PARENT;
      const registrations = await getRegistrations(accessToken);

      expect(registrations).toHaveLength(5);
      // Don nhap vua lap hom qua nen dung dau
      expect(registrations[0]).toMatchObject({
        id: DRAFT_ORDER_ID,
        status: 'DRAFT',
        parentEmail: SAMPLE_PARENT.email,
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

    it('hoc sinh mau cua phu huynh khac 403, giao vien 403, thieu Bearer 401', async () => {
      const forbidden = { status: 403, body: { error: { code: 'FORBIDDEN' } } };
      const url = Endpoints.me.studentRegistrations(DEMO_STUDENT_ID);

      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });
      expect(
        await captureError(client.get(url, withBearer(OTHER_PARENT.accessToken))),
      ).toMatchObject(forbidden);
      expect(await captureError(client.get(url, withBearer(TEACHER.accessToken)))).toMatchObject(
        forbidden,
      );
    });
  });
});
