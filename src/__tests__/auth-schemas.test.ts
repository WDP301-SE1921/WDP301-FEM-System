import { loginSchema, registerSchema } from '@/features/auth/schemas';

type ParseResult = { error?: { issues: { path: PropertyKey[]; message: string }[] } };

/** Lay message loi dau tien cua mot field sau khi validate. */
function firstError(result: ParseResult, field: string) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('features/auth/schemas', () => {
  describe('loginSchema', () => {
    it('chap nhan du lieu hop le', () => {
      expect(loginSchema.safeParse({ email: 'a@b.vn', password: '12345678' }).success).toBe(true);
    });

    it('bao loi khi bo trong email', () => {
      const result = loginSchema.safeParse({ email: '', password: '12345678' });
      expect(firstError(result, 'email')).toBe('Vui lòng nhập email');
    });

    it('bao loi khi email sai dinh dang', () => {
      const result = loginSchema.safeParse({ email: 'abc', password: '12345678' });
      expect(firstError(result, 'email')).toBe('Email không hợp lệ');
    });

    it('bao loi khi mat khau ngan hon 8 ky tu nhu LoginDto', () => {
      const result = loginSchema.safeParse({ email: 'a@b.vn', password: '1234567' });
      expect(firstError(result, 'password')).toBe('Mật khẩu tối thiểu 8 ký tự');
    });
  });

  describe('registerSchema', () => {
    const valid = {
      displayName: 'Nguyễn Văn A',
      email: 'a@b.vn',
      password: '12345678',
      confirmPassword: '12345678',
    };

    it('chap nhan du lieu hop le va trim ho ten', () => {
      const result = registerSchema.safeParse({ ...valid, displayName: '  Nguyễn Văn A  ' });
      expect(result.data?.displayName).toBe('Nguyễn Văn A');
    });

    it('bao loi khi ho ten chi co khoang trang', () => {
      const result = registerSchema.safeParse({ ...valid, displayName: '   ' });
      expect(firstError(result, 'displayName')).toBe('Vui lòng nhập họ tên');
    });

    it('bao loi khi mat khau dai hon 72 ky tu', () => {
      const password = 'a'.repeat(73);
      const result = registerSchema.safeParse({ ...valid, password, confirmPassword: password });
      expect(firstError(result, 'password')).toBe('Mật khẩu tối đa 72 ký tự');
    });

    it('bao loi o confirmPassword khi mat khau xac nhan khong khop', () => {
      const result = registerSchema.safeParse({ ...valid, confirmPassword: '87654321' });
      expect(firstError(result, 'confirmPassword')).toBe('Mật khẩu xác nhận không khớp');
    });
  });
});
