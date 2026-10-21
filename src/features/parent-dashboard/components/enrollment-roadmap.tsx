import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useEnrollmentLessons } from '../hooks/use-parent-dashboard';
import type { SessionLink, StudentEnrollment } from '../types';
import { getAssessmentMarkers, getRoadmapLessons, summarizeRoadmap } from '../utils';

import { RoadmapSummaryCard } from './roadmap-summary-card';
import { RoadmapTimeline } from './roadmap-timeline';

export type EnrollmentRoadmapProps = {
  studentId: string;
  enrollment: StudentEnrollment;
  onOpenSession: (session: SessionLink) => void;
  onOpenAssignments: () => void;
};

/** Lo trinh mot mon cua con: tong quan tien do va cac bai theo thu tu. */
export function EnrollmentRoadmap({
  studentId,
  enrollment,
  onOpenSession,
  onOpenAssignments,
}: EnrollmentRoadmapProps) {
  const lessons = useEnrollmentLessons(studentId, enrollment.id);

  if (lessons.isPending) return <LoadingState />;
  if (lessons.isError) {
    return <ErrorState error={lessons.error} onRetry={() => void lessons.refetch()} />;
  }
  if (lessons.data.length === 0) {
    return (
      <EmptyState
        title="Chưa có lộ trình"
        description={`Trung tâm chưa công bố các bài học của lớp ${enrollment.className}.`}
      />
    );
  }

  const roadmap = getRoadmapLessons(lessons.data);

  return (
    <View style={styles.container}>
      <RoadmapSummaryCard
        enrollment={enrollment}
        summary={summarizeRoadmap(roadmap)}
        markers={getAssessmentMarkers(roadmap)}
      />
      <RoadmapTimeline
        lessons={roadmap}
        enrollment={enrollment}
        onOpenSession={onOpenSession}
        onOpenAssignments={onOpenAssignments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
});
