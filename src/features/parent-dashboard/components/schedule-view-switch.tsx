import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { ScheduleView } from '../types';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const OPTION_MIN_HEIGHT = 44;
const ICON_SIZE = 18;

const OPTIONS: readonly { view: ScheduleView; label: string; icon: IconName }[] = [
  { view: 'WEEK', label: 'Lịch tuần', icon: 'calendar-outline' },
  { view: 'COURSES', label: 'Môn học', icon: 'library-outline' },
  { view: 'ROADMAP', label: 'Lộ trình', icon: 'trail-sign-outline' },
  { view: 'ATTENDANCE', label: 'Điểm danh', icon: 'checkmark-done-outline' },
];

export type ScheduleViewSwitchProps = {
  value: ScheduleView;
  onChange: (view: ScheduleView) => void;
};

/** Chuyen giua lich theo tuan, danh sach mon, lo trinh bai hoc va lich su diem danh cua con. */
export function ScheduleViewSwitch({ value, onChange }: ScheduleViewSwitchProps) {
  return (
    <ThemedView type="backgroundElement" accessibilityRole="tablist" style={styles.container}>
      {OPTIONS.map(({ view, label, icon }) => {
        const isSelected = view === value;
        const color = isSelected ? 'primary' : 'textSecondary';
        return (
          <Pressable
            key={view}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(view)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <ThemedView
              type={isSelected ? 'background' : 'backgroundElement'}
              style={styles.optionContent}
            >
              <Icon name={icon} size={ICON_SIZE} themeColor={color} />
              <ThemedText
                type={isSelected ? 'smallBold' : 'small'}
                themeColor={color}
                numberOfLines={1}
                style={styles.label}
              >
                {label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.full,
  },
  option: { flex: 1 },
  pressed: { opacity: 0.75 },
  // Bon lua chon tren man hinh 360dp chi con khoang 73dp moi o, khong du cho icon dat canh chu:
  // xep icon tren chu
  optionContent: {
    minHeight: OPTION_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.half,
    borderRadius: Radius.full,
  },
  label: { maxWidth: '100%' },
});
