import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const CHEVRON_ICON_SIZE = 16;

export type LoginFooterProps = {
  /** Phu huynh chua co tai khoan: sang luong nhap ma lien ket. */
  onLinkCode: () => void;
};

/** Loi vao cho phu huynh moi: tai khoan phu huynh duoc tao tu ma lien ket trung tam gui. */
export function LoginFooter({ onLinkCode }: LoginFooterProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có tài khoản?
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={onLinkCode}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <ThemedText type="smallBold" themeColor="primary">
            Nhập mã liên kết
          </ThemedText>
          <Icon name="chevron-forward" size={CHEVRON_ICON_SIZE} themeColor="primary" />
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Dành cho Phụ huynh mới nhận mã từ EduGrade
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: {
    minHeight: TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  pressed: { opacity: 0.75 },
  center: { textAlign: 'center' },
});
