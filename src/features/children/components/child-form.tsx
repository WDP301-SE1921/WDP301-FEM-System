import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import type { IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Radius, Spacing } from '@/constants/theme';

import { BIRTH_DATE_LENGTH } from '../constants';
import { addChildSchema, type AddChildInput } from '../schemas';
import type { ChildFormDefaults } from '../types';
import { formatBirthDateInput } from '../utils';

import { GradePicker } from './grade-picker';

const EMPTY_FORM: ChildFormDefaults = { fullName: '', dateOfBirth: '' };

export type ChildFormProps = {
  /** Ho so hien tai khi sua; bo trong khi tao con moi. */
  defaultValues?: ChildFormDefaults;
  submitLabel: string;
  submitIcon: IconName;
  onSubmit: (values: AddChildInput) => void;
  isPending: boolean;
  /** Loi khi luu ho so (thuong la `mutation.error`). */
  error: unknown;
};

/**
 * Form ho so con, dung cho ca tao va sua: ho ten, lop, ngay sinh. Viec goi API do container quyet
 * dinh qua `onSubmit`.
 */
export function ChildForm({
  defaultValues = EMPTY_FORM,
  submitLabel,
  submitIcon,
  onSubmit,
  isPending,
  error,
}: ChildFormProps) {
  const { control, handleSubmit } = useForm<AddChildInput>({
    resolver: zodResolver(addChildSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="fullName"
        label="Họ và tên học sinh"
        placeholder="Nguyễn Minh Anh"
        autoCapitalize="words"
        // Tat goi y de may khong dien ten cua chinh phu huynh
        autoComplete="off"
      />

      {/* Hai field duoi khong dung duoc FormInput: chon lop khong phai o nhap, ngay sinh can
          chen dau `/` khi go nen noi voi form qua Controller */}
      <Controller
        control={control}
        name="grade"
        render={({ field, fieldState }) => (
          <GradePicker
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <Input
            ref={field.ref}
            label="Ngày sinh (không bắt buộc)"
            placeholder="VD: 15/08/2013"
            leadingIcon="calendar-outline"
            keyboardType="number-pad"
            maxLength={BIRTH_DATE_LENGTH}
            value={field.value}
            onChangeText={(text) => field.onChange(formatBirthDateInput(text))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormError error={error} />

      <Button
        title={submitLabel}
        icon={submitIcon}
        loading={isPending}
        onPress={submit}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, gap: Spacing.four },
  submit: { marginTop: 'auto', borderRadius: Radius.full },
});
