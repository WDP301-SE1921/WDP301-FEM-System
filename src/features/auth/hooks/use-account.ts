import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { queryKeys } from '@/api/query-client';
import { useAuthStore } from '@/store/auth-store';

import { authApi } from '../api/auth-api';
import type {
  AccountProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
} from '../schemas';

/**
 * Sua ten hien thi va so dien thoai (de trong thi BE xoa so dang luu), xong thi ghi tai khoan moi vao
 * phien da luu va cache cua GET /auth/me.
 */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountProfileInput) => authApi.updateProfile(input),
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
      await setUser(user);
    },
  });
}

/** Doi mat khau. Phien tren may nay van giu, cac thiet bi khac bi dang xuat. */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, ...payload }: ChangePasswordInput) =>
      authApi.changePassword(payload),
  });
}

/** Gui email dat lai mat khau toi email phu huynh nhap. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }: ForgotPasswordInput) => authApi.forgotPassword(email),
  });
}

/**
 * Xoa tai khoan phu huynh. BE da thu hoi moi phien nen xoa phien tren may ngay, roi ve man chao (man do
 * bao da xoa xong).
 */
export function useDeleteAccount() {
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: ({ password }: DeleteAccountInput) => authApi.deleteAccount(password),
    onSuccess: async () => {
      await signOut('ACCOUNT_DELETED');
      router.replace('/(auth)/welcome');
    },
  });
}
