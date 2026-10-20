import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatDayMonth } from '@/utils/format';

import { TONES } from '../constants';
import type { AssignmentGrade, StudentAssignment } from '../types';
import { getGradeLevel } from '../utils';

import { ActionChip } from './action-chip';
import { AssignmentCardFrame } from './assignment-card-frame';
import { AssignmentCardHeader } from './assignment-card-header';
import { ScoreBox } from './score-box';
import { ToneBadge } from './tone-badge';

const ICON_SIZE = 16;

export type GradedAssignmentCardProps = {
  assignment: StudentAssignment;
  grade: AssignmentGrade;
  /** Mo bai lam cua con kem diem tung cau va dap an. */
  onOpen: () => void;
};

/** Bai da co diem: diem lon de doc nhanh, xep loai, ngay cham, nhan xet va giao vien cham. */
export function GradedAssignmentCard({ assignment, grade, onOpen }: GradedAssignmentCardProps) {
  const level = getGradeLevel(grade);

  return (
    <AssignmentCardFrame
      onPress={onOpen}
      accessibilityLabel={`Xem bài làm và đáp án: ${assignment.title}`}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AssignmentCardHeader assignment={assignment} />
          <ThemedText type="default" accessibilityRole="header" style={styles.title}>
            {assignment.title}
          </ThemedText>
        </View>
        <ScoreBox totalScore={grade.totalScore} maxScore={grade.maxScore} tone={level.tone} />
      </View>

      <ThemedView type="background" style={styles.review}>
        <View style={styles.reviewHeader}>
          <View style={styles.gradedAt}>
            <Icon name="checkmark-circle" size={ICON_SIZE} themeColor={TONES[level.tone].color} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.gradedAtText}>
              Đã chấm ngày {formatDayMonth(grade.publishedAt)}
            </ThemedText>
          </View>
          <ToneBadge label={level.label} tone={level.tone} />
        </View>
        {grade.feedback ? (
          <ThemedText type="small" style={styles.feedback}>
            “{grade.feedback}”
          </ThemedText>
        ) : null}
      </ThemedView>

      {assignment.teacherName ? (
        <ThemedText type="small" themeColor="textSecondary">
          Giáo viên: {assignment.teacherName}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <ActionChip label="Xem bài làm và đáp án" variant="soft" trailingIcon="arrow-forward" />
      </View>
    </AssignmentCardFrame>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  titleBlock: { flex: 1, gap: Spacing.two },
  title: { fontWeight: 700 },
  review: { gap: Spacing.one, padding: Spacing.two, borderRadius: Radius.control },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  gradedAt: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  gradedAtText: { flexShrink: 1 },
  feedback: { fontStyle: 'italic' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
