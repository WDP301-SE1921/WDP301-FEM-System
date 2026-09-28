import type { AuthTokens, User } from '@/types/auth';

export type LoginResponse = AuthTokens & {
  user: User;
};
