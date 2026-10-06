import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { useStudentEnrollments } from '../hooks/use-parent-dashboard';
import type { LinkedStudent, SessionRef } from '../types';
import { getRoadmapCourseOptions, getStudyingEnrollments } from '../utils';

import { EnrollmentRoadmap } from './enrollment-roadmap';
import { FilterChips } from './filter-chips';

export type StudentRoadmapProps = {
  student: LinkedStudent;
  onOpenSession: (session: SessionRef) => void;
  onOpenAssignments: () => void;
};

/** Lo trinh bai hoc cac mon con dang hoc: chip chon mon, tong quan tien do va danh sach bai. */
export function StudentRoadmap({ student, onOpenSession, onOpenAssignments }: StudentRoadmapProps) {
  const enrollments = useStudentEnrollments(student.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (enrollments.isPending) return <LoadingState />;
  if (enrollments.isError) {
    return <ErrorState error={enrollments.error} onRetry={() => void enrollments.refetch()} />;
  }

  const studying = getStudyingEnrollments(enrollments.data);
  // Chua chon (hoac mon da chon khong con dang hoc sau khi tai lai) thi xem mon dau tien
  const selected = studying.find(({ id }) => id === selectedId) ?? studying[0];
  if (!selected) {
    return (
      <EmptyState
        title="Chưa có môn đang học"
        description={`Lộ trình bài học sẽ hiện ở đây khi ${getShortName(student.fullName)} đang theo học một lớp.`}
      />
    );
  }

  const courseOptions = getRoadmapCourseOptions(studying);

  return (
    <View style={styles.container}>
      {courseOptions.length > 0 ? (
        <FilterChips options={courseOptions} selected={selected.id} onSelect={setSelectedId} />
      ) : null}
      {/* key theo mon de lo trinh quay ve dang thu gon khi doi mon */}
      <EnrollmentRoadmap
        key={selected.id}
        studentId={student.id}
        enrollment={selected}
        onOpenSession={({ id, startsAt }) =>
          onOpenSession({ studentId: student.id, sessionId: id, startsAt })
        }
        onOpenAssignments={onOpenAssignments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
});
