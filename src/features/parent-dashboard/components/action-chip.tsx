import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'solid' | 'soft';

const CHIP_HEIGHT = 36;
const ICON_SIZE = 16;
/** Bu phan thieu cua `CHIP_HEIGHT` de vung cham dat 44x44 (design-mobile.md). */
const HIT_SLOP = 4;

const VARIANTS: Record<Variant, { background: ThemeColor; text: ThemeColor }> = {
  solid: { background: 'primary', text: 'primaryText' },
  soft: { background: 'background', text: 'primary' },
};

export type ActionChipProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  /** `solid`: nen mau chinh. `soft`: nen trang, dat tren nen mau nhat. Mac dinh: `solid`. */
  variant?: Variant;
  trailingIcon?: IconName;
};

/**
 * Nut nho dang vien thuoc dat trong the (vd "Xem bài"). `Button` dung chung co chu 16px, qua to
 * khi nam cung hang voi noi dung the tren man hinh hep. Khong co `onPress` thi chi la nhan trang tri
 * cua mot the bam duoc ca the (the da doc ten cho trinh doc man hinh).
 */
export function ActionChip({ label, variant = 'solid', trailingIcon, ...rest }: ActionChipProps) {
  const theme = useTheme();
  const colors = VARIANTS[variant];
  const chipStyle = [styles.chip, { backgroundColor: theme[colors.background] }];
  const content = (
    <>
      <ThemedText type="smallBold" themeColor={colors.text} numberOfLines={1} style={styles.label}>
        {label}
      </ThemedText>
      {trailingIcon ? <Icon name={trailingIcon} size={ICON_SIZE} themeColor={colors.text} /> : null}
    </>
  );

  if (!rest.onPress) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={chipStyle}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [...chipStyle, pressed && styles.pressed]}
      {...rest}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  // O hep (vd nut "Thử lại" trong o so lieu nua be ngang) va chu phong to: cat chu, khong tran o
  label: { flexShrink: 1 },
  pressed: { opacity: 0.75 },
});
