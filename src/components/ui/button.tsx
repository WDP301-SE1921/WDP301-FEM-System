import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { ThemedText } from './themed-text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE = 20;

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Icon dat truoc chu. */
  icon?: IconName;
  /** Icon dat sau chu, thuong la mui ten dieu huong. */
  trailingIcon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  trailingIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background = {
    primary: theme.primary,
    secondary: theme.backgroundElement,
    ghost: 'transparent',
    danger: theme.danger,
  }[variant];

  const textColor = {
    primary: theme.primaryText,
    secondary: theme.text,
    ghost: theme.primary,
    danger: theme.primaryText,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        { backgroundColor: background },
        variant === 'ghost' && { borderWidth: 1, borderColor: theme.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={ICON_SIZE} color={textColor} /> : null}
          <ThemedText type="default" style={{ color: textColor }}>
            {title}
          </ThemedText>
          {trailingIcon ? <Icon name={trailingIcon} size={ICON_SIZE} color={textColor} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, minHeight: 36 },
  md: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, minHeight: 48 },
  lg: { paddingVertical: Spacing.four, paddingHorizontal: Spacing.five, minHeight: 56 },
});
