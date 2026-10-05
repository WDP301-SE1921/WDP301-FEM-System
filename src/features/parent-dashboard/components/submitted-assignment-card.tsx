import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

import { GRADING_STATUS } from '../constants';
import type { AssignmentSubmission, StudentAssignment } from '../types';
import { formatAssignmentSubmitted, getRemainingAttempts } from '../utils';

import { ActionChip } from './action-chip';
import { AssignmentCardFrame } from './assignment-card-frame';
import { AssignmentCardHeader } from './assignment-card-header';
import { AssignmentInfoRow } from './assignment-info-row';
import { ToneBadge } from './tone-badge';

export type SubmittedAssignmentCardProps = {
  assignment: StudentAssignment;
  submission: AssignmentSubmission;
  /** Ten goi cua con, vd `Minh Anh`. */
  childName: string;
  /** Mo bai con da nop; con luot thi nop lai tu day. */
  onOpen: () => void;
};

/** Bai con da nop, dang cho giao vien cong bo diem: gio nop va so lan con duoc nop lai. */
export function SubmittedAssignmentCard({
  assignment,
  submission,
  childName,
  onOpen,
}: SubmittedAssignmentCardProps) {
  const remainingAttempts = getRemainingAttempts(assignment);

  return (
    <AssignmentCardFrame>
      <AssignmentCardHeader assignment={assignment} trailing={<ToneBadge {...GRADING_STATUS} />} />
      <ThemedText type="default" accessibilityRole="header" style={styles.title}>
        {assignment.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {childName} đã nộp bài. Điểm và nhận xét sẽ có sau khi giáo viên chấm xong.
      </ThemedText>
      <AssignmentInfoRow
        icon="time-outline"
        text={formatAssignmentSubmitted(submission.submittedAt)}
        trailing={remainingAttempts > 0 ? `Còn ${remainingAttempts} lần nộp lại` : undefined}
      />
      <View style={styles.actions}>
        <ActionChip
          label="Xem bài đã nộp"
          variant="soft"
          trailingIcon="arrow-forward"
          accessibilityLabel={`Xem bài đã nộp: ${assignment.title}`}
          onPress={onOpen}
        />
      </View>
    </AssignmentCardFrame>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: 700 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
