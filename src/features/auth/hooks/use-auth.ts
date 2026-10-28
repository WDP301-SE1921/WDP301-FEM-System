import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/auth-store';
import { AppError } from '@/types/api';
import type { AuthSession } from '@/types/auth';

import { authApi } from '../api/auth-api';
import { MOBILE_ACCESS_DENIED_CODE, MOBILE_ACCESS_DENIED_MESSAGE } from '../constants';
import type { LoginInput, RegisterInput } from '../schemas';
import { canUseMobileApp, getPostSignInHref } from '../utils';

/** Doc trang thai dang nhap hien tai. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isSessionExpired = useAuthStore((s) => s.isSessionExpired);
  return { user, isAuthenticated, isHydrated, isSessionExpired };
}

/**
 * Luu phien roi vao man hinh dau tien cua tai khoan: phu huynh chua xac minh email (luon dung voi
 * tai khoan vua dang ky) qua buoc xac minh truoc. Dung chung cho dang nhap va dang ky.
 */
function useStartSession() {
  const signIn = useAuthStore((s) => s.signIn);

  return async (session: AuthSession) => {
    await signIn(session);
    router.replace(getPostSignInHref(session.user));
  };
}

/**
 * Dang nhap bang tai khoan BE. Tai khoan giao vien, nhan su trung tam khong luu phien: thu hoi phien BE
 * vua tao roi bao loi duoi form.
 */
async function signInToMobileApp(input: LoginInput): Promise<AuthSession> {
  const session = await authApi.login(input);
  if (canUseMobileApp(session.user)) return session;

  try {
    await authApi.revokeSession(session.tokens.accessToken);
  } catch (error) {
    // Khong thu hoi duoc thi phien tu het han; van chan dang nhap
    logger.warn('Khong thu hoi duoc phien cua tai khoan khong dung app mobile', error);
  }
  throw new AppError(MOBILE_ACCESS_DENIED_MESSAGE, 403, MOBILE_ACCESS_DENIED_CODE);
}

export function useLogin() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: signInToMobileApp,
    onSuccess: startSession,
  });
}

export function useRegister() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, phone, ...input }: RegisterInput) =>
      authApi.register(phone ? { ...input, phone } : input),
    onSuccess: startSession,
  });
}

export function useLogout() {
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Du API loi van phai xoa phien o client
    onSettled: async (_data, error) => {
      if (error) logger.warn('Logout API loi, van xoa phien local', error);
      await signOut();
      router.replace('/(auth)/login');
    },
  });
}
