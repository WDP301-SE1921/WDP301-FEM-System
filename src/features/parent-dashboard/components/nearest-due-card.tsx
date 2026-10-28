import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { StudentAssignment } from '../types';
import { formatNextSession, getAssignmentDeadline } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

const CHEVRON_SIZE = 18;

export type NearestDueCardProps = {
  assignment: Pick<StudentAssignment, 'dueAt' | 'subjectName' | 'title'>;
  /** Ten goi cua con, vd `Minh Anh`. */
  childName: string;
  /** Mo bai de con lam ngay. */
  onPress: () => void;
};

/** Bai chua nop co han gan nhat, de phu huynh nhac con lam bai. Bam de mo bai. */
export function NearestDueCard({ assignment, childName, onPress }: NearestDueCardProps) {
  const { isUrgent } = getAssignmentDeadline(assignment.dueAt);
  const due = formatNextSession(assignment.dueAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hạn nộp gần nhất: ${due}, ${assignment.title}`}
      accessibilityHint="Mở bài để làm"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="accentSoft" style={styles.card}>
        <ToneIcon name="alarm-outline" tone="accent" variant="solid" />
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <ThemedText type="smallBold" style={styles.title}>
              Hạn nộp gần nhất: {due}
            </ThemedText>
            {isUrgent ? <ToneBadge label="Gấp" tone="danger" /> : null}
          </View>
          <ThemedText type="small">{assignment.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Nhắc {childName} hoàn thành bài tập {assignment.subjectName} đúng hạn nhé!
          </ThemedText>
        </View>
        <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="textSecondary" />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1, gap: Spacing.half },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flexShrink: 1 },
});
