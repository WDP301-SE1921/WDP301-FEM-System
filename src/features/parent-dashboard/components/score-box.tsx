import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { TONES, type Tone } from '../constants';
import { formatScore } from '../utils';

/** Du cho diem hai chu so, vd `10.0`. */
const SCORE_BOX_MIN_WIDTH = 72;

export type ScoreBoxProps = {
  totalScore: number;
  maxScore: number;
  /** Mau theo xep loai diem. */
  tone: Tone;
};

/** O diem lon de doc nhanh, vd `8.5 / 10.0`, dung o the bai da co diem va man chi tiet bai. */
export function ScoreBox({ totalScore, maxScore, tone }: ScoreBoxProps) {
  const { color, soft } = TONES[tone];
  const score = formatScore(totalScore);
  const max = formatScore(maxScore);

  return (
    <ThemedView
      type={soft}
      accessible
      accessibilityLabel={`Điểm ${score} trên ${max}`}
      style={styles.scoreBox}
    >
      <ThemedText type="subtitle" themeColor={color} style={styles.score}>
        {score}
      </ThemedText>
      <ThemedText type="small" themeColor={color}>
        / {max}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scoreBox: {
    minWidth: SCORE_BOX_MIN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.control,
  },
  score: { fontWeight: 700, fontVariant: ['tabular-nums'] },
});
