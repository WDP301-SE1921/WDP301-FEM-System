import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { formatWeekRange } from '../utils';

const BUTTON_HEIGHT = 36;
/** Bu phan thieu cua `BUTTON_HEIGHT` de vung cham dat 44x44 (design-mobile.md). */
const HIT_SLOP = 4;
const CHEVRON_SIZE = 16;

export type WeekButtonProps = {
  weekStart: Date;
  onPress: () => void;
};

/** Tuan dang xem cua lich tuan; bam de mo sheet chon tuan. */
export function WeekButton({ weekStart, onPress }: WeekButtonProps) {
  const weekRange = formatWeekRange(weekStart);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chọn tuần, đang xem tuần ${weekRange}`}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView type="primarySoft" style={styles.button}>
        <ThemedText type="smallBold" themeColor="primaryStrong" style={styles.text}>
          Tuần: {weekRange}
        </ThemedText>
        <Icon name="chevron-down" size={CHEVRON_SIZE} themeColor="primaryStrong" />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Nam giua hai nut mui ten: co lai khi chu phong to thay vi day mui ten ra ngoai man hinh
  pressable: { flexShrink: 1 },
  pressed: { opacity: 0.75 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: BUTTON_HEIGHT,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  text: { flexShrink: 1 },
});
