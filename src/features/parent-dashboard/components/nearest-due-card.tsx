import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { StudentAssignment } from '../types';
import { formatNextSession, getAssignmentDeadline } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

export type NearestDueCardProps = {
  assignment: Pick<StudentAssignment, 'dueAt' | 'subjectName'>;
  /** Ten goi cua con, vd `Minh Anh`. */
  childName: string;
};

/** Bai chua nop co han gan nhat, de phu huynh nhac con lam bai. */
export function NearestDueCard({ assignment, childName }: NearestDueCardProps) {
  const { isUrgent } = getAssignmentDeadline(assignment.dueAt);

  return (
    <ThemedView type="accentSoft" style={styles.card}>
      <ToneIcon name="alarm-outline" tone="accent" variant="solid" />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" style={styles.title}>
            Hạn nộp gần nhất: {formatNextSession(assignment.dueAt)}
          </ThemedText>
          {isUrgent ? <ToneBadge label="Gấp" tone="danger" /> : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Nhắc {childName} hoàn thành bài tập {assignment.subjectName} đúng hạn nhé!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1, gap: Spacing.half },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flexShrink: 1 },
});
