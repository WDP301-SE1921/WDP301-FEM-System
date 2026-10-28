import {
  canUseMobileApp,
  extractVerificationToken,
  getPostSignInHref,
  getSignedOutHref,
  needsEmailVerification,
} from '@/features/auth/utils';
import type { UserRole } from '@/types/auth';

const VERIFIED_AT = '2026-10-02T03:00:00.000Z';

describe('features/auth/utils', () => {
  it('chi tai khoan phu huynh dung duoc app mobile', () => {
    expect(canUseMobileApp({ role: 'PARENT' })).toBe(true);
    const staffRoles: UserRole[] = ['TEACHER', 'STAFF', 'MANAGER', 'CURRICULUM_DESIGNER'];
    for (const role of staffRoles) expect(canUseMobileApp({ role })).toBe(false);
  });

  it('chi phu huynh chua xac minh email moi can buoc xac minh', () => {
    expect(needsEmailVerification({ role: 'PARENT', emailVerifiedAt: null })).toBe(true);
    expect(needsEmailVerification({ role: 'PARENT', emailVerifiedAt: VERIFIED_AT })).toBe(false);
    // Tai khoan nhan su do trung tam tao, khong qua buoc xac minh
    expect(needsEmailVerification({ role: 'TEACHER', emailVerifiedAt: null })).toBe(false);
    expect(needsEmailVerification({ role: 'STAFF', emailVerifiedAt: null })).toBe(false);
  });

  it('sau khi dang nhap: chua xac minh thi toi man hinh xac minh, con lai vao man hinh chinh', () => {
    expect(getPostSignInHref({ role: 'PARENT', emailVerifiedAt: null })).toBe('/verify-email');
    expect(getPostSignInHref({ role: 'PARENT', emailVerifiedAt: VERIFIED_AT })).toBe('/(tabs)');
    expect(getPostSignInHref({ role: 'MANAGER', emailVerifiedAt: null })).toBe('/(tabs)');
  });

  it('het phien thi dua thang toi man dang nhap, tu dang xuat thi ve man chao', () => {
    expect(getSignedOutHref(true)).toBe('/(auth)/login');
    expect(getSignedOutHref(false)).toBe('/(auth)/welcome');
  });

  describe('extractVerificationToken', () => {
    const token = 'k3J9xQ2mVb7Lw0Zt5Yh8Nf1Rc4Ud6Sa-_pEgIoTqWzA';

    it('lay ma trong cau email cua BE hoac khi dan kem dau cach, xuong dong', () => {
      expect(extractVerificationToken(`Mã xác minh tài khoản EduGrade: ${token}`)).toBe(token);
      expect(extractVerificationToken(`  ${token}  `)).toBe(token);
      expect(extractVerificationToken(`${token}\n`)).toBe(token);
    });

    it('khong co doan nao du dai thi tra chu da cat khoang trang', () => {
      expect(extractVerificationToken('  abc  ')).toBe('abc');
      expect(extractVerificationToken('')).toBe('');
    });
  });
});
