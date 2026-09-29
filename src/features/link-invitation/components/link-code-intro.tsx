import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { LINK_CODE_LENGTH } from '../constants';

const ILLUSTRATION_SIZE = 80;
const ILLUSTRATION_INNER_SIZE = 56;
const LOCK_ICON_SIZE = 28;
const BADGE_SIZE = 28;
const BADGE_ICON_SIZE = 16;
const BADGE_BORDER_WIDTH = 2;
const TEXT_MAX_WIDTH = 320;

/** Icon khoa va loi giai thich ma lien ket o dau buoc nhap ma. */
export function LinkCodeIntro() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.illustration}>
        <ThemedView style={styles.illustrationInner}>
          <Icon name="lock-open" size={LOCK_ICON_SIZE} themeColor="accent" />
        </ThemedView>
        <View
          style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}
        >
          <Icon name="checkmark" size={BADGE_ICON_SIZE} themeColor="primaryText" />
        </View>
      </ThemedView>

      <ThemedText type="subtitle" accessibilityRole="header" style={styles.center}>
        Nhập mã liên kết
      </ThemedText>
      <ThemedText type="default" style={[styles.center, styles.text]}>
        Mã gồm {LINK_CODE_LENGTH} ký tự được gửi trong email từ trung tâm EduGrade
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
        Mã liên kết giúp kết nối tài khoản phụ huynh với hồ sơ học sinh của con tại trung tâm.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  illustrationInner: {
    width: ILLUSTRATION_INNER_SIZE,
    height: ILLUSTRATION_INNER_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  center: { textAlign: 'center' },
  text: { maxWidth: TEXT_MAX_WIDTH },
});
