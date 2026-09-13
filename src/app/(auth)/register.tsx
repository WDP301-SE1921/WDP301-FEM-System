import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { registerSchema, useRegister, type RegisterInput } from '@/features/auth';

export default function RegisterScreen() {
  const register = useRegister();

  const { control, handleSubmit } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => register.mutate(values));

  return (
    <Screen contentStyle={styles.container}>
      <ThemedText type="title">Dang ky</ThemedText>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <Input
            label="Ho va ten"
            placeholder="Nguyen Van A"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
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
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <Input
            label="Xac nhan mat khau"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      {register.error ? (
        <ThemedText type="small" themeColor="danger">
          {register.error.message}
        </ThemedText>
      ) : null}

      <Button title="Tao tai khoan" loading={register.isPending} onPress={onSubmit} />

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="linkPrimary">Da co tai khoan? Dang nhap</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
