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
  /** Ma xac minh email sai, da dung hoac qua 24 gio. */
  AUTH_INVALID_EMAIL_TOKEN:
    'Mã xác minh không đúng hoặc đã hết hạn. Hãy gửi lại mã để nhận mã mới.',
  AUTH_CURRENT_PASSWORD_INVALID: 'Mật khẩu hiện tại không đúng.',
  /** Module `registration-flow` cua BE. */
  PARENT_EMAIL_UNVERIFIED: 'Cần xác minh email trước khi tạo hoặc sửa hồ sơ học sinh.',
  STUDENT_NOT_FOUND: 'Không tìm thấy hồ sơ học sinh.',
  RECEIPT_NOT_FOUND: 'Không tìm thấy biên lai.',
  BILL_NOT_FOUND: 'Không tìm thấy bill học phí.',
  STUDENT_GRADE_LOCKED: 'Không đổi được lớp khi học sinh đang có môn học tại trung tâm.',
  /** Nop bai (module `academic` cua BE). */
  SUBMISSION_CLOSED: 'Bài tập đã hết hạn nộp.',
  ATTEMPTS_EXHAUSTED: 'Học sinh đã dùng hết số lần nộp bài.',
  INVALID_ANSWERS: 'Cần trả lời đủ tất cả câu hỏi trước khi nộp.',
  INVALID_CHOICE: 'Có câu trả lời không nằm trong các lựa chọn của đề.',
};
