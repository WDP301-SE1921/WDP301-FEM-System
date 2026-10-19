import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/utils/format';

import type { AppNotification } from '../types';
import { getNotificationAppearance } from '../utils';

import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

const UNREAD_DOT_SIZE = 8;

export type NotificationRowProps = {
  notification: AppNotification;
  /** Ten cac con lien quan, chi truyen khi phu huynh co nhieu con. */
  studentLabel?: string | null;
  onPress: () => void;
};

/** Mot thong bao: icon theo loai, tieu de, thoi gian, noi dung, cham xanh khi chua doc. */
export function NotificationRow({ notification, studentLabel, onPress }: NotificationRowProps) {
  const theme = useTheme();
  const { icon, tone } = getNotificationAppearance(notification);
  const isUnread = notification.readAt === null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isUnread ? 'Chưa đọc. ' : ''}${notification.title}. ${notification.body}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView style={styles.item}>
        <ToneIcon name={icon} tone={tone} size="sm" />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText
              type={isUnread ? 'smallBold' : 'small'}
              numberOfLines={1}
              style={styles.title}
            >
              {notification.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRelativeTime(notification.createdAt)}
            </ThemedText>
            {isUnread ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {notification.body}
          </ThemedText>
          {studentLabel ? (
            <View style={styles.tags}>
              <ToneBadge label={studentLabel} tone="neutral" icon="person-outline" />
            </View>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
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
  dot: { width: UNREAD_DOT_SIZE, height: UNREAD_DOT_SIZE, borderRadius: Radius.full },
  tags: { flexDirection: 'row', marginTop: Spacing.half },
});
