import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { PasswordVisibilityToggle } from '@/components/common/password-visibility-toggle';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useLogin } from '../hooks/use-auth';
import { loginSchema, type LoginInput } from '../schemas';

/** Noi rong vung cham cua link chu (cao 20) cho du 44 ma khong day nhan ra xa o nhap. */
const LINK_HIT_SLOP = 12;

/** BE chua co luong quen mat khau (chi co register/login/refresh/logout/me): phai nho trung tam. */
function showForgotPasswordHelp() {
  Alert.alert('Quên mật khẩu?', 'Vui lòng liên hệ trung tâm EduGrade để được đặt lại mật khẩu.');
}

/** Form dang nhap: validate bang Zod, dang nhap xong tu chuyen sang (tabs). */
export function LoginForm() {
  const login = useLogin();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { control, handleSubmit, setFocus } = useForm<LoginInput>({
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
            onPress={showForgotPasswordHelp}
          >
            <ThemedText type="smallBold" themeColor="primary">
              Quên mật khẩu?
            </ThemedText>
          </Pressable>
        </View>
        <FormInput
          control={control}
          name="password"
          accessibilityLabel="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          leadingIcon="lock-closed-outline"
          secureTextEntry={!isPasswordVisible}
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          trailing={
            <PasswordVisibilityToggle
              isVisible={isPasswordVisible}
              onToggle={() => setIsPasswordVisible((isVisible) => !isVisible)}
            />
          }
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
