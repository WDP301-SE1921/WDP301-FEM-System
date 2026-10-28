import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { useOpenNotification, useRecentNotifications } from '../hooks/use-notifications';
import type { ParentDestination } from '../types';
import { getNotificationDestination } from '../utils';

import { NotificationRow } from './notification-row';
import { RecentNotifications } from './recent-notifications';
import { SectionLoadError } from './section-load-error';
import { SectionLoading } from './section-loading';

export type StudentRecentNotificationsProps = {
  studentId: string;
  /** Mo man hinh cua ban ghi thong bao tro toi; route quyet dinh dieu huong. */
  onOpenNotification: (destination: ParentDestination) => void;
  onSeeAll: () => void;
};

/** Vai thong bao moi nhat cua con: tu tai, loi thi chi the nay bao loi va thu lai. */
export function StudentRecentNotifications({
  studentId,
  onOpenNotification,
  onSeeAll,
}: StudentRecentNotificationsProps) {
  const notifications = useRecentNotifications(studentId);
  const openNotification = useOpenNotification(onOpenNotification);

  const renderBody = () => {
    if (notifications.isPending) return <SectionLoading message="Đang tải thông báo…" />;
    if (notifications.isError) {
      return (
        <SectionLoadError
          message="Không tải được thông báo."
          onRetry={() => void notifications.refetch()}
        />
      );
    }
    if (notifications.data.length === 0) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có thông báo mới.
        </ThemedText>
      );
    }
    return (
      <View style={styles.list}>
        {notifications.data.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            canOpen={getNotificationDestination(notification) !== null}
            onPress={() => openNotification(notification)}
          />
        ))}
      </View>
    );
  };

  return <RecentNotifications onSeeAll={onSeeAll}>{renderBody()}</RecentNotifications>;
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
