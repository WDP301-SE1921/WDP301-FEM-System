import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { AddChildFlow } from '@/features/children';

export default function AddChildScreen() {
  const { isAuthenticated, user } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <AddChildFlow parentEmail={user.email} onBack={goHome} onDone={goHome} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
