import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';
import { startOfDay, startOfWeek } from '@/utils/date';

import { useLinkedStudents } from '../hooks/use-parent-dashboard';
import type { ScheduleView, SessionRef } from '../types';
import { getDefaultDayOfWeek } from '../utils';

import { ChildPickerSheet } from './child-picker-sheet';
import { ScheduleHeader } from './schedule-header';
import { ScheduleViewSwitch } from './schedule-view-switch';
import { StudentAttendance } from './student-attendance';
import { StudentCourses } from './student-courses';
import { StudentRoadmap } from './student-roadmap';
import { StudentWeekSchedule } from './student-week-schedule';
import { WeekPickerSheet } from './week-picker-sheet';

type OpenSheet = 'child' | 'week' | null;

export type ParentScheduleProps = {
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
  onAddChild,
  onOpenAssignments,
  onOpenSession,
}: ParentScheduleProps) {
  const students = useLinkedStudents();
  const today = startOfDay(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [view, setView] = useState<ScheduleView>('WEEK');

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
          title="Chưa có hồ sơ của con"
          description="Thêm con vào tài khoản để xem lịch học của con."
          actionLabel="Thêm con"
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
      <ScheduleHeader
        weekStart={weekStart}
        student={selected}
        onPressWeek={view === 'WEEK' ? () => setOpenSheet('week') : undefined}
        onPressStudent={() => setOpenSheet('child')}
      />
      {selected ? <ScheduleViewSwitch value={view} onChange={setView} /> : null}
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
