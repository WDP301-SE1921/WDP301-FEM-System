import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type QuestionFrameProps = PropsWithChildren<{
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  prompt: string;
  /** Diem cua cau o goc phai, vd `2 điểm` hoac `1.5 / 2 điểm`. */
  points: string;
}>;

/** Khung mot cau hoi: so thu tu, diem, de bai; phan tra loi hoac ket qua nam ben duoi. */
export function QuestionFrame({ position, prompt, points, children }: QuestionFrameProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="primary">
          Câu {position}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.points}>
          {points}
        </ThemedText>
      </View>
      <ThemedText type="default">{prompt}</ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  points: { fontVariant: ['tabular-nums'] },
});
