import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const BACK_ICON_SIZE = 22;
const DOT_SIZE = 8;

export type LoginHeaderProps = {
  onBack: () => void;
};

/** Thanh tren cung man hinh dang nhap: nut quay lai va nhom nguoi dung cua app. */
export function LoginHeader({ onBack }: LoginHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="arrow-back" size={BACK_ICON_SIZE} />
      </Pressable>

      <ThemedView type="backgroundElement" style={styles.roleTag}>
        <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        <ThemedText type="smallBold" themeColor="primary" numberOfLines={1} style={styles.roleText}>
          Phụ huynh & Học sinh
        </ThemedText>
      </ThemedView>

      {/* Giu nhan o giua: can bang voi nut quay lai */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  // Man hinh 320dp hoac chu he thong phong to: nhan co lai giua hai nut thay vi day nut ra ngoai
  roleTag: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  roleText: { flexShrink: 1 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
  spacer: { width: TOUCH_TARGET_SIZE },
});
