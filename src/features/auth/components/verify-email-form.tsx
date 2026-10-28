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

/** O dan ma xac minh trong email. Viec goi API do container quyet dinh qua `onSubmit`. */
export function VerifyEmailForm({ onSubmit, isPending, error }: VerifyEmailFormProps) {
  const { control, handleSubmit } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: '' },
  });
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="token"
        label="Mã xác minh"
        placeholder="Dán mã, hoặc cả dòng chứa mã"
        leadingIcon="key-outline"
        // Ma phan biet hoa thuong: khong de ban phim tu viet hoa hay tu sua
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
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
