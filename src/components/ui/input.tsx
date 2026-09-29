import type { ReactNode, Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { ThemedText } from './themed-text';

const ADORNMENT_ICON_SIZE = 20;
/** Be ngang danh cho icon hai dau o: du cho vung cham 44 cua nut dat o cuoi. */
const ADORNMENT_WIDTH = 52;

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Icon trang tri o dau o nhap. */
  leadingIcon?: IconName;
  /** Phan tu o cuoi o nhap (nut hien mat khau, dau tich...), can giua trong `ADORNMENT_WIDTH`. */
  trailing?: ReactNode;
  ref?: Ref<TextInput>;
};

export function Input({ label, error, leadingIcon, trailing, style, ref, ...rest }: InputProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}

      <View>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: error ? theme.danger : theme.border,
            },
            leadingIcon ? styles.withLeading : null,
            trailing ? styles.withTrailing : null,
            style,
          ]}
          {...rest}
        />

        {leadingIcon ? (
          <View style={[styles.adornment, styles.leading]}>
            <Icon name={leadingIcon} size={ADORNMENT_ICON_SIZE} themeColor="textSecondary" />
          </View>
        ) : null}
        {trailing ? <View style={[styles.adornment, styles.trailing]}>{trailing}</View> : null}
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one, width: '100%' },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    minHeight: 48,
  },
  withLeading: { paddingLeft: ADORNMENT_WIDTH },
  withTrailing: { paddingRight: ADORNMENT_WIDTH },
  adornment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ADORNMENT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon chi de trang tri: cham vao van focus o nhap ben duoi
  leading: { left: 0, pointerEvents: 'none' },
  trailing: { right: 0 },
});
