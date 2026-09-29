import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { LinkInvitationFlow } from '@/features/link-invitation';

export default function LinkCodeScreen() {
  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'));

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <LinkInvitationFlow onBack={goBack} onSignIn={() => router.push('/(auth)/login')} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
