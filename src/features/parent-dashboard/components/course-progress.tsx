import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TONES, type Tone } from '../constants';

const BAR_HEIGHT = 8;

export type CourseProgressProps = {
  label: string;
  completedSessions: number;
  totalSessions: number;
  /** Phan tram da hoc, 0-100. */
  percent: number;
  tone: Tone;
};

/** So buoi da hoc tren tong so buoi cua khoa, kem thanh tien do. */
export function CourseProgress({
  label,
  completedSessions,
  totalSessions,
  percent,
  tone,
}: CourseProgressProps) {
  const theme = useTheme();
  const { color, text } = TONES[tone];
  const summary = `${completedSessions}/${totalSessions} buổi (${percent}%)`;

  return (
    <ThemedView accessible accessibilityLabel={`${label}: ${summary}`} style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
        <ThemedText type="smallBold" themeColor={text}>
          {summary}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme[color] }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.control },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: { flexShrink: 1 },
  track: { height: BAR_HEIGHT, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
