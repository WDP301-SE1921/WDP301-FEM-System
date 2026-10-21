import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { useLinkedStudents } from '../hooks/use-parent-dashboard';

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
          title="Chưa có hồ sơ của con"
          description="Thêm con vào tài khoản để xem gói học và học phí của con."
          actionLabel="Thêm con"
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
      <View>
        <ThemedText type="heading" accessibilityRole="header">
          Quản lý học phí
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Thông tin gói học và lịch sử đóng học phí
        </ThemedText>
      </View>
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
