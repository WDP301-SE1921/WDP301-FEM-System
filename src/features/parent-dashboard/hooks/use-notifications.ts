import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';
import { logger } from '@/lib/logger';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import { NOTIFICATION_PAGE_SIZE } from '../constants';
import type { AppNotification, NotificationDestination } from '../types';
import { getNotificationDestination } from '../utils';

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => parentDashboardApi.getUnreadNotificationCount(),
  });
}

export function useRecentNotifications(studentId: string) {
  return useQuery({
    queryKey: queryKeys.notifications.recent(studentId),
    queryFn: () => parentDashboardApi.getRecentNotifications(studentId),
  });
}

/** Hop thu thong bao, tai them tung trang khi phu huynh keo xuong cuoi. */
export function useNotificationInbox() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ pageParam }) =>
      parentDashboardApi.getNotifications({ page: pageParam, limit: NOTIFICATION_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: ({ page, limit, total }) => (page * limit < total ? page + 1 : undefined),
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => parentDashboardApi.markAllNotificationsRead(),
    onSuccess: invalidate,
  });
}

/**
 * Bam mot thong bao: danh dau da doc (khong cho BE, loi thi chi ghi log vi lan sau van danh dau duoc)
 * roi bao route mo man hinh cua ban ghi thong bao tro toi, neu co.
 */
export function useOpenNotification(
  onOpenDestination: (destination: NotificationDestination) => void,
) {
  const invalidate = useInvalidateNotifications();
  const markRead = useMutation({
    mutationFn: (notificationId: string) => parentDashboardApi.markNotificationRead(notificationId),
    onSuccess: invalidate,
    onError: (error) => logger.warn('[notifications] Khong danh dau da doc duoc', error),
  });

  return (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    const destination = getNotificationDestination(notification);
    if (destination) onOpenDestination(destination);
  };
}
