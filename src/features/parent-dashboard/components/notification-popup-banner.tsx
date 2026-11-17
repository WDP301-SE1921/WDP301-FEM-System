import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useOpenNotification } from '../hooks/use-notifications';
import { useOpenParentDestination } from '../hooks/use-open-parent-destination';
import type { AppNotification } from '../types';
import { getNotificationAppearance, getNotificationDestination } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

const CLOSE_BUTTON_SIZE = 32;
// Nut dong 32px, noi vung cham them 6px moi phia cho du 44px
const CLOSE_HIT_SLOP = 6;
const CLOSE_ICON_SIZE = 18;
const BODY_LINES = 3;
const BANNER_Z_INDEX = 1000;
const SHADOW_OPACITY = 0.14;
const SHADOW_RADIUS = 12;
const SHADOW_OFFSET_Y = 4;
const ANDROID_ELEVATION = 6;

export type NotificationPopupBannerProps = {
  notification: AppNotification;
  onDismiss: () => void;
};

/**
 * Popup message noi o dau man hinh khi co thong bao moi: hien ro tieu de va noi dung tin nhan
 * (`body`), bam vao thi mo man hinh lien quan hoac hop thu thong bao.
 */
export function NotificationPopupBanner({ notification, onDismiss }: NotificationPopupBannerProps) {
  const theme = useTheme();
  const openDestination = useOpenParentDestination();
  const openNotification = useOpenNotification(openDestination);
  const { icon, tone } = getNotificationAppearance(notification);

  const handlePress = () => {
    onDismiss();
    openNotification(notification);
    if (!getNotificationDestination(notification)) {
      router.navigate('/notifications');
    }
  };

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.overlay}>
      <ThemedView
        style={[
          styles.card,
          {
            borderColor: theme.primary,
            shadowColor: theme.text,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thông báo mới: ${notification.title}. ${notification.body}`}
          onPress={handlePress}
          style={({ pressed }) => [styles.mainArea, pressed && styles.pressed]}
        >
          <ToneIcon name={icon} tone={tone} size="sm" />
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
                {notification.title}
              </ThemedText>
              <ToneBadge label="Mới" tone="primary" />
            </View>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={BODY_LINES}>
              {notification.body}
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo nổi"
          hitSlop={CLOSE_HIT_SLOP}
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="close" size={CLOSE_ICON_SIZE} themeColor="textSecondary" />
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: BANNER_Z_INDEX,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    elevation: ANDROID_ELEVATION,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  content: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
