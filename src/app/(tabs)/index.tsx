import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/features/auth';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Screen>
      <ThemedText type="title">Xin chao{user ? `, ${user.fullName}` : ''}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Bat dau xay dung tinh nang tai src/features/ va them man hinh tai src/app/.
      </ThemedText>
    </Screen>
  );
}
