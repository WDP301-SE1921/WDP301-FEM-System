import type { InvitationContext } from './types';

export const INVALID_CODE_MESSAGE =
  'Mã liên kết không đúng. Vui lòng kiểm tra lại email trung tâm đã gửi.';

/**
 * Thong bao theo ngu canh ma lien ket, ghi de `ApiErrorMessages` chung.
 * BE tra loi chung cho ma khong ton tai de chong do ma, nen phai noi ro la ma sai.
 * Phu huynh da dang nhap thi khong goi y dang nhap nua; FORBIDDEN khi dung ma luc do nghia la
 * email cua ma khac email tai khoan (§6.5, mock dang gia dinh ma loi nay).
 */
export const INVITATION_ERROR_MESSAGES: Record<
  InvitationContext,
  Partial<Record<string, string>>
> = {
  SIGN_UP: {
    RESOURCE_NOT_FOUND: INVALID_CODE_MESSAGE,
    INVITATION_ALREADY_USED:
      'Mã liên kết này đã được sử dụng. Nếu chính bạn đã dùng mã, hãy đăng nhập; nếu không, vui lòng liên hệ trung tâm.',
  },
  ADD_CHILD: {
    RESOURCE_NOT_FOUND: INVALID_CODE_MESSAGE,
    INVITATION_ALREADY_USED:
      'Mã liên kết này đã được sử dụng. Nếu con đã có trong danh sách thì bạn không cần nhập lại; nếu chưa, vui lòng liên hệ trung tâm.',
    FORBIDDEN:
      'Mã liên kết này được gửi tới email khác. Vui lòng đăng nhập bằng email đã nhận mã để liên kết.',
  },
};

/**
 * Loi cho thay phu huynh (co the) da co tai khoan nen UI kem nut dang nhap:
 * ma da dung, hoac email vua duoc dang ky trong luc dung ma (§6.4, race condition).
 */
export const SIGN_IN_ERROR_CODES: ReadonlySet<string> = new Set([
  'ACCOUNT_ALREADY_EXISTS',
  'INVITATION_ALREADY_USED',
]);

/**
 * Ma lien ket gom 8 ky tu chu in hoa va so, theo thiet ke man hinh.
 * EDUGRADE_BACKEND_FLOW.md §10 dang ghi token >= 256 bit: BE chot dinh dang nao thi chi sua o day.
 */
export const LINK_CODE_LENGTH = 8;

/** Hien ma thanh cac nhom 4 ky tu (XXXX-XXXX) cho de doc va de doi chieu voi email. */
export const LINK_CODE_GROUP_SIZE = 4;

/** Tieu de email chua ma, giup phu huynh tim trong hop thu. Phai khop mau email cua BE. */
export const INVITATION_EMAIL_SUBJECT = 'EduGrade - Mã kích hoạt tài khoản';
