import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { pickPdf } from '@/lib/document-picker';
import {
  MAX_IMAGE_BYTES,
  pickImage,
  type ImageSource,
  type UploadableFile,
} from '@/lib/image-picker';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { AttachmentKind, AttachmentPickProblem, SubmissionAttachment } from '../types';

/** Mot lan tai tep len cho mot cau tu luan. */
type UploadRequest = {
  questionId: string;
  kind: AttachmentKind;
  file: UploadableFile;
};

/** Tep dang tai len, de hien o xem truoc kem vong quay dung cau. */
export type UploadingAttachment = {
  questionId: string;
  kind: AttachmentKind;
  uri: string;
  name: string;
};

/**
 * Chup/chon anh hoac chon file PDF bai lam cho tung cau tu luan roi tai len ngay, de luc nop chi con
 * gui id tep kem dung cau. Tai xong thi bao cho form qua `onUploaded` de luu vao bai lam dang do.
 * Moi luc chi tai mot tep; loi chon tep va loi tai len chi hien o cau vua thao tac.
 */
export function useSubmissionUpload(onUploaded: (attachment: SubmissionAttachment) => void) {
  const [problem, setProblem] = useState<({ questionId: string } & AttachmentPickProblem) | null>(
    null,
  );
  const upload = useMutation({
    mutationFn: ({ file }: UploadRequest) => parentDashboardApi.uploadSubmissionImage(file),
  });

  const start = (request: UploadRequest) =>
    upload.mutate(request, {
      onSuccess: (uploaded) =>
        onUploaded({
          fileId: uploaded.id,
          uri: request.kind === 'IMAGE' ? request.file.uri : null,
          questionId: request.questionId,
          kind: request.kind,
          ...(request.kind === 'PDF' ? { name: request.file.name } : {}),
        }),
    });

  const reset = () => {
    setProblem(null);
    upload.reset();
  };

  const addImage = async (questionId: string, source: ImageSource) => {
    reset();
    const result = await pickImage(source);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ questionId, kind: 'IMAGE', problem: result.status });
      return;
    }
    start({ questionId, kind: 'IMAGE', file: result.image });
  };

  const addPdf = async (questionId: string) => {
    reset();
    const result = await pickPdf(MAX_IMAGE_BYTES);
    if (result.status === 'CANCELED') return;
    if (result.status !== 'PICKED') {
      setProblem({ questionId, kind: 'PDF', problem: result.status });
      return;
    }
    start({ questionId, kind: 'PDF', file: result.file });
  };

  const request = upload.variables;
  const uploading: UploadingAttachment | null =
    upload.isPending && request
      ? {
          questionId: request.questionId,
          kind: request.kind,
          uri: request.file.uri,
          name: request.file.name,
        }
      : null;

  return {
    addImage,
    addPdf,
    uploading,
    /** Loi tai len kem cau vua thao tac. */
    uploadError:
      upload.isError && request ? { questionId: request.questionId, error: upload.error } : null,
    problem,
  };
}
