import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { LoginForm } from '@/features/auth';

export default function LoginScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ThemedText type="title">Đăng nhập</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Đăng nhập để tiếp tục sử dụng FEM System.
        </ThemedText>

        <LoginForm />

        <Link href="/(auth)/register" style={styles.link}>
          <ThemedText type="linkPrimary">Chưa có tài khoản? Đăng ký</ThemedText>
        </Link>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  content: { gap: Spacing.three },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
