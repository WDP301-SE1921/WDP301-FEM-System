import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { useSelectedStudent } from '../hooks/use-selected-student';
import type { ParentDestination } from '../types';

import { ChildPickerSheet } from './child-picker-sheet';
import { EnrollmentGuideCard } from './enrollment-guide-card';
import { StudentOverview } from './student-overview';
import { StudentSwitcherBar } from './student-switcher-bar';

export type ParentDashboardProps = {
  /** Email dang nhap, hien trong huong dan dang ky mon tai trung tam. */
  parentEmail: string;
  /** Cac nut dan ra ngoai trang chu; route quyet dinh dieu huong toi dau. */
  onAddChild: () => void;
  onOpenNotifications: () => void;
  /** Mo man hinh cua mot the hoac thong bao (bai tap, buoi hoc, bill, tab Lich hoc, tab Diem). */
  onOpenDestination: (destination: ParentDestination) => void;
};

/** Trang chu phu huynh: chon con roi xem tong quan hom nay cua con do. */
export function ParentDashboard({
  parentEmail,
  onAddChild,
  onOpenNotifications,
  onOpenDestination,
}: ParentDashboardProps) {
  const { students, selected, selectStudent } = useSelectedStudent();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const selectFromPicker = (studentId: string) => {
    selectStudent(studentId);
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
          title="Chưa có hồ sơ học sinh"
          description="Thêm học sinh vào tài khoản để theo dõi việc học."
          actionLabel="Thêm học sinh"
          onAction={onAddChild}
        />
      );
    }

    return (
      <>
        {/* `subjectNames` la mon cua cac ghi danh dang hoc: rong thi con chua dang ky hoac da hoc xong */}
        {selected.subjectNames.length === 0 ? (
          <EnrollmentGuideCard
            childName={getShortName(selected.fullName)}
            parentEmail={parentEmail}
          />
        ) : null}
        <StudentOverview
          studentId={selected.id}
          onOpenNotifications={onOpenNotifications}
          onOpenDestination={onOpenDestination}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      {selected ? (
        <StudentSwitcherBar student={selected} onPress={() => setIsPickerOpen(true)} />
      ) : null}
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
  container: { flex: 1, gap: Spacing.three },
});
