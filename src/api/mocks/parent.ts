/**
 * Mock cho trang chu phu huynh. BE chua co module nay, EDUGRADE_BACKEND_FLOW.md chua thiet ke va
 * prisma/schema.prisma chua co bang lich hoc, diem danh, diem so, bai tap, thong bao. Vi vay ten
 * route, field va ma loi duoi day deu la TAM, can BE chot:
 * - GET /parent/students                      : con da lien ket (StudentProfile: id, fullName,
 *                                               grade) kem ten mon cua cac Enrollment `ACTIVE`
 * - GET /parent/students/:studentId/dashboard : tong quan hom nay cua mot con
 * - GET /parent/notifications/unread-count    : so thong bao chua doc cua phu huynh (moi con)
 * - GET /parent/students/:studentId/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 *                                             : cac buoi hoc cua mot con tu `from` toi `to` (gom ca
 *                                               hai ngay), theo gio tang dan. Moi buoi co `type`
 *                                               (REGULAR, MAKEUP hoc bu, RESCHEDULED doi lich),
 *                                               `topic` va `note` cua trung tam. Thieu/thua query,
 *                                               sai dinh dang ngay hoac `from` sau `to` thi 400
 * Chi role PARENT duoc goi (403 FORBIDDEN theo §11). Con khong thuoc phu huynh thi 404.
 * Khi BE lam xong: xoa file nay, bo `parentRoutes` khoi `./index.ts` va doi chieu DTO that.
 *
 * Tai khoan dung thu (mat khau `Matkhau123`, xem `./mock-accounts.ts`):
 * - phuhuynh@example.com    : 2 con, 2 thong bao chua doc. Minh Anh co buoi hoc 18:00 hom nay,
 *                             Hoang Long thi khong
 * - phuhuynh.cu@example.com : chua lien ket con nao -> man hinh rong, khong co thong bao chua doc
 * - giaovien@example.com    : 403
 * Hoc sinh vua lien ket bang ma lien ket chua co du lieu hoc tap. Lich hoc mau: `./mock-schedule.ts`.
 */
import { Endpoints } from '@/api/endpoints';
import { parseDateKey } from '@/utils/date';

import { authorizeParent } from './auth';
import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import { buildMockSchedule } from './mock-schedule';
import { findStudentOfParent, findStudentsByParent, type MockStudent } from './mock-students';

const HOUR_MS = 60 * 60 * 1000;
const STUDENT_ID_PARAM = ':studentId';

const STUDENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Student not found');

/** Key la `User.id` cua phu huynh; phu huynh khong co trong map thi da doc het. */
const UNREAD_NOTIFICATION_COUNTS: Partial<Record<string, number>> = { 'mock-user-1': 2 };

type MockDashboard = {
  todaySessions: {
    id: string;
    className: string;
    subjectName: string;
    startsAt: string;
    endsAt: string;
    room: string | null;
    teacherName: string;
  }[];
  attendance: { attendedSessions: number; totalSessions: number };
  scoreSummary: { average: number; changeFromLastMonth: number | null } | null;
  attentionItems: {
    id: string;
    type: 'TUITION' | 'ASSIGNMENT';
    title: string;
    description: string;
  }[];
  recentNotifications: {
    id: string;
    type: 'ATTENDANCE' | 'GRADE';
    title: string;
    message: string;
    createdAt: string;
  }[];
};

function todayAt(hours: number, minutes = 0): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

const EMPTY_DASHBOARD: MockDashboard = {
  todaySessions: [],
  attendance: { attendedSessions: 0, totalSessions: 0 },
  scoreSummary: null,
  attentionItems: [],
  recentNotifications: [],
};

/** Tao luc nhan request de gio hoc va thoi gian thong bao luon tinh theo hom nay. */
const DASHBOARDS: Partial<Record<string, () => MockDashboard>> = {
  'mock-student-1': () => ({
    todaySessions: [
      {
        id: 'mock-session-1',
        className: 'Toán nâng cao 8A2',
        subjectName: 'Toán',
        startsAt: todayAt(18),
        endsAt: todayAt(19, 30),
        room: 'P.203 (Tầng 2)',
        teacherName: 'Đặng Hải Yến',
      },
    ],
    attendance: { attendedSessions: 16, totalSessions: 17 },
    scoreSummary: { average: 8.2, changeFromLastMonth: 0.4 },
    attentionItems: [
      {
        id: 'mock-attention-1',
        type: 'TUITION',
        title: 'Học phí tháng 10',
        description: 'Chưa xác nhận đóng, vui lòng đóng tại trung tâm',
      },
      {
        id: 'mock-attention-2',
        type: 'ASSIGNMENT',
        title: 'Bài tập Toán Đại số',
        description: 'Hạn nộp: 23:59, 20/10',
      },
    ],
    recentNotifications: [
      {
        id: 'mock-notification-1',
        type: 'ATTENDANCE',
        title: 'Đã điểm danh buổi học Toán',
        message: 'Minh Anh đã có mặt đúng giờ tại phòng P.203.',
        createdAt: hoursAgo(2),
      },
      {
        id: 'mock-notification-2',
        type: 'GRADE',
        title: 'Kết quả kiểm tra 15 phút',
        message: 'Cô Yến đã chấm bài kiểm tra Hình học: đạt 9.0 điểm.',
        createdAt: hoursAgo(26),
      },
    ],
  }),
  'mock-student-2': () => ({
    todaySessions: [],
    attendance: { attendedSessions: 10, totalSessions: 12 },
    scoreSummary: { average: 6.8, changeFromLastMonth: -0.3 },
    attentionItems: [],
    recentNotifications: [
      {
        id: 'mock-notification-3',
        type: 'ATTENDANCE',
        title: 'Đã điểm danh buổi học Tiếng Anh',
        message: 'Hoàng Long đã có mặt tại phòng P.105.',
        createdAt: hoursAgo(50),
      },
    ],
  }),
};

function toStudentDto({ id, fullName, grade, subjectNames }: MockStudent) {
  return { id, fullName, grade, subjectNames };
}

function listStudents(_body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  return mockOk(findStudentsByParent(check.parent.id).map(toStudentDto));
}

function getStudentDashboard(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;
  return mockOk(DASHBOARDS[student.id]?.() ?? EMPTY_DASHBOARD);
}

function getUnreadNotificationCount(_body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  return mockOk({ unreadCount: UNREAD_NOTIFICATION_COUNTS[check.parent.id] ?? 0 });
}

/** Gia lap DTO query cua lich hoc: dung hai field ngay `from`, `to`, va `from` khong sau `to`. */
function readScheduleRange(query: MockRequest['query']): { from: Date; to: Date } | null {
  const fields = readBody(query, ['from', 'to']);
  if (!fields) return null;

  const from = typeof fields.from === 'string' ? parseDateKey(fields.from) : null;
  const to = typeof fields.to === 'string' ? parseDateKey(fields.to) : null;
  if (!from || !to || from > to) return null;
  return { from, to };
}

function getStudentSchedule(
  _body: unknown,
  { accessToken, params, query }: MockRequest,
): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  // Guard chay truoc ValidationPipe nen loi xac thuc duoc bao truoc loi query
  const range = readScheduleRange(query);
  if (!range) return mockValidationError();

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;
  return mockOk(buildMockSchedule(student.id, range.from, range.to));
}

export const parentRoutes: readonly MockRoute[] = [
  { method: 'get', url: Endpoints.parent.students, handle: listStudents },
  {
    method: 'get',
    url: Endpoints.parent.studentDashboard(STUDENT_ID_PARAM),
    handle: getStudentDashboard,
  },
  {
    method: 'get',
    url: Endpoints.parent.studentSchedule(STUDENT_ID_PARAM),
    handle: getStudentSchedule,
  },
  {
    method: 'get',
    url: Endpoints.parent.unreadNotificationCount,
    handle: getUnreadNotificationCount,
  },
];
