import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { useLinkedStudents } from '../hooks/use-parent-dashboard';
import type { AssignmentRef } from '../types';

import { ChildPickerSheet } from './child-picker-sheet';
import { StudentAssignments } from './student-assignments';
import { StudentSwitcherBar } from './student-switcher-bar';

export type ParentAssignmentsProps = {
  /** Route quyet dinh dieu huong toi form them con va man chi tiet bai tap. */
  onAddChild: () => void;
  onOpenAssignment: (assignment: AssignmentRef) => void;
};

/** Tab diem va bai tap cua con dang chon: bai can lam, bai da nop cho cham va bai da co diem. */
export function ParentAssignments({ onAddChild, onOpenAssignment }: ParentAssignmentsProps) {
  const students = useLinkedStudents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Chua chon (hoac con da chon khong con trong danh sach) thi xem con dau tien
  const selected =
    students.data?.find((student) => student.id === selectedId) ?? students.data?.[0];

  const closePicker = () => setIsPickerVisible(false);

  const selectStudent = (studentId: string) => {
    setSelectedId(studentId);
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
    // key theo con de tab va bo loc quay ve mac dinh khi doi con
    return (
      <StudentAssignments
        key={selected.id}
        student={selected}
        onOpenAssignment={(assignmentId) =>
          onOpenAssignment({ studentId: selected.id, assignmentId })
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText type="heading" accessibilityRole="header">
        Điểm & Bài tập
      </ThemedText>
      {selected ? (
        <StudentSwitcherBar student={selected} onPress={() => setIsPickerVisible(true)} />
      ) : null}
      {renderBody()}

      {students.data && selected ? (
        <ChildPickerSheet
          isVisible={isPickerVisible}
          students={students.data}
          selectedId={selected.id}
          onSelect={selectStudent}
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
