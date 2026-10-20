import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { AttendanceSummary } from '../types';
import { getAttendanceRate } from '../utils';

import { StatCard } from './stat-card';

const ICON_SIZE = 18;
const PROGRESS_HEIGHT = 6;
const PERCENT_MAX = 100;

export type AttendanceStatCardProps = {
  attendance: AttendanceSummary;
  /** Mo lich su diem danh cua con. */
  onPress: () => void;
};

export function AttendanceStatCard({ attendance, onPress }: AttendanceStatCardProps) {
  const theme = useTheme();
  const rate = getAttendanceRate(attendance);
  const progress = rate ?? 0;

  return (
    <StatCard
      label="Tỷ lệ đi học"
      trailing={<Icon name="shield-checkmark-outline" size={ICON_SIZE} themeColor="primary" />}
      onPress={onPress}
      accessibilityLabel={
        rate === null ? 'Tỷ lệ đi học: chưa có buổi học' : `Tỷ lệ đi học ${rate}%`
      }
      accessibilityHint="Xem lịch sử điểm danh"
    >
      <ThemedText type="subtitle">{rate === null ? '--' : `${rate}%`}</ThemedText>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: PERCENT_MAX, now: progress }}
        style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
      >
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {rate === null
          ? 'Chưa có buổi học nào'
          : `Đã học ${attendance.attendedSessions}/${attendance.totalSessions} buổi`}
      </ThemedText>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  track: { height: PROGRESS_HEIGHT, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
