import { router } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import {
  ParentNotifications,
  useOpenParentDestination,
  useRefreshParentData,
} from '@/features/parent-dashboard';

// Mo tu nut chuong va "Xem tất cả" o trang chu; tab nay khong co nut tren thanh tab nen co nut quay lai
export default function NotificationsScreen() {
  const { isRefreshing, refresh } = useRefreshParentData();
  const openDestination = useOpenParentDestination();

  // Thanh tab giu lich su (`backBehavior`) nen quay lai dung tab vua mo chuong; mo thang tu link thi ve trang chu
  const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/'));

  return (
    <Screen edges={TAB_SCREEN_EDGES} onRefresh={refresh} isRefreshing={isRefreshing}>
      <ParentNotifications onBack={goBack} onOpenNotification={openDestination} />
    </Screen>
  );
}
