import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/api/query-client';
import {
  pickImage,
  type ImageSource,
  type PickedImage,
  type PickImageProblem,
} from '@/lib/image-picker';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types/auth';

import { authApi } from '../api/auth-api';
import { AVATAR_PICK_OPTIONS, AVATAR_URL_STALE_MS } from '../constants';
import type { AvatarAccess } from '../types';

const NO_AVATAR: AvatarAccess = { url: null, expiresIn: null };

/**
 * Link xem anh dai dien cua tai khoan. Phien bao chua co anh (`hasAvatar: false`) thi khong goi BE;
 * phien luu tu truoc khi BE tra `hasAvatar` thi van hoi.
 */
export function useAvatar(user: Pick<User, 'hasAvatar'>) {
  return useQuery({
    queryKey: queryKeys.auth.avatar,
    queryFn: () => authApi.getAvatar(),
    enabled: user.hasAvatar !== false,
    staleTime: AVATAR_URL_STALE_MS,
  });
}

/**
 * Ghi anh dai dien moi vao cache va vao phien da luu: lan mo app sau van biet tai khoan co anh hay
 * chua ma khong phai hoi BE.
 */
function useSaveAvatar() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return async (avatar: AvatarAccess) => {
    const hasAvatar = avatar.url !== null;
    queryClient.setQueryData(queryKeys.auth.avatar, avatar);
    queryClient.setQueryData<User>(queryKeys.auth.me, (me) => (me ? { ...me, hasAvatar } : me));
    if (user) await setUser({ ...user, hasAvatar });
  };
}

/** Chup hoac chon mot anh (cat vuong) roi luu lam anh dai dien. Luu xong thi goi `onSaved`. */
export function useUploadAvatar(onSaved: () => void) {
  const saveAvatar = useSaveAvatar();
  const [problem, setProblem] = useState<PickImageProblem | null>(null);
  const upload = useMutation({
    mutationFn: (image: PickedImage) => authApi.uploadAvatar(image),
    onSuccess: saveAvatar,
  });

  const reset = () => {
    setProblem(null);
    upload.reset();
  };

  const addImage = async (source: ImageSource) => {
    reset();
    const result = await pickImage(source, AVATAR_PICK_OPTIONS);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem(result.status);
      return;
    }
    upload.mutate(result.image, { onSuccess: onSaved });
  };

  return { addImage, reset, isUploading: upload.isPending, error: upload.error, problem };
}

/** Go anh dai dien, quay ve chu cai dau cua ten. Go xong thi goi `onRemoved`. */
export function useRemoveAvatar(onRemoved: () => void) {
  const saveAvatar = useSaveAvatar();

  return useMutation({
    mutationFn: () => authApi.deleteAvatar(),
    onSuccess: async () => {
      await saveAvatar(NO_AVATAR);
      onRemoved();
    },
  });
}
