import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ToneBadge } from './tone-badge';

export type QuestionFrameProps = PropsWithChildren<{
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  prompt: string;
  /** Diem cua cau o goc phai, vd `2 điểm` hoac `1.5 / 2 điểm`. */
  points: string;
  /** Con bam nop khi cau nay chua tra loi: vien do va nhan "Chưa trả lời". */
  isMissing?: boolean;
}>;

/** Khung mot cau hoi: so thu tu, diem, de bai; phan tra loi hoac ket qua nam ben duoi. */
export function QuestionFrame({
  position,
  prompt,
  points,
  isMissing = false,
  children,
}: QuestionFrameProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        { borderColor: isMissing ? theme.danger : theme.border },
        isMissing && styles.missing,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.position}>
          <ThemedText type="smallBold" themeColor="primary">
            Câu {position}
          </ThemedText>
          {isMissing ? <ToneBadge label="Chưa trả lời" tone="danger" icon="alert-circle" /> : null}
        </View>
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
  position: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  points: { fontVariant: ['tabular-nums'] },
  missing: { borderWidth: 2 },
});
