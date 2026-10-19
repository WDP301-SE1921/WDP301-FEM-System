import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { Spacing } from '@/constants/theme';
import { LoginFooter, LoginForm, LoginHeader, LoginIntro } from '@/features/auth';

export default function LoginScreen() {
  // Vao thang tu dang xuat (replace) thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'));

  return (
    <Screen contentStyle={styles.content}>
      <LoginHeader onBack={goBack} />

      <View style={styles.main}>
        <LoginIntro />
        <LoginForm
          onForgotPassword={(email) =>
            router.push({ pathname: '/(auth)/forgot-password', params: { email } })
          }
        />
      </View>

      <LoginFooter onRegister={() => router.push('/(auth)/register')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  main: { flex: 1, justifyContent: 'center', gap: Spacing.five },
});
