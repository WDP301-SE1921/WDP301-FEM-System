import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/features/auth';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Screen>
      <ThemedText type="title">Xin chào{user ? `, ${user.fullName}` : ''}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Bắt đầu xây dựng tính năng tại src/features/ và thêm màn hình tại src/app/.
      </ThemedText>
    </Screen>
  );
}
