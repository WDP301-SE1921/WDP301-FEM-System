import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TONES, type Tone } from '../constants';

import { ToneIcon } from './tone-icon';

const HIGHLIGHT_WIDTH = 6;

export type SectionCardProps = PropsWithChildren<{
  title: string;
  icon: IconName;
  /** Mau icon tieu de. Mac dinh: `primary`. */
  tone?: Tone;
  /** Noi dung o goc phai tieu de, vd nhan trang thai. */
  trailing?: ReactNode;
  /** Vach mau ben trai de lam noi the quan trong nhat man hinh. */
  highlightTone?: Tone;
}>;

/** The mot muc cua trang chu: tieu de co icon, noi dung ben duoi. */
export function SectionCard({
  title,
  icon,
  tone = 'primary',
  trailing,
  highlightTone,
  children,
}: SectionCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      {highlightTone ? (
        <View style={[styles.highlight, { backgroundColor: theme[TONES[highlightTone].color] }]} />
      ) : null}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ToneIcon name={icon} tone={tone} size="sm" />
          <ThemedText
            type="default"
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.title}
          >
            {title}
          </ThemedText>
        </View>
        {trailing}
      </View>

      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleRow: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flexShrink: 1, fontWeight: 700 },
});
