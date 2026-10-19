import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { accountProfileSchema, type AccountProfileInput } from '../schemas';

export type AccountProfileFormProps = {
  defaultValues: AccountProfileInput;
  onSubmit: (values: AccountProfileInput) => void;
  isPending: boolean;
  /** Loi khi luu (thuong la `mutation.error`). */
  error: unknown;
};

/** Ten hien thi va so dien thoai moi. Viec goi API do container quyet dinh qua `onSubmit`. */
export function AccountProfileForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
}: AccountProfileFormProps) {
  const { control, handleSubmit, setFocus } = useForm<AccountProfileInput>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="displayName"
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        leadingIcon="person-outline"
        autoComplete="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('phone')}
      />
      <FormInput
        control={control}
        name="phone"
        label="Số điện thoại mới (không bắt buộc)"
        placeholder="Bỏ trống để giữ số đã lưu"
        leadingIcon="call-outline"
        autoComplete="tel"
        keyboardType="phone-pad"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <FormError error={error} />

      <Button
        title="Lưu thay đổi"
        icon="checkmark"
        accessibilityLabel="Lưu thay đổi"
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
