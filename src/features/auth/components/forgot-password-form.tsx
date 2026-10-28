import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';

export type ForgotPasswordFormProps = {
  /** Email da nhap o man dang nhap, rong khi chua nhap. */
  defaultEmail: string;
  onSubmit: (values: ForgotPasswordInput) => void;
  isPending: boolean;
  /** Loi khi gui yeu cau (thuong la `mutation.error`). */
  error: unknown;
};

/** O nhap email nhan lien ket dat lai mat khau. Viec goi API do container quyet dinh qua `onSubmit`. */
export function ForgotPasswordForm({
  defaultEmail,
  onSubmit,
  isPending,
  error,
}: ForgotPasswordFormProps) {
  const { control, handleSubmit } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  });
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="email"
        label="Email đăng nhập"
        placeholder="nhap.email@example.com"
        leadingIcon="mail-outline"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={submit}
      />

      <FormError error={error} />

      <Button
        title="Gửi liên kết đặt lại"
        icon="send-outline"
        accessibilityLabel="Gửi liên kết đặt lại"
        loading={isPending}
        onPress={submit}
        style={styles.pill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  pill: { borderRadius: Radius.full },
});
