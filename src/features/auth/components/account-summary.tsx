import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { User } from '@/types/auth';
import { getInitials } from '@/utils/format';

const AVATAR_SIZE = 56;

export type AccountSummaryProps = {
  user: User;
};

/**
 * The tai khoan o man hinh Tai khoan: chu cai dau, ten hien thi va email dang nhap. Voi phu huynh,
 * nhac them email nay la thu nhan vien tra cuu khi dang ky mon cho con (SRS muc 6.1).
 */
export function AccountSummary({ user }: AccountSummaryProps) {
  const theme = useTheme();
  const name = user.displayName ?? user.email;

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.identity}>
        <ThemedView type="primary" style={styles.avatar}>
          <ThemedText type="heading" themeColor="primaryText">
            {getInitials(name)}
          </ThemedText>
        </ThemedView>
        <View style={styles.info}>
          <ThemedText type="default" numberOfLines={1} style={styles.name}>
            {name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" selectable>
            {user.email}
          </ThemedText>
        </View>
      </View>
      {user.role === 'PARENT' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Khi đăng ký môn học cho học sinh tại trung tâm, đọc email này để nhân viên tìm tài khoản
          của bạn.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: Spacing.half },
  name: { fontWeight: 700 },
});
