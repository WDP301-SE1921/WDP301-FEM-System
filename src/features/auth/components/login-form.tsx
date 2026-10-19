import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { FormPasswordInput } from '@/components/common/form-password-input';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useLogin } from '../hooks/use-auth';
import { loginSchema, type LoginInput } from '../schemas';

/** Noi rong vung cham cua link chu (cao 20) cho du 44 ma khong day nhan ra xa o nhap. */
const LINK_HIT_SLOP = 12;

export type LoginFormProps = {
  /** Mo man quen mat khau, kem email dang nhap da nhap (co the rong). */
  onForgotPassword: (email: string) => void;
};

/** Form dang nhap: validate bang Zod, dang nhap xong tu chuyen sang (tabs). */
export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const login = useLogin();

  const { control, handleSubmit, setFocus, getValues } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <View style={styles.form}>
      {/* LoginDto cua BE chi nhan email, chua dang nhap duoc bang so dien thoai */}
      <FormInput
        control={control}
        name="email"
        label="Email"
        placeholder="nhap.email@example.com"
        leadingIcon="mail-outline"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('password')}
      />

      <View style={styles.field}>
        {/* Nhan tu dung de dat link quen mat khau cung hang */}
        <View style={styles.labelRow}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Mật khẩu
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            hitSlop={LINK_HIT_SLOP}
            onPress={() => onForgotPassword(getValues('email').trim())}
          >
            <ThemedText type="smallBold" themeColor="primary">
              Quên mật khẩu?
            </ThemedText>
          </Pressable>
        </View>
        <FormPasswordInput
          control={control}
          name="password"
          accessibilityLabel="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          leadingIcon="lock-closed-outline"
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
      </View>

      <FormError error={login.error} />

      <Button
        title="Đăng nhập"
        trailingIcon="arrow-forward"
        loading={login.isPending}
        onPress={onSubmit}
        style={styles.pill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.one },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { borderRadius: Radius.full },
});
