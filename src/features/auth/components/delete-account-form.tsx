import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormPasswordInput } from '@/components/common/form-password-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { deleteAccountSchema, type DeleteAccountInput } from '../schemas';

export type DeleteAccountFormProps = {
  /** Mat khau da hop le; container hoi lai lan cuoi roi moi goi API. */
  onSubmit: (values: DeleteAccountInput) => void;
  isPending: boolean;
  /** Loi khi xoa tai khoan (thuong la `mutation.error`), vd sai mat khau. */
  error: unknown;
};

/** Nhap lai mat khau de xac nhan xoa tai khoan. */
export function DeleteAccountForm({ onSubmit, isPending, error }: DeleteAccountFormProps) {
  const { control, handleSubmit } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });
  // Goi khong kem su kien: su kien bam cua RN 0.88 khong con khop kieu su kien DOM ma react-hook-form nhan
  const submit = () => handleSubmit(onSubmit)();

  return (
    <View style={styles.form}>
      <FormPasswordInput
        control={control}
        name="password"
        label="Mật khẩu hiện tại"
        leadingIcon="lock-closed-outline"
        autoComplete="current-password"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <FormError error={error} />

      <Button
        title="Xóa tài khoản"
        variant="danger"
        icon="trash-outline"
        accessibilityLabel="Xóa tài khoản"
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
