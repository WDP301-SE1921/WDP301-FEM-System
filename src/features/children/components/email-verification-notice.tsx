import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 24;

export type EmailVerificationNoticeProps = {
  /** Email dang nhap cua phu huynh, noi BE gui ma xac minh. */
  parentEmail: string;
  onVerifyEmail: () => void;
};

/**
 * Thay cho form them con khi phu huynh chua xac minh email: BE tu choi tao ho so
 * (`PARENT_EMAIL_UNVERIFIED`) nen dan phu huynh qua buoc xac minh truoc.
 */
export function EmailVerificationNotice({
  parentEmail,
  onVerifyEmail,
}: EmailVerificationNoticeProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.titleRow}>
        <Icon name="mail-unread-outline" size={ICON_SIZE} themeColor="warning" />
        <ThemedText type="default" accessibilityRole="header" style={styles.title}>
          Cần xác minh email trước
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Trung tâm chỉ nhận hồ sơ học sinh từ tài khoản đã xác minh email. Mã xác minh được gửi tới{' '}
        <ThemedText type="smallBold" selectable>
          {parentEmail}
        </ThemedText>
        .
      </ThemedText>
      <Button
        title="Xác minh email"
        icon="shield-checkmark-outline"
        accessibilityLabel="Xác minh email"
        onPress={onVerifyEmail}
        style={styles.pill}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1, fontWeight: 700 },
  pill: { borderRadius: Radius.full },
});
