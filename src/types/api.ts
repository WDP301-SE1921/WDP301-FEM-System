/** Kieu du lieu dung chung cho response tu backend (xem docs/api-conventions.md cua BE). */

export type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * Query phan trang cua BE (PageDto, `docs/data-list-api.md`): `page` tu 1, `limit` tu 1 toi 100. Bo
 * `limit` thi BE chi tra 20 dong dau, ke ca route van tra mang.
 */
export type PageQuery = {
  page: number;
  limit: number;
};

/** Query phan trang kem `paginated: true`: route van tra mang thi tra `Page`, doc duoc het theo `total`. */
export type PaginatedQuery = PageQuery & { paginated: true };

/** Response phan trang cua BE (`{ items, page, limit, total }`). `total` dem sau khi loc quyen. */
export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
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
