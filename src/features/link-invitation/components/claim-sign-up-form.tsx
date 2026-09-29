import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormInput } from '@/components/common/form-input';
import { PasswordVisibilityToggle } from '@/components/common/password-visibility-toggle';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { claimSignUpSchema, type ClaimSignUpInput } from '../schemas';

import { InvitationEmailField } from './invitation-email-field';
import { InvitationErrorMessage } from './invitation-error-message';
import { TermsCheckbox } from './terms-checkbox';

const MATCH_ICON_SIZE = 20;
/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;

export type ClaimSignUpFormProps = {
  /** Email da che tu buoc kiem tra ma (p***@example.com). Chi de hien, BE tu lay email tu ma. */
  maskedEmail: string;
  onSubmit: (password: string) => void;
  /** Phu huynh da co tai khoan: chuyen sang dang nhap. */
  onSignIn: () => void;
  isPending: boolean;
  /** Loi khi tao tai khoan (thuong la `mutation.error`). */
  error: unknown;
};

/** Form dat mat khau cho phu huynh moi. Viec goi API do container quyet dinh qua `onSubmit`. */
export function ClaimSignUpForm({
  maskedEmail,
  onSubmit,
  onSignIn,
  isPending,
  error,
}: ClaimSignUpFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { control, handleSubmit } = useForm<ClaimSignUpInput>({
    resolver: zodResolver(claimSignUpSchema),
    defaultValues: { password: '', confirmPassword: '', acceptTerms: false },
  });
  const [password, confirmPassword] = useWatch({ control, name: ['password', 'confirmPassword'] });
  const isPasswordConfirmed = confirmPassword.length > 0 && confirmPassword === password;
  const submit = handleSubmit((values) => onSubmit(values.password));

  return (
    <View style={styles.form}>
      <View style={styles.fields}>
        <InvitationEmailField maskedEmail={maskedEmail} />

        <FormInput
          control={control}
          name="password"
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự"
          leadingIcon="lock-closed-outline"
          secureTextEntry={!isPasswordVisible}
          autoComplete="new-password"
          trailing={
            <PasswordVisibilityToggle
              isVisible={isPasswordVisible}
              onToggle={() => setIsPasswordVisible((isVisible) => !isVisible)}
            />
          }
        />
        <FormInput
          control={control}
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          leadingIcon="shield-checkmark-outline"
          secureTextEntry={!isPasswordVisible}
          autoComplete="new-password"
          trailing={
            isPasswordConfirmed ? (
              <Icon
                name="checkmark-circle"
                size={MATCH_ICON_SIZE}
                themeColor="success"
                accessibilityLabel="Mật khẩu xác nhận đã khớp"
              />
            ) : null
          }
        />

        {/* FormInput chi boc o nhap chu nen checkbox noi voi form qua Controller */}
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <TermsCheckbox
              isChecked={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      <InvitationErrorMessage error={error} onSignIn={onSignIn} />

      <View style={styles.actions}>
        <Button
          title="Tạo tài khoản"
          trailingIcon="arrow-forward"
          loading={isPending}
          onPress={submit}
          style={styles.pill}
        />
        <View style={styles.signInRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Đã có tài khoản?
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={onSignIn} style={styles.signInLink}>
            <ThemedText type="smallBold" themeColor="primary">
              Đăng nhập
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, gap: Spacing.four },
  fields: { gap: Spacing.three },
  actions: { marginTop: 'auto', gap: Spacing.two },
  pill: { borderRadius: Radius.full },
  signInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signInLink: {
    minHeight: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
});
