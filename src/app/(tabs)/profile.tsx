import { router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { AccountActions, AccountSummary, useAuth, useLogout } from '@/features/auth';
import { ChildrenSection } from '@/features/children';

export default function ProfileScreen() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <Screen>
      <ThemedText type="heading" accessibilityRole="header">
        Tài khoản
      </ThemedText>
      {user ? <AccountSummary user={user} /> : null}

      {/* Chi phu huynh co ho so con; role khac chua chot co dung app mobile hay khong */}
      {user?.role === 'PARENT' ? (
        <>
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
        </>
      ) : null}

      <Button
        title="Đăng xuất"
        variant="danger"
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </Screen>
  );
}
