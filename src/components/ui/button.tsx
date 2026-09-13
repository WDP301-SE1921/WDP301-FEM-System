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

import { ThemedText } from './themed-text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
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
        <ThemedText type="default" style={{ color: textColor }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
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
