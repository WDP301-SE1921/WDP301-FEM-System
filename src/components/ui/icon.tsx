import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconProps = ComponentProps<typeof Ionicons> & {
  /** Mau lay tu token theme, bi bo qua khi truyen `color`. Mac dinh: `text`. */
  themeColor?: ThemeColor;
};

/** Icon theo theme. Boc Ionicons de doi bo icon chi phai sua mot file. */
export function Icon({ themeColor = 'text', color, ...rest }: IconProps) {
  const theme = useTheme();

  return <Ionicons color={color ?? theme[themeColor]} {...rest} />;
}
