import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { toDateKey } from '@/utils/date';
import { formatWeekdayDate, getShortName } from '@/utils/format';

import { useStudentSchedule } from '../hooks/use-parent-dashboard';
import type { LinkedStudent, WeekDay } from '../types';
import { buildWeekDays, findNextFreeDay, getWeekRange } from '../utils';

import { FreeDayCard } from './free-day-card';
import { NextFreeDayCard } from './next-free-day-card';
import { ScheduleSessionCard } from './schedule-session-card';
import { ToneBadge } from './tone-badge';
import { WeekStrip } from './week-strip';

export type StudentWeekScheduleProps = {
  student: LinkedStudent;
  weekStart: Date;
  /** Luon thuoc tuan `weekStart`. */
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onOpenAssignments: () => void;
};

/** Lich mot tuan cua con: thanh chon ngay va cac buoi hoc cua ngay dang chon. */
export function StudentWeekSchedule({
  student,
  weekStart,
  selectedDate,
  today,
  onSelectDate,
  onOpenAssignments,
}: StudentWeekScheduleProps) {
  const schedule = useStudentSchedule(student.id, getWeekRange(weekStart));
  const days = buildWeekDays(weekStart, schedule.data ?? []);
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(today);
  const selectedDay = days.find((day) => day.key === selectedKey);

  const renderDay = () => {
    if (schedule.isPending) return <LoadingState />;
    if (schedule.isError) {
      return <ErrorState error={schedule.error} onRetry={() => void schedule.refetch()} />;
    }
    if (!selectedDay) return null;

    const isToday = selectedKey === todayKey;
    if (selectedDay.sessions.length === 0) {
      return (
        <FreeDayCard
          studentName={getShortName(student.fullName)}
          isToday={isToday}
          onOpenAssignments={onOpenAssignments}
        />
      );
    }

    const nextFreeDay = findNextFreeDay(days, selectedKey);
    return (
      <>
        {selectedDay.sessions.map((session) => (
          <ScheduleSessionCard key={session.id} session={session} isToday={isToday} />
        ))}
        {nextFreeDay ? (
          <NextFreeDayCard date={nextFreeDay.date} onView={() => onSelectDate(nextFreeDay.date)} />
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <WeekStrip
        days={days}
        selectedKey={selectedKey}
        todayKey={todayKey}
        onSelect={onSelectDate}
      />
      <DayHeader
        date={selectedDate}
        day={schedule.isSuccess ? selectedDay : undefined}
        isToday={selectedKey === todayKey}
      />
      {renderDay()}
    </View>
  );
}

type DayHeaderProps = {
  date: Date;
  /** undefined khi lich chua tai xong: an so buoi de khong bao sai "0 buổi học". */
  day: WeekDay | undefined;
  isToday: boolean;
};

function DayHeader({ date, day, isToday }: DayHeaderProps) {
  const sessionCount = day?.sessions.length ?? 0;

  return (
    <View style={styles.dayHeader}>
      <View style={styles.dayTitle}>
        <ThemedText type="default" accessibilityRole="header" style={styles.dayTitleText}>
          {formatWeekdayDate(date)}
        </ThemedText>
        {day ? (
          <ToneBadge
            label={`${sessionCount} buổi học`}
            tone={sessionCount > 0 ? 'primary' : 'neutral'}
          />
        ) : null}
      </View>
      {isToday ? (
        <ThemedText type="small" themeColor="textSecondary">
          Hôm nay
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dayTitle: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dayTitleText: { flexShrink: 1, fontWeight: 700 },
});
