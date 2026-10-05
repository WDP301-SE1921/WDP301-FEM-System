import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { ASSIGNMENT_STATES, TONES } from '../constants';
import type { LessonAssignment } from '../types';
import { formatAssignmentDue, getAssignmentState } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;

export type LessonAssignmentRowProps = {
  assignment: LessonAssignment;
  /** Mo danh sach bai tap cua con. */
  onPress: () => void;
};

/** Bai tap giao kem bai dang hoc: ten, han nop va con da nop hay chua. */
export function LessonAssignmentRow({ assignment, onPress }: LessonAssignmentRowProps) {
  const state = ASSIGNMENT_STATES[getAssignmentState(assignment)];
  const due = formatAssignmentDue(assignment.dueAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assignment.title}, ${due}, ${state.label}`}
      accessibilityHint="Mở danh sách bài tập"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type={TONES[state.tone].soft} style={styles.row}>
        <ToneIcon name="document-text-outline" tone={state.tone} variant="solid" size="sm" />
        <View style={styles.text}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {assignment.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {due}
          </ThemedText>
        </View>
        <ToneBadge label={state.label} tone={state.tone} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  row: {
    minHeight: TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  text: { flex: 1 },
});
