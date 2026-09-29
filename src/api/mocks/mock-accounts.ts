/**
 * Tai khoan va phien gia dung chung cho cac mock (auth, link-invitations), dong vai bang `users`
 * va `auth_sessions` cua BE. Tai khoan mau, mat khau deu la `Matkhau123`:
 * - phuhuynh@example.com    : PARENT
 * - phuhuynh.cu@example.com : PARENT, trung email cua ma lien ket DEMOOLD1
 * - giaovien@example.com    : TEACHER
 * - khoa@example.com        : PARENT bi DISABLED, dang nhap bao sai thong tin nhu BE
 *
 * Token mang san userId va sessionId nen tai khoan mau van con dang nhap sau khi tai lai app.
 * Tai khoan tao luc chay (register, claim-and-sign-up) va phien bi thu hoi chi nam trong bo nho.
 */
import type { AuthSession, User, UserRole } from '@/types/auth';

/** Thoi han access token BE tra ve (giay). Mock khong lam token het han that. */
const ACCESS_TOKEN_TTL_SECONDS = 900;
const ACCESS_PREFIX = 'mock-access';
const REFRESH_PREFIX = 'mock-refresh';
const TOKEN_SEPARATOR = '.';
const SEED_CREATED_AT = '2026-09-01T00:00:00.000Z';
const DEMO_PASSWORD = 'Matkhau123';

type MockAccount = { user: User; password: string };

const SEED_USERS: readonly Omit<User, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'mock-user-1',
    email: 'phuhuynh@example.com',
    displayName: 'Phạm Thu Hà',
    role: 'PARENT',
    status: 'ACTIVE',
  },
  {
    id: 'mock-user-2',
    email: 'phuhuynh.cu@example.com',
    displayName: 'Trần Văn Minh',
    role: 'PARENT',
    status: 'ACTIVE',
  },
  {
    id: 'mock-user-3',
    email: 'giaovien@example.com',
    displayName: 'Lê Thị Lan',
    role: 'TEACHER',
    status: 'ACTIVE',
  },
  {
    id: 'mock-user-4',
    email: 'khoa@example.com',
    displayName: 'Đỗ Văn Khoa',
    role: 'PARENT',
    status: 'DISABLED',
  },
];

/** Key la email da chuan hoa (trim, viet thuong) nhu BE. */
const accounts = new Map<string, MockAccount>(
  SEED_USERS.map((user) => [
    user.email,
    {
      user: { ...user, createdAt: SEED_CREATED_AT, updatedAt: SEED_CREATED_AT },
      password: DEMO_PASSWORD,
    },
  ]),
);

const revokedSessions = new Set<string>();
/** Refresh token moi nhat cua tung phien, de phat hien dung lai token cu. */
const latestRefreshNonces = new Map<string, string>();

let sequence = 0;
/** Date.now giu id khong trung voi id da phat truoc lan tai lai app. */
function nextId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}${sequence}`;
}

export function findAccountByEmail(email: string): MockAccount | undefined {
  return accounts.get(email);
}

function findUserById(id: string): User | undefined {
  return [...accounts.values()].find((account) => account.user.id === id)?.user;
}

export function createAccount(input: {
  email: string;
  password: string;
  displayName: string | null;
  role: UserRole;
}): User {
  const now = new Date().toISOString();
  const user: User = {
    id: `mock-user-${nextId()}`,
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  accounts.set(user.email, { user, password: input.password });
  return user;
}

function issueTokens(user: User, sessionId: string): AuthSession {
  const nonce = nextId();
  latestRefreshNonces.set(sessionId, nonce);
  return {
    user,
    tokens: {
      accessToken: [ACCESS_PREFIX, user.id, sessionId].join(TOKEN_SEPARATOR),
      refreshToken: [REFRESH_PREFIX, user.id, sessionId, nonce].join(TOKEN_SEPARATOR),
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
}

/** Mo phien moi, tra dung hop dong AuthResponseDto. */
export function startSession(user: User): AuthSession {
  return issueTokens(user, `s${nextId()}`);
}

/** Giong JwtAuthGuard: tra user va phien neu access token con hieu luc. */
export function authenticate(accessToken: string | null): { user: User; sessionId: string } | null {
  const [prefix, userId, sessionId] = accessToken?.split(TOKEN_SEPARATOR) ?? [];
  if (prefix !== ACCESS_PREFIX || !userId || !sessionId || revokedSessions.has(sessionId)) {
    return null;
  }
  const user = findUserById(userId);
  return user ? { user, sessionId } : null;
}

/** Doi cap token moi. Dung lai refresh token cu thi thu hoi ca phien nhu AuthService.refresh. */
export function rotateSession(refreshToken: string): AuthSession | null {
  const [prefix, userId, sessionId, nonce] = refreshToken.split(TOKEN_SEPARATOR);
  if (prefix !== REFRESH_PREFIX || !userId || !sessionId || !nonce) return null;
  if (revokedSessions.has(sessionId)) return null;

  const user = findUserById(userId);
  if (!user) return null;

  const latestNonce = latestRefreshNonces.get(sessionId);
  // Sau khi tai lai app khong con nonce trong bo nho: chap nhan token de khong bat dang nhap lai
  if (latestNonce !== undefined && latestNonce !== nonce) {
    revokedSessions.add(sessionId);
    return null;
  }
  return issueTokens(user, sessionId);
}

export function revokeSession(sessionId: string) {
  revokedSessions.add(sessionId);
}
