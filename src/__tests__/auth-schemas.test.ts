import {
  accountProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from '@/features/auth/schemas';

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
      phone: '',
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

    it('so dien thoai khong bat buoc; co nhap thi phai la so, cho phep + va khoang trang', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true);
      expect(registerSchema.safeParse({ ...valid, phone: ' 0901 234 567 ' }).data?.phone).toBe(
        '0901 234 567',
      );
      expect(registerSchema.safeParse({ ...valid, phone: '+84901234567' }).success).toBe(true);

      const tooShort = registerSchema.safeParse({ ...valid, phone: '12345' });
      expect(firstError(tooShort, 'phone')).toBe('Số điện thoại không hợp lệ');
      const letters = registerSchema.safeParse({ ...valid, phone: 'so cua toi' });
      expect(firstError(letters, 'phone')).toBe('Số điện thoại không hợp lệ');
    });

    it('bao loi o confirmPassword khi mat khau xac nhan khong khop', () => {
      const result = registerSchema.safeParse({ ...valid, confirmPassword: '87654321' });
      expect(firstError(result, 'confirmPassword')).toBe('Mật khẩu xác nhận không khớp');
    });
  });

  describe('verifyEmailSchema', () => {
    /** BE phat ma 43 ky tu (32 byte dang base64url). */
    const token = 'k3J9xQ2mVb7Lw0Zt5Yh8Nf1Rc4Ud6Sa-_pEgIoTqWzA';

    it('chap nhan ma BE gui va cat khoang trang khi dan tu email', () => {
      expect(verifyEmailSchema.safeParse({ token: ` ${token}\n` }).data).toEqual({ token });
    });

    it('bo trong thi nhac dan ma', () => {
      const result = verifyEmailSchema.safeParse({ token: '   ' });
      expect(firstError(result, 'token')).toBe('Vui lòng dán mã xác minh');
    });

    it('ma ngan hon 32 ky tu nhu VerifyEmailDto thi bao dan thieu', () => {
      const result = verifyEmailSchema.safeParse({ token: token.slice(0, 31) });
      expect(firstError(result, 'token')).toBe(
        'Mã xác minh chưa đủ, hãy dán toàn bộ mã trong email',
      );
    });
  });

  describe('forgotPasswordSchema', () => {
    it('chi can email hop le', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'a@b.vn' }).success).toBe(true);
      expect(firstError(forgotPasswordSchema.safeParse({ email: '' }), 'email')).toBe(
        'Vui lòng nhập email',
      );
    });
  });

  describe('changePasswordSchema', () => {
    const valid = {
      currentPassword: 'MatKhauCu1',
      newPassword: 'MatKhauMoi1',
      confirmPassword: 'MatKhauMoi1',
    };

    it('chap nhan du lieu hop le', () => {
      expect(changePasswordSchema.safeParse(valid).success).toBe(true);
    });

    it('mat khau moi theo gioi han cua ChangePasswordDto (8-72 ky tu)', () => {
      const short = changePasswordSchema.safeParse({
        ...valid,
        newPassword: '1234567',
        confirmPassword: '1234567',
      });
      const long = 'a'.repeat(73);
      const tooLong = changePasswordSchema.safeParse({
        ...valid,
        newPassword: long,
        confirmPassword: long,
      });

      expect(firstError(short, 'newPassword')).toBe('Mật khẩu tối thiểu 8 ký tự');
      expect(firstError(tooLong, 'newPassword')).toBe('Mật khẩu tối đa 72 ký tự');
    });

    it('bao loi khi nhap lai khong khop hoac mat khau moi trung mat khau cu', () => {
      const mismatch = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'KhacNhau1' });
      const unchanged = changePasswordSchema.safeParse({
        ...valid,
        newPassword: valid.currentPassword,
        confirmPassword: valid.currentPassword,
      });

      expect(firstError(mismatch, 'confirmPassword')).toBe('Mật khẩu xác nhận không khớp');
      expect(firstError(unchanged, 'newPassword')).toBe('Mật khẩu mới phải khác mật khẩu hiện tại');
    });
  });

  describe('accountProfileSchema', () => {
    it('so dien thoai bo trong duoc, nhap thi phai hop le', () => {
      expect(
        accountProfileSchema.safeParse({ displayName: 'Phạm Thu Hà', phone: '' }).success,
      ).toBe(true);
      expect(
        firstError(accountProfileSchema.safeParse({ displayName: 'Hà', phone: 'abc' }), 'phone'),
      ).toBe('Số điện thoại không hợp lệ');
      expect(
        firstError(accountProfileSchema.safeParse({ displayName: ' ', phone: '' }), 'displayName'),
      ).toBe('Vui lòng nhập họ tên');
    });
  });
});
