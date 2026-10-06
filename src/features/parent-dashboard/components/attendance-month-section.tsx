import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import type { AttendanceMonth, SessionLink } from '../types';
import { countAttendance, formatAttendanceBreakdown } from '../utils';

import { AttendanceRecordCard } from './attendance-record-card';

const ICON_SIZE = 20;

export type AttendanceMonthSectionProps = {
  month: AttendanceMonth;
  onOpenSession: (session: SessionLink) => void;
};

/** Cac buoi trong mot thang, tieu de kem so buoi theo ket qua diem danh. */
export function AttendanceMonthSection({ month, onOpenSession }: AttendanceMonthSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="calendar-outline" size={ICON_SIZE} themeColor="primary" />
          <ThemedText type="default" accessibilityRole="header" style={styles.title}>
            {month.label}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatAttendanceBreakdown(countAttendance(month.records))}
        </ThemedText>
      </View>

      {month.records.map((record) => (
        <AttendanceRecordCard
          key={record.sessionId}
          record={record}
          onPress={() => onOpenSession({ id: record.sessionId, startsAt: record.startsAt })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: Spacing.two,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontWeight: 700 },
});
