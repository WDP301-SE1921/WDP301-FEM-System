import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatWeekdayDate } from '@/utils/format';

import { ActionChip } from './action-chip';
import { ToneIcon } from './tone-icon';

const TEXT_MIN_WIDTH = 120;

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
  // Khong du cho cho chu rong toi thieu TEXT_MIN_WIDTH (man hinh 360dp) thi nut roi xuong hang duoi,
  // can phai, thay vi ep chu thanh mot cot hep nhieu dong
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: Spacing.three,
    rowGap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flexGrow: 1, flexShrink: 1, flexBasis: TEXT_MIN_WIDTH },
});
