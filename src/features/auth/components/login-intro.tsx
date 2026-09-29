import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LOGO_RING_SIZE = 80;
const LOGO_RING_WIDTH = Spacing.one;
const LOGO_BORDER_WIDTH = 2;
const BADGE_SIZE = 24;
const BADGE_ICON_SIZE = 14;
const BADGE_BORDER_WIDTH = 2;
const TEXT_MAX_WIDTH = 300;

/** Logo, tieu de va loi gioi thieu o dau man hinh dang nhap. */
export function LoginIntro() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Thiet ke dung vien gradient, nhung repo chua co thu vien gradient nen dung mau primary */}
      <View style={[styles.logoRing, { backgroundColor: theme.primary }]}>
        <Image
          source={require('@/assets/images/edugrade-logo.jpg')}
          style={[styles.logo, { borderColor: theme.background }]}
          contentFit="cover"
          accessibilityLabel="Logo EduGrade"
        />
        <View
          style={[styles.badge, { backgroundColor: theme.success, borderColor: theme.background }]}
        >
          <Icon name="checkmark" size={BADGE_ICON_SIZE} themeColor="primaryText" />
        </View>
      </View>

      <ThemedText type="subtitle" accessibilityRole="header">
        Đăng nhập
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        Truy cập hệ thống quản lý học tập và thông báo con tại{' '}
        <ThemedText type="smallBold" themeColor="primary">
          EduGrade
        </ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  logoRing: {
    width: LOGO_RING_SIZE,
    height: LOGO_RING_SIZE,
    padding: LOGO_RING_WIDTH,
    borderRadius: Radius.full,
    marginBottom: Spacing.one,
  },
  logo: {
    flex: 1,
    borderRadius: Radius.full,
    borderWidth: LOGO_BORDER_WIDTH,
  },
  badge: {
    position: 'absolute',
    right: -Spacing.one,
    bottom: -Spacing.one,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: Radius.full,
    borderWidth: BADGE_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { maxWidth: TEXT_MAX_WIDTH, textAlign: 'center' },
});
