import {
  INVALID_CODE_MESSAGE,
  INVITATION_ERROR_MESSAGES,
} from '@/features/link-invitation/constants';
import { claimSignUpSchema, linkCodeSchema } from '@/features/link-invitation/schemas';
import {
  formatLinkCode,
  normalizeLinkCode,
  shouldSuggestSignIn,
  toInvitationError,
} from '@/features/link-invitation/utils';
import { AppError } from '@/types/api';

type ParseResult = { error?: { issues: { path: PropertyKey[]; message: string }[] } };

function firstError(result: ParseResult, field: string) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('features/link-invitation', () => {
  describe('linkCodeSchema', () => {
    it('chap nhan ma du 8 ky tu in hoa va so', () => {
      expect(linkCodeSchema.parse({ code: 'EDUG2026' })).toEqual({ code: 'EDUG2026' });
    });

    it('bao loi khi chua nhap', () => {
      const result = linkCodeSchema.safeParse({ code: '' });
      expect(firstError(result, 'code')).toBe('Vui lòng nhập mã liên kết');
    });

    it('bao loi khi nhap thieu ky tu', () => {
      const result = linkCodeSchema.safeParse({ code: 'EDUG2' });
      expect(firstError(result, 'code')).toBe('Vui lòng nhập đủ 8 ký tự');
    });

    it('bao loi khi co ky tu ngoai chu in hoa va so', () => {
      const result = linkCodeSchema.safeParse({ code: 'edug-202' });
      expect(firstError(result, 'code')).toBe('Mã liên kết chỉ gồm chữ in hoa và số');
    });
  });

  describe('normalizeLinkCode', () => {
    it('viet hoa va bo dau gach, khoang trang khi dan tu email', () => {
      expect(normalizeLinkCode(' edug-2026 ')).toBe('EDUG2026');
    });

    it('cat bot phan thua sau 8 ky tu', () => {
      expect(normalizeLinkCode('EDUG2026XYZ')).toBe('EDUG2026');
    });

    it('bo ky tu co dau tieng Viet', () => {
      expect(normalizeLinkCode('ĐEMO')).toBe('EMO');
    });
  });

  describe('formatLinkCode', () => {
    it('chia ma thanh nhom 4 ky tu', () => {
      expect(formatLinkCode('DEMONEW1')).toBe('DEMO-NEW1');
    });

    it('giu nhom cuoi khi ma khong chia het', () => {
      expect(formatLinkCode('EDUG20')).toBe('EDUG-20');
    });

    it('tra chuoi rong khi khong co ma', () => {
      expect(formatLinkCode('')).toBe('');
    });
  });

  describe('claimSignUpSchema', () => {
    const valid = {
      password: '12345678',
      confirmPassword: '12345678',
      acceptTerms: true,
    };

    it('chap nhan du lieu hop le', () => {
      expect(claimSignUpSchema.safeParse(valid).success).toBe(true);
    });

    it('bao loi khi chua dong y dieu khoan', () => {
      const result = claimSignUpSchema.safeParse({ ...valid, acceptTerms: false });
      expect(firstError(result, 'acceptTerms')).toBe('Vui lòng đồng ý với điều khoản để tiếp tục');
    });

    it('bao loi khi mat khau duoi 8 ky tu (khop BE)', () => {
      const result = claimSignUpSchema.safeParse({
        ...valid,
        password: '1234567',
        confirmPassword: '1234567',
      });
      expect(firstError(result, 'password')).toBe('Mật khẩu tối thiểu 8 ký tự');
    });

    it('bao loi khi mat khau qua 72 ky tu', () => {
      const long = 'a'.repeat(73);
      const result = claimSignUpSchema.safeParse({
        ...valid,
        password: long,
        confirmPassword: long,
      });
      expect(firstError(result, 'password')).toBe('Mật khẩu tối đa 72 ký tự');
    });

    it('bao loi o confirmPassword khi khong khop', () => {
      const result = claimSignUpSchema.safeParse({ ...valid, confirmPassword: '87654321' });
      expect(firstError(result, 'confirmPassword')).toBe('Mật khẩu xác nhận không khớp');
    });
  });

  describe('toInvitationError', () => {
    it('doi 404 chung thanh thong bao ma sai', () => {
      const error = toInvitationError(new AppError('Không tìm thấy', 404, 'RESOURCE_NOT_FOUND'));
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        message: INVALID_CODE_MESSAGE,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });

    it('giu nguyen loi co ma khac', () => {
      const original = new AppError('Mã đã hết hạn', 410, 'INVITATION_EXPIRED');
      expect(toInvitationError(original)).toBe(original);
    });

    it('giu nguyen loi khong phai AppError', () => {
      const original = new TypeError('boom');
      expect(toInvitationError(original)).toBe(original);
    });

    it('noi ro cach xu ly khi ma da dung', () => {
      const error = toInvitationError(new AppError('Đã dùng', 409, 'INVITATION_ALREADY_USED'));
      expect(error).toMatchObject({
        message: INVITATION_ERROR_MESSAGES.SIGN_UP.INVITATION_ALREADY_USED,
        code: 'INVITATION_ALREADY_USED',
      });
    });

    it('phu huynh da dang nhap: khong goi y dang nhap, FORBIDDEN la sai email', () => {
      const used = toInvitationError(
        new AppError('Đã dùng', 409, 'INVITATION_ALREADY_USED'),
        'ADD_CHILD',
      );
      expect(used).toMatchObject({
        message: INVITATION_ERROR_MESSAGES.ADD_CHILD.INVITATION_ALREADY_USED,
      });
      expect(used).not.toMatchObject({ message: expect.stringContaining('đăng nhập;') });

      const forbidden = toInvitationError(new AppError('Cấm', 403, 'FORBIDDEN'), 'ADD_CHILD');
      expect(forbidden).toMatchObject({
        message: INVITATION_ERROR_MESSAGES.ADD_CHILD.FORBIDDEN,
        status: 403,
        code: 'FORBIDDEN',
      });
    });

    it('FORBIDDEN khi chua dang nhap giu thong bao chung', () => {
      const original = new AppError('Không có quyền', 403, 'FORBIDDEN');
      expect(toInvitationError(original)).toBe(original);
    });
  });

  describe('shouldSuggestSignIn', () => {
    it.each(['ACCOUNT_ALREADY_EXISTS', 'INVITATION_ALREADY_USED'])(
      'goi y dang nhap khi BE tra %s',
      (code) => {
        expect(shouldSuggestSignIn(new AppError('x', 409, code))).toBe(true);
      },
    );

    it.each([
      ['ma het han', new AppError('x', 410, 'INVITATION_EXPIRED')],
      ['rate limit', new AppError('x', 429, 'HTTP_ERROR')],
      ['loi mang (khong co code)', new AppError('x')],
      ['loi khong phai AppError', new TypeError('boom')],
      ['khong co loi', null],
    ])('khong goi y dang nhap voi %s', (_label, error) => {
      expect(shouldSuggestSignIn(error)).toBe(false);
    });
  });
});
