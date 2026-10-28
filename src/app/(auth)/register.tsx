import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { LoginHeader, RegisterForm } from '@/features/auth';

export default function RegisterScreen() {
  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'));

  return (
    <Screen contentStyle={styles.content}>
      <LoginHeader onBack={goBack} />

      <View style={styles.intro}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Tạo tài khoản
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tài khoản của phụ huynh. Học sinh dùng chung tài khoản này để làm bài và xem điểm.
        </ThemedText>
      </View>

      <RegisterForm />

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="linkPrimary">Đã có tài khoản? Đăng nhập</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  intro: { gap: Spacing.one },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
