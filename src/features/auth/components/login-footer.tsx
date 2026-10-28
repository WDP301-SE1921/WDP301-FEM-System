import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const CHEVRON_ICON_SIZE = 16;

export type LoginFooterProps = {
  /** Phu huynh chua co tai khoan: sang man hinh dang ky. */
  onRegister: () => void;
};

/**
 * Loi vao cho phu huynh moi. BE chi cho tu dang ky tai khoan PARENT; hoc sinh khong co tai khoan rieng,
 * giao vien va nhan su trung tam khong dung app mobile.
 */
export function LoginFooter({ onRegister }: LoginFooterProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onRegister}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        {/*
          Ca cau la mot doan chu rong het hang. Tach "Đăng ký" thanh Text rieng thi Text do rong
          vua khit chu, Android day chu "ký" xuong dong hai roi cat mat.
        */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Chưa có tài khoản?{' '}
          <ThemedText type="smallBold" themeColor="primary">
            Đăng ký
          </ThemedText>{' '}
          <Icon name="chevron-forward" size={CHEVRON_ICON_SIZE} themeColor="primary" />
        </ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Học sinh dùng chung tài khoản của phụ huynh. Giáo viên và nhân viên trung tâm dùng EduGrade
        trên web.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  link: { minHeight: TOUCH_TARGET_SIZE, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  center: { textAlign: 'center' },
});
