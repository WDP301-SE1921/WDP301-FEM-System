import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import type {
  AssignmentDetail,
  AttendanceReport,
  MakeupBooking,
  ScheduledSession,
  ScheduledSessionDetail,
  TuitionBill,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';
import { addDays, toDateKey } from '@/utils/date';

/**
 * `parentDashboardApi` voi adapter mang gia (xem `api-client.test.ts`): kiem tra cac route da wire cua
 * module `academic` ra mang voi dung duong dan va query, va du lieu BE tra chung cho moi con duoc tach
 * theo ghi danh cua con dang xem. Khong phai goi BE that.
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

type SentRequest = {
  method: string;
  /** Duong dan sau dia chi BE, vd `/academic/scheduled-sessions`. */
  path: string;
  query: Record<string, string>;
  body: unknown;
};

/** Dia chi BE dat trong `jest.setup.js`. */
const API_URL = 'http://localhost:3000/api/v1';
const STUDENT_ID = 'cmg2x1abc0001student';
const PAGE_LIMIT = 100;

/** `respond` tra gia tri nay thi BE tra loi voi envelope loi. */
class BeError {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {}
}

let sent: SentRequest[] = [];
let respond: (request: SentRequest) => unknown = () => [];

/** Dong vai adapter mang cua axios: ghi lai request va tra `data` trong envelope cua BE. */
function networkAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = new URL(axios.getUri(config));
  const request: SentRequest = {
    method: config.method ?? '',
    path: url.href.slice(API_URL.length, url.href.length - url.search.length),
    query: Object.fromEntries(url.searchParams),
    // transformRequest cua axios da stringify body truoc khi toi adapter
    body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
  };
  sent.push(request);

  const reply = respond(request);
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

function sentTo(path: string): SentRequest[] {
  return sent.filter((request) => request.path === path);
}

function at(daysFromToday: number, hours = 18): string {
  const date = addDays(new Date(), daysFromToday);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

function dateColumn(daysFromToday: number): string {
  return `${toDateKey(addDays(new Date(), daysFromToday))}T00:00:00.000Z`;
}

/** Con dang xem hoc lop Toan, ky hoc tu 30 ngay truoc toi 60 ngay sau. */
const ENROLLMENT: TuitionEnrollment = {
  id: 'enrollment-math',
  registrationOrderId: 'order-math',
  packageMonths: 3,
  status: 'ACTIVE',
  startDate: dateColumn(-30),
  endDate: dateColumn(60),
  activatedAt: at(-31),
  class: {
    id: 'class-math',
    name: 'Toán nâng cao 8A2',
    roomId: null,
    program: { name: 'Toán 8', subject: 'Toán', grade: 8 },
    weeklySchedules: [],
  },
  placements: [],
  registrationOrder: { payment: null },
};

function session(
  id: string,
  daysFromToday: number,
  overrides: Partial<ScheduledSession> = {},
): ScheduledSession {
  return {
    id,
    classId: 'class-math',
    startsAt: at(daysFromToday),
    endsAt: at(daysFromToday, 20),
    status: 'SCHEDULED',
    class: { name: 'Lớp', program: { grade: 8, subject: 'Toán' } },
    lesson: { id: `lesson-${id}`, title: `Bài ${id}`, kind: 'LESSON' },
    participations: [],
    ...overrides,
  };
}

const ROUTES = {
  enrollments: `/me/students/${STUDENT_ID}/enrollments`,
  sessions: '/academic/scheduled-sessions',
  attendance: `/academic/me/students/${STUDENT_ID}/attendance`,
  makeups: '/academic/makeups',
  leaves: '/academic/leaves',
  rooms: '/rooms',
  assignments: '/academic/assignments',
  bills: '/me/bills',
};

const ROOMS = [{ id: 'room-a101', name: 'Phòng A101' }];

beforeEach(() => {
  sent = [];
  respond = ({ path }) => (path === ROUTES.enrollments ? [ENROLLMENT] : []);
  jest.spyOn(axios, 'getAdapter').mockReturnValue(networkAdapter);
});

afterEach(() => jest.restoreAllMocks());

describe('features/parent-dashboard/api/parentDashboardApi', () => {
  describe('getStudentSchedule', () => {
    it('hoi buoi hoc cua con dang xem theo khoang ngay, bo buoi ma con da mat cho', async () => {
      const sessions = [
        session('math', 1),
        session('da-chuyen-lop', 2, {
          participations: [
            {
              enrollmentId: ENROLLMENT.id,
              kind: 'REGULAR',
              attendance: 'UNMARKED',
              cancelled: true,
            },
          ],
        }),
      ];
      respond = ({ path }) => (path === ROUTES.sessions ? sessions : [ENROLLMENT]);
      const range = { from: toDateKey(new Date()), to: toDateKey(addDays(new Date(), 6)) };

      const schedule = await parentDashboardApi.getStudentSchedule(STUDENT_ID, range);

      expect(schedule.map(({ id }) => id)).toEqual(['math']);
      expect(sent).toEqual([
        {
          method: 'get',
          path: ROUTES.sessions,
          query: {
            studentId: STUDENT_ID,
            fromDate: range.from,
            toDate: range.to,
            page: '1',
            limit: String(PAGE_LIMIT),
          },
          body: undefined,
        },
      ]);
    });

    it('BE tra du mot trang thi doc tiep trang sau cho toi trang chua day', async () => {
      const fullPage = Array.from({ length: PAGE_LIMIT }, (_, index) => session(`s${index}`, 1));
      respond = ({ path, query }) => {
        if (path !== ROUTES.sessions) return [ENROLLMENT];
        return query.page === '1' ? fullPage : [session('trang-hai', 2)];
      };
      const today = toDateKey(new Date());

      const schedule = await parentDashboardApi.getStudentSchedule(STUDENT_ID, {
        from: today,
        to: today,
      });

      expect(schedule).toHaveLength(PAGE_LIMIT + 1);
      expect(sentTo(ROUTES.sessions).map(({ query }) => query.page)).toEqual(['1', '2']);
    });
  });

  describe('getSessionDetail', () => {
    const detail: ScheduledSessionDetail = {
      id: 'math',
      classId: 'class-math',
      roomId: 'room-a101',
      startsAt: at(-1),
      endsAt: at(-1, 20),
      status: 'COMPLETED',
      summary: null,
      cancelReason: null,
      class: { name: 'Toán nâng cao 8A2', roomId: null, program: { subject: 'Toán' } },
      teacher: { id: 'teacher-1', displayName: 'Đặng Hải Yến' },
      lesson: { id: 'lesson-1', title: 'Phương trình', kind: 'LESSON' },
      participation: {
        enrollmentId: ENROLLMENT.id,
        kind: 'REGULAR',
        attendance: 'PRESENT',
        cancelled: false,
      },
    };
    const ref = { studentId: STUDENT_ID, sessionId: 'math' };

    it('doc mot buoi theo con va ten phong', async () => {
      respond = ({ path }) => (path === ROUTES.rooms ? ROOMS : detail);

      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toMatchObject({
        id: 'math',
        room: 'Phòng A101',
        teacherName: 'Đặng Hải Yến',
        attendance: 'PRESENT',
      });
      expect(sentTo(`${ROUTES.sessions}/math`)[0]?.query).toEqual({ studentId: STUDENT_ID });
    });

    it('buoi khong (con) thuoc lich cua con thi tra null', async () => {
      respond = ({ path }) =>
        path === ROUTES.rooms ? ROOMS : new BeError(404, 'SESSION_NOT_FOUND');
      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toBeNull();

      respond = ({ path }) => (path === ROUTES.rooms ? ROOMS : new BeError(403, 'FORBIDDEN'));
      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toBeNull();
    });

    it('khong tai duoc phong thi an phong; loi khac cua buoi thi bao loi', async () => {
      respond = ({ path }) => (path === ROUTES.rooms ? new BeError(500, 'INTERNAL_ERROR') : detail);
      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toMatchObject({
        room: null,
      });

      respond = ({ path }) => (path === ROUTES.rooms ? ROOMS : new BeError(500, 'INTERNAL_ERROR'));
      await expect(parentDashboardApi.getSessionDetail(ref)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getStudentEnrollments', () => {
    it('ghep ghi danh voi don bao luu hom nay, buoi sap toi trong 30 ngay va phong', async () => {
      respond = ({ path }) => {
        if (path === ROUTES.sessions) return [session('tiep-theo', 2)];
        if (path === ROUTES.rooms) return ROOMS;
        if (path === ROUTES.leaves) {
          return [
            {
              id: 'leave-1',
              enrollmentId: 'enrollment-khac',
              kind: 'PERIOD_PAUSE',
              sessionId: null,
              fromDate: dateColumn(-1),
              toDate: dateColumn(5),
              reason: 'Ôn thi',
              status: 'APPROVED',
            },
          ];
        }
        return [{ ...ENROLLMENT, class: { ...ENROLLMENT.class, roomId: 'room-a101' } }];
      };
      const today = toDateKey(new Date());

      const [course] = await parentDashboardApi.getStudentEnrollments(STUDENT_ID);

      expect(course).toMatchObject({
        id: 'enrollment-math',
        status: 'ACTIVE',
        pause: null,
        className: 'Toán nâng cao 8A2',
        room: 'Phòng A101',
        nextSession: { id: 'tiep-theo', startsAt: at(2) },
      });
      expect(sentTo(ROUTES.leaves)[0]?.query).toEqual({
        studentId: STUDENT_ID,
        kind: 'PERIOD_PAUSE',
        status: 'APPROVED',
        fromDate: today,
        toDate: today,
        page: '1',
        limit: String(PAGE_LIMIT),
      });
      expect(sentTo(ROUTES.sessions)[0]?.query).toMatchObject({
        studentId: STUDENT_ID,
        fromDate: today,
        toDate: toDateKey(addDays(new Date(), 30)),
      });
    });
  });

  describe('getEnrollmentLessons', () => {
    it('hoi buoi hoc cua ca ky ghi danh, khong gom ngay het han', async () => {
      respond = ({ path }) =>
        path === ROUTES.sessions ? [session('sau', 2), session('truoc', -2)] : [ENROLLMENT];

      const lessons = await parentDashboardApi.getEnrollmentLessons(STUDENT_ID, ENROLLMENT.id);

      expect(lessons.map(({ id, sequence }) => [id, sequence])).toEqual([
        ['truoc', 1],
        ['sau', 2],
      ]);
      expect(sentTo(ROUTES.sessions)[0]?.query).toMatchObject({
        studentId: STUDENT_ID,
        fromDate: toDateKey(addDays(new Date(), -30)),
        toDate: toDateKey(addDays(new Date(), 59)),
      });
    });

    it('ghi danh khong thuoc con thi khong hoi buoi hoc', async () => {
      const lessons = await parentDashboardApi.getEnrollmentLessons(STUDENT_ID, 'ghi-danh-khac');

      expect(lessons).toEqual([]);
      expect(sentTo(ROUTES.sessions)).toEqual([]);
    });
  });

  describe('diem danh', () => {
    const report: AttendanceReport = {
      counts: { present: 6, absent: 2, madeUp: 2, excused: 1 },
      history: [
        {
          enrollmentId: ENROLLMENT.id,
          effectiveStatus: 'ABSENT',
          session: { id: 'vang', classId: 'class-math', startsAt: at(-3), endsAt: at(-3, 20) },
        },
      ],
    };
    const booking: MakeupBooking = {
      id: 'makeup-1',
      status: 'BOOKED',
      original: { sessionId: 'vang', enrollmentId: ENROLLMENT.id },
      replacement: { session: { id: 'bu', startsAt: at(2, 9) } },
    };

    it('ty le di hoc tinh tu so buoi cua BE, chi goi mot route', async () => {
      respond = () => report;

      await expect(parentDashboardApi.getAttendanceSummary(STUDENT_ID)).resolves.toEqual({
        attendedSessions: 8,
        totalSessions: 10,
      });
      expect(sent.map(({ path }) => path)).toEqual([ROUTES.attendance]);
    });

    it('lich su ghep ghi danh, lich hoc bu va don nghi da duyet cua con', async () => {
      respond = ({ path }) => {
        if (path === ROUTES.attendance) return report;
        if (path === ROUTES.makeups) return [booking];
        if (path === ROUTES.leaves) return [];
        return [ENROLLMENT];
      };

      const records = await parentDashboardApi.getStudentAttendance(STUDENT_ID);

      expect(records).toEqual([
        expect.objectContaining({
          sessionId: 'vang',
          className: 'Toán nâng cao 8A2',
          status: 'ABSENT',
          makeup: { status: 'BOOKED', startsAt: at(2, 9) },
        }),
      ]);
      expect(sentTo(ROUTES.attendance)[0]?.query).toEqual({});
      expect(sentTo(ROUTES.leaves)[0]?.query).toEqual({
        studentId: STUDENT_ID,
        status: 'APPROVED',
        page: '1',
        limit: String(PAGE_LIMIT),
      });
      expect(sentTo(ROUTES.makeups)[0]?.query).toEqual({ page: '1', limit: String(PAGE_LIMIT) });
    });
  });

  describe('getStudentAssignments', () => {
    const detail: AssignmentDetail = {
      id: 'assignment-math',
      classId: 'class-math',
      kind: 'HOMEWORK',
      testType: null,
      title: 'Bài tập về nhà bài 10',
      instructions: 'Làm trực tiếp trên EduGrade.',
      dueAt: at(3, 23),
      status: 'PUBLISHED',
      maxAttempts: 2,
      recipients: [{ id: 'recipient-1', enrollmentId: 'enrollment-math' }],
      questions: [{ id: 'q1', kind: 'ESSAY', prompt: 'Giải', choices: null, maxScore: 10 }],
    };

    it('chi doc de bai va bai nop cua bai thuoc lop cua con', async () => {
      const summary = { title: 'Bài', dueAt: at(3, 23), status: 'PUBLISHED', maxAttempts: 2 };
      respond = ({ path }) => {
        if (path === ROUTES.assignments) {
          return [
            { ...summary, id: 'assignment-math', classId: 'class-math' },
            { ...summary, id: 'assignment-english', classId: 'class-english' },
          ];
        }
        if (path === `${ROUTES.assignments}/assignment-math`) return detail;
        if (path === `${ROUTES.assignments}/assignment-math/submissions`) {
          return [
            {
              id: 'submission-1',
              recipientId: 'recipient-1',
              attemptNo: 1,
              answers: [{ questionId: 'q1', answer: 'x = 2' }],
              submittedAt: at(-1),
              grades: [],
            },
          ];
        }
        return [ENROLLMENT];
      };

      const assignments = await parentDashboardApi.getStudentAssignments(STUDENT_ID);

      expect(assignments).toEqual([
        expect.objectContaining({
          id: 'assignment-math',
          className: 'Toán nâng cao 8A2',
          subjectName: 'Toán',
          submission: { attemptNo: 1, submittedAt: at(-1) },
          grade: null,
        }),
      ]);
      expect(sent.map(({ path }) => path).sort()).toEqual(
        [
          ROUTES.enrollments,
          ROUTES.assignments,
          `${ROUTES.assignments}/assignment-math`,
          `${ROUTES.assignments}/assignment-math/submissions`,
        ].sort(),
      );
    });
  });

  describe('getStudentBills', () => {
    function bill(registrationId: string, studentId: string): TuitionBill {
      return {
        registrationId,
        status: 'UNPAID',
        issuedAt: at(-1),
        student: { id: studentId, fullName: 'Nguyễn Minh Anh', grade: 8 },
        class: {
          id: 'class-math',
          name: 'Toán nâng cao 8A2',
          subject: 'Toán',
          grade: 8,
          schedules: [],
        },
        term: { packageMonths: 3, startDate: '2026-10-06', endDate: '2027-01-06' },
        pricing: {
          monthlyFee: '800000.00',
          packageMonths: 3,
          total: '2400000.00',
          currency: 'VND',
        },
        payment: null,
      };
    }

    it('doc het cac trang theo total va chi tra bill cua con dang xem', async () => {
      const firstPage = Array.from({ length: PAGE_LIMIT }, (_, index) =>
        bill(`order-${index}`, index === 0 ? STUDENT_ID : 'con-khac'),
      );
      respond = ({ query }) =>
        query.page === '1'
          ? { items: firstPage, page: 1, limit: PAGE_LIMIT, total: PAGE_LIMIT + 1 }
          : {
              items: [bill('order-cuoi', STUDENT_ID)],
              page: 2,
              limit: PAGE_LIMIT,
              total: PAGE_LIMIT + 1,
            };

      const bills = await parentDashboardApi.getStudentBills(STUDENT_ID);

      expect(bills.map(({ registrationId }) => registrationId)).toEqual(['order-0', 'order-cuoi']);
      expect(sentTo(ROUTES.bills).map(({ query }) => query)).toEqual([
        { page: '1', limit: String(PAGE_LIMIT) },
        { page: '2', limit: String(PAGE_LIMIT) },
      ]);
    });

    it('phu huynh chua co bill nao thi chi goi mot trang', async () => {
      respond = () => ({ items: [], page: 1, limit: PAGE_LIMIT, total: 0 });

      await expect(parentDashboardApi.getStudentBills(STUDENT_ID)).resolves.toEqual([]);
      expect(sentTo(ROUTES.bills)).toHaveLength(1);
    });

    it('getBill doc bill cua mot don qua GET /registrations/:id/bill', async () => {
      const detail = {
        ...bill('order-math', STUDENT_ID),
        billNumber: 'order-math',
        parent: { displayName: null, email: 'phuhuynh@example.com', phone: null },
      };
      respond = () => detail;

      await expect(parentDashboardApi.getBill('order-math')).resolves.toEqual(detail);
      expect(sent).toEqual([
        { method: 'get', path: '/registrations/order-math/bill', query: {}, body: undefined },
      ]);
    });
  });

  describe('submitAssignment', () => {
    it('gui dung body cua SubmissionDto toi POST /academic/submissions', async () => {
      const receipt = {
        id: 'submission-2',
        recipientId: 'recipient-1',
        attemptNo: 2,
        submittedAt: at(0),
      };
      respond = () => receipt;
      const payload = {
        recipientId: 'recipient-1',
        answers: [{ questionId: 'q1', answer: 'x = 2' }],
      };

      await expect(parentDashboardApi.submitAssignment(payload)).resolves.toEqual(receipt);
      expect(sent).toEqual([
        { method: 'post', path: '/academic/submissions', query: {}, body: payload },
      ]);
    });
  });
});
