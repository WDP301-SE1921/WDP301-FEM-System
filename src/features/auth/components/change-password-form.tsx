import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { changePasswordSchema, type ChangePasswordInput } from '../schemas';

export type ChangePasswordFormProps = {
  onSubmit: (values: ChangePasswordInput) => void;
  isPending: boolean;
  /** Loi khi doi mat khau (thuong la `mutation.error`). */
  error: unknown;
};

/** Mat khau hien tai, mat khau moi va xac nhan. Viec goi API do container quyet dinh qua `onSubmit`. */
export function ChangePasswordForm({ onSubmit, isPending, error }: ChangePasswordFormProps) {
  const { control, handleSubmit, setFocus } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="currentPassword"
        label="Mật khẩu hiện tại"
        leadingIcon="lock-closed-outline"
        secureTextEntry
        autoComplete="current-password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('newPassword')}
      />
      <FormInput
        control={control}
        name="newPassword"
        label="Mật khẩu mới"
        leadingIcon="key-outline"
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('confirmPassword')}
      />
      <FormInput
        control={control}
        name="confirmPassword"
        label="Nhập lại mật khẩu mới"
        leadingIcon="key-outline"
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <FormError error={error} />

      <Button
        title="Đổi mật khẩu"
        icon="checkmark"
        accessibilityLabel="Đổi mật khẩu"
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
