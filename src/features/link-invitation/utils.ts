import { AppError } from '@/types/api';

import {
  INVITATION_ERROR_MESSAGES,
  LINK_CODE_GROUP_SIZE,
  LINK_CODE_LENGTH,
  SIGN_IN_ERROR_CODES,
} from './constants';
import type { InvitationContext } from './types';

const NON_CODE_CHARACTERS = /[^A-Z0-9]/g;
const CODE_GROUP_PATTERN = new RegExp(`.{1,${LINK_CODE_GROUP_SIZE}}`, 'g');
const CODE_GROUP_SEPARATOR = '-';

/** Doi thong bao chung sang thong bao theo ngu canh ma lien ket; loi khac giu nguyen. */
export function toInvitationError(error: unknown, context: InvitationContext = 'SIGN_UP'): unknown {
  if (!(error instanceof AppError) || !error.code) return error;

  const message = INVITATION_ERROR_MESSAGES[context][error.code];
  return message ? new AppError(message, error.status, error.code) : error;
}

/** Loi co nen kem loi goi y dang nhap hay khong (xem `SIGN_IN_ERROR_CODES`). */
export function shouldSuggestSignIn(error: unknown): boolean {
  return error instanceof AppError && !!error.code && SIGN_IN_ERROR_CODES.has(error.code);
}

/**
 * Chuan hoa chuoi nguoi dung go hoac dan tu email ("edug-2026 ab") thanh ma gui len BE:
 * viet hoa, bo dau gach va khoang trang, cat dung do dai ma.
 */
export function normalizeLinkCode(input: string): string {
  return input.toUpperCase().replace(NON_CODE_CHARACTERS, '').slice(0, LINK_CODE_LENGTH);
}

/** Hien ma theo nhom giong o nhap ma, vd "DEMONEW1" -> "DEMO-NEW1". */
export function formatLinkCode(code: string): string {
  return (code.match(CODE_GROUP_PATTERN) ?? []).join(CODE_GROUP_SEPARATOR);
}
