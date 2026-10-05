import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { ALL_SUBJECTS } from '../constants';
import { useStudentAttendance } from '../hooks/use-parent-dashboard';
import type { LinkedStudent, SessionRef } from '../types';
import {
  countAttendance,
  filterBySubject,
  getSubjectFilterOptions,
  groupAttendanceByMonth,
  sortAttendanceRecords,
} from '../utils';

import { AttendanceMonthSection } from './attendance-month-section';
import { AttendanceSummaryCard } from './attendance-summary-card';
import { FilterChips } from './filter-chips';

export type StudentAttendanceProps = {
  student: LinkedStudent;
  onOpenSession: (session: SessionRef) => void;
};

/**
 * Lich su diem danh cua con: ty le di hoc tren moi mon, chip loc theo mon va cac buoi da hoc chia
 * theo thang, moi nhat truoc.
 */
export function StudentAttendance({ student, onOpenSession }: StudentAttendanceProps) {
  const attendance = useStudentAttendance(student.id);
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS);

  if (attendance.isPending) return <LoadingState />;
  if (attendance.isError) {
    return <ErrorState error={attendance.error} onRetry={() => void attendance.refetch()} />;
  }

  const records = sortAttendanceRecords(attendance.data);
  const firstRecord = records[records.length - 1];
  if (!firstRecord) {
    return (
      <EmptyState
        title="Chưa có buổi học nào"
        description={`Kết quả điểm danh của ${getShortName(student.fullName)} sẽ hiện ở đây sau mỗi buổi học.`}
      />
    );
  }

  const subjectOptions = getSubjectFilterOptions(records);
  // Tru chip "Tất cả môn"
  const subjectCount = subjectOptions.length - 1;
  // Du lieu tai lai co the khong con mon dang loc: quay ve xem tat ca
  const activeSubject = subjectOptions.some((option) => option.filter === subject)
    ? subject
    : ALL_SUBJECTS;
  const months = groupAttendanceByMonth(filterBySubject(records, activeSubject));

  return (
    <View style={styles.container}>
      <AttendanceSummaryCard counts={countAttendance(records)} since={firstRecord.startsAt} />

      {subjectOptions.length > 0 ? (
        <View style={styles.filter}>
          <View style={styles.filterHeader}>
            <ThemedText type="smallBold">Lọc theo môn học</ThemedText>
            <ThemedText type="small" themeColor="primary">
              {subjectCount} môn
            </ThemedText>
          </View>
          <FilterChips options={subjectOptions} selected={activeSubject} onSelect={setSubject} />
        </View>
      ) : null}

      {months.map((month) => (
        <AttendanceMonthSection
          key={month.label}
          month={month}
          onOpenSession={(sessionId) => onOpenSession({ studentId: student.id, sessionId })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  filter: { gap: Spacing.one },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
