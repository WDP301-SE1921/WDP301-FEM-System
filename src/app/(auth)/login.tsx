import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { loginSchema, useLogin, type LoginInput } from '@/features/auth';

export default function LoginScreen() {
  const login = useLogin();

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <Screen contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}
      >
        <ThemedText type="title">Dang nhap</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Dang nhap de tiep tuc su dung FEM System.
        </ThemedText>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Input
              label="Mat khau"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        {login.error ? (
          <ThemedText type="small" themeColor="danger">
            {login.error.message}
          </ThemedText>
        ) : null}

        <Button title="Dang nhap" loading={login.isPending} onPress={onSubmit} />

        <Link href="/(auth)/register" style={styles.link}>
          <ThemedText type="linkPrimary">Chua co tai khoan? Dang ky</ThemedText>
        </Link>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  form: { gap: Spacing.three },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
