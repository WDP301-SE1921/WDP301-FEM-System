import type { User } from '@/types/auth';

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

/** Man hinh dau tien sau khi dang nhap hoac dang ky: xac minh email truoc neu con thieu. */
export function getPostSignInHref(
  user: Pick<User, 'role' | 'emailVerifiedAt'>,
): '/verify-email' | '/(tabs)' {
  return needsEmailVerification(user) ? '/verify-email' : '/(tabs)';
}
