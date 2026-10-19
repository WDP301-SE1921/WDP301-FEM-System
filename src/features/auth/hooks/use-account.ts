import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth-store';

import { authApi } from '../api/auth-api';
import type { AccountProfileInput, ChangePasswordInput, ForgotPasswordInput } from '../schemas';

/** Sua ten hien thi va so dien thoai, xong thi ghi tai khoan moi vao phien da luu. */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: ({ phone, ...input }: AccountProfileInput) =>
      authApi.updateProfile(phone ? { ...input, phone } : input),
    onSuccess: (user) => setUser(user),
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
