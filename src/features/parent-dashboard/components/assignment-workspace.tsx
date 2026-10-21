import { useState } from 'react';

import type { AssignmentDetail, AssignmentRef, SubmissionRecord } from '../types';
import { canSubmitAssignment, findLatestSubmission, toAnswerDraft } from '../utils';

import { AssignmentAnswerForm } from './assignment-answer-form';
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
  const stopRetrying = () => setIsRetrying(false);

  return (
    <>
      <AssignmentSummaryCard detail={detail} className={className} latest={latest} />
      {canSubmit && (!latest || isRetrying) ? (
        <AssignmentAnswerForm
          studentId={studentId}
          assignmentId={assignmentId}
          recipientId={recipientId}
          questions={detail.questions}
          initialDraft={latest ? toAnswerDraft(latest.answers) : undefined}
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
