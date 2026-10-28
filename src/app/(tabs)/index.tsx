import { router } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import { TabHeader } from '@/components/common/tab-header';
import { useAuth } from '@/features/auth';
import {
  getParentGreeting,
  NotificationBell,
  ParentDashboard,
  useOpenParentDestination,
  useRefreshParentData,
} from '@/features/parent-dashboard';
import { formatWeekdayDate } from '@/utils/format';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isRefreshing, refresh } = useRefreshParentData();
  const openDestination = useOpenParentDestination();

  // Layout cua (tabs) chi render cac tab cho phien phu huynh
  if (!user) return null;

  const openNotifications = () => router.navigate('/notifications');

  return (
    <Screen edges={TAB_SCREEN_EDGES} onRefresh={refresh} isRefreshing={isRefreshing}>
      <TabHeader
        title={getParentGreeting(user.displayName)}
        subtitle={`Hôm nay, ${formatWeekdayDate(new Date())}`}
        trailing={<NotificationBell onPress={openNotifications} />}
      />
      <ParentDashboard
        parentEmail={user.email}
        onAddChild={() => router.push('/add-child')}
        onOpenNotifications={openNotifications}
        onOpenDestination={openDestination}
      />
    </Screen>
  );
}
