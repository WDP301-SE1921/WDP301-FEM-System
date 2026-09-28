import { loginSchema, registerSchema } from '@/features/auth/schemas';

type ParseResult = { error?: { issues: { path: PropertyKey[]; message: string }[] } };

/** Lay message loi dau tien cua mot field sau khi validate. */
function firstError(result: ParseResult, field: string) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('features/auth/schemas', () => {
  describe('loginSchema', () => {
    it('chap nhan du lieu hop le', () => {
      expect(loginSchema.safeParse({ email: 'a@b.vn', password: '123456' }).success).toBe(true);
    });

    it('bao loi khi bo trong email', () => {
      const result = loginSchema.safeParse({ email: '', password: '123456' });
      expect(firstError(result, 'email')).toBe('Vui lòng nhập email');
    });

    it('bao loi khi email sai dinh dang', () => {
      const result = loginSchema.safeParse({ email: 'abc', password: '123456' });
      expect(firstError(result, 'email')).toBe('Email không hợp lệ');
    });

    it('bao loi khi mat khau qua ngan', () => {
      const result = loginSchema.safeParse({ email: 'a@b.vn', password: '123' });
      expect(firstError(result, 'password')).toBe('Mật khẩu tối thiểu 6 ký tự');
    });
  });

  describe('registerSchema', () => {
    const valid = {
      fullName: 'Nguyễn Văn A',
      email: 'a@b.vn',
      password: '123456',
      confirmPassword: '123456',
    };

    it('chap nhan du lieu hop le', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true);
    });

    it('bao loi o confirmPassword khi mat khau xac nhan khong khop', () => {
      const result = registerSchema.safeParse({ ...valid, confirmPassword: '654321' });
      expect(firstError(result, 'confirmPassword')).toBe('Mật khẩu xác nhận không khớp');
    });
  });
});
