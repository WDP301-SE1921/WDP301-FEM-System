import { router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/features/auth';
import {
  getNotificationHref,
  ParentDashboard,
  useRefreshParentData,
} from '@/features/parent-dashboard';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isRefreshing, refresh } = useRefreshParentData();

  if (user?.role === 'PARENT') {
    return (
      <Screen onRefresh={refresh} isRefreshing={isRefreshing}>
        <ParentDashboard
          parentName={user.displayName}
          parentEmail={user.email}
          onAddChild={() => router.push('/add-child')}
          onOpenNotifications={() => router.navigate('/notifications')}
          onOpenNotification={(destination) => router.push(getNotificationHref(destination))}
          onOpenAssignments={() => router.navigate('/grades')}
        />
      </Screen>
    );
  }

  // Chua chot giao vien, quan ly co dung app mobile hay khong: giu man hinh tam
  return (
    <Screen>
      <ThemedText type="title">Xin chào</ThemedText>
      {/* Ten hoac email dat dong rieng, co chu nho hon: email dai o co 48px bi be giua chu */}
      {user ? <ThemedText type="heading">{user.displayName ?? user.email}</ThemedText> : null}
      <ThemedText type="small" themeColor="textSecondary">
        Bắt đầu xây dựng tính năng tại src/features/ và thêm màn hình tại src/app/.
      </ThemedText>
    </Screen>
  );
}
