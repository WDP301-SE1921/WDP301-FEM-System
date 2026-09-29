import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { startOfDay, startOfWeek } from '@/utils/date';

import { useLinkedStudents } from '../hooks/use-parent-dashboard';
import { getDefaultDayOfWeek } from '../utils';

import { ChildPickerSheet } from './child-picker-sheet';
import { ScheduleHeader } from './schedule-header';
import { StudentWeekSchedule } from './student-week-schedule';
import { WeekPickerSheet } from './week-picker-sheet';

type OpenSheet = 'child' | 'week' | null;

export type ParentScheduleProps = {
  /** Cac nut dan ra ngoai lich hoc; route quyet dinh dieu huong toi dau. */
  onAddChild: () => void;
  onOpenAssignments: () => void;
};

/** Lich hoc theo tuan cua con dang chon: doi con, doi tuan, chon ngay de xem cac buoi hoc. */
export function ParentSchedule({ onAddChild, onOpenAssignments }: ParentScheduleProps) {
  const students = useLinkedStudents();
  const today = startOfDay(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // Chua chon (hoac con da chon khong con trong danh sach) thi xem con dau tien
  const selected =
    students.data?.find((student) => student.id === selectedId) ?? students.data?.[0];
  const weekStart = startOfWeek(selectedDate);

  const closeSheet = () => setOpenSheet(null);

  const selectStudent = (studentId: string) => {
    setSelectedId(studentId);
    closeSheet();
  };

  const selectWeek = (nextWeekStart: Date) => {
    setSelectedDate(getDefaultDayOfWeek(nextWeekStart, today));
    closeSheet();
  };

  const addChildFromPicker = () => {
    closeSheet();
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
          description="Dùng mã liên kết trung tâm gửi qua email để xem lịch học của con."
          actionLabel="Nhập mã liên kết"
          onAction={onAddChild}
        />
      );
    }

    return (
      <StudentWeekSchedule
        student={selected}
        weekStart={weekStart}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={setSelectedDate}
        onOpenAssignments={onOpenAssignments}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScheduleHeader
        weekStart={weekStart}
        student={selected}
        onPressWeek={() => setOpenSheet('week')}
        onPressStudent={() => setOpenSheet('child')}
      />
      {renderBody()}

      <WeekPickerSheet
        isVisible={openSheet === 'week'}
        selectedWeekStart={weekStart}
        today={today}
        onSelect={selectWeek}
        onClose={closeSheet}
      />
      {students.data && selected ? (
        <ChildPickerSheet
          isVisible={openSheet === 'child'}
          students={students.data}
          selectedId={selected.id}
          onSelect={selectStudent}
          onAddChild={addChildFromPicker}
          onClose={closeSheet}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.four },
});
