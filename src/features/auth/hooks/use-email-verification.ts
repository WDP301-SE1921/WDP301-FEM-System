import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';
import { useAuthStore } from '@/store/auth-store';

import { authApi } from '../api/auth-api';
import type { VerifyEmailInput } from '../schemas';

/**
 * Doc lai tai khoan tu BE va ghi vao phien da luu. Phien chi giu ban chup luc dang nhap, nen day la
 * cach app biet email da duoc xac minh, ke ca khi xac minh tu lan mo app truoc.
 */
export function useRefreshedUser() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authApi.me();
      await setUser(user);
      return user;
    },
  });
}

/** Xac minh email bang ma trong email, xong thi doc lai tai khoan de cap nhat phien da luu. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyEmailInput) => authApi.verifyEmail(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

/** Gui lai email chua ma xac minh toi email dang nhap. */
export function useResendVerification(email: string) {
  return useMutation({
    mutationFn: () => authApi.resendVerification(email),
  });
}
