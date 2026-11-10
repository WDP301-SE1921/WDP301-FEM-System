import { useState } from 'react';

import type { AssignmentDetail, AssignmentRef, SubmissionRecord } from '../types';
import {
  canSubmitAssignment,
  findLatestSubmission,
  getAssignmentFiles,
  getMeasuredTargets,
  toAnswerDraft,
  toDraftAttachments,
} from '../utils';

import { AssignmentAnswerForm } from './assignment-answer-form';
import { AssignmentFiles } from './assignment-files';
import { AssignmentLearningTargets } from './assignment-learning-targets';
import { AssignmentReview } from './assignment-review';
import { AssignmentSummaryCard } from './assignment-summary-card';

export type AssignmentWorkspaceProps = AssignmentRef & {
  detail: AssignmentDetail;
  /** Con dang xem, xem `AssignmentDetail.recipients`. */
  recipientId: string;
  /** Ten lop cua bai, lay tu ghi danh cua con. */
  className: string;
  /** Cac lan nop cua moi con thuoc phu huynh cho bai nay. */
  submissions: SubmissionRecord[];
};

/**
 * Noi dung man chi tiet bai tap cua mot con: chua nop va con han thi lam bai; da nop thi xem lai bai,
 * con luot nop thi lam lai tu bai cu.
 */
export function AssignmentWorkspace({
  studentId,
  assignmentId,
  detail,
  recipientId,
  className,
  submissions,
}: AssignmentWorkspaceProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const latest = findLatestSubmission(submissions, recipientId);
  const attemptsUsed = latest?.attemptNo ?? 0;
  const canSubmit = canSubmitAssignment(detail, attemptsUsed);
  const remainingAttempts = canSubmit ? detail.maxAttempts - attemptsUsed : 0;
  // Bai cu khong co bo CLO va khong cau nao gan CLO: khong hien khoi muc tieu
  const measuredTargets = getMeasuredTargets(detail);
  // De bai PDF hoac anh giao vien gui kem (BE PR #12); tep chi giao vien xem BE khong tra
  const files = getAssignmentFiles(detail);
  const stopRetrying = () => setIsRetrying(false);

  return (
    <>
      <AssignmentSummaryCard detail={detail} className={className} latest={latest} />
      {detail.outcomeSetId && measuredTargets.length > 0 ? (
        <AssignmentLearningTargets outcomeSetId={detail.outcomeSetId} targets={measuredTargets} />
      ) : null}
      {files.length > 0 ? <AssignmentFiles files={files} /> : null}
      {canSubmit && (!latest || isRetrying) ? (
        <AssignmentAnswerForm
          studentId={studentId}
          assignmentId={assignmentId}
          recipientId={recipientId}
          questions={detail.questions}
          // Nop lai giu ca anh cua lan truoc; con xoa duoc neu muon gui anh khac
          initialDraft={
            latest
              ? { answers: toAnswerDraft(latest.answers), attachments: toDraftAttachments(latest) }
              : undefined
          }
          remainingAttempts={remainingAttempts}
          onSubmitted={stopRetrying}
          onCancel={latest ? stopRetrying : undefined}
        />
      ) : (
        <AssignmentReview
          questions={detail.questions}
          submission={latest}
          remainingAttempts={remainingAttempts}
          onRetry={() => setIsRetrying(true)}
        />
      )}
    </>
  );
}
