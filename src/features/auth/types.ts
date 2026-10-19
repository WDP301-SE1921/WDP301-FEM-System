import type { AccountProfileInput, ChangePasswordInput, RegisterInput } from './schemas';

/**
 * Body POST /auth/register (RegisterParentDto). `confirmPassword` chi de validate o client; `phone`
 * khong bat buoc nen bo trong thi khong gui.
 */
export type RegisterPayload = Omit<RegisterInput, 'confirmPassword' | 'phone'> & {
  phone?: string;
};

/** Body POST /auth/change-password (ChangePasswordDto). */
export type ChangePasswordPayload = Omit<ChangePasswordInput, 'confirmPassword'>;

/**
 * Body PATCH /auth/me (UpdateProfileDto). Luon gui `phone` vi form dien san so dang luu: chuoi rong thi
 * BE xoa so dang luu.
 */
export type UpdateProfilePayload = AccountProfileInput;

/**
 * Response POST /auth/resend-verification. `sent: false` khi BE khong gui duoc email (BE chua cau
 * hinh gui email, hoac email khong thuoc tai khoan phu huynh nao); `true` ca khi email da xac minh.
 */
export type ResendVerificationResult = {
  sent: boolean;
};
