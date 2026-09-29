import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useStudentDashboard } from '../hooks/use-parent-dashboard';

import { AttendanceStatCard } from './attendance-stat-card';
import { AttentionList } from './attention-list';
import { RecentNotifications } from './recent-notifications';
import { ScoreStatCard } from './score-stat-card';
import { TodaySessions } from './today-sessions';

export type StudentOverviewProps = {
  studentId: string;
  onOpenAssignments: () => void;
  onOpenNotifications: () => void;
};

/** Tong quan hom nay cua con dang chon. */
export function StudentOverview({
  studentId,
  onOpenAssignments,
  onOpenNotifications,
}: StudentOverviewProps) {
  const dashboard = useStudentDashboard(studentId);

  if (dashboard.isPending) return <LoadingState />;
  if (dashboard.isError) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const { todaySessions, attendance, scoreSummary, attentionItems, recentNotifications } =
    dashboard.data;

  return (
    <View style={styles.sections}>
      <TodaySessions sessions={todaySessions} onPrepare={onOpenAssignments} />
      <View style={styles.stats}>
        <AttendanceStatCard attendance={attendance} />
        <ScoreStatCard score={scoreSummary} />
      </View>
      {attentionItems.length > 0 ? (
        <AttentionList items={attentionItems} onOpenAssignments={onOpenAssignments} />
      ) : null}
      <RecentNotifications notifications={recentNotifications} onSeeAll={onOpenNotifications} />
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.three },
});
