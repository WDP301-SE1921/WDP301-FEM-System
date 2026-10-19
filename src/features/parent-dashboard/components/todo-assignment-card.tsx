import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

import type { StudentAssignment } from '../types';
import { formatAssignmentDue, formatQuestionCount, getAssignmentDeadline } from '../utils';

import { ActionChip } from './action-chip';
import { AssignmentCardFrame } from './assignment-card-frame';
import { AssignmentCardHeader } from './assignment-card-header';
import { AssignmentInfoRow } from './assignment-info-row';
import { ToneBadge } from './tone-badge';

export type TodoAssignmentCardProps = {
  assignment: StudentAssignment;
  /** Mo de bai de con lam va nop. */
  onOpen: () => void;
};

/**
 * Bai con chua nop: con bao nhieu ngay, ten bai, han nop va so cau. De bai chi co o man chi tiet (danh
 * sach bai tap cua BE khong tra de bai). Bai sap het han duoc lam noi.
 */
export function TodoAssignmentCard({ assignment, onOpen }: TodoAssignmentCardProps) {
  const deadline = getAssignmentDeadline(assignment.dueAt);

  return (
    <AssignmentCardFrame highlightTone={deadline.isUrgent ? 'accent' : undefined}>
      <AssignmentCardHeader
        assignment={assignment}
        trailing={<ToneBadge label={deadline.label} tone={deadline.tone} icon={deadline.icon} />}
      />
      <ThemedText type="default" accessibilityRole="header" style={styles.title}>
        {assignment.title}
      </ThemedText>
      <AssignmentInfoRow
        icon="calendar-outline"
        text={formatAssignmentDue(assignment.dueAt)}
        trailing={formatQuestionCount(assignment.questionCounts)}
      />
      <View style={styles.actions}>
        <ActionChip
          label="Làm bài"
          trailingIcon="arrow-forward"
          accessibilityLabel={`Làm bài: ${assignment.title}`}
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
