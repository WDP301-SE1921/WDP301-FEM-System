import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

const LOCK_ICON_SIZE = 20;
const HINT_ICON_SIZE = 16;

export type InvitationEmailFieldProps = {
  /** Email da che tu buoc kiem tra ma (p***@example.com). */
  maskedEmail: string;
};

/**
 * Email dang nhap cua tai khoan sap tao. Chi doc: BE lay email co dinh tu ma va chan
 * field thua (§6.4), nen client khong cho sua va khong gui email.
 */
export function InvitationEmailField({ maskedEmail }: InvitationEmailFieldProps) {
  return (
    <View style={styles.container}>
      <Input
        label="Email phụ huynh"
        value={maskedEmail}
        editable={false}
        leadingIcon="mail-outline"
        trailing={<Icon name="lock-closed" size={LOCK_ICON_SIZE} themeColor="textSecondary" />}
      />
      <View style={styles.hint}>
        <Icon name="information-circle-outline" size={HINT_ICON_SIZE} themeColor="primary" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
          Email nhận mã liên kết, dùng để đăng nhập và nhận thông báo
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  hint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  hintText: { flex: 1 },
});
