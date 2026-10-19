import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useUnreadNotificationCount } from '../hooks/use-notifications';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const BUTTON_SIZE = 44;
const ICON_SIZE = 22;
const DOT_SIZE = 10;
const DOT_BORDER_WIDTH = 2;
/** Dat cham do o goc tren ben phai cua icon, khong phai cua ca nut. */
const DOT_OFFSET = 10;

export type NotificationBellProps = {
  onPress: () => void;
};

/**
 * Nut chuong, co cham do khi con thong bao chua doc. Dem loi hoac dang tai thi chi an cham do:
 * phu huynh van vao duoc trang thong bao, khong can chan trang chu vi so dem.
 */
export function NotificationBell({ onPress }: NotificationBellProps) {
  const theme = useTheme();
  const unread = useUnreadNotificationCount();
  const unreadCount = unread.data?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <Icon name="notifications-outline" size={ICON_SIZE} themeColor="primary" />
      {hasUnread ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.danger, borderColor: theme.backgroundElement },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  dot: {
    position: 'absolute',
    top: DOT_OFFSET,
    right: DOT_OFFSET,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: Radius.full,
    borderWidth: DOT_BORDER_WIDTH,
  },
});
