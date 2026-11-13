import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { verifyEmailSchema, type VerifyEmailInput } from '../schemas';

export type VerifyEmailFormProps = {
  onSubmit: (values: VerifyEmailInput) => void;
  isPending: boolean;
  /** Loi khi xac minh (thuong la `mutation.error`). */
  error: unknown;
};

/** O nhap ma 6 so trong email. Viec goi API do container quyet dinh qua `onSubmit`. */
export function VerifyEmailForm({ onSubmit, isPending, error }: VerifyEmailFormProps) {
  const { control, handleSubmit } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  });
  // Goi khong kem su kien: su kien bam cua RN 0.88 khong con khop kieu su kien DOM ma react-hook-form nhan
  const submit = () => handleSubmit(onSubmit)();

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="code"
        label="Mã xác minh"
        placeholder="6 chữ số trong email"
        leadingIcon="key-outline"
        keyboardType="number-pad"
        // iOS goi y ma tu ung dung Mail, Android goi y ma tu thong bao
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <FormError error={error} />

      <Button
        title="Xác minh email"
        icon="shield-checkmark-outline"
        accessibilityLabel="Xác minh email"
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
