import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { useStudentEnrollments } from '../hooks/use-parent-dashboard';
import type { CourseFilter, LinkedStudent, SessionRef } from '../types';
import {
  countCoursesByStatus,
  filterEnrollments,
  getCourseFilterOptions,
  sortEnrollments,
} from '../utils';

import { CourseCard } from './course-card';
import { CourseSummaryCard } from './course-summary-card';
import { FilterChips } from './filter-chips';

export type StudentCoursesProps = {
  student: LinkedStudent;
  onOpenSession: (session: SessionRef) => void;
};

/** Cac mon con da ghi danh: tong quan theo trang thai, chip loc va the tung mon. */
export function StudentCourses({ student, onOpenSession }: StudentCoursesProps) {
  const enrollments = useStudentEnrollments(student.id);
  const [filter, setFilter] = useState<CourseFilter>('ALL');

  if (enrollments.isPending) return <LoadingState />;
  if (enrollments.isError) {
    return <ErrorState error={enrollments.error} onRetry={() => void enrollments.refetch()} />;
  }
  if (enrollments.data.length === 0) {
    return (
      <EmptyState
        title="Chưa có môn học"
        description={`${getShortName(student.fullName)} chưa được xếp vào lớp nào. Môn học sẽ hiện ở đây khi trung tâm xếp lớp.`}
      />
    );
  }

  const sorted = sortEnrollments(enrollments.data);
  const counts = countCoursesByStatus(sorted);
  const filterOptions = getCourseFilterOptions(counts);
  // Du lieu tai lai co the khong con mon nao thuoc bo loc dang chon: quay ve xem tat ca
  const activeFilter = filterOptions.some((option) => option.filter === filter) ? filter : 'ALL';

  return (
    <View style={styles.container}>
      <CourseSummaryCard totalCourses={sorted.length} counts={counts} />
      {filterOptions.length > 0 ? (
        <FilterChips options={filterOptions} selected={activeFilter} onSelect={setFilter} />
      ) : null}
      {filterEnrollments(sorted, activeFilter).map((enrollment) => (
        <CourseCard
          key={enrollment.id}
          enrollment={enrollment}
          onOpenSession={(sessionId) => onOpenSession({ studentId: student.id, sessionId })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
});
