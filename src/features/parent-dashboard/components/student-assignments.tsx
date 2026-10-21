import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { ALL_SUBJECTS, ASSIGNMENT_TABS } from '../constants';
import { useStudentAssignments } from '../hooks/use-parent-dashboard';
import type { AssignmentTab, LinkedStudent, StudentAssignment } from '../types';
import {
  countAssignmentsByTab,
  filterBySubject,
  findNearestDueAssignment,
  getSubjectFilterOptions,
  getTabAssignments,
} from '../utils';

import { AssignmentTabSwitch } from './assignment-tab-switch';
import { FilterChips } from './filter-chips';
import { GradedAssignmentCard } from './graded-assignment-card';
import { NearestDueCard } from './nearest-due-card';
import { SubmittedAssignmentCard } from './submitted-assignment-card';
import { TodoAssignmentCard } from './todo-assignment-card';

export type StudentAssignmentsProps = {
  student: LinkedStudent;
  /** Mo de bai de con lam, hoac bai da nop kem diem va dap an. */
  onOpenAssignment: (assignmentId: string) => void;
};

/**
 * Bai tap cua con: nhac bai co han gan nhat, ba tab (can lam, da nop, da co diem) kem so bai,
 * chip loc theo mon va the tung bai.
 */
export function StudentAssignments({ student, onOpenAssignment }: StudentAssignmentsProps) {
  const assignments = useStudentAssignments(student.id);
  const [tab, setTab] = useState<AssignmentTab>('TODO');
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS);

  if (assignments.isPending) return <LoadingState />;
  if (assignments.isError) {
    return <ErrorState error={assignments.error} onRetry={() => void assignments.refetch()} />;
  }

  const childName = getShortName(student.fullName);
  if (assignments.data.length === 0) {
    return (
      <EmptyState
        title="Chưa có bài tập nào"
        description={`Bài tập giáo viên giao cho ${childName} sẽ hiện ở đây.`}
      />
    );
  }

  const now = new Date();
  const subjectOptions = getSubjectFilterOptions(assignments.data);
  // Du lieu tai lai co the khong con mon dang loc: quay ve xem tat ca
  const activeSubject = subjectOptions.some((option) => option.filter === subject)
    ? subject
    : ALL_SUBJECTS;
  const filtered = filterBySubject(assignments.data, activeSubject);
  // Nhac han nop tinh tren moi mon, khong phu thuoc chip dang loc
  const nearestDue = findNearestDueAssignment(assignments.data, now);
  const tabAssignments = getTabAssignments(filtered, tab, now);

  const renderCard: Record<AssignmentTab, (assignment: StudentAssignment) => ReactNode> = {
    TODO: (assignment) => (
      <TodoAssignmentCard
        key={assignment.id}
        assignment={assignment}
        onOpen={() => onOpenAssignment(assignment.id)}
      />
    ),
    SUBMITTED: (assignment) =>
      assignment.submission ? (
        <SubmittedAssignmentCard
          key={assignment.id}
          assignment={assignment}
          submission={assignment.submission}
          childName={childName}
          onOpen={() => onOpenAssignment(assignment.id)}
        />
      ) : null,
    GRADED: (assignment) =>
      assignment.grade ? (
        <GradedAssignmentCard
          key={assignment.id}
          assignment={assignment}
          grade={assignment.grade}
          onOpen={() => onOpenAssignment(assignment.id)}
        />
      ) : null,
  };

  return (
    <View style={styles.container}>
      {nearestDue ? <NearestDueCard assignment={nearestDue} childName={childName} /> : null}
      <AssignmentTabSwitch value={tab} counts={countAssignmentsByTab(filtered)} onChange={setTab} />
      {subjectOptions.length > 0 ? (
        <FilterChips options={subjectOptions} selected={activeSubject} onSelect={setSubject} />
      ) : null}
      {tabAssignments.length > 0 ? (
        tabAssignments.map(renderCard[tab])
      ) : (
        <EmptyState {...ASSIGNMENT_TABS[tab].empty} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
