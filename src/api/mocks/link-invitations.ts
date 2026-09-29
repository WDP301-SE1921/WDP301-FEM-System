/**
 * Mock cho module link-invitations (EDUGRADE_BACKEND_FLOW.md §6.3, §6.4, §6.5). BE chua co module
 * nay. Khi BE lam xong: xoa file nay va bo `linkInvitationRoutes` khoi `./index.ts`.
 *
 * Ma dung thu (8 ky tu nhu thiet ke man hinh, o nhap hien thanh XXXX-XXXX):
 * - DEMONEW1 : phu huynh chua co tai khoan -> tao tai khoan va lien ket
 * - DEMOOLD1 : email da co tai khoan (phuhuynh.cu@example.com) -> dang nhap roi lien ket
 * - DEMOADD1 : email cua phuhuynh@example.com -> dang nhap roi lien ket them con thu ba
 * - DEMOEXP1 : 410 INVITATION_EXPIRED
 * - DEMOUSE1 : 409 INVITATION_ALREADY_USED
 * - DEMOLIMT : 429 HTTP_ERROR (vuot rate limit, §10)
 * - DEMOFAIL : 500 INTERNAL_ERROR
 * - ma khac  : 404 RESOURCE_NOT_FOUND
 * `mode` suy ra tu viec email da co tai khoan hay chua. Ma dung xong se thanh "da dung", hoc sinh
 * cua ma hien o trang chu cua tai khoan vua lien ket, cho toi khi tai lai app.
 *
 * POST /link-invitations/claim (§6.5): tai lieu chua ghi response va ma loi khi email khong khop.
 * Mock TAM tra `{ studentId, studentName }` va 403 FORBIDDEN khi email phien khac email cua ma.
 * Chua gia lap loai EXISTING_STUDENT_NEW_SUBJECT: moi ma deu tao hoc sinh moi.
 */
import { Endpoints } from '@/api/endpoints';

import { authorizeParent, FORBIDDEN } from './auth';
import { createAccount, findAccountByEmail, startSession } from './mock-accounts';
import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import { linkStudent } from './mock-students';

const DAY_MS = 24 * 60 * 60 * 1000;
const HTTP_CREATED = 201;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const DISPLAY_NAME_MAX_LENGTH = 255;

type InvitationFixture = {
  parentEmail: string;
  studentName: string;
  /** Khoi cua hoc sinh, khong tra ve o inspect; dung khi tao StudentProfile luc claim. */
  studentGrade: number;
  subjectName: string;
  className: string;
  expiresAt: string;
};

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

const INVITATIONS: Partial<Record<string, InvitationFixture>> = {
  DEMONEW1: {
    parentEmail: 'phuhuynh.moi@example.com',
    studentName: 'Nguyễn Văn An',
    studentGrade: 8,
    subjectName: 'Toán',
    className: 'Toán 8A',
    expiresAt: daysFromNow(6),
  },
  DEMOOLD1: {
    parentEmail: 'phuhuynh.cu@example.com',
    studentName: 'Trần Minh Khang',
    studentGrade: 7,
    subjectName: 'Ngữ văn',
    className: 'Văn 7B',
    expiresAt: daysFromNow(3),
  },
  DEMOADD1: {
    parentEmail: 'phuhuynh@example.com',
    studentName: 'Nguyễn Gia Huy',
    studentGrade: 7,
    subjectName: 'Tiếng Anh',
    className: 'Anh 7C',
    expiresAt: daysFromNow(5),
  },
};

const EXPIRED = mockError(410, 'INVITATION_EXPIRED', 'Invitation has expired');
const USED = mockError(409, 'INVITATION_ALREADY_USED', 'Invitation has already been used');
const NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Invitation not found');
const ACCOUNT_EXISTS = mockError(409, 'ACCOUNT_ALREADY_EXISTS', 'Account exists, sign in to claim');
/** ThrottlerException la HttpException nen AllExceptionsFilter tra code chung HTTP_ERROR. */
const TOO_MANY_REQUESTS = mockError(429, 'HTTP_ERROR', 'ThrottlerException: Too Many Requests');
const INTERNAL_ERROR = mockError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');

const FAILURES: Partial<Record<string, MockReply>> = {
  DEMOEXP1: EXPIRED,
  DEMOUSE1: USED,
  DEMOLIMT: TOO_MANY_REQUESTS,
  DEMOFAIL: INTERNAL_ERROR,
};

const usedTokens = new Set<string>();

type Lookup = { invitation: InvitationFixture } | { reply: MockReply };

function lookupInvitation(token: string): Lookup {
  if (usedTokens.has(token)) return { reply: USED };
  const invitation = INVITATIONS[token];
  if (invitation) return { invitation };
  return { reply: FAILURES[token] ?? NOT_FOUND };
}

function hasAccount(invitation: InvitationFixture): boolean {
  return findAccountByEmail(invitation.parentEmail) !== undefined;
}

function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH
  );
}

function isValidDisplayName(value: unknown): boolean {
  return (
    value === undefined || (typeof value === 'string' && value.length <= DISPLAY_NAME_MAX_LENGTH)
  );
}

function inspect(body: unknown): MockReply {
  const input = readBody(body, ['token']);
  if (!input || !isNonEmptyString(input.token)) return mockValidationError();

  const found = lookupInvitation(input.token);
  if ('reply' in found) return found.reply;

  const { parentEmail, studentName, subjectName, className, expiresAt } = found.invitation;
  return mockOk({
    valid: true,
    mode: hasAccount(found.invitation) ? 'SIGN_IN' : 'CREATE_ACCOUNT',
    maskedEmail: maskEmail(parentEmail),
    studentName,
    subjectName,
    className,
    expiresAt,
  });
}

function claimAndSignUp(body: unknown): MockReply {
  const input = readBody(body, ['token', 'password'], ['displayName']);
  if (
    !input ||
    !isNonEmptyString(input.token) ||
    !isValidPassword(input.password) ||
    !isValidDisplayName(input.displayName)
  ) {
    return mockValidationError();
  }

  const found = lookupInvitation(input.token);
  if ('reply' in found) return found.reply;
  if (hasAccount(found.invitation)) return ACCOUNT_EXISTS;

  const user = createAccount({
    email: found.invitation.parentEmail,
    password: input.password,
    displayName: typeof input.displayName === 'string' ? input.displayName.trim() : null,
    role: 'PARENT',
  });
  consumeInvitation(input.token, found.invitation, user.id);
  return mockOk(startSession(user), HTTP_CREATED);
}

/** Danh dau ma da dung va tao hoc sinh tu snapshot cua ma, gan cho phu huynh. */
function consumeInvitation(token: string, invitation: InvitationFixture, parentUserId: string) {
  usedTokens.add(token);
  return linkStudent({
    parentUserId,
    fullName: invitation.studentName,
    grade: invitation.studentGrade,
    subjectNames: [invitation.subjectName],
  });
}

/** Guard chay truoc ValidationPipe nhu NestJS: 401/403 truoc, roi moi toi 400. */
function claim(body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const input = readBody(body, ['token']);
  if (!input || !isNonEmptyString(input.token)) return mockValidationError();

  const found = lookupInvitation(input.token);
  if ('reply' in found) return found.reply;
  if (found.invitation.parentEmail !== check.parent.email) return FORBIDDEN;

  const student = consumeInvitation(input.token, found.invitation, check.parent.id);
  return mockOk({ studentId: student.id, studentName: student.fullName });
}

export const linkInvitationRoutes: readonly MockRoute[] = [
  { method: 'post', url: Endpoints.linkInvitations.inspect, handle: inspect },
  { method: 'post', url: Endpoints.linkInvitations.claimAndSignUp, handle: claimAndSignUp },
  { method: 'post', url: Endpoints.linkInvitations.claim, handle: claim },
];
