import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius } from '@/constants/theme';

import { TONES, type Tone } from '../constants';

type Variant = 'soft' | 'solid';
type Size = 'sm' | 'md' | 'lg';

const ICON_SIZES: Record<Size, number> = { sm: 16, md: 18, lg: 24 };

export type ToneIconProps = {
  name: IconName;
  tone: Tone;
  /** `soft`: nen nhat, icon cung mau. `solid`: nen dam, icon trang. */
  variant?: Variant;
  size?: Size;
};

/** Icon trong nen tron theo sac thai, dung o tieu de the va dau moi dong. */
export function ToneIcon({ name, tone, variant = 'soft', size = 'md' }: ToneIconProps) {
  // Mau dam cua sac thai cho ca nen dac lan icon tren nen nhat: mau goc (vd vang) qua nhat de icon
  // trang hoac icon cung mau tren nen nhat con nhin ro
  const { text, soft } = TONES[tone];
  const isSolid = variant === 'solid';

  return (
    <ThemedView type={isSolid ? text : soft} style={[styles.circle, sizeStyles[size]]}>
      <Icon name={name} size={ICON_SIZES[size]} themeColor={isSolid ? 'primaryText' : text} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
});

const sizeStyles = StyleSheet.create({
  sm: { width: 28, height: 28 },
  md: { width: 36, height: 36 },
  lg: { width: 48, height: 48 },
});
