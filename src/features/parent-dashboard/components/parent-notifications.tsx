import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormError } from '@/components/common/form-error';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import {
  useMarkAllNotificationsRead,
  useNotificationInbox,
  useOpenNotification,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import { useLinkedStudents } from '../hooks/use-parent-dashboard';
import type { ParentDestination } from '../types';
import {
  getNotificationDestination,
  getNotificationStudentLabel,
  mergeNotificationPages,
} from '../utils';

import { DetailHeader } from './detail-header';
import { NotificationRow } from './notification-row';

export type ParentNotificationsProps = {
  /** Roi hop thu, ve man hinh vua mo chuong. */
  onBack: () => void;
  /** Mo man hinh cua ban ghi thong bao tro toi; route quyet dinh dieu huong. */
  onOpenNotification: (destination: ParentDestination) => void;
};

/**
 * Hop thu thong bao cua phu huynh, chung moi con. Thong bao moi den qua realtime nen danh sach tu cap
 * nhat; bam mot thong bao thi danh dau da doc va mo man hinh lien quan.
 */
export function ParentNotifications({ onBack, onOpenNotification }: ParentNotificationsProps) {
  const inbox = useNotificationInbox();
  const unread = useUnreadNotificationCount();
  const markAll = useMarkAllNotificationsRead();
  const openNotification = useOpenNotification(onOpenNotification);
  const students = useLinkedStudents();

  const unreadCount = unread.data?.unreadCount ?? 0;
  // Ten con chi giup phan biet khi phu huynh co nhieu con
  const labelStudents = (students.data?.length ?? 0) > 1 ? (students.data ?? []) : [];

  const renderBody = () => {
    if (inbox.isPending) return <LoadingState />;
    if (inbox.isError) {
      return <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} />;
    }

    const notifications = mergeNotificationPages(inbox.data.pages);
    if (notifications.length === 0) {
      return (
        <EmptyState
          title="Chưa có thông báo"
          description="Thông báo về lịch học, điểm danh, bài tập và học phí của con sẽ hiện ở đây."
        />
      );
    }

    return (
      <View style={styles.list}>
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            studentLabel={getNotificationStudentLabel(notification, labelStudents)}
            canOpen={getNotificationDestination(notification) !== null}
            onPress={() => openNotification(notification)}
          />
        ))}
        {inbox.hasNextPage ? (
          <Button
            title="Xem thêm"
            variant="ghost"
            loading={inbox.isFetchingNextPage}
            onPress={() => void inbox.fetchNextPage()}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Thông báo" onBack={onBack} />
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Đã đọc hết thông báo'}
        </ThemedText>
        {unreadCount > 0 ? (
          <Button
            title="Đọc tất cả"
            variant="secondary"
            size="sm"
            icon="checkmark-done-outline"
            loading={markAll.isPending}
            onPress={() => markAll.mutate()}
          />
        ) : null}
      </View>
      <FormError error={markAll.error} />
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heading: { flex: 1 },
  list: { gap: Spacing.two },
});
