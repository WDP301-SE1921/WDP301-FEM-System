/**
 * Mock cho trang chu phu huynh. BE chua co module nay, EDUGRADE_BACKEND_FLOW.md chua thiet ke va
 * prisma/schema.prisma chua co bang lich hoc, diem danh, diem so, bai tap, thong bao. Vi vay ten
 * route, field va ma loi duoi day deu la TAM, can BE chot:
 * - GET /parent/students                      : con cua phu huynh (StudentProfile: id, fullName,
 *                                               grade) kem ten mon cua cac Enrollment `ACTIVE`
 * - POST /parent/students                     : phu huynh tu tao ho so con. Body `fullName`
 *                                               (1-255 ky tu sau khi trim), `grade` (so nguyen 6-9),
 *                                               `dateOfBirth?` (`YYYY-MM-DD`, lay theo cot cua
 *                                               StudentProfile); thua field hoac sai kieu thi 400.
 *                                               Tra 201 voi con vua tao, cung dang phan tu cua
 *                                               GET /parent/students (chua co mon). EDUGRADE_BACKEND_FLOW.md
 *                                               chi tao StudentProfile khi phu huynh dung ma lien ket
 *                                               (§6.5) nen endpoint nay la TAM hoan toan. `dateOfBirth`
 *                                               duoc luu va tra qua GET /me/students
 *                                               (`./registration-flow.ts`)
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
 * Chi role PARENT duoc goi (403 FORBIDDEN theo §11). Con khong thuoc phu huynh thi 404.
 * App chi dung mock: ke ca khi BE lam xong, chi xoa file nay khi nguoi dung yeu cau wire.
 *
 * Tai khoan dung thu (mat khau `Matkhau123`, xem `./mock-accounts.ts`):
 * - phuhuynh@example.com    : 2 con, 2 thong bao chua doc. Minh Anh co buoi hoc 18:00 hom nay,
 *                             Hoang Long thi khong
 * - phuhuynh.cu@example.com : chua co con nao -> man hinh rong, khong co thong bao chua doc
 * - giaovien@example.com    : 403
 * Con phu huynh vua tao chua co du lieu hoc tap. Lich hoc mau: `./mock-schedule.ts`,
 * chi tiet buoi hoc mau: `./mock-session-details.ts`, mon hoc mau: `./mock-enrollments.ts`, lo trinh
 * mau: `./mock-lessons.ts`, diem danh mau: `./mock-attendance.ts`, bai tap mau:
 * `./mock-assignments.ts`.
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
import { buildMockAssignments } from './mock-assignments';
import { buildMockAttendance } from './mock-attendance';
import { buildMockEnrollments } from './mock-enrollments';
import { buildMockLessons } from './mock-lessons';
import { buildMockSchedule } from './mock-schedule';
import { buildMockSessionDetail } from './mock-session-details';
import {
  addStudent,
  findStudentOfParent,
  findStudentsByParent,
  type MockStudent,
} from './mock-students';

const HTTP_CREATED = 201;
const HOUR_MS = 60 * 60 * 1000;
/** Cot `fullName` VarChar(255) va khoi 6-9 cua StudentProfile. */
const FULL_NAME_MAX_LENGTH = 255;
const MIN_GRADE = 6;
const MAX_GRADE = 9;
const STUDENT_ID_PARAM = ':studentId';
const SESSION_ID_PARAM = ':sessionId';
const ENROLLMENT_ID_PARAM = ':enrollmentId';

const STUDENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Student not found');
const SESSION_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Session not found');
const ENROLLMENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Enrollment not found');

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

function toStudentDto({ id, fullName, grade, subjectNames }: MockStudent) {
  return { id, fullName, grade, subjectNames };
}

function listStudents(_body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  return mockOk(findStudentsByParent(check.parent.id).map(toStudentDto));
}

/** Giong IsString + IsNotEmpty + MaxLength sau @Transform trim. */
function readFullName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const fullName = value.trim();
  return fullName.length > 0 && fullName.length <= FULL_NAME_MAX_LENGTH ? fullName : null;
}

function isGrade(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= MIN_GRADE && Number(value) <= MAX_GRADE;
}

function isOptionalDateKey(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && parseDateKey(value) !== null);
}

function createStudent(body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const input = readBody(body, ['fullName', 'grade'], ['dateOfBirth']);
  const fullName = readFullName(input?.fullName);
  const grade = input?.grade;
  if (!fullName || !isGrade(grade) || !isOptionalDateKey(input?.dateOfBirth)) {
    return mockValidationError();
  }

  const dateOfBirth = input?.dateOfBirth;
  const student = addStudent({
    parentUserId: check.parent.id,
    fullName,
    grade,
    dateOfBirth: typeof dateOfBirth === 'string' ? dateOfBirth : null,
    subjectNames: [],
  });
  return mockOk(toStudentDto(student), HTTP_CREATED);
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

function getStudentSession(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;

  const detail = buildMockSessionDetail(student.id, params.sessionId ?? '');
  return detail ? mockOk(detail) : SESSION_NOT_FOUND;
}

function getStudentEnrollments(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;
  return mockOk(buildMockEnrollments(student.id));
}

function getEnrollmentLessons(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;

  const enrollment = buildMockEnrollments(student.id).find(({ id }) => id === params.enrollmentId);
  if (!enrollment) return ENROLLMENT_NOT_FOUND;
  return mockOk(buildMockLessons(student.id, enrollment.className));
}

function getStudentAttendance(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;
  return mockOk(buildMockAttendance(student.id));
}

function getStudentAssignments(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const student = findStudentOfParent(check.parent.id, params.studentId ?? '');
  if (!student) return STUDENT_NOT_FOUND;
  return mockOk(buildMockAssignments(student.id));
}

export const parentRoutes: readonly MockRoute[] = [
  { method: 'get', url: Endpoints.parent.students, handle: listStudents },
  { method: 'post', url: Endpoints.parent.students, handle: createStudent },
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
