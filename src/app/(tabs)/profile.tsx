import { Screen } from '@/components/common/screen';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth, useLogout } from '@/features/auth';
import { getInitials } from '@/utils/format';

export default function ProfileScreen() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <Screen>
      <ThemedText type="title">{user ? getInitials(user.fullName) : '--'}</ThemedText>
      <ThemedText type="default">{user?.fullName ?? 'Chưa có thông tin'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {user?.email}
      </ThemedText>

      <Button
        title="Đăng xuất"
        variant="danger"
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </Screen>
  );
}
