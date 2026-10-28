import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { WeekButton } from './week-button';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const ARROW_SIZE = 44;
const ARROW_ICON_SIZE = 20;

export type WeekNavigatorProps = {
  weekStart: Date;
  /** null khi da toi tuan dau hoac cuoi chon duoc: nut mui ten mo di. */
  previousWeek: Date | null;
  nextWeek: Date | null;
  onSelectWeek: (weekStart: Date) => void;
  /** Mo sheet chon tuan bat ky. */
  onOpenPicker: () => void;
};

/** Doi tuan cua lich tuan: mui ten sang tuan truoc, tuan sau, bam tuan dang xem de chon tuan khac. */
export function WeekNavigator({
  weekStart,
  previousWeek,
  nextWeek,
  onSelectWeek,
  onOpenPicker,
}: WeekNavigatorProps) {
  return (
    <View style={styles.container}>
      <WeekArrow direction="previous" target={previousWeek} onPress={onSelectWeek} />
      <WeekButton weekStart={weekStart} onPress={onOpenPicker} />
      <WeekArrow direction="next" target={nextWeek} onPress={onSelectWeek} />
    </View>
  );
}

const ARROWS = {
  previous: { icon: 'chevron-back', label: 'Tuần trước' },
  next: { icon: 'chevron-forward', label: 'Tuần sau' },
} as const;

type WeekArrowProps = {
  direction: keyof typeof ARROWS;
  target: Date | null;
  onPress: (weekStart: Date) => void;
};

function WeekArrow({ direction, target, onPress }: WeekArrowProps) {
  const theme = useTheme();
  const { icon, label } = ARROWS[direction];
  const isDisabled = target === null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => {
        if (target) onPress(target);
      }}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={ARROW_ICON_SIZE} themeColor="primary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
