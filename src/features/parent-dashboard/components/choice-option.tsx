import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ChoiceState } from '../types';

/** Cao bang o nhap `Input`, du vung cham 44 (design-mobile.md). */
const OPTION_MIN_HEIGHT = 48;
const ICON_SIZE = 20;

type Appearance = {
  border: ThemeColor;
  background: ThemeColor;
  icon: IconName;
  iconColor: ThemeColor;
  /** Doc kem lua chon khi xem lai bai, de khong chi phan biet bang mau. */
  note: string | null;
};

const APPEARANCES: Record<ChoiceState, Appearance> = {
  IDLE: {
    border: 'border',
    background: 'background',
    icon: 'ellipse-outline',
    iconColor: 'textSecondary',
    note: null,
  },
  SELECTED: {
    border: 'primary',
    background: 'primarySoft',
    icon: 'radio-button-on',
    iconColor: 'primary',
    note: 'con đã chọn',
  },
  CORRECT: {
    border: 'success',
    background: 'successSoft',
    icon: 'checkmark-circle',
    iconColor: 'success',
    note: 'đáp án đúng',
  },
  WRONG: {
    border: 'danger',
    background: 'dangerSoft',
    icon: 'close-circle',
    iconColor: 'danger',
    note: 'con đã chọn, chưa đúng',
  },
};

export type ChoiceOptionProps = {
  label: string;
  state: ChoiceState;
  /** Co thi la o chon khi lam bai; khong co thi chi de xem lai bai da nop. */
  onPress?: () => void;
};

/** Mot lua chon cua cau trac nghiem, dung khi lam bai (bam de chon) va khi xem lai bai. */
export function ChoiceOption({ label, state, onPress }: ChoiceOptionProps) {
  const theme = useTheme();
  const { border, background, icon, iconColor, note } = APPEARANCES[state];
  const boxStyle = [
    styles.option,
    { borderColor: theme[border], backgroundColor: theme[background] },
  ];
  const content = (
    <>
      <Icon name={icon} size={ICON_SIZE} themeColor={iconColor} />
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={note ? `${label}, ${note}` : label} style={boxStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: state === 'SELECTED' }}
      onPress={onPress}
      style={({ pressed }) => [...boxStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: OPTION_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.control,
  },
  pressed: { opacity: 0.75 },
  label: { flex: 1 },
});
