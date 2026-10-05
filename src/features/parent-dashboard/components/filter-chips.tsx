import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { FilterOption } from '../types';

const CHIP_HEIGHT = 36;
const ICON_SIZE = 16;
/**
 * Bu phan thieu cua `CHIP_HEIGHT` de vung cham dat 44 (design-mobile.md), chi theo chieu doc vi
 * chieu ngang da co `gap`. `content` dem cung khoang nay: Android bo cham ngoai khung ScrollView.
 */
const CHIP_HIT_SLOP_VERTICAL = Spacing.one;
const CHIP_HIT_SLOP = { top: CHIP_HIT_SLOP_VERTICAL, bottom: CHIP_HIT_SLOP_VERTICAL };

export type FilterChipsProps<T extends string> = {
  options: readonly FilterOption<T>[];
  selected: T;
  onSelect: (filter: T) => void;
};

/**
 * Hang chip loc (mon theo trang thai, diem danh theo mon, lo trinh theo mon), cuon ngang khi khong
 * du cho.
 */
export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {options.map(({ filter, label, icon }) => {
        const isSelected = filter === selected;
        const color = isSelected ? 'primaryText' : 'textSecondary';
        return (
          <Pressable
            key={filter}
            accessibilityRole="button"
            accessibilityLabel={`Lọc: ${label}`}
            accessibilityState={{ selected: isSelected }}
            hitSlop={CHIP_HIT_SLOP}
            onPress={() => onSelect(filter)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <ThemedView type={isSelected ? 'primary' : 'backgroundElement'} style={styles.chip}>
              {icon ? <Icon name={icon} size={ICON_SIZE} themeColor={color} /> : null}
              <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={color}>
                {label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Tran ra het be ngang man hinh de cuon sat mep, chip dau van thang hang voi padding cua Screen
  scroll: { flexGrow: 0, marginHorizontal: -Spacing.four },
  content: {
    paddingHorizontal: Spacing.four,
    paddingVertical: CHIP_HIT_SLOP_VERTICAL,
    gap: Spacing.two,
  },
  pressed: { opacity: 0.75 },
  chip: {
    minHeight: CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
});
