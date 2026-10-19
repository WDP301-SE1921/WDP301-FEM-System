import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatShortWeekday, formatWeekdayDate } from '@/utils/format';

import type { WeekDay } from '../types';

/** `Date.getDay()` cua Chu nhat, to mau rieng nhu lich treo tuong. */
const SUNDAY = 0;
const DOT_SIZE = 6;

export type WeekStripProps = {
  days: WeekDay[];
  selectedKey: string;
  todayKey: string;
  onSelect: (date: Date) => void;
};

/**
 * 7 ngay trong tuan, cham duoi ngay co buoi hoc (mau cam khi co hoc bu / doi lich). Cac o sat nhau,
 * khong padding de moi o van rong toi thieu 44 tren man hinh 360dp (design-mobile.md).
 */
export function WeekStrip({ days, selectedKey, todayKey, onSelect }: WeekStripProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.strip}>
      {days.map((day) => (
        <DayCell
          key={day.key}
          day={day}
          isSelected={day.key === selectedKey}
          isToday={day.key === todayKey}
          onPress={() => onSelect(day.date)}
        />
      ))}
    </ThemedView>
  );
}

type DayCellProps = {
  day: WeekDay;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
};

function DayCell({ day, isSelected, isToday, onPress }: DayCellProps) {
  const theme = useTheme();
  const dotColor = getDotColor(day, isSelected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel(day, isToday)}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        isSelected && { backgroundColor: theme.primary },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="small" themeColor={getWeekdayColor(day, isSelected)}>
        {formatShortWeekday(day.date)}
      </ThemedText>
      {/* O ngay chi rong khoang 39dp tren man hinh 320dp: chu phong to thi thu nho so ngay, khong
          de "30" vo thanh hai dong */}
      <ThemedText
        type="heading"
        themeColor={getDateColor(isSelected, isToday)}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {day.date.getDate()}
      </ThemedText>
      <View style={[styles.dot, dotColor && { backgroundColor: theme[dotColor] }]} />
    </Pressable>
  );
}

function getWeekdayColor(day: WeekDay, isSelected: boolean): ThemeColor {
  if (isSelected) return 'primaryText';
  if (day.date.getDay() === SUNDAY) return 'danger';
  return 'textSecondary';
}

function getDateColor(isSelected: boolean, isToday: boolean): ThemeColor {
  if (isSelected) return 'primaryText';
  return isToday ? 'primary' : 'text';
}

/** null: ngay khong co buoi hoc, cham trong suot de cac o van cao bang nhau. */
function getDotColor(day: WeekDay, isSelected: boolean): ThemeColor | null {
  if (day.sessions.length === 0) return null;
  if (day.hasScheduleChange) return 'accent';
  return isSelected ? 'primaryText' : 'primary';
}

function getAccessibilityLabel(day: WeekDay, isToday: boolean): string {
  const parts = [isToday ? 'Hôm nay' : null, formatWeekdayDate(day.date)];
  if (day.sessions.length > 0) parts.push(`${day.sessions.length} buổi học`);
  if (day.hasScheduleChange) parts.push('có thay đổi lịch');
  return parts.filter(Boolean).join(', ');
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', borderRadius: Radius.lg },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.75 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
});
