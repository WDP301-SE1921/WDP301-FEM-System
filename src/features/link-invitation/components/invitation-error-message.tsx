import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

import { shouldSuggestSignIn } from '../utils';

export type InvitationErrorMessageProps = {
  /** Loi khi kiem tra hoac dung ma (thuong la `mutation.error`). Khong co loi thi khong render. */
  error: unknown;
  /** Bo qua khi phu huynh da dang nhap: khi do khong goi y dang nhap. */
  onSignIn?: () => void;
};

/** Loi cua luong ma lien ket. Loi cho thay phu huynh da co tai khoan thi kem nut dang nhap. */
export function InvitationErrorMessage({ error, onSignIn }: InvitationErrorMessageProps) {
  if (!error) return null;

  return (
    <View style={styles.container}>
      <FormError error={error} />
      {onSignIn && shouldSuggestSignIn(error) ? (
        <Button title="Đăng nhập" variant="secondary" icon="log-in-outline" onPress={onSignIn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
});
