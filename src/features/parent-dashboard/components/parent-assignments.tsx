import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useSelectedStudent } from '../hooks/use-selected-student';
import type { AssignmentRef, AssignmentTab } from '../types';

import { ChildPickerSheet } from './child-picker-sheet';
import { StudentAssignments } from './student-assignments';
import { StudentSwitcherBar } from './student-switcher-bar';

export type ParentAssignmentsProps = {
  /** Tab dang xem (can lam, da nop, da co diem), route giu tren URL. */
  tab: AssignmentTab;
  onChangeTab: (tab: AssignmentTab) => void;
  /** Route quyet dinh dieu huong toi form them con va man chi tiet bai tap. */
  onAddChild: () => void;
  onOpenAssignment: (assignment: AssignmentRef) => void;
};

/** Tab diem va bai tap cua con dang chon: bai can lam, bai da nop cho cham va bai da co diem. */
export function ParentAssignments({
  tab,
  onChangeTab,
  onAddChild,
  onOpenAssignment,
}: ParentAssignmentsProps) {
  const { students, selected, selectStudent } = useSelectedStudent();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const closePicker = () => setIsPickerVisible(false);

  const selectFromPicker = (studentId: string) => {
    selectStudent(studentId);
    closePicker();
  };

  const addChildFromPicker = () => {
    closePicker();
    onAddChild();
  };

  const renderBody = () => {
    if (students.isPending) return <LoadingState />;
    if (students.isError) {
      return <ErrorState error={students.error} onRetry={() => void students.refetch()} />;
    }
    if (!selected) {
      return (
        <EmptyState
          title="Chưa có hồ sơ học sinh"
          description="Thêm học sinh vào tài khoản để xem bài tập và điểm."
          actionLabel="Thêm học sinh"
          onAction={onAddChild}
        />
      );
    }
    // key theo con de bo loc mon quay ve "Tất cả" khi doi con
    return (
      <StudentAssignments
        key={selected.id}
        student={selected}
        tab={tab}
        onChangeTab={onChangeTab}
        onOpenAssignment={(assignmentId) =>
          onOpenAssignment({ studentId: selected.id, assignmentId })
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {selected ? (
        <StudentSwitcherBar student={selected} onPress={() => setIsPickerVisible(true)} />
      ) : null}
      {renderBody()}

      {students.data && selected ? (
        <ChildPickerSheet
          isVisible={isPickerVisible}
          students={students.data}
          selectedId={selected.id}
          onSelect={selectFromPicker}
          onAddChild={addChildFromPicker}
          onClose={closePicker}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
