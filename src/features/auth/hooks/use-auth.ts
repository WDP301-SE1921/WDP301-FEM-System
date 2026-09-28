import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/auth-store';

import { authApi } from '../api/auth-api';
import type { LoginInput, RegisterInput } from '../schemas';
import type { LoginResponse } from '../types';

/** Doc trang thai dang nhap hien tai. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  return { user, isAuthenticated, isHydrated };
}

/** Luu phien roi vao man hinh chinh. Dung chung cho dang nhap va dang ky. */
function useStartSession() {
  const signIn = useAuthStore((s) => s.signIn);

  return async (session: LoginResponse) => {
    await signIn(session);
    router.replace('/(tabs)');
  };
}

export function useLogin() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: startSession,
  });
}

export function useRegister() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, ...input }: RegisterInput) =>
      authApi.register(input),
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
