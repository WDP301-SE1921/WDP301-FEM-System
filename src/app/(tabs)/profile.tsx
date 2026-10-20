import { router } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import { TabHeader } from '@/components/common/tab-header';
import { AccountActions, AccountSummary, LogoutButton, useAuth } from '@/features/auth';
import { ChildrenSection } from '@/features/children';
import { NotificationBell } from '@/features/parent-dashboard';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <Screen edges={TAB_SCREEN_EDGES}>
      <TabHeader
        title="Tài khoản"
        subtitle="Thông tin đăng nhập và hồ sơ học sinh"
        trailing={<NotificationBell onPress={() => router.navigate('/notifications')} />}
      />
      {user ? <AccountSummary user={user} /> : null}

      <AccountActions
        onEditProfile={() => router.push('/edit-account')}
        onChangePassword={() => router.push('/change-password')}
      />
      <ChildrenSection
        onAddChild={() => router.push('/add-child')}
        onEditChild={(studentId) =>
          router.push({ pathname: '/children/[studentId]', params: { studentId } })
        }
      />

      <LogoutButton />
    </Screen>
  );
}
