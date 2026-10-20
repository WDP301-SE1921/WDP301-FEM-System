import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TONES, type Tone } from '../constants';

const HIGHLIGHT_WIDTH = 6;

export type AssignmentCardFrameProps = PropsWithChildren<{
  /** Vach mau ben trai de lam noi bai can chu y, vd bai sap het han. */
  highlightTone?: Tone;
  /** Co thi ca the la nut mo bai; chip trong the chi la nhan cho biet bam thi lam gi. */
  onPress?: () => void;
  /** Ten nut cho trinh doc man hinh, vd `Làm bài: Bài tập chương 2`. */
  accessibilityLabel?: string;
}>;

/** Khung chung cua the bai tap o ca ba tab va dau man chi tiet bai. */
export function AssignmentCardFrame({
  highlightTone,
  onPress,
  accessibilityLabel,
  children,
}: AssignmentCardFrameProps) {
  const theme = useTheme();

  const card = (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      {highlightTone ? (
        <View style={[styles.highlight, { backgroundColor: theme[TONES[highlightTone].color] }]} />
      ) : null}
      {children}
    </ThemedView>
  );
  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
});
