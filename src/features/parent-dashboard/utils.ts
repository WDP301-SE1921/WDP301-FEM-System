import { addDays, startOfWeek, toDateKey } from '@/utils/date';
import { formatDayMonth } from '@/utils/format';

import {
  FAILING_SCORE_LEVEL,
  SCORE_LEVELS,
  WEEKS_AFTER,
  WEEKS_BEFORE,
  type ScoreLevel,
} from './constants';
import type {
  AttendanceSummary,
  ClassSession,
  DayPeriod,
  ScheduleRange,
  ScheduleSession,
  ScoreTrend,
  SessionStatus,
  WeekDay,
} from './types';

const PERCENT = 100;
/** Bang diem hien mot chu so thap phan. */
const SCORE_FRACTION_DIGITS = 1;
const DAYS_PER_WEEK = 7;
const NOON_HOUR = 12;
const EVENING_HOUR = 18;

/** Trang thai buoi hoc so voi thoi diem `now`. */
export function getSessionStatus(
  session: Pick<ClassSession, 'startsAt' | 'endsAt'>,
  now: Date = new Date(),
): SessionStatus {
  const time = now.getTime();
  if (time < new Date(session.startsAt).getTime()) return 'UPCOMING';
  if (time < new Date(session.endsAt).getTime()) return 'IN_PROGRESS';
  return 'FINISHED';
}

/** Ty le di hoc theo phan tram, lam tron. null khi chua co buoi hoc nao. */
export function getAttendanceRate({
  attendedSessions,
  totalSessions,
}: AttendanceSummary): number | null {
  if (totalSessions <= 0) return null;
  return Math.round((attendedSessions / totalSessions) * PERCENT);
}

export function getScoreLevel(score: number): ScoreLevel {
  return SCORE_LEVELS.find((level) => score >= level.minScore) ?? FAILING_SCORE_LEVEL;
}

/** Vd `8.2`. */
export function formatScore(score: number): string {
  return score.toFixed(SCORE_FRACTION_DIGITS);
}

/** Xu huong tinh tren gia tri da lam tron, de `+0.0` khong bi coi la tang. */
export function getScoreTrend(change: number): ScoreTrend {
  const rounded = Number(formatScore(change));
  if (rounded > 0) return 'UP';
  if (rounded < 0) return 'DOWN';
  return 'FLAT';
}

/** Vd `+0.4`, `-0.3`, `0.0`. */
export function formatScoreChange(change: number): string {
  const trend = getScoreTrend(change);
  if (trend === 'FLAT') return formatScore(0);
  return trend === 'UP' ? `+${formatScore(change)}` : formatScore(change);
}

/** Sang, chieu hay toi, theo gio bat dau cua buoi hoc. */
export function getDayPeriod(startsAt: string): DayPeriod {
  const hours = new Date(startsAt).getHours();
  if (hours < NOON_HOUR) return 'MORNING';
  if (hours < EVENING_HOUR) return 'AFTERNOON';
  return 'EVENING';
}

/** Tu Thu Hai toi Chu nhat cua tuan bat dau tu `weekStart`, dung lam query lich hoc. */
export function getWeekRange(weekStart: Date): ScheduleRange {
  return { from: toDateKey(weekStart), to: toDateKey(addDays(weekStart, DAYS_PER_WEEK - 1)) };
}

/** Vd `12/10 – 18/10`. */
export function formatWeekRange(weekStart: Date): string {
  return `${formatDayMonth(weekStart)} – ${formatDayMonth(addDays(weekStart, DAYS_PER_WEEK - 1))}`;
}

function compareStartTime(a: ScheduleSession, b: ScheduleSession): number {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

/** 7 ngay cua tuan, moi ngay kem cac buoi hoc bat dau trong ngay do. */
export function buildWeekDays(weekStart: Date, sessions: readonly ScheduleSession[]): WeekDay[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, offset) => {
    const date = addDays(weekStart, offset);
    const key = toDateKey(date);
    const daySessions = sessions
      .filter((session) => toDateKey(new Date(session.startsAt)) === key)
      .sort(compareStartTime);
    return {
      date,
      key,
      sessions: daySessions,
      hasScheduleChange: daySessions.some((session) => session.type !== 'REGULAR'),
    };
  });
}

/** Ngay khong co buoi hoc dau tien sau ngay dang chon, trong cung tuan. */
export function findNextFreeDay(
  days: readonly WeekDay[],
  selectedKey: string,
): WeekDay | undefined {
  const selectedIndex = days.findIndex((day) => day.key === selectedKey);
  return days.slice(selectedIndex + 1).find((day) => day.sessions.length === 0);
}

/** Ngay mo san khi chuyen sang tuan `weekStart`: hom nay neu thuoc tuan do, neu khong la Thu Hai. */
export function getDefaultDayOfWeek(weekStart: Date, today: Date): Date {
  return toDateKey(startOfWeek(today)) === toDateKey(weekStart) ? today : weekStart;
}

/** Cac tuan cho phep chon, `offset` la so tuan tinh tu tuan chua `today`. */
export function getWeekOptions(today: Date): { weekStart: Date; offset: number }[] {
  const currentWeekStart = startOfWeek(today);
  return Array.from({ length: WEEKS_BEFORE + WEEKS_AFTER + 1 }, (_, index) => {
    const offset = index - WEEKS_BEFORE;
    return { weekStart: addDays(currentWeekStart, offset * DAYS_PER_WEEK), offset };
  });
}

/** Vd `Tuần này`, `Tuần sau`, `2 tuần trước`. */
export function getRelativeWeekLabel(offset: number): string {
  if (offset === 0) return 'Tuần này';
  if (offset === -1) return 'Tuần trước';
  if (offset === 1) return 'Tuần sau';
  return offset < 0 ? `${-offset} tuần trước` : `${offset} tuần sau`;
}
