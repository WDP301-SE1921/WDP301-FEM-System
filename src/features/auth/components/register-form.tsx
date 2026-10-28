import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { FormPasswordInput } from '@/components/common/form-password-input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

import { useRegister } from '../hooks/use-auth';
import { registerSchema, type RegisterInput } from '../schemas';

/** Form dang ky: validate bang Zod, tao tai khoan xong tu dang nhap. */
export function RegisterForm() {
  const register = useRegister();

  const { control, handleSubmit } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => register.mutate(values));

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="displayName"
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        autoComplete="name"
      />
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
        name="phone"
        label="Số điện thoại (không bắt buộc)"
        placeholder="0901 234 567"
        autoComplete="tel"
        keyboardType="phone-pad"
      />
      <FormPasswordInput
        control={control}
        name="password"
        label="Mật khẩu"
        autoComplete="new-password"
      />
      <FormPasswordInput
        control={control}
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        autoComplete="new-password"
      />

      <FormError error={register.error} />

      <Button title="Tạo tài khoản" loading={register.isPending} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
