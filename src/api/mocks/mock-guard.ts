/**
 * Gia lap JwtAuthGuard va RolesGuard cua BE cho cac route con chay bang mock. Dang nhap da noi BE
 * that nen access token la JWT do BE ky (payload `sub` la `User.id`, `role`, `type: 'access'`, xem
 * `jwt-payload.ts` cua BE). Server gia chi doc payload, khong kiem tra chu ky va han dung: token het
 * han van duoc nhan o day, endpoint da wire moi la noi BE tra 401 va kich hoat refresh.
 */
import { mockError, type MockReply } from './mock-adapter';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const JWT_SEPARATOR = '.';
const JWT_SEGMENT_COUNT = 3;
const BASE64_BLOCK_LENGTH = 4;
const ACCESS_TOKEN_TYPE = 'access';
const PARENT_ROLE = 'PARENT';

/** Loi cua JwtAuthGuard, dung lai o moi route mock can Bearer. */
export const UNAUTHORIZED = mockError(
  HTTP_UNAUTHORIZED,
  'AUTH_UNAUTHORIZED',
  'Authentication is required',
);
/** Loi cua RolesGuard, dung lai o moi route mock gioi han role. */
export const FORBIDDEN = mockError(HTTP_FORBIDDEN, 'FORBIDDEN', 'Forbidden resource');

/** Nguoi goi doc tu access token. `role` la `UserRole` cua BE, o day chi so sanh voi `PARENT`. */
export type MockPrincipal = { userId: string; role: string };

export type ParentCheck = { parent: { id: string } } | { reply: MockReply };

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddedLength = Math.ceil(base64.length / BASE64_BLOCK_LENGTH) * BASE64_BLOCK_LENGTH;
  return atob(base64.padEnd(paddedLength, '='));
}

function readJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(JWT_SEPARATOR);
  const payloadSegment = segments[1];
  if (segments.length !== JWT_SEGMENT_COUNT || !payloadSegment) return null;

  try {
    const payload: unknown = JSON.parse(decodeBase64Url(payloadSegment));
    if (typeof payload !== 'object' || payload === null) return null;
    return Object.fromEntries(Object.entries(payload));
  } catch {
    // Chuoi khong phai JWT: coi nhu thieu token, route tra 401 nhu JwtAuthGuard
    return null;
  }
}

/** Nguoi goi cua request, null khi thieu Bearer hoac token khong phai access token cua BE. */
export function readPrincipal(accessToken: string | null): MockPrincipal | null {
  const payload = accessToken ? readJwtPayload(accessToken) : null;
  if (!payload || payload.type !== ACCESS_TOKEN_TYPE) return null;

  const { sub, role } = payload;
  if (typeof sub !== 'string' || sub.length === 0 || typeof role !== 'string') return null;
  return { userId: sub, role };
}

/** Giong JwtAuthGuard ket hop RolesGuard chi cho PARENT, dung cho cac route cua phu huynh. */
export function authorizeParent(accessToken: string | null): ParentCheck {
  const principal = readPrincipal(accessToken);
  if (!principal) return { reply: UNAUTHORIZED };
  if (principal.role !== PARENT_ROLE) return { reply: FORBIDDEN };
  return { parent: { id: principal.userId } };
}
