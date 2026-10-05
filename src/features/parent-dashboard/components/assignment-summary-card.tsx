import { ThemedText } from '@/components/ui/themed-text';

import type { AssignmentDetail, SubmissionRecord } from '../types';
import {
  countQuestionKinds,
  formatAssignmentDue,
  formatAssignmentSubmitted,
  formatAttempt,
  formatQuestionCount,
  getAssignmentDetailStatus,
} from '../utils';

import { AssignmentCardFrame } from './assignment-card-frame';
import { AssignmentCardHeader } from './assignment-card-header';
import { AssignmentInfoRow } from './assignment-info-row';
import { ToneBadge } from './tone-badge';

export type AssignmentSummaryCardProps = {
  detail: AssignmentDetail;
  /** Ten lop cua bai, lay tu ghi danh cua con. */
  className: string;
  /** Lan nop moi nhat cua con, null khi con chua nop. */
  latest: SubmissionRecord | null;
};

/** Tom tat bai tap o dau man chi tiet: hinh thuc, lop, trang thai, de bai, han nop va lan nop. */
export function AssignmentSummaryCard({ detail, className, latest }: AssignmentSummaryCardProps) {
  const questionCounts = countQuestionKinds(detail.questions);
  const status = getAssignmentDetailStatus(detail, latest);

  return (
    <AssignmentCardFrame>
      <AssignmentCardHeader
        assignment={{ questionCounts, className }}
        trailing={<ToneBadge label={status.label} tone={status.tone} icon={status.icon} />}
      />
      <ThemedText type="heading" accessibilityRole="header">
        {detail.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {detail.instructions}
      </ThemedText>
      <AssignmentInfoRow
        icon="calendar-outline"
        text={formatAssignmentDue(detail.dueAt)}
        trailing={formatQuestionCount(questionCounts)}
      />
      {latest ? (
        <AssignmentInfoRow
          icon="time-outline"
          text={formatAssignmentSubmitted(latest.submittedAt)}
          trailing={formatAttempt(latest.attemptNo, detail.maxAttempts)}
        />
      ) : null}
    </AssignmentCardFrame>
  );
}
