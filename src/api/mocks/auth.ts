/**
 * Mock module auth, lam theo nhanh `feature/auth` cua BE (auth.controller.ts, dto/, auth.service.ts,
 * jwt-auth.guard.ts). BE da co module nay nhung mobile chua duoc noi that: chi xoa file nay khi
 * nguoi dung yeu cau wire (Luat so 2 trong CLAUDE.md cua workspace).
 *
 * Tai khoan dung thu nam o dau `./mock-accounts.ts`.
 * Chua gia lap: rate limit 429 va access token het han sau `expiresIn` giay.
 */
import { Endpoints } from '@/api/endpoints';
import type { User } from '@/types/auth';

import {
  authenticate,
  createAccount,
  findAccountByEmail,
  revokeSession,
  rotateSession,
  startSession,
} from './mock-accounts';
import {
  mockError,
  mockOk,
  mockValidationError,
  readBody,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';

const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
/** Gioi han class-validator trong LoginDto va RegisterParentDto. */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
/** AuthService chan truoc vi bcrypt cat bo phan sau 72 byte. */
const BCRYPT_MAX_BYTES = 72;
const EMAIL_MAX_LENGTH = 255;
const DISPLAY_NAME_MAX_LENGTH = 255;
const PHONE_MAX_LENGTH = 32;
const REFRESH_TOKEN_MIN_LENGTH = 32;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Moc code point ma UTF-8 can them 1 byte. */
const UTF8_BYTE_THRESHOLDS = [0x80, 0x800, 0x10000] as const;

const INVALID_CREDENTIALS = mockError(
  HTTP_UNAUTHORIZED,
  'AUTH_INVALID_CREDENTIALS',
  'Invalid email or password',
);
const INVALID_REFRESH_TOKEN = mockError(
  HTTP_UNAUTHORIZED,
  'AUTH_INVALID_REFRESH_TOKEN',
  'Invalid refresh token',
);
/** Loi cua JwtAuthGuard, dung lai o moi route mock can Bearer. */
export const UNAUTHORIZED = mockError(
  HTTP_UNAUTHORIZED,
  'AUTH_UNAUTHORIZED',
  'Authentication is required',
);
/** Loi cua RolesGuard (§11), dung lai o moi route mock gioi han role. */
export const FORBIDDEN = mockError(HTTP_FORBIDDEN, 'FORBIDDEN', 'Forbidden resource');
const PASSWORD_TOO_LONG = mockError(
  HTTP_BAD_REQUEST,
  'AUTH_PASSWORD_TOO_LONG',
  'Password must be at most 72 bytes for bcrypt',
);
const EMAIL_EXISTS = mockError(HTTP_CONFLICT, 'AUTH_EMAIL_EXISTS', 'Email is already registered');

/** Giong @Transform normalizeEmail + IsEmail + MaxLength cua DTO. */
function readEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email) ? email : null;
}

function readPassword(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH ? value : null;
}

/** Field tuy chon: IsOptional + IsString + MaxLength, do dai tinh sau khi trim nhu DTO. */
function isOptionalString(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === 'string' && value.trim().length <= maxLength);
}

function utf8ByteLength(text: string): number {
  return Array.from(text).reduce((total, char) => {
    const codePoint = char.codePointAt(0) ?? 0;
    return total + 1 + UTF8_BYTE_THRESHOLDS.filter((threshold) => codePoint >= threshold).length;
  }, 0);
}

function login(body: unknown): MockReply {
  const input = readBody(body, ['email', 'password']);
  const email = readEmail(input?.email);
  const password = readPassword(input?.password);
  if (!email || !password) return mockValidationError();
  if (utf8ByteLength(password) > BCRYPT_MAX_BYTES) return PASSWORD_TOO_LONG;

  const account = findAccountByEmail(email);
  const isValid = account?.user.status === 'ACTIVE' && account.password === password;
  return isValid ? mockOk(startSession(account.user)) : INVALID_CREDENTIALS;
}

function register(body: unknown): MockReply {
  const input = readBody(body, ['email', 'password'], ['displayName', 'phone']);
  const email = readEmail(input?.email);
  const password = readPassword(input?.password);
  const hasValidOptionals =
    isOptionalString(input?.displayName, DISPLAY_NAME_MAX_LENGTH) &&
    isOptionalString(input?.phone, PHONE_MAX_LENGTH);
  if (!email || !password || !hasValidOptionals) return mockValidationError();
  if (utf8ByteLength(password) > BCRYPT_MAX_BYTES) return PASSWORD_TOO_LONG;
  if (findAccountByEmail(email)) return EMAIL_EXISTS;

  const displayName = input?.displayName;
  const user = createAccount({
    email,
    password,
    displayName: typeof displayName === 'string' ? displayName.trim() : null,
    role: 'PARENT',
  });
  return mockOk(startSession(user), HTTP_CREATED);
}

function refresh(body: unknown): MockReply {
  const refreshToken = readBody(body, ['refreshToken'])?.refreshToken;
  if (typeof refreshToken !== 'string' || refreshToken.length < REFRESH_TOKEN_MIN_LENGTH) {
    return mockValidationError();
  }
  const session = rotateSession(refreshToken);
  return session ? mockOk(session) : INVALID_REFRESH_TOKEN;
}

function logout(_body: unknown, { accessToken }: MockRequest): MockReply {
  const current = authenticate(accessToken);
  if (!current) return UNAUTHORIZED;
  revokeSession(current.sessionId);
  return mockOk({ revoked: true });
}

function me(_body: unknown, { accessToken }: MockRequest): MockReply {
  const current = authenticate(accessToken);
  return current ? mockOk(current.user) : UNAUTHORIZED;
}

export type ParentCheck = { parent: User } | { reply: MockReply };

/** Giong JwtAuthGuard ket hop RolesGuard chi cho PARENT, dung cho cac route cua phu huynh. */
export function authorizeParent(accessToken: string | null): ParentCheck {
  const current = authenticate(accessToken);
  if (!current) return { reply: UNAUTHORIZED };
  if (current.user.role !== 'PARENT') return { reply: FORBIDDEN };
  return { parent: current.user };
}

export const authRoutes: readonly MockRoute[] = [
  { method: 'post', url: Endpoints.auth.login, handle: login },
  { method: 'post', url: Endpoints.auth.register, handle: register },
  { method: 'post', url: Endpoints.auth.refresh, handle: refresh },
  { method: 'post', url: Endpoints.auth.logout, handle: logout },
  { method: 'get', url: Endpoints.auth.me, handle: me },
];
