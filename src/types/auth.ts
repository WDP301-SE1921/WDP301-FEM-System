/** Kieu cua phien dang nhap, dung chung cho store va cac feature. Khop SafeUserDto cua BE. */

/** `UserRole` cua BE. App mobile chi co man hinh cho `PARENT`, role khac van dang nhap duoc. */
export type UserRole = 'STAFF' | 'MANAGER' | 'TEACHER' | 'CURRICULUM_DESIGNER' | 'PARENT';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  /** null khi chua xac minh email: BE chua cho phu huynh tao hay sua ho so con. */
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Phien BE tra ve sau khi xac thuc (AuthResponseDto): login, register va refresh deu dung chung
 * hop dong nay.
 */
export type AuthSession = {
  user: User;
  tokens: AuthTokens & {
    tokenType: 'Bearer';
    /** Thoi han access token, tinh bang giay. */
    expiresIn: number;
  };
};
