import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

import { useLogin } from '../hooks/use-auth';
import { loginSchema, type LoginInput } from '../schemas';

/** Form dang nhap: validate bang Zod, dang nhap xong tu chuyen sang (tabs). */
export function LoginForm() {
  const login = useLogin();

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <FormInput
        control={control}
        name="password"
        label="Mật khẩu"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
      />

      <FormError error={login.error} />

      <Button title="Đăng nhập" loading={login.isPending} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
