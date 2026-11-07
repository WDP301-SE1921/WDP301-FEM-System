import type { User } from '@/types/auth';

/** Ma xac minh dung rieng trong mot cau: 6 chu so khong dinh vao chu so khac (nhom 1). */
const STANDALONE_CODE = /(?:^|\D)(\d{6})(?!\d)/;
const NON_DIGITS = /\D/g;

/**
 * Lay ma 6 so tu chu phu huynh nhap. Email cua BE ghi "Mã xác minh tài khoản EduGrade của bạn là:
 * <mã>", nhan giu de chep thuong lay ca cau, nen uu tien nhom 6 chu so dung rieng. Khong co thi bo
 * moi ky tu khong phai so (vd go "123 456"), de schema bao ma sai do dai.
 */
export function extractVerificationCode(text: string): string {
  return STANDALONE_CODE.exec(text)?.[1] ?? text.replace(NON_DIGITS, '');
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
