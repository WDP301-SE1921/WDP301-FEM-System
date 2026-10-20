import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { useAuth } from '../hooks/use-auth';

const ICON_SIZE = 20;

/**
 * Bao o man dang nhap khi app vua tu dang xuat vi het phien, de phu huynh biet vi sao phai dang nhap
 * lai. Khong het phien thi khong hien gi.
 */
export function SessionExpiredNotice() {
  const { isSessionExpired } = useAuth();
  if (!isSessionExpired) return null;

  return (
    <ThemedView type="accentSoft" accessible accessibilityRole="alert" style={styles.card}>
      <Icon name="time-outline" size={ICON_SIZE} themeColor="accentStrong" />
      <View style={styles.text}>
        <ThemedText type="smallBold">Phiên đăng nhập đã hết hạn</ThemedText>
        <ThemedText type="small">
          Để bảo vệ tài khoản, ứng dụng đã tự đăng xuất. Vui lòng đăng nhập lại.
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
