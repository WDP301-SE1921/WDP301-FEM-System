import { ErrorMessages } from '@/constants/messages';
import { AppError } from '@/types/api';

/**
 * Thong bao loi hien thi duoc cho nguoi dung.
 * Chi AppError (da chuan hoa trong api/client) co message than thien; loi khac dung fallback
 * de khong lo chi tiet ky thuat (vd "undefined is not a function") ra giao dien.
 */
export function getErrorMessage(error: unknown, fallback: string = ErrorMessages.unknown): string {
  return error instanceof AppError ? error.message : fallback;
}
