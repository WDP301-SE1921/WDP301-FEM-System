import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { RegisterForm } from '@/features/auth';

export default function RegisterScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <ThemedText type="title">Đăng ký</ThemedText>

      <RegisterForm />

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="linkPrimary">Đã có tài khoản? Đăng nhập</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
