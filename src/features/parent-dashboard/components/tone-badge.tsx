import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { TONES, type Tone } from '../constants';

const ICON_SIZE = 14;

export type ToneBadgeProps = {
  label: string;
  tone: Tone;
  /** Icon dat truoc chu, vd nhan "Học bù". */
  icon?: IconName;
};

/** Nhan dang vien thuoc: trang thai buoi hoc, xep loai diem, lop cua con. */
export function ToneBadge({ label, tone, icon }: ToneBadgeProps) {
  const { color, soft } = TONES[tone];

  return (
    <ThemedView type={soft} style={styles.badge}>
      {icon ? <Icon name={icon} size={ICON_SIZE} themeColor={color} /> : null}
      <ThemedText type="smallBold" themeColor={color} numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
});
