import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import type {
  AppNotification,
  AssignmentListItem,
  AttendanceReport,
  CurriculumUnit,
  GradeHistoryItem,
  ScheduledSession,
  ScheduledSessionDetail,
  TuitionBill,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';
import { addDays, toDateKey } from '@/utils/date';

/**
 * `parentDashboardApi` voi adapter mang gia (xem `api-client.test.ts`): kiem tra cac route da wire ra
 * mang voi dung duong dan va query, doc het cac trang theo `total`, va du lieu BE duoc ghep cho con
 * dang xem. Khong phai goi BE that.
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
/** Query cua route phan trang `academic` khi app doc trang dau. */
const FIRST_PAGE = { paginated: 'true', page: '1', limit: String(PAGE_LIMIT) };

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

/** Response phan trang cua BE; mac dinh mot trang chua het `items`. */
function page<T>(items: T[], total = items.length, pageNumber = 1) {
  return { items, page: pageNumber, limit: PAGE_LIMIT, total };
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
    teacher: { id: 'teacher-1', displayName: 'Đặng Hải Yến' },
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
    cancelReason: null,
    class: { name: 'Lớp', program: { grade: 8, subject: 'Toán' } },
    teacher: { id: 'teacher-1', displayName: 'Đặng Hải Yến' },
    room: { id: 'room-a101', name: 'Phòng A101' },
    lesson: { id: `lesson-${id}`, title: `Bài ${id}`, kind: 'LESSON' },
    participations: [],
    ...overrides,
  };
}

const ROUTES = {
  enrollments: `/me/students/${STUDENT_ID}/enrollments`,
  sessions: '/academic/scheduled-sessions',
  attendance: `/academic/me/students/${STUDENT_ID}/attendance`,
  grades: `/academic/me/students/${STUDENT_ID}/grades`,
  curriculum: `/academic/me/students/${STUDENT_ID}/curriculum`,
  leaves: '/academic/leaves',
  rooms: '/rooms',
  assignments: '/academic/assignments',
  bills: '/me/bills',
  notifications: '/notifications',
};

const ROOMS = [{ id: 'room-a101', name: 'Phòng A101' }];
const EMPTY_GRADES = { studentId: STUDENT_ID, subjects: [], history: [], ...page([]) };

/** BE tra rong cho moi route, rieng ghi danh tra ghi danh cua con. */
function respondEmpty({ path }: SentRequest): unknown {
  if (path === ROUTES.enrollments) return [ENROLLMENT];
  if (path === ROUTES.rooms) return [];
  if (path === ROUTES.grades) return EMPTY_GRADES;
  if (path === ROUTES.curriculum) return { studentId: STUDENT_ID, ...page([]) };
  return page([]);
}

beforeEach(() => {
  sent = [];
  respond = respondEmpty;
  jest.spyOn(axios, 'getAdapter').mockReturnValue(networkAdapter);
});

afterEach(() => jest.restoreAllMocks());

describe('features/parent-dashboard/api/parentDashboardApi', () => {
  describe('getStudentSchedule', () => {
    it('hoi buoi hoc cua con dang xem theo khoang ngay, gom ca buoi bi huy', async () => {
      const sessions = [
        session('math', 1),
        session('bi-huy', 2, { status: 'CANCELLED', cancelReason: 'Giáo viên ốm' }),
      ];
      respond = ({ path }) => (path === ROUTES.sessions ? page(sessions) : [ENROLLMENT]);
      const range = { from: toDateKey(new Date()), to: toDateKey(addDays(new Date(), 6)) };

      const schedule = await parentDashboardApi.getStudentSchedule(STUDENT_ID, range);

      expect(schedule).toEqual([
        expect.objectContaining({ id: 'math', type: 'REGULAR', room: 'Phòng A101' }),
        expect.objectContaining({ id: 'bi-huy', type: 'CANCELLED', note: 'Giáo viên ốm' }),
      ]);
      expect(sent).toEqual([
        {
          method: 'get',
          path: ROUTES.sessions,
          query: { studentId: STUDENT_ID, fromDate: range.from, toDate: range.to, ...FIRST_PAGE },
          body: undefined,
        },
      ]);
    });

    it('doc tiep trang sau cho toi khi du `total` cua BE', async () => {
      const fullPage = Array.from({ length: PAGE_LIMIT }, (_, index) => session(`s${index}`, 1));
      respond = ({ path, query }) => {
        if (path !== ROUTES.sessions) return [ENROLLMENT];
        return query.page === '1'
          ? page(fullPage, PAGE_LIMIT + 1)
          : page([session('trang-hai', 2)], PAGE_LIMIT + 1, 2);
      };
      const today = toDateKey(new Date());

      const schedule = await parentDashboardApi.getStudentSchedule(STUDENT_ID, {
        from: today,
        to: today,
      });

      expect(schedule).toHaveLength(PAGE_LIMIT + 1);
      expect(sentTo(ROUTES.sessions).map(({ query }) => query.page)).toEqual(['1', '2']);
    });

    it('trang dau du `total` thi khong doc trang sau, ke ca trang day', async () => {
      const fullPage = Array.from({ length: PAGE_LIMIT }, (_, index) => session(`s${index}`, 1));
      respond = () => page(fullPage);
      const today = toDateKey(new Date());

      await parentDashboardApi.getStudentSchedule(STUDENT_ID, { from: today, to: today });

      expect(sentTo(ROUTES.sessions)).toHaveLength(1);
    });
  });

  describe('getSessionDetail', () => {
    const detail: ScheduledSessionDetail = {
      id: 'math',
      classId: 'class-math',
      startsAt: at(-1),
      endsAt: at(-1, 20),
      status: 'COMPLETED',
      summary: null,
      cancelReason: null,
      class: { name: 'Toán nâng cao 8A2', program: { subject: 'Toán' } },
      teacher: { id: 'teacher-1', displayName: 'Đặng Hải Yến' },
      room: { id: 'room-a101', name: 'Phòng A101' },
      lesson: { id: 'lesson-1', title: 'Phương trình', kind: 'LESSON' },
      participation: { enrollmentId: ENROLLMENT.id, kind: 'REGULAR', attendance: 'PRESENT' },
    };
    const ref = { studentId: STUDENT_ID, sessionId: 'math' };

    it('doc mot buoi theo con trong mot request, phong lay tu buoi', async () => {
      respond = () => detail;

      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toMatchObject({
        id: 'math',
        room: 'Phòng A101',
        teacherName: 'Đặng Hải Yến',
        attendance: 'PRESENT',
      });
      expect(sent.map(({ path, query }) => [path, query])).toEqual([
        [`${ROUTES.sessions}/math`, { studentId: STUDENT_ID }],
      ]);
    });

    it('buoi khong (con) thuoc lich cua con thi tra null; loi khac thi bao loi', async () => {
      respond = () => new BeError(404, 'SESSION_NOT_FOUND');
      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toBeNull();

      respond = () => new BeError(403, 'FORBIDDEN');
      await expect(parentDashboardApi.getSessionDetail(ref)).resolves.toBeNull();

      respond = () => new BeError(500, 'INTERNAL_ERROR');
      await expect(parentDashboardApi.getSessionDetail(ref)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getStudentEnrollments', () => {
    it('ghep ghi danh voi don bao luu, buoi sap toi, phong va diem trung binh mon', async () => {
      respond = (request) => {
        if (request.path === ROUTES.sessions) return page([session('tiep-theo', 2)]);
        if (request.path === ROUTES.rooms) return ROOMS;
        if (request.path === ROUTES.grades) {
          return {
            ...EMPTY_GRADES,
            subjects: [{ subject: 'Toán', count: 2, averageOutOf10: 8.25 }],
          };
        }
        if (request.path === ROUTES.enrollments) {
          return [{ ...ENROLLMENT, class: { ...ENROLLMENT.class, roomId: 'room-a101' } }];
        }
        return respondEmpty(request);
      };
      const today = toDateKey(new Date());

      const [course] = await parentDashboardApi.getStudentEnrollments(STUDENT_ID);

      expect(course).toMatchObject({
        id: 'enrollment-math',
        status: 'ACTIVE',
        pause: null,
        className: 'Toán nâng cao 8A2',
        teacherName: 'Đặng Hải Yến',
        room: 'Phòng A101',
        averageScore: 8.25,
        nextSession: { id: 'tiep-theo', startsAt: at(2) },
      });
      expect(sentTo(ROUTES.leaves)[0]?.query).toEqual({
        studentId: STUDENT_ID,
        kind: 'PERIOD_PAUSE',
        status: 'APPROVED',
        fromDate: today,
        toDate: today,
        ...FIRST_PAGE,
      });
      expect(sentTo(ROUTES.sessions)[0]?.query).toMatchObject({
        studentId: STUDENT_ID,
        fromDate: today,
        toDate: toDateKey(addDays(new Date(), 30)),
      });
    });

    it('khong tai duoc phong hay diem thi an phan do, van hien mon', async () => {
      respond = (request) =>
        request.path === ROUTES.rooms || request.path === ROUTES.grades
          ? new BeError(500, 'INTERNAL_ERROR')
          : respondEmpty(request);

      await expect(parentDashboardApi.getStudentEnrollments(STUDENT_ID)).resolves.toEqual([
        expect.objectContaining({ id: 'enrollment-math', room: null, averageScore: null }),
      ]);
    });
  });

  describe('getEnrollmentLessons', () => {
    it('ghep hoc phan da duyet voi buoi hoc cua ca ky ghi danh', async () => {
      const unit: CurriculumUnit = {
        id: 'unit-1',
        title: 'Tháng này',
        programId: 'program-math',
        fromDate: dateColumn(-30),
        toDate: dateColumn(0),
        version: 1,
        program: { subject: 'Toán', grade: 8 },
        classes: [{ id: 'class-math', name: 'Toán nâng cao 8A2' }],
        lessons: [
          { id: 'lesson-truoc', title: 'Bài 1', sequence: 1, kind: 'LESSON', monthKey: null },
          { id: 'chua-xep', title: 'Bài 2', sequence: 2, kind: 'LESSON', monthKey: null },
        ],
      };
      respond = (request) => {
        if (request.path === ROUTES.sessions) return page([session('truoc', -2)]);
        if (request.path === ROUTES.curriculum) return { studentId: STUDENT_ID, ...page([unit]) };
        return respondEmpty(request);
      };

      const lessons = await parentDashboardApi.getEnrollmentLessons(STUDENT_ID, ENROLLMENT.id);

      expect(
        lessons.map(({ id, sequence, session: lessonSession }) => [
          id,
          sequence,
          lessonSession?.id ?? null,
        ]),
      ).toEqual([
        ['lesson-truoc', 1, 'truoc'],
        ['chua-xep', 2, null],
      ]);
      expect(sentTo(ROUTES.sessions)[0]?.query).toMatchObject({
        studentId: STUDENT_ID,
        fromDate: toDateKey(addDays(new Date(), -30)),
        toDate: toDateKey(addDays(new Date(), 59)),
      });
      expect(sentTo(ROUTES.curriculum)[0]?.query).toEqual({ page: '1', limit: String(PAGE_LIMIT) });
    });

    it('ghi danh khong thuoc con thi khong hoi buoi hoc va giao trinh', async () => {
      const lessons = await parentDashboardApi.getEnrollmentLessons(STUDENT_ID, 'ghi-danh-khac');

      expect(lessons).toEqual([]);
      expect(sent.map(({ path }) => path)).toEqual([ROUTES.enrollments]);
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
          class: { name: 'Toán nâng cao 8A2', program: { subject: 'Toán' } },
          approvedLeave: { id: 'leave-1', kind: 'SINGLE_ABSENCE', reason: 'Con bị sốt' },
          latestMakeup: {
            id: 'makeup-1',
            status: 'BOOKED',
            replacement: {
              sessionId: 'bu',
              session: { id: 'bu', startsAt: at(2, 9), endsAt: at(2, 11) },
            },
          },
        },
      ],
    };

    it('ty le di hoc tinh tu so buoi cua BE, chi goi mot route', async () => {
      respond = () => report;

      await expect(parentDashboardApi.getAttendanceSummary(STUDENT_ID)).resolves.toEqual({
        attendedSessions: 8,
        totalSessions: 10,
      });
      expect(sent.map(({ path }) => path)).toEqual([ROUTES.attendance]);
    });

    it('lich su lay lop, don nghi va lich hoc bu tu chinh route diem danh', async () => {
      respond = () => report;

      const records = await parentDashboardApi.getStudentAttendance(STUDENT_ID);

      expect(records).toEqual([
        expect.objectContaining({
          sessionId: 'vang',
          className: 'Toán nâng cao 8A2',
          status: 'ABSENT',
          leaveReason: 'Con bị sốt',
          makeup: { status: 'BOOKED', startsAt: at(2, 9) },
        }),
      ]);
      expect(sent).toEqual([
        { method: 'get', path: ROUTES.attendance, query: {}, body: undefined },
      ]);
    });
  });

  describe('getStudentAssignments', () => {
    const item: AssignmentListItem = {
      id: 'assignment-math',
      classId: 'class-math',
      kind: 'HOMEWORK',
      testType: null,
      title: 'Bài tập về nhà bài 10',
      dueAt: at(3, 23),
      status: 'PUBLISHED',
      maxAttempts: 2,
      class: {
        id: 'class-math',
        name: 'Toán nâng cao 8A2',
        program: { subject: 'Toán', grade: 8 },
      },
      questionCounts: { multipleChoice: 0, essay: 1, total: 1 },
      maxScore: 10,
      recipients: [
        {
          id: 'recipient-1',
          enrollmentId: ENROLLMENT.id,
          studentId: STUDENT_ID,
          latestSubmission: {
            id: 'submission-1',
            attemptNo: 1,
            submittedAt: at(-1),
            publishedGrade: null,
          },
        },
      ],
    };

    it('loc bai theo con o BE, chi goi danh sach va ghi danh', async () => {
      respond = (request) =>
        request.path === ROUTES.assignments ? page([item]) : respondEmpty(request);

      const assignments = await parentDashboardApi.getStudentAssignments(STUDENT_ID);

      expect(assignments).toEqual([
        expect.objectContaining({
          id: 'assignment-math',
          className: 'Toán nâng cao 8A2',
          subjectName: 'Toán',
          teacherName: 'Đặng Hải Yến',
          questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 1 },
          submission: { attemptNo: 1, submittedAt: at(-1) },
          grade: null,
        }),
      ]);
      expect(sent.map(({ path }) => path).sort()).toEqual(
        [ROUTES.enrollments, ROUTES.assignments].sort(),
      );
      expect(sentTo(ROUTES.assignments)[0]?.query).toEqual({
        studentId: STUDENT_ID,
        ...FIRST_PAGE,
      });
    });
  });

  describe('getStudentGrades', () => {
    function grade(id: string, scoreOutOf10: number): GradeHistoryItem {
      return {
        recipientId: `recipient-${id}`,
        assignment: {
          id,
          title: 'Bài',
          kind: 'TEST',
          testType: 'FIFTEEN_MINUTES',
          class: { id: 'class-math', name: 'Toán nâng cao 8A2', program: { subject: 'Toán' } },
        },
        submissionId: `submission-${id}`,
        attemptNo: 1,
        totalScore: scoreOutOf10,
        maxScore: 10,
        scoreOutOf10,
        feedback: '',
        publishedAt: new Date().toISOString(),
      };
    }

    it('doc het lich su diem de tinh trung binh, diem theo mon lay cua BE', async () => {
      const subjects = [{ subject: 'Toán', count: 2, averageOutOf10: 7 }];
      respond = ({ query }) => ({
        studentId: STUDENT_ID,
        subjects,
        history: query.page === '1' ? [grade('a', 8)] : [grade('b', 6)],
        page: Number(query.page),
        limit: PAGE_LIMIT,
        total: 2,
      });

      await expect(parentDashboardApi.getStudentGrades(STUDENT_ID)).resolves.toEqual({
        summary: { average: 7, changeFromLastMonth: null },
        subjects,
      });
      expect(sentTo(ROUTES.grades).map(({ query }) => query)).toEqual([
        { page: '1', limit: String(PAGE_LIMIT) },
        { page: '2', limit: String(PAGE_LIMIT) },
      ]);
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
          ? page(firstPage, PAGE_LIMIT + 1)
          : page([bill('order-cuoi', STUDENT_ID)], PAGE_LIMIT + 1, 2);

      const bills = await parentDashboardApi.getStudentBills(STUDENT_ID);

      expect(bills.map(({ registrationId }) => registrationId)).toEqual(['order-0', 'order-cuoi']);
      // /me/bills cua module registration-flow khong nhan `paginated`
      expect(sentTo(ROUTES.bills).map(({ query }) => query)).toEqual([
        { page: '1', limit: String(PAGE_LIMIT) },
        { page: '2', limit: String(PAGE_LIMIT) },
      ]);
    });

    it('phu huynh chua co bill nao thi chi goi mot trang', async () => {
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

  describe('thong bao', () => {
    const notification: AppNotification = {
      id: 'notification-1',
      type: 'GRADE_PUBLISHED',
      title: 'Cập nhật học tập',
      body: 'Giáo viên đã công bố kết quả bài làm.',
      target: { kind: 'ASSIGNMENT', id: 'assignment-1' },
      context: { classId: 'class-math', studentIds: [STUDENT_ID] },
      createdAt: at(0, 9),
      readAt: null,
    };

    it('thong bao gan day cua mot con: trang dau, loc theo con', async () => {
      respond = () => page([notification], 5);

      await expect(parentDashboardApi.getRecentNotifications(STUDENT_ID)).resolves.toEqual([
        notification,
      ]);
      expect(sent).toEqual([
        {
          method: 'get',
          path: ROUTES.notifications,
          query: { studentId: STUDENT_ID, page: '1', limit: '3' },
          body: undefined,
        },
      ]);
    });

    it('dem chua doc, danh dau da doc mot thong bao va tat ca', async () => {
      respond = ({ path }) => {
        if (path === `${ROUTES.notifications}/unread-count`) return { unreadCount: 4 };
        if (path === `${ROUTES.notifications}/read-all`) return { updatedCount: 4, unreadCount: 0 };
        return { ...notification, readAt: at(0, 10) };
      };

      await expect(parentDashboardApi.getUnreadNotificationCount()).resolves.toEqual({
        unreadCount: 4,
      });
      await expect(
        parentDashboardApi.markNotificationRead('notification-1'),
      ).resolves.toMatchObject({ readAt: at(0, 10) });
      await expect(parentDashboardApi.markAllNotificationsRead()).resolves.toEqual({
        updatedCount: 4,
        unreadCount: 0,
      });
      expect(sent.map(({ method, path, body }) => [method, path, body])).toEqual([
        ['get', `${ROUTES.notifications}/unread-count`, undefined],
        ['patch', `${ROUTES.notifications}/notification-1/read`, undefined],
        ['post', `${ROUTES.notifications}/read-all`, undefined],
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
