import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

import { ATTENDANCE_BREAKDOWN, TONES, type Tone } from '../constants';
import type { AttendanceCounts } from '../types';
import { getAttendanceLevel, getAttendanceRate, toAttendanceSummary } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

const DOT_SIZE = 8;

export type AttendanceSummaryCardProps = {
  counts: AttendanceCounts;
  /** Gio bat dau cua buoi som nhat trong lich su. */
  since: string;
};

/** Ty le di hoc, muc chuyen can va so buoi theo 4 ket qua diem danh cua con. */
export function AttendanceSummaryCard({ counts, since }: AttendanceSummaryCardProps) {
  const theme = useTheme();
  const rate = getAttendanceRate(toAttendanceSummary(counts));
  // Moi buoi deu chua chot diem danh thi chua xep muc
  const level = rate === null ? null : getAttendanceLevel(rate);

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.rateBlock}>
          <View style={styles.rateRow}>
            <ThemedText type="subtitle">{rate === null ? '--' : `${rate}%`}</ThemedText>
            {level ? <ToneBadge label={level.label} tone={level.tone} /> : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Tỷ lệ đi học từ {formatDate(since)}
          </ThemedText>
        </View>
        <ToneIcon
          name={level?.icon ?? 'shield-checkmark'}
          tone={level?.tone ?? 'neutral'}
          size="lg"
        />
      </View>

      <View style={styles.counters}>
        {ATTENDANCE_BREAKDOWN.map(({ count, counter, tone }) => (
          <AttendanceCounter key={count} label={counter} value={counts[count]} tone={tone} />
        ))}
      </View>
      {/* Giai thich vi sao buoi nghi co phep khong lam giam ty le (SRS muc 5.5) */}
      {counts.excused > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Buổi nghỉ có phép trong thời gian tạm nghỉ không tính vào tỷ lệ đi học.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

type AttendanceCounterProps = {
  label: string;
  value: number;
  /** Mau cham truoc nhan. */
  tone: Tone;
};

function AttendanceCounter({ label, value, tone }: AttendanceCounterProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="background"
      accessible
      accessibilityLabel={`${label}: ${value} buổi`}
      style={styles.counter}
    >
      <View style={styles.counterLabel}>
        <View style={[styles.dot, { backgroundColor: theme[TONES[tone].color] }]} />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="heading">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rateBlock: { flex: 1, gap: Spacing.half },
  rateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  counters: { flexDirection: 'row', gap: Spacing.two },
  counter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.lg,
  },
  counterLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
});
