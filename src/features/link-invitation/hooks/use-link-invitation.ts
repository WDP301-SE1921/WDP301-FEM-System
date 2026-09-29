import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { queryKeys } from '@/api/query-client';
import { useAuthStore } from '@/store/auth-store';

import { linkInvitationApi } from '../api/link-invitation-api';
import type { ClaimAndSignUpPayload, InvitationContext } from '../types';

/**
 * Kiem tra ma lien ket. Dung mutation thay vi query: BE dung POST, thao tac do nguoi dung bam,
 * va ket qua cua ma dung mot lan khong nen nam trong cache.
 */
export function useInspectInvitation(context: InvitationContext = 'SIGN_UP') {
  return useMutation({
    mutationFn: (token: string) => linkInvitationApi.inspect(token, context),
  });
}

/** Tao tai khoan va lien ket con, luu phien roi vao man hinh chinh. */
export function useClaimAndSignUp() {
  const signIn = useAuthStore((s) => s.signIn);

  return useMutation({
    mutationFn: (payload: ClaimAndSignUpPayload) => linkInvitationApi.claimAndSignUp(payload),
    onSuccess: async (session) => {
      await signIn(session);
      router.replace('/(tabs)');
    },
  });
}

/** Phu huynh da dang nhap lien ket them con, roi tai lai danh sach con o trang chu. */
export function useClaimInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => linkInvitationApi.claim(token),
    // Key cua danh sach con la tien to cua key tong quan tung con: ma co the them mon cho con cu.
    // Cho tai lai xong moi bao thanh cong de ve trang chu la thay con moi ngay.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.parent.students }),
  });
}
