import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatUnscheduledNote } from '../utils';

const ICON_CIRCLE_SIZE = 64;
const ICON_SIZE = 32;

export type UnscheduledDayCardProps = {
  /** Ten lop hoc vao ngay nay theo lich co dinh, vd `Toán 9A`. */
  classNames: readonly string[];
  isToday: boolean;
};

/**
 * Ngay lop co hoc theo lich co dinh nhung trung tam chua tao buoi: noi ro la chua xep lich, khong bao
 * con duoc nghi.
 */
export function UnscheduledDayCard({ classNames, isToday }: UnscheduledDayCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedView type="accentSoft" style={styles.iconCircle}>
        <Icon name="calendar-clear-outline" size={ICON_SIZE} themeColor="accentStrong" />
      </ThemedView>
      <ThemedText type="default" style={[styles.center, styles.title]}>
        {isToday ? 'Hôm nay chưa có lịch buổi học' : 'Ngày này chưa có lịch buổi học'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {formatUnscheduledNote(classNames, isToday)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: { textAlign: 'center' },
  title: { fontWeight: 700 },
});
