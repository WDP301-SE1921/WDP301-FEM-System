import type { RegisterInput } from './schemas';

/**
 * Body POST /auth/register (RegisterParentDto). `confirmPassword` chi de validate o client; `phone`
 * khong bat buoc nen bo trong thi khong gui.
 */
export type RegisterPayload = Omit<RegisterInput, 'confirmPassword' | 'phone'> & {
  phone?: string;
};

/**
 * Response POST /auth/resend-verification. `sent: false` khi BE khong gui duoc email (BE chua cau
 * hinh gui email, hoac email khong thuoc tai khoan phu huynh nao); `true` ca khi email da xac minh.
 */
export type ResendVerificationResult = {
  sent: boolean;
};
