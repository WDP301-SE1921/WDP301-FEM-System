import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { toDateKey } from '@/utils/date';

import { useAttendanceSummary, useStudentSchedule } from '../hooks/use-parent-dashboard';
import type { ParentDestination } from '../types';

import { AttendanceStatCard } from './attendance-stat-card';
import { StudentAttention } from './student-attention';
import { StudentRecentNotifications } from './student-recent-notifications';
import { StudentScoreStat } from './student-score-stat';
import { TodaySessions } from './today-sessions';

export type StudentOverviewProps = {
  studentId: string;
  onOpenNotifications: () => void;
  /** Mo man hinh cua the duoc bam, theo con dang xem. */
  onOpenDestination: (destination: ParentDestination) => void;
};

/**
 * Tong quan hom nay cua con dang chon, ghep tu cac route that cua BE (BE khong co route tong quan).
 * Phan chinh (buoi hom nay, ty le di hoc) tai loi thi ca khoi bao loi. Phan phu (diem trung binh, viec
 * can chu y, thong bao moi) tu tai va tu bao loi trong the cua minh, de mot route phu loi khong che mat
 * lich hoc cua con. The nao cung bam duoc de mo phan chi tiet tuong ung.
 */
export function StudentOverview({
  studentId,
  onOpenNotifications,
  onOpenDestination,
}: StudentOverviewProps) {
  const today = toDateKey(new Date());
  const todaySessions = useStudentSchedule(studentId, { from: today, to: today });
  const attendance = useAttendanceSummary(studentId);

  if (todaySessions.isPending || attendance.isPending) return <LoadingState />;
  if (todaySessions.isError) {
    return <ErrorState error={todaySessions.error} onRetry={() => void todaySessions.refetch()} />;
  }
  if (attendance.isError) {
    return <ErrorState error={attendance.error} onRetry={() => void attendance.refetch()} />;
  }

  return (
    <View style={styles.sections}>
      <TodaySessions
        sessions={todaySessions.data}
        onOpenSession={(sessionId) => onOpenDestination({ kind: 'SESSION', studentId, sessionId })}
        onPrepare={() => onOpenDestination({ kind: 'ASSIGNMENTS', studentId, tab: 'TODO' })}
      />
      <View style={styles.stats}>
        <AttendanceStatCard
          attendance={attendance.data}
          onPress={() => onOpenDestination({ kind: 'SCHEDULE', studentId, view: 'ATTENDANCE' })}
        />
        <StudentScoreStat
          studentId={studentId}
          onPress={() => onOpenDestination({ kind: 'ASSIGNMENTS', studentId, tab: 'GRADED' })}
        />
      </View>
      <StudentAttention studentId={studentId} onOpenDestination={onOpenDestination} />
      <StudentRecentNotifications
        studentId={studentId}
        onOpenNotification={onOpenDestination}
        onSeeAll={onOpenNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.three },
});
