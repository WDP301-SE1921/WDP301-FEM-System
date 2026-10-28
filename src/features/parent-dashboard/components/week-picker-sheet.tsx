import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/utils/date';

import { formatWeekRange, getRelativeWeekLabel, getWeekOptions } from '../utils';

/** Vien day bang nhau o hai trang thai de dong khong nhay khi doi tuan. */
const BORDER_WIDTH = 2;
const RADIO_SIZE = 24;
const RADIO_ICON_SIZE = 16;

export type WeekPickerSheetProps = {
  isVisible: boolean;
  selectedWeekStart: Date;
  /** Moc de tinh "Tuần này", "Tuần sau"... */
  today: Date;
  onSelect: (weekStart: Date) => void;
  onClose: () => void;
};

/** Bottom sheet chon tuan cua lich hoc, quanh tuan hien tai. */
export function WeekPickerSheet({
  isVisible,
  selectedWeekStart,
  today,
  onSelect,
  onClose,
}: WeekPickerSheetProps) {
  const selectedKey = toDateKey(selectedWeekStart);

  return (
    <BottomSheet
      isVisible={isVisible}
      title="Chọn tuần"
      subtitle="Xem lịch học của học sinh theo từng tuần"
      onClose={onClose}
    >
      <ScrollView
        accessibilityRole="radiogroup"
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {getWeekOptions(today).map(({ weekStart, offset }) => (
          <WeekOption
            key={toDateKey(weekStart)}
            label={getRelativeWeekLabel(offset)}
            range={formatWeekRange(weekStart)}
            isSelected={toDateKey(weekStart) === selectedKey}
            onPress={() => onSelect(weekStart)}
          />
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

type WeekOptionProps = {
  label: string;
  range: string;
  isSelected: boolean;
  onPress: () => void;
};

function WeekOption({ label, range, isSelected, onPress }: WeekOptionProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${range}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: isSelected ? theme.primary : theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <ThemedText type="default" style={styles.range}>
          {range}
        </ThemedText>
        <ThemedText type="small" themeColor={isSelected ? 'primary' : 'textSecondary'}>
          {label}
        </ThemedText>
      </View>
      <View
        style={[
          styles.radio,
          isSelected
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { borderColor: theme.backgroundSelected },
        ]}
      >
        {isSelected ? (
          <Icon name="checkmark" size={RADIO_ICON_SIZE} themeColor="primaryText" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 0 },
  listContent: { gap: Spacing.two, paddingVertical: Spacing.three },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: BORDER_WIDTH,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.75 },
  text: { flex: 1 },
  range: { fontWeight: 700 },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: Radius.full,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
