import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import type {
  AssignmentDetail,
  ScheduledSession,
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

  return Promise.resolve({
    data: { success: true, data: respond(request) },
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
    program: { name: 'Toán 8', subject: 'Toán', grade: 8 },
    weeklySchedules: [],
  },
  placements: [],
  registrationOrder: { payment: null },
};

function session(id: string, daysFromToday: number, classId = 'class-math'): ScheduledSession {
  return {
    id,
    classId,
    startsAt: at(daysFromToday),
    endsAt: at(daysFromToday, 20),
    status: 'SCHEDULED',
    class: { name: 'Lớp', program: { grade: 8, subject: 'Toán' } },
    lesson: { id: `lesson-${id}`, title: `Bài ${id}`, kind: 'LESSON' },
  };
}

const ROUTES = {
  enrollments: `/me/students/${STUDENT_ID}/enrollments`,
  sessions: '/academic/scheduled-sessions',
  leaves: '/academic/leaves',
  assignments: '/academic/assignments',
  bills: '/me/bills',
};

beforeEach(() => {
  sent = [];
  respond = ({ path }) => (path === ROUTES.enrollments ? [ENROLLMENT] : []);
  jest.spyOn(axios, 'getAdapter').mockReturnValue(networkAdapter);
});

afterEach(() => jest.restoreAllMocks());

describe('features/parent-dashboard/api/parentDashboardApi', () => {
  describe('getStudentSchedule', () => {
    it('hoi buoi hoc theo khoang ngay va chi tra buoi cua con dang xem', async () => {
      const sessions = [session('math', 1), session('cua-anh-chi-em', 1, 'class-english')];
      respond = ({ path }) => (path === ROUTES.sessions ? sessions : [ENROLLMENT]);
      const range = { from: toDateKey(new Date()), to: toDateKey(addDays(new Date(), 6)) };

      const schedule = await parentDashboardApi.getStudentSchedule(STUDENT_ID, range);

      expect(schedule.map(({ id }) => id)).toEqual(['math']);
      expect(sentTo(ROUTES.sessions)).toEqual([
        {
          method: 'get',
          path: ROUTES.sessions,
          query: { fromDate: range.from, toDate: range.to, page: '1', limit: String(PAGE_LIMIT) },
          body: undefined,
        },
      ]);
      expect(sentTo(ROUTES.enrollments)).toHaveLength(1);
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
    it('tim buoi trong lich cua ngay hoc; khong thay thi tra null', async () => {
      respond = ({ path }) => (path === ROUTES.sessions ? [session('math', 3)] : [ENROLLMENT]);
      const day = toDateKey(addDays(new Date(), 3));

      const found = await parentDashboardApi.getSessionDetail({
        studentId: STUDENT_ID,
        sessionId: 'math',
        startsAt: at(3),
      });
      const missing = await parentDashboardApi.getSessionDetail({
        studentId: STUDENT_ID,
        sessionId: 'buoi-da-huy',
        startsAt: at(3),
      });

      expect(found).toMatchObject({ id: 'math', status: 'SCHEDULED', attendance: null });
      expect(missing).toBeNull();
      expect(sentTo(ROUTES.sessions)[0]?.query).toMatchObject({ fromDate: day, toDate: day });
    });
  });

  describe('getStudentEnrollments', () => {
    it('ghep ghi danh voi don bao luu hom nay va buoi sap toi trong 30 ngay', async () => {
      respond = ({ path }) => {
        if (path === ROUTES.sessions) return [session('tiep-theo', 2)];
        if (path === ROUTES.leaves) {
          return [
            {
              id: 'leave-1',
              enrollmentId: 'enrollment-khac',
              kind: 'PERIOD_PAUSE',
              fromDate: dateColumn(-1),
              toDate: dateColumn(5),
              status: 'APPROVED',
            },
          ];
        }
        return [ENROLLMENT];
      };
      const today = toDateKey(new Date());

      const [course] = await parentDashboardApi.getStudentEnrollments(STUDENT_ID);

      expect(course).toMatchObject({
        id: 'enrollment-math',
        status: 'ACTIVE',
        pause: null,
        className: 'Toán nâng cao 8A2',
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

  describe('getStudentAssignments', () => {
    const detail: AssignmentDetail = {
      id: 'assignment-math',
      classId: 'class-math',
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
