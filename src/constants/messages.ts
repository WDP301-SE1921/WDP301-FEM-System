/** Thong bao loi chung, dung o nhieu tang (api, utils, component). */
export const ErrorMessages = {
  unknown: 'Đã có lỗi xảy ra, vui lòng thử lại.',
  timeout: 'Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối mạng.',
  network: 'Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi hoặc 4G rồi thử lại.',
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
  /**
   * Moi danh sach loc theo ngay: ngay khong ton tai, hoac ngay bat dau sau ngay ket thuc. App tu tinh
   * khoang ngay nen nguoi dung khong tu sua duoc.
   */
  INVALID_DATE_RANGE: 'Khoảng ngày xem không hợp lệ. Vui lòng chọn tuần khác hoặc thử lại.',
  INTERNAL_ERROR: ErrorMessages.unknown,
  /** JwtAuthGuard tra ma nay khi thieu, sai hoac het han access token. */
  AUTH_UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  AUTH_EMAIL_EXISTS: 'Email này đã được đăng ký.',
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  AUTH_PASSWORD_TOO_LONG: 'Mật khẩu quá dài.',
  AUTH_INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  /** Ma xac minh email sai, da dung, qua 15 phut, hoac da co ma moi hon. */
  AUTH_INVALID_EMAIL_TOKEN:
    'Mã xác minh không đúng hoặc đã hết hạn. Hãy kiểm tra lại, hoặc gửi lại mã để nhận mã mới.',
  /** Nhap sai 5 lan: ma do khong dung duoc nua. */
  AUTH_EMAIL_CODE_ATTEMPTS_EXCEEDED:
    'Bạn đã nhập sai mã nhiều lần. Hãy bấm "Gửi lại mã" để nhận mã mới.',
  /** BE gui toi da 5 ma moi gio cho mot tai khoan. */
  AUTH_VERIFICATION_RATE_LIMITED:
    'Bạn đã yêu cầu gửi mã nhiều lần. Vui lòng kiểm tra hộp thư, hoặc thử lại sau 1 giờ.',
  AUTH_CURRENT_PASSWORD_INVALID: 'Mật khẩu hiện tại không đúng.',
  /** Chi tai khoan phu huynh tu xoa duoc; app khong cho role khac vao nen hiem khi gap. */
  AUTH_ACCOUNT_DELETE_NOT_ALLOWED: 'Tài khoản này không tự xóa được. Vui lòng liên hệ trung tâm.',
  /** Module `registration-flow` cua BE. */
  PARENT_EMAIL_UNVERIFIED: 'Cần xác minh email trước khi tạo hoặc sửa hồ sơ học sinh.',
  STUDENT_NOT_FOUND: 'Không tìm thấy hồ sơ học sinh.',
  RECEIPT_NOT_FOUND: 'Không tìm thấy biên lai.',
  BILL_NOT_FOUND: 'Không tìm thấy bill học phí.',
  STUDENT_GRADE_LOCKED: 'Không đổi được khối khi học sinh đang có môn học tại trung tâm.',
  /** Nop bai (module `academic` cua BE). */
  SUBMISSION_CLOSED: 'Bài tập đã hết hạn nộp.',
  ATTEMPTS_EXHAUSTED: 'Học sinh đã dùng hết số lần nộp bài.',
  INVALID_ANSWERS: 'Cần trả lời đủ tất cả câu hỏi trước khi nộp.',
  INVALID_CHOICE: 'Có câu trả lời không nằm trong các lựa chọn của đề.',
  /** Ma cua POST /academic/files va tep gui kem bai nop (anh dai dien ghi de trong `auth-api`). */
  INVALID_FILE_TYPE: 'Chỉ gửi được ảnh JPG, PNG hoặc tệp PDF.',
  INVALID_FILE_SIZE: 'Tệp phải lớn hơn 0 và nhỏ hơn 10 MB.',
  INVALID_FILES: 'Có ảnh hoặc tệp bài làm không còn dùng được. Hãy xoá tệp đó và gửi lại.',
  INVALID_FILE_QUESTION:
    'Có tệp được gắn với câu hỏi nhưng không có trong bài nộp. Hãy xoá tệp đó và gửi lại.',
  /** Hai lan doi anh dai dien cung luc (vd tren hai may): lan den sau bi tu choi. */
  AVATAR_CONFLICT: 'Ảnh đại diện vừa được đổi ở nơi khác. Vui lòng thử lại.',
};
