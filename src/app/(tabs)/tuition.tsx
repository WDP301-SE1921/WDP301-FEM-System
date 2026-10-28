import { router } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import { TabHeader } from '@/components/common/tab-header';
import { NotificationBell, ParentTuition, useRefreshParentData } from '@/features/parent-dashboard';

export default function TuitionScreen() {
  const { isRefreshing, refresh } = useRefreshParentData();

  return (
    <Screen edges={TAB_SCREEN_EDGES} onRefresh={refresh} isRefreshing={isRefreshing}>
      <TabHeader
        title="Học phí"
        subtitle="Gói học và lịch sử đóng học phí"
        trailing={<NotificationBell onPress={() => router.navigate('/notifications')} />}
      />
      <ParentTuition
        onAddChild={() => router.push('/add-child')}
        onOpenReceipt={(registrationId) =>
          router.push({ pathname: '/receipts/[registrationId]', params: { registrationId } })
        }
        onOpenBill={(registrationId) =>
          router.push({ pathname: '/bills/[registrationId]', params: { registrationId } })
        }
      />
    </Screen>
  );
}
