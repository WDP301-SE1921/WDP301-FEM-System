import type { RegisterInput } from './schemas';

/** Body POST /auth/register (RegisterParentDto). `confirmPassword` chi de validate o client. */
export type RegisterPayload = Omit<RegisterInput, 'confirmPassword'>;
