import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useForgotPassword } from '../hooks/use-account';

import { AccountIntro } from './account-intro';
import { ForgotPasswordForm } from './forgot-password-form';

export type ForgotPasswordFlowProps = {
  /** Email da nhap o man dang nhap, dien san vao o email. */
  defaultEmail: string;
  /** Quay ve man dang nhap. */
  onBack: () => void;
};

/**
 * Phu huynh quen mat khau: nhap email de BE gui lien ket dat lai mat khau. Lien ket mo trang web cua
 * trung tam (BE dung `WEB_ORIGIN`), dat mat khau moi xong thi quay lai app dang nhap.
 */
export function ForgotPasswordFlow({ defaultEmail, onBack }: ForgotPasswordFlowProps) {
  const forgotPassword = useForgotPassword();

  if (forgotPassword.isSuccess) {
    return (
      <View style={styles.flow}>
        {/* BE tra thanh cong ca khi email chua dang ky, de khong lo email nao co tai khoan */}
        <AccountIntro icon="mail-open-outline" tone="success" title="Kiểm tra email của bạn">
          Nếu{' '}
          <ThemedText type="smallBold" selectable>
            {forgotPassword.variables.email}
          </ThemedText>{' '}
          là email đăng nhập EduGrade, trung tâm đã gửi liên kết đặt lại mật khẩu. Mở liên kết để
          đặt mật khẩu mới rồi đăng nhập lại. Không thấy email thì xem cả thư rác.
        </AccountIntro>
        <Button
          title="Quay lại đăng nhập"
          trailingIcon="arrow-forward"
          accessibilityLabel="Quay lại đăng nhập"
          onPress={onBack}
          style={styles.pill}
        />
      </View>
    );
  }

  return (
    <View style={styles.flow}>
      <AccountIntro icon="key-outline" tone="primary" title="Quên mật khẩu">
        Nhập email đăng nhập, trung tâm sẽ gửi liên kết để bạn đặt mật khẩu mới.
      </AccountIntro>
      <ForgotPasswordForm
        defaultEmail={defaultEmail}
        onSubmit={(values) => forgotPassword.mutate(values)}
        isPending={forgotPassword.isPending}
        error={forgotPassword.error}
      />
      <Button title="Quay lại đăng nhập" variant="ghost" onPress={onBack} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  pill: { borderRadius: Radius.full },
});
