import { router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import {
  getNotificationHref,
  ParentNotifications,
  useRefreshParentData,
} from '@/features/parent-dashboard';

// Mo tu nut chuong va "Xem tất cả" o trang chu; tab nay khong co nut tren thanh tab
export default function NotificationsScreen() {
  const { isRefreshing, refresh } = useRefreshParentData();

  return (
    <Screen onRefresh={refresh} isRefreshing={isRefreshing}>
      <ParentNotifications
        onOpenNotification={(destination) => router.push(getNotificationHref(destination))}
      />
    </Screen>
  );
}
