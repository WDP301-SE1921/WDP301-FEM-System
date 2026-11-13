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
  /** Cau ma tep gan vao ngay khi tai xong. Rong: tep dung cho ca bai. */
  questionIds: string[];
};

/** Loi chon tep, kem cac cau dang chon tep de chi hien loi o dung cho. */
export type UploadPickProblem = AttachmentPickProblem & { questionIds: string[] };

/**
 * Chup, chon anh hoac chon tep PDF bai lam roi tai len ngay, de luc nop chi con gui id tep. Tai xong
 * thi bao cho form qua `onUploaded` de luu vao bai lam dang do, gan san voi `questionIds` (khu tep
 * rieng cua mot cau tu luan) hoac dung cho ca bai (khu tep chung, phu huynh gan cau sau).
 */
export function useSubmissionUpload(onUploaded: (attachment: SubmissionAttachment) => void) {
  const [problem, setProblem] = useState<UploadPickProblem | null>(null);
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
          questionIds: pending.questionIds,
        }),
    });

  const reset = () => {
    setProblem(null);
    upload.reset();
  };

  const addImage = async (source: ImageSource, questionIds: string[] = []) => {
    reset();
    const result = await pickImage(source);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ kind: 'IMAGE', reason: result.status, questionIds });
      return;
    }
    send({ kind: 'IMAGE', file: result.image, questionIds });
  };

  const addPdf = async (questionIds: string[] = []) => {
    reset();
    const result = await pickPdf();
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ kind: 'PDF', reason: result.status, questionIds });
      return;
    }
    send({ kind: 'PDF', file: result.file, questionIds });
  };

  return {
    addImage,
    addPdf,
    /** Tep dang tai len, de hien kem vong quay; null khi khong co. */
    pending: upload.isPending ? (upload.variables ?? null) : null,
    uploadError: upload.error,
    /** Cac cau cua lan tai gan nhat, de chi hien `uploadError` o dung khu tep. */
    uploadScope: upload.variables?.questionIds ?? null,
    problem,
  };
}
