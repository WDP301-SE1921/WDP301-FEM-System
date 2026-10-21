import { ApiErrorMessages, ErrorMessages } from '@/constants/messages';
import { AppError } from '@/types/api';

const HTTP_TOO_MANY_REQUESTS = 429;

/**
 * Thong bao loi hien thi duoc cho nguoi dung.
 * Chi AppError (da chuan hoa trong api/client) co message than thien; loi khac dung fallback
 * de khong lo chi tiet ky thuat (vd "undefined is not a function") ra giao dien.
 */
export function getErrorMessage(error: unknown, fallback: string = ErrorMessages.unknown): string {
  return error instanceof AppError ? error.message : fallback;
}

/**
 * Doi loi BE (`error.code` + HTTP status) thanh thong bao tieng Viet.
 * Rate limit cua BE tra code chung `HTTP_ERROR` nen phai nhan dien bang status 429.
 */
export function getApiErrorMessage(code: string | undefined, status: number): string {
  const byCode = code ? ApiErrorMessages[code] : undefined;
  if (byCode) return byCode;
  if (status === HTTP_TOO_MANY_REQUESTS) return ErrorMessages.tooManyRequests;
  return ErrorMessages.unknown;
}
