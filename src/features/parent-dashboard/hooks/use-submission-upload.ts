import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { pickPdf } from '@/lib/document-picker';
import { pickImage, type ImageSource } from '@/lib/image-picker';
import type { UploadableFile } from '@/lib/upload-file';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { AttachmentPickProblem, SubmissionAttachment, SubmissionFileKind } from '../types';

/** Tep dang gui len: anh co `file.uri` de xem truoc, PDF hien ten tep. */
export type PendingUpload = {
  kind: SubmissionFileKind;
  file: UploadableFile;
};

/**
 * Chup, chon anh hoac chon tep PDF bai lam roi tai len ngay, de luc nop chi con gui id tep. Tai xong
 * thi bao cho form qua `onUploaded` de luu vao bai lam dang do; tep moi dung cho ca bai cho toi khi
 * phu huynh gan voi cau.
 */
export function useSubmissionUpload(onUploaded: (attachment: SubmissionAttachment) => void) {
  const [problem, setProblem] = useState<AttachmentPickProblem | null>(null);
  const upload = useMutation({
    mutationFn: ({ file }: PendingUpload) => parentDashboardApi.uploadSubmissionFile(file),
  });

  const send = (pending: PendingUpload) =>
    upload.mutate(pending, {
      onSuccess: (uploaded) =>
        onUploaded({
          fileId: uploaded.id,
          uri: pending.kind === 'IMAGE' ? pending.file.uri : null,
          kind: pending.kind,
          name: uploaded.name,
          size: uploaded.size,
          questionIds: [],
        }),
    });

  const reset = () => {
    setProblem(null);
    upload.reset();
  };

  const addImage = async (source: ImageSource) => {
    reset();
    const result = await pickImage(source);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ kind: 'IMAGE', reason: result.status });
      return;
    }
    send({ kind: 'IMAGE', file: result.image });
  };

  const addPdf = async () => {
    reset();
    const result = await pickPdf();
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ kind: 'PDF', reason: result.status });
      return;
    }
    send({ kind: 'PDF', file: result.file });
  };

  return {
    addImage,
    addPdf,
    /** Tep dang tai len, de hien kem vong quay; null khi khong co. */
    pending: upload.isPending ? (upload.variables ?? null) : null,
    uploadError: upload.error,
    problem,
  };
}
