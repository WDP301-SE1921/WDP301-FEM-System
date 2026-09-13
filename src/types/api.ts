/** Kieu du lieu dung chung cho response tu backend. */

export type ApiResponse<T> = {
  success: boolean;
  message: string;
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
  message?: string;
  errors?: Record<string, string[]>;
};

/** Loi da duoc chuan hoa truoc khi den tang UI. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
