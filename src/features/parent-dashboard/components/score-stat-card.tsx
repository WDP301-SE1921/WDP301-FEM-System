import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';

import type { ScoreSummary, ScoreTrend } from '../types';
import { formatScore, formatScoreChange, getScoreLevel, getScoreTrend } from '../utils';

import { StatCard } from './stat-card';
import { ToneBadge } from './tone-badge';

const LABEL = 'Điểm trung bình';
const STAR_ICON_SIZE = 20;
const TREND_ICON_SIZE = 16;

const TRENDS: Record<ScoreTrend, { icon: IconName; color: ThemeColor }> = {
  UP: { icon: 'trending-up', color: 'success' },
  DOWN: { icon: 'trending-down', color: 'danger' },
  FLAT: { icon: 'remove', color: 'textSecondary' },
};

export type ScoreStatCardProps = {
  score: ScoreSummary | null;
};

export function ScoreStatCard({ score }: ScoreStatCardProps) {
  if (!score) {
    return (
      <StatCard label={LABEL}>
        <ThemedText type="subtitle">--</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có điểm
        </ThemedText>
      </StatCard>
    );
  }

  const level = getScoreLevel(score.average);

  return (
    <StatCard label={LABEL} trailing={<ToneBadge label={level.label} tone={level.tone} />}>
      <View style={styles.value}>
        <ThemedText type="subtitle">{formatScore(score.average)}</ThemedText>
        <Icon name="star" size={STAR_ICON_SIZE} themeColor="accent" />
      </View>
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
