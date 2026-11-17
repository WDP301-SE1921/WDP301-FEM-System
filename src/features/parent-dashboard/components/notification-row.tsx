import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
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
const CHEVRON_SIZE = 16;

/**
 * Bam vao dong thi mo gi: `screen` la man hinh lien quan (bai tap, buoi hoc, bill), `detail` la sheet
 * chi tiet cua chinh thong bao, null la khong mo gi (bam chi danh dau da doc).
 */
export type NotificationRowOpens = 'screen' | 'detail' | null;

const OPEN_HINTS: Record<NonNullable<NotificationRowOpens>, string> = {
  screen: 'Mở nội dung liên quan',
  detail: 'Xem chi tiết thông báo',
};

export type NotificationRowProps = {
  notification: AppNotification;
  /** Ten cac con lien quan, chi truyen khi phu huynh co nhieu con. */
  studentLabel?: string | null;
  /** Co mo gi thi hien mui ten va goi y cho trinh doc man hinh. */
  opens: NotificationRowOpens;
  onPress: () => void;
};

/** Mot thong bao: icon theo loai, tieu de, thoi gian, noi dung, cham xanh khi chua doc. */
export function NotificationRow({
  notification,
  studentLabel,
  opens,
  onPress,
}: NotificationRowProps) {
  const theme = useTheme();
  const { icon, tone } = getNotificationAppearance(notification);
  const isUnread = notification.readAt === null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isUnread ? 'Chưa đọc. ' : ''}${notification.title}. ${notification.body}`}
      accessibilityHint={opens ? OPEN_HINTS[opens] : undefined}
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
        {opens ? (
          <Icon
            name="chevron-forward"
            size={CHEVRON_SIZE}
            themeColor="textSecondary"
            style={styles.chevron}
          />
        ) : null}
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
  chevron: { alignSelf: 'center' },
});
