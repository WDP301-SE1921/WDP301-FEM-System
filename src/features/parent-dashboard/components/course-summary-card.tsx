import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { formatCourseSummary, type CourseStatusCounts } from '../utils';

import { ToneIcon } from './tone-icon';

export type CourseSummaryCardProps = {
  totalCourses: number;
  counts: CourseStatusCounts;
};

/** Tong so mon cua con va so mon theo tung trang thai. */
export function CourseSummaryCard({ totalCourses, counts }: CourseSummaryCardProps) {
  return (
    <ThemedView type="primarySoft" style={styles.card}>
      <ToneIcon name="library" tone="primary" variant="solid" />
      <View style={styles.text}>
        <ThemedText type="default" style={styles.total}>
          {totalCourses} môn học
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatCourseSummary(counts)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1 },
  total: { fontWeight: 700 },
});
