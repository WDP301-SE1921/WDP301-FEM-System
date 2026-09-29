/** Thong bao loi chung, dung o nhieu tang (api, utils, component). */
export const ErrorMessages = {
  unknown: 'Đã có lỗi xảy ra, vui lòng thử lại.',
  timeout: 'Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối mạng.',
  network: 'Không kết nối được tới máy chủ.',
  tooManyRequests: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.',
} as const;

/**
 * Thong bao tieng Viet theo `error.code` cua BE (EDUGRADE_BACKEND_FLOW.md §11 va module auth).
 * BE tra `error.message` tieng Anh nen UI khong dung truc tiep. Feature co the ghi de theo ngu canh.
 */
export const ApiErrorMessages: Partial<Record<string, string>> = {
  VALIDATION_ERROR: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
  INTERNAL_ERROR: ErrorMessages.unknown,
  /** JwtAuthGuard tra ma nay khi thieu, sai hoac het han access token. */
  AUTH_UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  AUTH_EMAIL_EXISTS: 'Email này đã được đăng ký.',
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  AUTH_PASSWORD_TOO_LONG: 'Mật khẩu quá dài.',
  AUTH_INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  ACCOUNT_ALREADY_EXISTS: 'Email này đã có tài khoản. Vui lòng đăng nhập.',
  INVITATION_ALREADY_USED: 'Mã liên kết này đã được sử dụng.',
  INVITATION_EXPIRED: 'Mã liên kết đã hết hạn. Vui lòng liên hệ trung tâm để được cấp mã mới.',
};
