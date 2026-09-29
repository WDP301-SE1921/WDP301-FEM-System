import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useLinkedStudents } from '../hooks/use-parent-dashboard';

import { ChildPickerSheet } from './child-picker-sheet';
import { ChildSwitcher } from './child-switcher';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardTopBar } from './dashboard-top-bar';
import { StudentOverview } from './student-overview';

export type ParentDashboardProps = {
  /** `displayName` cua phu huynh, null khi tai khoan chua dat ten. */
  parentName: string | null;
  /** Cac nut dan ra ngoai trang chu; route quyet dinh dieu huong toi dau. */
  onAddChild: () => void;
  onOpenNotifications: () => void;
  onOpenAssignments: () => void;
};

/** Trang chu phu huynh: chon con roi xem tong quan hom nay cua con do. */
export function ParentDashboard({
  parentName,
  onAddChild,
  onOpenNotifications,
  onOpenAssignments,
}: ParentDashboardProps) {
  const students = useLinkedStudents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Chua chon (hoac con da chon khong con trong danh sach) thi xem con dau tien
  const selected =
    students.data?.find((student) => student.id === selectedId) ?? students.data?.[0];

  const selectFromPicker = (studentId: string) => {
    setSelectedId(studentId);
    setIsPickerOpen(false);
  };

  const addChildFromPicker = () => {
    setIsPickerOpen(false);
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
          title="Chưa liên kết học sinh"
          description="Dùng mã liên kết trung tâm gửi qua email để theo dõi việc học của con."
          actionLabel="Nhập mã liên kết"
          onAction={onAddChild}
        />
      );
    }

    return (
      <>
        <ChildSwitcher
          students={students.data}
          selectedId={selected.id}
          onSelect={setSelectedId}
          onAddChild={onAddChild}
        />
        <StudentOverview
          studentId={selected.id}
          onOpenAssignments={onOpenAssignments}
          onOpenNotifications={onOpenNotifications}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <DashboardTopBar student={selected} onPressStudent={() => setIsPickerOpen(true)} />
      <DashboardGreeting parentName={parentName} onOpenNotifications={onOpenNotifications} />
      {renderBody()}

      {students.data && selected ? (
        <ChildPickerSheet
          isVisible={isPickerOpen}
          students={students.data}
          selectedId={selected.id}
          onSelect={selectFromPicker}
          onAddChild={addChildFromPicker}
          onClose={() => setIsPickerOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.four },
});
