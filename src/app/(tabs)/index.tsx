import { router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/features/auth';
import { ParentDashboard } from '@/features/parent-dashboard';

export default function HomeScreen() {
  const { user } = useAuth();

  if (user?.role === 'PARENT') {
    return (
      <Screen>
        <ParentDashboard
          parentName={user.displayName}
          onAddChild={() => router.push('/add-child')}
          onOpenNotifications={() => router.navigate('/notifications')}
          onOpenAssignments={() => router.navigate('/grades')}
        />
      </Screen>
    );
  }

  // Chua chot giao vien, quan ly co dung app mobile hay khong: giu man hinh tam
  return (
    <Screen>
      <ThemedText type="title">
        Xin chào{user ? `, ${user.displayName ?? user.email}` : ''}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Bắt đầu xây dựng tính năng tại src/features/ và thêm màn hình tại src/app/.
      </ThemedText>
    </Screen>
  );
}
