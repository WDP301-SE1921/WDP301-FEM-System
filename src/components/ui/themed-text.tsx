import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { FontFamily, Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'default'
  | 'title'
  | 'heading'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: TextVariant;
  /** Mau chu lay tu token theme. Mac dinh: mau rieng cua variant, neu khong co thi `text`. */
  themeColor?: ThemeColor;
};

/** Variant co mau mac dinh khac `text`. */
const VARIANT_COLORS: Partial<Record<TextVariant, ThemeColor>> = {
  linkPrimary: 'primary',
};

type LoadedWeight = 400 | 500 | 600 | 700;

const FAMILY_BY_WEIGHT: Record<LoadedWeight, string> = {
  400: FontFamily.regular,
  500: FontFamily.medium,
  600: FontFamily.semiBold,
  700: FontFamily.bold,
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? VARIANT_COLORS[type] ?? 'text'];
  // RN 0.88 khai bao `flatten` co the tra `undefined`; mang luon co `{ color }` nen thuc te khong rong
  const textStyle: TextStyle = StyleSheet.flatten([{ color }, styles[type], style]) ?? {};

  return <Text style={[textStyle, getFontFace(textStyle)]} {...rest} />;
}

/**
 * File font Be Vietnam Pro hop voi `fontWeight`, `fontStyle` cua style da gop. Tra ve `fontWeight` va
 * `fontStyle` binh thuong vi do dam, chu nghieng da nam trong file font: giu lai thi Android to dam
 * hoac nghieng gia them lan nua. Style tu dat `fontFamily` (vd chu `code`) giu nguyen.
 */
export function getFontFace({ fontFamily, fontWeight, fontStyle }: TextStyle): TextStyle {
  if (fontFamily) return {};
  const family =
    fontStyle === 'italic' ? FontFamily.mediumItalic : FAMILY_BY_WEIGHT[toLoadedWeight(fontWeight)];
  return { fontFamily: family, fontWeight: 'normal', fontStyle: 'normal' };
}

/** Lam tron xuong do dam da nap gan nhat: chi nap 400, 500, 600, 700. */
function toLoadedWeight(weight: TextStyle['fontWeight']): LoadedWeight {
  if (weight === 'bold') return 700;
  const value = typeof weight === 'number' ? weight : Number(weight);
  if (value >= 700) return 700;
  if (value >= 600) return 600;
  if (value >= 500) return 500;
  return 400;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  /** Tieu de khoi noi dung, nho hon `subtitle`. */
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
