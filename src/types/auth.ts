/** Kieu cua phien dang nhap, dung chung cho store va cac feature. */

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
