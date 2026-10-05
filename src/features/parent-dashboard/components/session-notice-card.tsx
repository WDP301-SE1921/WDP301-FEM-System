import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { SESSION_TYPES, TONES } from '../constants';
import type { ScheduleSessionType } from '../types';

import { ToneIcon } from './tone-icon';

export type SessionNoticeCardProps = {
  type: ScheduleSessionType;
  note: string;
};

/** Ghi chu cua trung tam cho buoi hoc, tieu de theo loai buoi (hoc bu, doi lich). */
export function SessionNoticeCard({ type, note }: SessionNoticeCardProps) {
  const appearance = SESSION_TYPES[type];
  const tone = TONES[appearance.tone];

  return (
    <ThemedView type={tone.soft} style={styles.card}>
      <ToneIcon name={appearance.noteIcon} tone={appearance.tone} variant="solid" />
      <View style={styles.content}>
        <ThemedText type="smallBold" themeColor={tone.color}>
          {appearance.noteTitle}
        </ThemedText>
        <ThemedText type="small">{note}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  content: { flex: 1, gap: Spacing.half },
});
