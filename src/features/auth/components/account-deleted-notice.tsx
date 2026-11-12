import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { useAuth } from '../hooks/use-auth';

const ICON_SIZE = 20;

/** Bao o man chao ngay sau khi phu huynh xoa tai khoan. Khong vua xoa thi khong hien gi. */
export function AccountDeletedNotice() {
  const { isAccountDeleted } = useAuth();
  if (!isAccountDeleted) return null;

  return (
    <ThemedView type="successSoft" accessible accessibilityRole="alert" style={styles.card}>
      <Icon name="checkmark-circle" size={ICON_SIZE} themeColor="successStrong" />
      <View style={styles.text}>
        <ThemedText type="smallBold">Đã xóa tài khoản</ThemedText>
        <ThemedText type="small">
          Thông tin cá nhân của bạn đã được xóa và mọi thiết bị đã được đăng xuất.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1, gap: Spacing.half },
});
