import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { useChangePassword } from '../hooks/use-account';

import { AccountIntro } from './account-intro';
import { ChangePasswordForm } from './change-password-form';

export type ChangePasswordFlowProps = {
  /** Roi man hinh: da doi xong, hoac phu huynh huy. */
  onDone: () => void;
};

/** Doi mat khau tai khoan dang dang nhap. BE giu phien tren may nay va dang xuat cac thiet bi khac. */
export function ChangePasswordFlow({ onDone }: ChangePasswordFlowProps) {
  const changePassword = useChangePassword();

  if (changePassword.isSuccess) {
    return (
      <View style={styles.flow}>
        <AccountIntro icon="checkmark-circle" tone="success" title="Đã đổi mật khẩu">
          Lần sau đăng nhập, hãy dùng mật khẩu mới. Các thiết bị khác đang đăng nhập tài khoản này
          đã được đăng xuất.
        </AccountIntro>
        <Button title="Xong" accessibilityLabel="Xong" onPress={onDone} style={styles.pill} />
      </View>
    );
  }

  return (
    <View style={styles.flow}>
      <AccountIntro icon="lock-closed-outline" tone="primary" title="Đổi mật khẩu">
        Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.
      </AccountIntro>
      <ChangePasswordForm
        onSubmit={(values) => changePassword.mutate(values)}
        isPending={changePassword.isPending}
        error={changePassword.error}
      />
      <Button title="Huỷ" variant="ghost" onPress={onDone} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  pill: { borderRadius: Radius.full },
});
