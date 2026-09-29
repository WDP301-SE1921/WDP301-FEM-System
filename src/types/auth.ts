/** Kieu cua phien dang nhap, dung chung cho store va cac feature. Khop SafeUserDto cua BE. */

export type UserRole = 'MANAGER' | 'TEACHER' | 'PARENT';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Phien BE tra ve sau khi xac thuc (AuthResponseDto): login, register, refresh
 * va claim-and-sign-up deu dung chung hop dong nay.
 */
export type AuthSession = {
  user: User;
  tokens: AuthTokens & {
    tokenType: 'Bearer';
    /** Thoi han access token, tinh bang giay. */
    expiresIn: number;
  };
};
