import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useSelectedStudent } from '../hooks/use-selected-student';

import { ChildPickerSheet } from './child-picker-sheet';
import { StudentSwitcherBar } from './student-switcher-bar';
import { StudentTuition } from './student-tuition';

export type ParentTuitionProps = {
  /** Route quyet dinh dieu huong toi form them con, man bien lai va man bill. */
  onAddChild: () => void;
  onOpenReceipt: (registrationId: string) => void;
  onOpenBill: (registrationId: string) => void;
};

/** Tab hoc phi cua con dang chon: bill chua thanh toan, goi hoc dang ap dung va lich su dong hoc phi. */
export function ParentTuition({ onAddChild, onOpenReceipt, onOpenBill }: ParentTuitionProps) {
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
          description="Thêm học sinh vào tài khoản để xem gói học và học phí."
          actionLabel="Thêm học sinh"
          onAction={onAddChild}
        />
      );
    }
    return (
      <StudentTuition student={selected} onOpenReceipt={onOpenReceipt} onOpenBill={onOpenBill} />
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
