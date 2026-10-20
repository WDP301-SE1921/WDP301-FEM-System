import { useEffect, useState } from 'react';

import { StorageKeyFactory } from '@/constants/storage-keys';
import { storage } from '@/lib/storage';

import type { AssignmentDraft, AssignmentRef, SubmissionAttachment } from '../types';
import { toAssignmentDraft } from '../utils';

/** `PENDING`: dang doc bo nho may. `RESTORED`: da lay lai bai lam dang do tu lan truoc. */
export type DraftRestoreStatus = 'PENDING' | 'RESTORED' | 'NONE';

/**
 * Bai lam dang do cua con (cau tra loi va anh bai lam da tai len), luu tren may sau moi lan sua. Roi
 * man hinh, bam nham nut quay lai, het phien dang nhap hay app bi tat thi lan sau mo bai van con.
 */
export function useAssignmentDraft(
  { studentId, assignmentId }: AssignmentRef,
  initialDraft: AssignmentDraft,
) {
  const key = StorageKeyFactory.assignmentDraft(studentId, assignmentId);
  const [draft, setDraft] = useState<AssignmentDraft>(initialDraft);
  const [restoreStatus, setRestoreStatus] = useState<DraftRestoreStatus>('PENDING');
  const [hasChanges, setHasChanges] = useState(false);

  // Bo nho may la he thong ben ngoai: doc mot lan khi mo bai
  useEffect(() => {
    let isActive = true;
    void storage.getJson<unknown>(key).then((saved) => {
      if (!isActive) return;
      const restored = toAssignmentDraft(saved);
      if (restored) setDraft(restored);
      setRestoreStatus(restored ? 'RESTORED' : 'NONE');
    });
    return () => {
      isActive = false;
    };
  }, [key]);

  // Ghi lai moi khi con sua. Sua bang ham cap nhat (khong doc `draft` cu) vi anh tai xong sau vai
  // giay, trong luc do con van go chu: ghi bang ban cu se mat chu vua go
  useEffect(() => {
    if (hasChanges) void storage.setJson(key, draft);
  }, [key, draft, hasChanges]);

  const change = (update: (current: AssignmentDraft) => AssignmentDraft) => {
    setDraft(update);
    setHasChanges(true);
  };

  const updateAnswer = (questionId: string, answer: string) =>
    change((current) => ({ ...current, answers: { ...current.answers, [questionId]: answer } }));

  const addAttachment = (attachment: SubmissionAttachment) =>
    change((current) => ({ ...current, attachments: [...current.attachments, attachment] }));

  const removeAttachment = (fileId: string) =>
    change((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.fileId !== fileId),
    }));

  /** Xoa ban nhap khi da nop xong hoac phu huynh bo lan nop lai. */
  const discard = () => storage.remove(key);

  return { draft, restoreStatus, updateAnswer, addAttachment, removeAttachment, discard };
}
