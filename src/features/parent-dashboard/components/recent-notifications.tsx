import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/format';

import type { Tone } from '../constants';
import type { DashboardNotification, NotificationType } from '../types';

import { SectionCard } from './section-card';
import { ToneIcon } from './tone-icon';

const CHEVRON_SIZE = 16;
/** Chu cao 20px, bu them de vung cham dat 44x44 (design-mobile.md). */
const SEE_ALL_HIT_SLOP = 12;

const NOTIFICATION_TYPES: Record<NotificationType, { icon: IconName; tone: Tone }> = {
  ATTENDANCE: { icon: 'checkmark-done-outline', tone: 'primary' },
  GRADE: { icon: 'star-outline', tone: 'accent' },
};

export type RecentNotificationsProps = {
  notifications: DashboardNotification[];
  onSeeAll: () => void;
};

export function RecentNotifications({ notifications, onSeeAll }: RecentNotificationsProps) {
  return (
    <SectionCard
      title="Thông báo mới"
      icon="newspaper-outline"
      trailing={<SeeAllLink onPress={onSeeAll} />}
    >
      {notifications.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có thông báo mới.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </View>
      )}
    </SectionCard>
  );
}

function SeeAllLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Xem tất cả thông báo"
      hitSlop={SEE_ALL_HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
    >
      <ThemedText type="smallBold" themeColor="primary">
        Xem tất cả
      </ThemedText>
      <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="primary" />
    </Pressable>
  );
}

function NotificationRow({ notification }: { notification: DashboardNotification }) {
  const { icon, tone } = NOTIFICATION_TYPES[notification.type];

  return (
    <ThemedView style={styles.item}>
      <ToneIcon name={icon} tone={tone} size="sm" />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {notification.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatRelativeTime(notification.createdAt)}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {notification.message}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  pressed: { opacity: 0.75 },
  list: { gap: Spacing.two },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.control,
  },
  content: { flex: 1, gap: Spacing.half },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
});
