import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { useAuth, VerifyEmailFlow } from '@/features/auth';

export default function VerifyEmailScreen() {
  const { isAuthenticated, user } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/welcome" />;

  // Vao tu dang nhap hoac dang ky thi khong co man hinh truoc de quay lai
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <VerifyEmailFlow user={user} onDone={leave} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
