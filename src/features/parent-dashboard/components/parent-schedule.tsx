import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { startOfDay, startOfWeek } from '@/utils/date';

import { useSelectedStudent } from '../hooks/use-selected-student';
import type { ScheduleView, SessionRef } from '../types';
import { getAdjacentWeek, getDefaultDayOfWeek } from '../utils';

import { ChildPickerSheet } from './child-picker-sheet';
import { ScheduleViewSwitch } from './schedule-view-switch';
import { StudentAttendance } from './student-attendance';
import { StudentCourses } from './student-courses';
import { StudentRoadmap } from './student-roadmap';
import { StudentSwitcherBar } from './student-switcher-bar';
import { StudentWeekSchedule } from './student-week-schedule';
import { WeekNavigator } from './week-navigator';
import { WeekPickerSheet } from './week-picker-sheet';

type OpenSheet = 'child' | 'week' | null;

export type ParentScheduleProps = {
  /** Che do xem dang mo, route giu tren URL de nut o trang chu mo dung che do (vd diem danh). */
  view: ScheduleView;
  onChangeView: (view: ScheduleView) => void;
  /** Cac nut dan ra ngoai lich hoc; route quyet dinh dieu huong toi dau. */
  onAddChild: () => void;
  onOpenAssignments: () => void;
  onOpenSession: (session: SessionRef) => void;
};

/**
 * Tab lich hoc cua con dang chon: xem lich theo tuan (doi tuan, chon ngay), danh sach mon con da
 * ghi danh, lo trinh bai hoc tung mon hoac lich su diem danh. Doi con thi giu nguyen cach xem.
 */
export function ParentSchedule({
  view,
  onChangeView,
  onAddChild,
  onOpenAssignments,
  onOpenSession,
}: ParentScheduleProps) {
  const { students, selected, selectStudent } = useSelectedStudent();
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const weekStart = startOfWeek(selectedDate);

  const closeSheet = () => setOpenSheet(null);

  const selectFromPicker = (studentId: string) => {
    selectStudent(studentId);
    closeSheet();
  };

  const showWeek = (nextWeekStart: Date) =>
    setSelectedDate(getDefaultDayOfWeek(nextWeekStart, today));

  const selectWeekFromPicker = (nextWeekStart: Date) => {
    showWeek(nextWeekStart);
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
          title="Chưa có hồ sơ học sinh"
          description="Thêm học sinh vào tài khoản để xem lịch học."
          actionLabel="Thêm học sinh"
          onAction={onAddChild}
        />
      );
    }
    // key theo con de bo loc quay ve "Tất cả" khi doi con
    if (view === 'COURSES') {
      return <StudentCourses key={selected.id} student={selected} onOpenSession={onOpenSession} />;
    }
    if (view === 'ROADMAP') {
      return (
        <StudentRoadmap
          key={selected.id}
          student={selected}
          onOpenSession={onOpenSession}
          onOpenAssignments={onOpenAssignments}
        />
      );
    }
    if (view === 'ATTENDANCE') {
      return (
        <StudentAttendance key={selected.id} student={selected} onOpenSession={onOpenSession} />
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
        onOpenSession={onOpenSession}
      />
    );
  };

  return (
    <View style={styles.container}>
      {selected ? (
        <>
          <StudentSwitcherBar student={selected} onPress={() => setOpenSheet('child')} />
          <ScheduleViewSwitch value={view} onChange={onChangeView} />
          {view === 'WEEK' ? (
            <WeekNavigator
              weekStart={weekStart}
              previousWeek={getAdjacentWeek(weekStart, -1, today)}
              nextWeek={getAdjacentWeek(weekStart, 1, today)}
              onSelectWeek={showWeek}
              onOpenPicker={() => setOpenSheet('week')}
            />
          ) : null}
        </>
      ) : null}
      {renderBody()}

      <WeekPickerSheet
        isVisible={openSheet === 'week'}
        selectedWeekStart={weekStart}
        today={today}
        onSelect={selectWeekFromPicker}
        onClose={closeSheet}
      />
      {students.data && selected ? (
        <ChildPickerSheet
          isVisible={openSheet === 'child'}
          students={students.data}
          selectedId={selected.id}
          onSelect={selectFromPicker}
          onAddChild={addChildFromPicker}
          onClose={closeSheet}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
