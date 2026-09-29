import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { Spacing } from '@/constants/theme';
import { LoginFooter, LoginForm, LoginHeader, LoginIntro } from '@/features/auth';

export default function LoginScreen() {
  // Vao thang tu dang xuat (replace) thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'));

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <LoginHeader onBack={goBack} />

        <View style={styles.main}>
          <LoginIntro />
          <LoginForm />
        </View>

        <LoginFooter onLinkCode={() => router.push('/(auth)/link-code')} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: Spacing.four },
  main: { flex: 1, justifyContent: 'center', gap: Spacing.five },
});
