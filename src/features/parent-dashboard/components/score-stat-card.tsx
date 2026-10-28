import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';

import { SCORE_STAT_LABEL as LABEL } from '../constants';
import type { ScoreSummary, ScoreTrend } from '../types';
import { formatScore, formatScoreChange, getScoreLevel, getScoreTrend } from '../utils';

import { StatCard } from './stat-card';
import { ToneBadge } from './tone-badge';

const STAR_ICON_SIZE = 20;
const TREND_ICON_SIZE = 16;

const TRENDS: Record<ScoreTrend, { icon: IconName; color: ThemeColor }> = {
  UP: { icon: 'trending-up', color: 'successStrong' },
  DOWN: { icon: 'trending-down', color: 'dangerStrong' },
  FLAT: { icon: 'remove', color: 'textSecondary' },
};

export type ScoreStatCardProps = {
  score: ScoreSummary | null;
  /** Mo cac bai da co diem cua con. */
  onPress: () => void;
};

export function ScoreStatCard({ score, onPress }: ScoreStatCardProps) {
  if (!score) {
    return (
      <StatCard
        label={LABEL}
        onPress={onPress}
        accessibilityLabel={`${LABEL}: chưa có điểm`}
        accessibilityHint="Xem bài đã có điểm"
      >
        <ThemedText type="subtitle">--</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có điểm
        </ThemedText>
      </StatCard>
    );
  }

  const level = getScoreLevel(score.average);
  const average = formatScore(score.average);
  // Trung binh cong deu moi bai (bai 15 phut ngang bai hoc ky): ghi ro de khong bi hieu la diem tong ket
  const basis = `Trung bình ${score.gradedCount} bài đã chấm`;

  return (
    <StatCard
      label={LABEL}
      trailing={<ToneBadge label={level.label} tone={level.tone} />}
      onPress={onPress}
      accessibilityLabel={`${LABEL} ${average}, ${level.label}. ${basis}`}
      accessibilityHint="Xem bài đã có điểm"
    >
      <View style={styles.value}>
        <ThemedText type="subtitle">{average}</ThemedText>
        <Icon name="star" size={STAR_ICON_SIZE} themeColor="accent" />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {basis}
      </ThemedText>
      <ScoreChange change={score.changeFromLastMonth} />
    </StatCard>
  );
}

function ScoreChange({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Chưa có điểm tháng trước
      </ThemedText>
    );
  }

  const trend = getScoreTrend(change);
  const { icon, color } = TRENDS[trend];
  const label = trend === 'FLAT' ? 'Không đổi' : formatScoreChange(change);

  return (
    <View style={styles.change}>
      <Icon name={icon} size={TREND_ICON_SIZE} themeColor={color} />
      <ThemedText type="small" themeColor={color} style={styles.changeLabel}>
        {label} so với tháng trước
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  change: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  changeLabel: { flexShrink: 1 },
});
