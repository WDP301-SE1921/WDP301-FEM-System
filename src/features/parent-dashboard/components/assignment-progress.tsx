import { StepList } from '@/components/common/step-list';
import { ThemedText } from '@/components/ui/themed-text';

import type { AssignmentDetail, SubmissionRecord } from '../types';
import { getAssignmentProgress, type AssignmentProgressKey } from '../utils';

import { AssignmentCardFrame } from './assignment-card-frame';

const TITLES: Record<AssignmentProgressKey, string> = {
  RECEIVE: 'Nhận bài',
  WORK: 'Làm bài',
  SUBMIT: 'Nộp bài',
  RESULT: 'Có điểm',
};

export type AssignmentProgressProps = {
  detail: Pick<AssignmentDetail, 'status' | 'dueAt' | 'maxAttempts'>;
  /** Lan nop moi nhat cua con, null khi con chua nop. */
  latest: SubmissionRecord | null;
};

/** Hang bon buoc o dau man chi tiet bai (Luong 4): con dang o buoc nao va lam gi tiep. */
export function AssignmentProgress({ detail, latest }: AssignmentProgressProps) {
  const { steps, caption } = getAssignmentProgress(detail, latest);
  return (
    <AssignmentCardFrame>
      <StepList
        layout="horizontal"
        steps={steps.map(({ key, state }) => ({ key, title: TITLES[key], state }))}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </AssignmentCardFrame>
  );
}
