import type { RegisterInput } from './schemas';

/**
 * Body POST /auth/register (RegisterParentDto). `confirmPassword` chi de validate o client; `phone`
 * khong bat buoc nen bo trong thi khong gui.
 */
export type RegisterPayload = Omit<RegisterInput, 'confirmPassword' | 'phone'> & {
  phone?: string;
};
