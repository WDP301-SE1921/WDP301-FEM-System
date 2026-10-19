import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { formatWeekdayDate, getShortName } from '@/utils/format';

import { NotificationBell } from './notification-bell';

const DATE_ICON_SIZE = 16;

export type DashboardGreetingProps = {
  /** `displayName` cua phu huynh, null khi tai khoan chua dat ten. */
  parentName: string | null;
  onOpenNotifications: () => void;
};

/** Loi chao dau trang chu, goi phu huynh bang ten (tu cuoi cua ho ten), kem nut thong bao. */
export function DashboardGreeting({ parentName, onOpenNotifications }: DashboardGreetingProps) {
  const greeting = parentName ? `Chào ${getShortName(parentName, 1)}` : 'Xin chào';

  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <ThemedText type="heading" accessibilityRole="header">
          {greeting} 👋
        </ThemedText>
        <View style={styles.date}>
          <Icon name="calendar-clear-outline" size={DATE_ICON_SIZE} themeColor="textSecondary" />
          <ThemedText type="small" themeColor="textSecondary" style={styles.dateText}>
            Hôm nay, {formatWeekdayDate(new Date())}
          </ThemedText>
        </View>
      </View>
      <NotificationBell onPress={onOpenNotifications} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.one },
  date: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dateText: { flexShrink: 1 },
});
