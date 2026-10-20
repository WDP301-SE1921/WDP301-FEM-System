import type { User } from '@/types/auth';

/** Doan ky tu co the la ma xac minh: BE phat 32 byte dang base64url (43 ky tu). */
const VERIFICATION_TOKEN_RUN = /[A-Za-z0-9_-]{32,}/g;

/**
 * Lay ma xac minh tu chu phu huynh dan vao. Email cua BE ghi "Mã xác minh tài khoản EduGrade: <mã>"
 * va nhan giu de chep thuong lay ca cau, nen lay doan dang ma dai nhat. Khong co doan nao du dai thi
 * tra chu da cat khoang trang de schema bao ma chua du.
 */
export function extractVerificationToken(text: string): string {
  const runs = text.match(VERIFICATION_TOKEN_RUN) ?? [];
  const longest = runs.reduce((best, run) => (run.length > best.length ? run : best), '');
  return longest || text.trim();
}

/**
 * App mobile chi danh cho phu huynh va hoc sinh (hoc sinh dung qua tai khoan cua phu huynh). Giao vien
 * va nhan su trung tam dung web: BE van cho moi role dang nhap nen app tu chan.
 */
export function canUseMobileApp({ role }: Pick<User, 'role'>): boolean {
  return role === 'PARENT';
}

/**
 * Phu huynh chua xac minh email thi BE chua cho tao hay sua ho so con (`PARENT_EMAIL_UNVERIFIED`).
 * Tai khoan cua role khac do trung tam tao, khong qua buoc nay.
 */
export function needsEmailVerification({
  role,
  emailVerifiedAt,
}: Pick<User, 'role' | 'emailVerifiedAt'>): boolean {
  return role === 'PARENT' && !emailVerifiedAt;
}

/**
 * Noi dua nguoi chua dang nhap toi. App vua tu dang xuat vi het phien thi vao thang man dang nhap (man
 * do bao ly do), khong thi ve man chao.
 */
export function getSignedOutHref(isSessionExpired: boolean): '/(auth)/login' | '/(auth)/welcome' {
  return isSessionExpired ? '/(auth)/login' : '/(auth)/welcome';
}

/** Man hinh dau tien sau khi dang nhap hoac dang ky: xac minh email truoc neu con thieu. */
export function getPostSignInHref(
  user: Pick<User, 'role' | 'emailVerifiedAt'>,
): '/verify-email' | '/(tabs)' {
  return needsEmailVerification(user) ? '/verify-email' : '/(tabs)';
}
