import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const ICON_SIZE = 20;

export type PasswordVisibilityToggleProps = {
  isVisible: boolean;
  onToggle: () => void;
};

/** Nut con mat dat cuoi o mat khau (qua prop `trailing` cua `Input`). */
export function PasswordVisibilityToggle({ isVisible, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      onPress={onToggle}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon
        name={isVisible ? 'eye-off-outline' : 'eye-outline'}
        size={ICON_SIZE}
        themeColor="textSecondary"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
