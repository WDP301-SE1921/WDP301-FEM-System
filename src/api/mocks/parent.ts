/**
 * Mock cho cac man hinh phu huynh ma BE chua co endpoint: trang chu, lich hoc, mon hoc, lo trinh,
 * diem danh, bai tap, thong bao. Ten route, field va ma loi duoi day deu la TAM, can BE chot:
 * - GET /parent/students/:studentId/dashboard : tong quan hom nay cua mot con
 * - GET /parent/notifications/unread-count    : so thong bao chua doc cua phu huynh (moi con)
 * - GET /parent/students/:studentId/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 *                                             : cac buoi hoc cua mot con tu `from` toi `to` (gom ca
 *                                               hai ngay), theo gio tang dan. Moi buoi co `type`
 *                                               (REGULAR, MAKEUP hoc bu, RESCHEDULED doi lich),
 *                                               `topic` va `note` cua trung tam. Thieu/thua query,
 *                                               sai dinh dang ngay hoac `from` sau `to` thi 400
 * - GET /parent/students/:studentId/sessions/:sessionId
 *                                             : mot buoi cua lich hoc kem `status` cua buoi,
 *                                               `lesson`, ket qua diem danh cua con, gio vao lop,
 *                                               nhan xet cua giao vien va tai lieu. Id buoi khong
 *                                               thuoc con thi 404. Enum `status` va `attendance`
 *                                               lay theo `SessionStatus`, `AttendanceStatus` cua
 *                                               nhanh BE `feature/academic-workflows`
 * - GET /parent/students/:studentId/enrollments
 *                                             : cac mon con da ghi danh (Enrollment `ACTIVE`,
 *                                               `ENDED`; khong tra `PENDING_LINK`) kem lop,
 *                                               chuong trinh, giao vien, lich co dinh trong tuan
 *                                               (`weekday` theo ISO 8601), so buoi, diem trung
 *                                               binh, buoi tiep theo va don bao luu (LeaveRequest
 *                                               `PERIOD_PAUSE` da duyet) dang hieu luc. Nhanh BE
 *                                               `feature/academic-workflows` moi co
 *                                               GET /academic/enrollments, chi tra id, classId,
 *                                               status, startDate, endDate
 * - GET /parent/students/:studentId/enrollments/:enrollmentId/lessons
 *                                             : lo trinh cua mot mon: cac bai (Lesson cua Program)
 *                                               theo `sequence`, moi bai kem `kind` (LESSON, ASSESSMENT
 *                                               bai kiem tra dinh ky), buoi day bai (ClassSession
 *                                               co `lessonId` la bai: id, startsAt, `SessionStatus`)
 *                                               va bai tap cua con (Assignment: han nop, lan nop
 *                                               gan nhat, diem da cong bo). BE chua co: Lesson khong
 *                                               co `kind`, Assignment khong gan voi bai, va
 *                                               GET /academic/lessons nhanh `feature/academic-workflows`
 *                                               khong cho PARENT goi. Ghi danh khong thuoc con thi 404
 * - GET /parent/students/:studentId/attendance
 *                                             : cac buoi da ket thuc cua con (SessionParticipant,
 *                                               bo buoi bi huy), moi nhat truoc. Moi buoi co `kind`
 *                                               (`ParticipantKind`), `attendance`
 *                                               (`AttendanceStatus`), `leaveReason` (LeaveRequest
 *                                               `SINGLE_ABSENCE` da duyet), `makeup` (MakeupBooking
 *                                               cua buoi vang: `MakeupStatus` bo `CANCELLED`, gio
 *                                               buoi bu) va `originalSession` (buoi vang ma buoi hoc
 *                                               bu nay bu cho). Enum lay theo nhanh BE
 *                                               `feature/academic-workflows`; chua chot tra tu ngay
 *                                               nao (mock tra tu ngay con vao lop), chua phan trang
 * - GET /parent/students/:studentId/assignments
 *                                             : bai tap (Assignment khong phai `DRAFT`) giao cho con
 *                                               o cac mon dang hoc, kem lop, mon, giao vien, han nop,
 *                                               `maxAttempts`, so cau theo `QuestionKind`, lan nop gan
 *                                               nhat (Submission: `attemptNo`, `submittedAt`) va diem
 *                                               da cong bo gan nhat (GradeReview `PUBLISHED`:
 *                                               `totalScore`, `feedback`, `publishedAt`) kem
 *                                               `maxScore` (tong diem cac cau). Nhanh BE
 *                                               `feature/academic-workflows` moi co
 *                                               GET /academic/assignments cho PARENT, chi tra id,
 *                                               classId, title, dueAt, status, maxAttempts cua moi con,
 *                                               khong loc theo con; bai nop va diem phai goi rieng
 *                                               GET /academic/assignments/:id/submissions. Chua chot
 *                                               thu tu tra ve va phan trang
 * Chi role PARENT duoc goi (403 FORBIDDEN theo §11). Chi xoa route o day khi nguoi dung yeu cau wire.
 *
 * Dang nhap va ho so con da noi BE that (`@/api/wired-routes`), nen server gia khong biet con nao ton
 * tai: `studentId` khong co trong du lieu mau la con that va chua co du lieu hoc tap (mang rong, tong
 * quan rong, khong co thong bao). Du lieu mau chi thuoc phu huynh mau trong `./mock-students.ts`
 * (2 con, 2 thong bao chua doc; Minh Anh co buoi hoc 18:00 hom nay, Hoang Long thi khong); hoc sinh
 * mau cua phu huynh khac thi 404. Lich hoc mau: `./mock-schedule.ts`, chi tiet buoi hoc mau:
 * `./mock-session-details.ts`, mon hoc mau: `./mock-enrollments.ts`, lo trinh mau: `./mock-lessons.ts`,
 * diem danh mau: `./mock-attendance.ts`, bai tap mau: `./mock-assignments.ts`.
 */
import { Endpoints } from '@/api/endpoints';
import { parseDateKey } from '@/utils/date';

import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import { buildMockAssignments } from './mock-assignments';
import { buildMockAttendance } from './mock-attendance';
import { buildMockEnrollments } from './mock-enrollments';
import { authorizeParent } from './mock-guard';
import { buildMockLessons } from './mock-lessons';
import { buildMockSchedule } from './mock-schedule';
import { buildMockSessionDetail } from './mock-session-details';
import { findStudentById, SAMPLE_PARENT } from './mock-students';

const HOUR_MS = 60 * 60 * 1000;
const STUDENT_ID_PARAM = ':studentId';
const SESSION_ID_PARAM = ':sessionId';
const ENROLLMENT_ID_PARAM = ':enrollmentId';

const STUDENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Student not found');
const SESSION_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Session not found');
const ENROLLMENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Enrollment not found');

/** Key la `User.id` cua phu huynh; phu huynh khong co trong map thi da doc het. */
const UNREAD_NOTIFICATION_COUNTS: Partial<Record<string, number>> = { [SAMPLE_PARENT.id]: 2 };

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
    // Khop mock diem danh: 12 buoi co dinh vang 2 buoi, them 1 buoi hoc bu co mat
    attendance: { attendedSessions: 11, totalSessions: 13 },
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

type StudentCheck = { studentId: string } | { reply: MockReply };

/**
 * Giong guard cua BE roi kiem tra con thuoc phu huynh. Id khong co trong du lieu mau la con that do BE
 * quan ly: cho qua, cac ham `buildMock...` tra du lieu rong cho id do.
 */
function authorizeStudent({ accessToken, params }: MockRequest): StudentCheck {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check;

  const studentId = params.studentId ?? '';
  const sample = findStudentById(studentId);
  if (sample && sample.parentUserId !== check.parent.id) return { reply: STUDENT_NOT_FOUND };
  return { studentId };
}

function getStudentDashboard(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(DASHBOARDS[check.studentId]?.() ?? EMPTY_DASHBOARD);
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

function getStudentSchedule(_body: unknown, request: MockRequest): MockReply {
  // Guard chay truoc ValidationPipe nen loi xac thuc duoc bao truoc loi query
  const parentCheck = authorizeParent(request.accessToken);
  if ('reply' in parentCheck) return parentCheck.reply;

  const range = readScheduleRange(request.query);
  if (!range) return mockValidationError();

  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockSchedule(check.studentId, range.from, range.to));
}

function getStudentSession(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;

  const detail = buildMockSessionDetail(check.studentId, request.params.sessionId ?? '');
  return detail ? mockOk(detail) : SESSION_NOT_FOUND;
}

function getStudentEnrollments(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockEnrollments(check.studentId));
}

function getEnrollmentLessons(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;

  const enrollment = buildMockEnrollments(check.studentId).find(
    ({ id }) => id === request.params.enrollmentId,
  );
  if (!enrollment) return ENROLLMENT_NOT_FOUND;
  return mockOk(buildMockLessons(check.studentId, enrollment.className));
}

function getStudentAttendance(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockAttendance(check.studentId));
}

function getStudentAssignments(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockAssignments(check.studentId));
}

export const parentRoutes: readonly MockRoute[] = [
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
    url: Endpoints.parent.studentSession(STUDENT_ID_PARAM, SESSION_ID_PARAM),
    handle: getStudentSession,
  },
  {
    method: 'get',
    url: Endpoints.parent.studentEnrollments(STUDENT_ID_PARAM),
    handle: getStudentEnrollments,
  },
  {
    method: 'get',
    url: Endpoints.parent.enrollmentLessons(STUDENT_ID_PARAM, ENROLLMENT_ID_PARAM),
    handle: getEnrollmentLessons,
  },
  {
    method: 'get',
    url: Endpoints.parent.studentAttendance(STUDENT_ID_PARAM),
    handle: getStudentAttendance,
  },
  {
    method: 'get',
    url: Endpoints.parent.studentAssignments(STUDENT_ID_PARAM),
    handle: getStudentAssignments,
  },
  {
    method: 'get',
    url: Endpoints.parent.unreadNotificationCount,
    handle: getUnreadNotificationCount,
  },
];
