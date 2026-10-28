import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime, formatWeekdayDate } from '@/utils/format';

import { TONES } from '../constants';
import type { AttendanceRecord } from '../types';
import {
  getAttendanceNotes,
  getAttendanceRecordStatus,
  isOutstandingAbsence,
  type AttendanceNote,
} from '../utils';

import { ToneBadge } from './tone-badge';

const HIGHLIGHT_WIDTH = 6;
const DETAIL_ICON_SIZE = 16;
const CHEVRON_SIZE = 18;

export type AttendanceRecordCardProps = {
  record: AttendanceRecord;
  /** Mo chi tiet buoi hoc. */
  onPress: () => void;
};

/** Mot buoi trong lich su diem danh: ngay, lop, ket qua, gio hoc va ghi chu vang, hoc bu. */
export function AttendanceRecordCard({ record, onPress }: AttendanceRecordCardProps) {
  const theme = useTheme();
  const status = getAttendanceRecordStatus(record);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Xem chi tiết buổi học"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        {/* Buoi vang chua bu xong la dieu phu huynh can thay dau tien khi luot danh sach */}
        {isOutstandingAbsence(record) ? (
          <View style={[styles.highlight, { backgroundColor: theme[TONES[status.tone].color] }]} />
        ) : null}

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <ThemedText type="small" themeColor="textSecondary">
              {formatWeekdayDate(record.startsAt)}
            </ThemedText>
            <ThemedText type="default" style={styles.title}>
              {record.className}
            </ThemedText>
          </View>
          <ToneBadge label={status.label} tone={status.tone} icon={status.icon} />
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detail}>
            <Icon name="time-outline" size={DETAIL_ICON_SIZE} themeColor="textSecondary" />
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.detailText}
            >
              {formatTime(record.startsAt)} – {formatTime(record.endsAt)}
            </ThemedText>
          </View>
          <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="textSecondary" />
        </View>

        {getAttendanceNotes(record).map((note) => (
          <NoteRow key={note.key} note={note} />
        ))}
      </ThemedView>
    </Pressable>
  );
}

function NoteRow({ note }: { note: AttendanceNote }) {
  const { text, soft } = TONES[note.tone];

  return (
    <ThemedView type={soft} style={styles.note}>
      <Icon name={note.icon} size={DETAIL_ICON_SIZE} themeColor={text} style={styles.noteIcon} />
      <ThemedText type="small" style={styles.noteText}>
        {note.text}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  titleBlock: { flex: 1 },
  title: { fontWeight: 700 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  detail: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  detailText: { flexShrink: 1 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  // Can icon voi dong chu dau tien (lineHeight 20 cua chu `small`)
  noteIcon: { marginTop: Spacing.half },
  noteText: { flex: 1 },
});
