import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatWeekdayDate } from '@/utils/format';

import { ActionChip } from './action-chip';
import { ToneIcon } from './tone-icon';

export type NextFreeDayCardProps = {
  date: Date;
  onView: () => void;
};

/** Bao truoc ngay nghi tiep theo trong tuan, bam de chuyen sang ngay do. */
export function NextFreeDayCard({ date, onView }: NextFreeDayCardProps) {
  const dateLabel = formatWeekdayDate(date);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ToneIcon name="cafe-outline" tone="accent" />
      <View style={styles.text}>
        <ThemedText type="smallBold">Ngày nghỉ tiếp theo</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {dateLabel} học sinh không có buổi học
        </ThemedText>
      </View>
      <ActionChip
        label="Xem ngày nghỉ"
        variant="soft"
        accessibilityLabel={`Xem ngày nghỉ ${dateLabel}`}
        onPress={onView}
      />
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
});
