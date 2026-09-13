export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthTokens & {
  user: User;
};
