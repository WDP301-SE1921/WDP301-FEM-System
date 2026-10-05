/** Kieu du lieu dung chung cho response tu backend (xem docs/api-conventions.md cua BE). */

export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiErrorBody = {
  success: false;
  error: {
    /** Ma loi on dinh cua BE, vd `VALIDATION_ERROR`, `AUTH_EMAIL_EXISTS`. */
    code: string;
    /** Thong bao tieng Anh cua BE, chi de debug, khong hien len UI. */
    message: string;
    requestId: string;
    details?: unknown;
  };
};

/** Loi da duoc chuan hoa truoc khi den tang UI. `message` luon la tieng Viet hien duoc. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
