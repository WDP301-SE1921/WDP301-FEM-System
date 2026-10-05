import { getPostSignInHref, needsEmailVerification } from '@/features/auth/utils';

const VERIFIED_AT = '2026-10-02T03:00:00.000Z';

describe('features/auth/utils', () => {
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
});
