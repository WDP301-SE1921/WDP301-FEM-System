import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { pickImage, type ImageSource, type PickedImage } from '@/lib/image-picker';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { ImagePickProblem, SubmissionAttachment } from '../types';

/**
 * Chup hoac chon mot anh bai lam roi tai len ngay, de luc nop chi con gui id anh. Tai xong thi bao
 * cho form qua `onUploaded` de luu vao bai lam dang do.
 */
export function useSubmissionImage(onUploaded: (attachment: SubmissionAttachment) => void) {
  const [problem, setProblem] = useState<ImagePickProblem | null>(null);
  const upload = useMutation({
    mutationFn: (image: PickedImage) => parentDashboardApi.uploadSubmissionImage(image),
  });

  const addImage = async (source: ImageSource) => {
    setProblem(null);
    upload.reset();
    const result = await pickImage(source);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem(result.status);
      return;
    }
    const { image } = result;
    upload.mutate(image, {
      onSuccess: (file) => onUploaded({ fileId: file.id, uri: image.uri }),
    });
  };

  return {
    addImage,
    /** Anh dang tai len, de hien o xem truoc kem vong quay. */
    uploadingUri: upload.isPending ? (upload.variables?.uri ?? null) : null,
    uploadError: upload.error,
    problem,
  };
}
