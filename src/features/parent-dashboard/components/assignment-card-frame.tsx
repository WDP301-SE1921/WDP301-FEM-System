import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TONES, type Tone } from '../constants';

const HIGHLIGHT_WIDTH = 6;

export type AssignmentCardFrameProps = PropsWithChildren<{
  /** Vach mau ben trai de lam noi bai can chu y, vd bai sap het han. */
  highlightTone?: Tone;
}>;

/** Khung chung cua the bai tap o ca ba tab. */
export function AssignmentCardFrame({ highlightTone, children }: AssignmentCardFrameProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      {highlightTone ? (
        <View style={[styles.highlight, { backgroundColor: theme[TONES[highlightTone].color] }]} />
      ) : null}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
});
