/**
 * Mock module `registration-flow` cua BE (nhanh `dev`: registration-flow.controller.ts,
 * registration-flow.service.ts). BE da co module nay nhung mobile chua duoc noi that: chi xoa route
 * khi nguoi dung yeu cau wire (Luat so 2 trong CLAUDE.md cua workspace). Mobile moi dung cac route
 * phu huynh quan ly ho so con va xem hoc phi:
 * - GET /me/students
 *     Ho so cac con cua phu huynh, tao truoc dung truoc. BE tra nguyen ban ghi Prisma StudentProfile:
 *     `id, parentProfileId, fullName, grade, dateOfBirth, status, createdAt, updatedAt`; `dateOfBirth`
 *     la 00:00 UTC cua ngay do hoac null. Chi PARENT (403 FORBIDDEN).
 * - PATCH /me/students/:studentId
 *     Sua ho so con (UpdateStudentDto): `fullName?` (1-255 ky tu, luu sau khi trim), `grade?` (so
 *     nguyen 6-9), `dateOfBirth?` (`YYYY-MM-DD`, null de xoa). Thua field hoac sai kieu 400; con khong
 *     ton tai 404 STUDENT_NOT_FOUND; con cua phu huynh khac 403 FORBIDDEN; doi khoi khi con con ghi
 *     danh `ACTIVE` chua het han 409 STUDENT_GRADE_LOCKED. Tra ban ghi sau khi sua. BE con tra
 *     409 PARENT_EMAIL_UNVERIFIED khi email chua xac minh: mock coi moi tai khoan da xac minh vi
 *     mobile chua co man xac minh email (chua chot, xem CLAUDE.md cua workspace).
 * - GET /me/students/:studentId/enrollments
 *     Ghi danh cua con (khong tra `PENDING_LINK`), moi tao truoc, kem `class` (program,
 *     weeklySchedules) va `registrationOrder.payment`. BE tra nguyen ban ghi Prisma: `monthlyFee`,
 *     `quotedAmount`, `amount` la chuoi Decimal; `startDate`, `endDate` la 00:00 UTC cua ngay do.
 *     Chi PARENT (403 FORBIDDEN); con khong ton tai 404 STUDENT_NOT_FOUND; con cua phu huynh khac
 *     403 FORBIDDEN.
 * - GET /registrations/:registrationId/receipt
 *     Bien lai cua don da xac nhan thu tien (`receiptResponse`: so tien la number, ngay dang
 *     `YYYY-MM-DD`). Don khong ton tai hoac chua thu tien 404 RECEIPT_NOT_FOUND. Phu huynh khong so
 *     huu don (so theo `parentEmail`) va role khac MANAGER nhan 403 FORBIDDEN. BE con cho STAFF doc,
 *     mobile chua co role nay.
 * - GET /me/students/:studentId/registrations
 *     TAM: BE chua co route nay, moi co GET /registrations/:id doc tung don. Tra moi don dang ky cua
 *     con, moi lap truoc, moi don cung dang GET /registrations/:id, de app hien don `DRAFT` nhan
 *     vien da lap nhung chua xac nhan thu hoc phi. Quyen giong route ghi danh. Route, thu tu va viec
 *     loc theo trang thai can BE chot.
 *
 * Du lieu mau: `./mock-registrations.ts`. Tai khoan dung thu (mat khau `Matkhau123`, xem
 * `./mock-accounts.ts`):
 * - phuhuynh@example.com    : Minh Anh co 4 bien lai (`mock-order-1` toi `mock-order-4`) va don
 *                             `mock-order-5` dang cho xac nhan; Hoang Long co bien lai `mock-order-6`
 * - phuhuynh.cu@example.com : chua co con nao, mo bien lai cua phu huynh khac thi 403
 * - giaovien@example.com    : 403
 */
import { Endpoints } from '@/api/endpoints';
import { parseDateKey } from '@/utils/date';

import { authorizeParent, FORBIDDEN, UNAUTHORIZED } from './auth';
import { authenticate } from './mock-accounts';
import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import {
  buildMockRegistrations,
  buildMockTuitionEnrollments,
  findMockRegistration,
  toMockReceipt,
} from './mock-registrations';
import {
  findStudentById,
  findStudentsByParent,
  updateStudent,
  type MockStudent,
  type MockStudentChanges,
} from './mock-students';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const STUDENT_ID_PARAM = ':studentId';
const REGISTRATION_ID_PARAM = ':registrationId';
/** Gioi han cua UpdateStudentDto. */
const FULL_NAME_MAX_LENGTH = 255;
const MIN_GRADE = 6;
const MAX_GRADE = 9;
const UPDATE_STUDENT_FIELDS = ['fullName', 'grade', 'dateOfBirth'] as const;

const STUDENT_NOT_FOUND = mockError(
  HTTP_NOT_FOUND,
  'STUDENT_NOT_FOUND',
  'Student profile not found',
);
const RECEIPT_NOT_FOUND = mockError(HTTP_NOT_FOUND, 'RECEIPT_NOT_FOUND', 'Receipt not found');
const STUDENT_GRADE_LOCKED = mockError(
  HTTP_CONFLICT,
  'STUDENT_GRADE_LOCKED',
  'Cannot change grade while the student has current or future enrollments',
);

/** Ban ghi Prisma StudentProfile: cot ngay tra 00:00 UTC cua ngay do. */
function toStudentProfile(student: MockStudent) {
  return {
    id: student.id,
    parentProfileId: `mock-parent-profile-${student.parentUserId}`,
    fullName: student.fullName,
    grade: student.grade,
    dateOfBirth: student.dateOfBirth ? `${student.dateOfBirth}T00:00:00.000Z` : null,
    status: 'ACTIVE',
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

/** Giong UpdateStudentDto qua ValidationPipe. Tra null khi body khong hop le. */
function readStudentChanges(body: unknown): MockStudentChanges | null {
  const input = readBody(body, [], UPDATE_STUDENT_FIELDS);
  if (!input) return null;

  const { fullName, grade, dateOfBirth } = input;
  const isFullNameValid =
    fullName === undefined ||
    (typeof fullName === 'string' &&
      fullName.length > 0 &&
      fullName.length <= FULL_NAME_MAX_LENGTH);
  const isGradeValid =
    grade === undefined ||
    (Number.isInteger(grade) && Number(grade) >= MIN_GRADE && Number(grade) <= MAX_GRADE);
  const isBirthDateValid =
    dateOfBirth === undefined ||
    dateOfBirth === null ||
    (typeof dateOfBirth === 'string' && parseDateKey(dateOfBirth) !== null);
  if (!isFullNameValid || !isGradeValid || !isBirthDateValid) return null;

  return {
    ...(typeof fullName === 'string' ? { fullName: fullName.trim() } : {}),
    ...(typeof grade === 'number' ? { grade } : {}),
    ...(typeof dateOfBirth === 'string' || dateOfBirth === null ? { dateOfBirth } : {}),
  };
}

type StudentCheck = { student: MockStudent } | { reply: MockReply };

/** Giong `requireRoles('PARENT')` roi `findVisibleStudent` cua RegistrationFlowService. */
function authorizeStudentOwner({ accessToken, params }: MockRequest): StudentCheck {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check;

  const student = findStudentById(params.studentId ?? '');
  if (!student) return { reply: STUDENT_NOT_FOUND };
  if (student.parentUserId !== check.parent.id) return { reply: FORBIDDEN };
  return { student };
}

function listMyStudents(_body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  return mockOk(findStudentsByParent(check.parent.id).map(toStudentProfile));
}

function updateMyStudent(body: unknown, request: MockRequest): MockReply {
  // Guard chay truoc ValidationPipe, con kiem tra role va quyen so huu nam trong service
  if (!authenticate(request.accessToken)) return UNAUTHORIZED;
  const changes = readStudentChanges(body);
  if (!changes) return mockValidationError();

  const check = authorizeStudentOwner(request);
  if ('reply' in check) return check.reply;

  const { student } = check;
  const isChangingGrade = changes.grade !== undefined && changes.grade !== student.grade;
  // `subjectNames` la mon cua cac ghi danh `ACTIVE`: con dang hoc thi khong doi khoi duoc
  if (isChangingGrade && student.subjectNames.length > 0) return STUDENT_GRADE_LOCKED;

  const updated = updateStudent(student.id, changes);
  return updated ? mockOk(toStudentProfile(updated)) : STUDENT_NOT_FOUND;
}

function getMyStudentEnrollments(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudentOwner(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockTuitionEnrollments(check.student));
}

function getMyStudentRegistrations(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudentOwner(request);
  if ('reply' in check) return check.reply;
  return mockOk(buildMockRegistrations(check.student));
}

function getReceipt(_body: unknown, { accessToken, params }: MockRequest): MockReply {
  const current = authenticate(accessToken);
  if (!current) return UNAUTHORIZED;

  // BE kiem tra bien lai ton tai truoc, roi moi kiem tra quyen doc
  const order = findMockRegistration(params.registrationId ?? '');
  const receipt = order ? toMockReceipt(order) : null;
  if (!order || !receipt) return RECEIPT_NOT_FOUND;

  const { role, email } = current.user;
  const canRead = role === 'PARENT' ? email === order.parentEmail : role === 'MANAGER';
  return canRead ? mockOk(receipt) : FORBIDDEN;
}

export const registrationFlowRoutes: readonly MockRoute[] = [
  { method: 'get', url: Endpoints.me.students, handle: listMyStudents },
  { method: 'patch', url: Endpoints.me.student(STUDENT_ID_PARAM), handle: updateMyStudent },
  {
    method: 'get',
    url: Endpoints.me.studentEnrollments(STUDENT_ID_PARAM),
    handle: getMyStudentEnrollments,
  },
  {
    method: 'get',
    url: Endpoints.me.studentRegistrations(STUDENT_ID_PARAM),
    handle: getMyStudentRegistrations,
  },
  {
    method: 'get',
    url: Endpoints.registrations.receipt(REGISTRATION_ID_PARAM),
    handle: getReceipt,
  },
];
