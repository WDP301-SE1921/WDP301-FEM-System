import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { linkCodeSchema, type LinkCodeInput } from '../schemas';

import { FindCodeTip } from './find-code-tip';
import { InvitationErrorMessage } from './invitation-error-message';
import { LinkCodeField } from './link-code-field';

export type LinkCodeFormProps = {
  onSubmit: (code: string) => void;
  /**
   * Loi cho thay phu huynh da co tai khoan (vd ma da dung): chuyen sang dang nhap.
   * Bo qua khi phu huynh da dang nhap.
   */
  onSignIn?: () => void;
  isPending: boolean;
  /** Loi khi kiem tra ma (thuong la `mutation.error`). */
  error: unknown;
};

/** Form nhap ma lien ket. Viec goi API do container quyet dinh qua `onSubmit`. */
export function LinkCodeForm({ onSubmit, onSignIn, isPending, error }: LinkCodeFormProps) {
  const { control, handleSubmit } = useForm<LinkCodeInput>({
    resolver: zodResolver(linkCodeSchema),
    defaultValues: { code: '' },
  });
  const submit = handleSubmit(({ code }) => onSubmit(code));

  return (
    <View style={styles.form}>
      {/* FormInput chi boc Input mot dong nen o nhap chia o noi voi form qua Controller */}
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <LinkCodeField
            ref={field.ref}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={submit}
            error={fieldState.error?.message}
          />
        )}
      />

      <InvitationErrorMessage error={error} onSignIn={onSignIn} />

      <FindCodeTip />

      <View style={styles.actions}>
        <Button
          title="Tiếp tục"
          trailingIcon="arrow-forward"
          loading={isPending}
          onPress={submit}
          style={styles.pill}
        />
        {/* BE chua co endpoint cho phu huynh xin lai ma, chi quan ly cap lai (§6.6) */}
        <View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Chưa nhận được email từ EduGrade?
          </ThemedText>
          <ThemedText type="small" style={styles.center}>
            Liên hệ trung tâm để được cấp lại mã mới.
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, gap: Spacing.four },
  actions: { marginTop: 'auto', gap: Spacing.three },
  pill: { borderRadius: Radius.full },
  center: { textAlign: 'center' },
});
