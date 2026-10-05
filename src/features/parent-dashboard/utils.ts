import type { IconName } from '@/components/ui/icon';
import {
  addDays,
  diffInCalendarDays,
  parseDateKey,
  startOfDay,
  startOfWeek,
  toDateKey,
} from '@/utils/date';
import {
  formatCurrency,
  formatDate,
  formatDayMonth,
  formatIsoWeekday,
  formatMonthYear,
  formatTime,
  formatWeekdayDate,
} from '@/utils/format';

import {
  ALL_SUBJECTS,
  ASSESSMENT_BADGE,
  ASSIGNMENT_STATES,
  ATTENDANCE_BREAKDOWN,
  ATTENDANCE_LEVELS,
  ATTENDANCE_STATUSES,
  CANCELLED_SESSION_STATUS,
  CENTER_NAME,
  CLOSED_ASSIGNMENT_STATUS,
  COURSE_STATUS_ORDER,
  COURSE_STATUSES,
  DEADLINE_APPEARANCES,
  DEFAULT_SUBJECT_ICON,
  FAILING_SCORE_LEVEL,
  GRADED_STATUS,
  GRADING_STATUS,
  LEAVE_REASON_NOTE,
  LESSON_PROGRESSES,
  LESSON_SCORE_LABELS,
  LOW_ATTENDANCE_LEVEL,
  MADE_UP_STATUS,
  MAKEUP_NOTES,
  ORIGINAL_SESSION_NOTE,
  ROADMAP_DONE_LESSONS_SHOWN,
  ROADMAP_UPCOMING_LESSONS_SHOWN,
  SCORE_LEVELS,
  SESSION_STATUSES,
  SUBJECT_ICONS,
  URGENT_DUE_DAYS,
  WEEKS_AFTER,
  WEEKS_BEFORE,
  type ScoreLevel,
  type StatusAppearance,
  type Tone,
} from './constants';
import type {
  AnswerDraft,
  AssignmentDetail,
  AssignmentFormat,
  AssignmentGrade,
  AssignmentQuestion,
  AssignmentRecipient,
  AssignmentState,
  AssignmentTab,
  AttendanceCounts,
  AttendanceMonth,
  AttendanceRecord,
  AttendanceSummary,
  ChoiceState,
  ClassSession,
  CourseFilter,
  CourseStatus,
  DayPeriod,
  EnrollmentLesson,
  FilterOption,
  LessonAssignment,
  LessonKind,
  LessonProgress,
  PaidEnrollment,
  QuestionKind,
  QuestionReview,
  RoadmapLesson,
  RoadmapSummary,
  ScheduleRange,
  ScheduleSession,
  ScoreTrend,
  SessionDetail,
  SessionStatus,
  StudentAssignment,
  StudentEnrollment,
  StudentRegistration,
  SubmissionAnswer,
  SubmissionGrade,
  SubmissionRecord,
  TermSessionCount,
  TermStatus,
  TuitionEnrollment,
  TuitionReceipt,
  WeekDay,
  WeeklySlot,
} from './types';

const MINUTE_MS = 60 * 1000;
const PERCENT = 100;
/** Thang diem cua `SCORE_LEVELS`. */
const SCORE_SCALE = 10;
/** Bang diem hien mot chu so thap phan. */
const SCORE_FRACTION_DIGITS = 1;
const DAYS_PER_WEEK = 7;
const NOON_HOUR = 12;
const EVENING_HOUR = 18;
/** `Date.getDay()` cua Chu nhat; ISO 8601 ghi Chu nhat la 7. */
const SUNDAY = 0;
const ISO_SUNDAY = 7;
/** Do dai phan ngay `YYYY-MM-DD` o dau chuoi ngay cua API hoc phi. */
const API_DATE_LENGTH = 10;
const TEN = 10;
const HUNDRED = 100;
/** So tieng Viet doc theo tung nhom ba chu so: don vi, nghin, trieu, ty. */
const DIGITS_PER_GROUP = 3;
const GROUP_SIZE = 1000;
const GROUP_UNITS = ['', 'nghìn', 'triệu', 'tỷ'] as const;
const DIGIT_WORDS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
] as const;

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

/** So phut tu `from` toi `to`, lam tron. Am khi `to` truoc `from`. */
export function getMinutesBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / MINUTE_MS);
}

/** Trang thai dang chu y nhat cua buoi: bi huy, ket qua diem danh, hoac trang thai theo gio. */
export function getSessionDetailStatus(
  session: Pick<SessionDetail, 'status' | 'attendance' | 'startsAt' | 'endsAt'>,
  now: Date = new Date(),
): StatusAppearance {
  if (session.status === 'CANCELLED') return CANCELLED_SESSION_STATUS;
  if (session.attendance !== 'UNMARKED') return ATTENDANCE_STATUSES[session.attendance];

  const timeStatus = getSessionStatus(session, now);
  // Da ket thuc ma chua co ket qua thi bao chua diem danh, phu huynh can biet dieu nay hon
  return timeStatus === 'FINISHED' ? ATTENDANCE_STATUSES.UNMARKED : SESSION_STATUSES[timeStatus];
}

/** Nhan diem danh, co mat thi kem dung gio hay muon, vd `Có mặt · Muộn 10 phút`. */
export function getAttendanceBadge(
  session: Pick<SessionDetail, 'attendance' | 'startsAt' | 'checkedInAt'>,
): StatusAppearance {
  const status = ATTENDANCE_STATUSES[session.attendance];
  if (session.attendance !== 'PRESENT' || !session.checkedInAt) return status;

  const lateMinutes = getMinutesBetween(session.startsAt, session.checkedInAt);
  if (lateMinutes <= 0) return { ...status, label: `${status.label} · Đúng giờ` };
  return { ...status, label: `${status.label} · Muộn ${lateMinutes} phút`, tone: 'accent' };
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

export type CourseStatusCounts = Record<CourseStatus, number>;

/** Ghi danh `ACTIVE` dang co don bao luu hieu luc thi la tam nghi. */
export function getCourseStatus(
  enrollment: Pick<StudentEnrollment, 'status' | 'pause'>,
): CourseStatus {
  if (enrollment.status === 'ENDED') return 'ENDED';
  return enrollment.pause ? 'PAUSED' : 'ACTIVE';
}

/** Dang hoc truoc, roi tam nghi, cuoi cung da ket thuc; cung trang thai thi giu thu tu cua API. */
export function sortEnrollments(enrollments: readonly StudentEnrollment[]): StudentEnrollment[] {
  const rank = (enrollment: StudentEnrollment) =>
    COURSE_STATUS_ORDER.indexOf(getCourseStatus(enrollment));
  return [...enrollments].sort((a, b) => rank(a) - rank(b));
}

export function countCoursesByStatus(
  enrollments: readonly StudentEnrollment[],
): CourseStatusCounts {
  const counts: CourseStatusCounts = { ACTIVE: 0, PAUSED: 0, ENDED: 0 };
  enrollments.forEach((enrollment) => {
    counts[getCourseStatus(enrollment)] += 1;
  });
  return counts;
}

function getPresentStatuses(counts: CourseStatusCounts): CourseStatus[] {
  return COURSE_STATUS_ORDER.filter((status) => counts[status] > 0);
}

/** Vd `2 đang học · 1 tạm nghỉ`, bo trang thai khong co mon nao. */
export function formatCourseSummary(counts: CourseStatusCounts): string {
  return getPresentStatuses(counts)
    .map((status) => `${counts[status]} ${COURSE_STATUSES[status].label.toLowerCase()}`)
    .join(' · ');
}

/** Chip loc theo trang thai co mon. Chi mot trang thai thi "Tất cả" trung voi no nen tra rong. */
export function getCourseFilterOptions(counts: CourseStatusCounts): FilterOption<CourseFilter>[] {
  const statuses = getPresentStatuses(counts);
  if (statuses.length < 2) return [];
  return [
    { filter: 'ALL', label: 'Tất cả' },
    ...statuses.map((status) => ({
      filter: status,
      label: `${COURSE_STATUSES[status].label} (${counts[status]})`,
    })),
  ];
}

export function filterEnrollments(
  enrollments: readonly StudentEnrollment[],
  filter: CourseFilter,
): StudentEnrollment[] {
  if (filter === 'ALL') return [...enrollments];
  return enrollments.filter((enrollment) => getCourseStatus(enrollment) === filter);
}

/** Phan tram so buoi da hoc, lam tron va toi da 100. null khi khoa chua co tong so buoi. */
export function getCourseProgress({
  completedSessions,
  totalSessions,
}: Pick<StudentEnrollment, 'completedSessions' | 'totalSessions'>): number | null {
  if (totalSessions <= 0) return null;
  return Math.min(PERCENT, Math.round((completedSessions / totalSessions) * PERCENT));
}

/** Gom cac buoi cung gio, vd `['T2, T5 · 18:00 – 19:30', 'T7 · 08:00 – 09:30']`. */
export function formatWeeklySlots(slots: readonly WeeklySlot[]): string[] {
  const weekdaysByTime = new Map<string, number[]>();
  [...slots]
    .sort((a, b) => a.weekday - b.weekday)
    .forEach((slot) => {
      const time = `${slot.startTime} – ${slot.endTime}`;
      weekdaysByTime.set(time, [...(weekdaysByTime.get(time) ?? []), slot.weekday]);
    });
  return Array.from(
    weekdaysByTime,
    ([time, weekdays]) => `${weekdays.map(formatIsoWeekday).join(', ')} · ${time}`,
  );
}

/** Vd `Hôm nay, 18:00`, `Thứ Ba 17/10, 18:00`. */
export function formatNextSession(startsAt: string, now: Date = new Date()): string {
  const isToday = toDateKey(new Date(startsAt)) === toDateKey(now);
  return `${isToday ? 'Hôm nay' : formatWeekdayDate(startsAt)}, ${formatTime(startsAt)}`;
}

/** Ngay dang `YYYY-MM-DD` cua API sang `dd/mm/yyyy`. */
export function formatDateKey(key: string): string {
  const date = parseDateKey(key);
  return date ? formatDate(date) : '--';
}

export type AttendanceNote = {
  key: 'leave-reason' | 'makeup' | 'original-session';
  text: string;
  icon: IconName;
  tone: Tone;
};

/** Moi nhat truoc, khong sua mang goc. */
export function sortAttendanceRecords(records: readonly AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );
}

function getCountKey({
  kind,
  attendance,
}: Pick<AttendanceRecord, 'kind' | 'attendance'>): Exclude<keyof AttendanceCounts, 'excused'> {
  if (attendance === 'UNMARKED') return 'unmarked';
  if (attendance !== 'PRESENT') return 'absent';
  return kind === 'MAKEUP' ? 'madeUp' : 'present';
}

/** Dem buoi theo ket qua diem danh, tach buoi hoc bu khoi buoi co dinh. */
export function countAttendance(records: readonly AttendanceRecord[]): AttendanceCounts {
  const counts: AttendanceCounts = { present: 0, madeUp: 0, absent: 0, excused: 0, unmarked: 0 };
  records.forEach((record) => {
    counts[getCountKey(record)] += 1;
    if (record.attendance === 'EXCUSED') counts.excused += 1;
  });
  return counts;
}

/** Buoi co mat (ke ca hoc bu) tren buoi da chot diem danh, de tinh bang `getAttendanceRate`. */
export function toAttendanceSummary({
  present,
  madeUp,
  absent,
}: AttendanceCounts): AttendanceSummary {
  const attendedSessions = present + madeUp;
  return { attendedSessions, totalSessions: attendedSessions + absent };
}

export function getAttendanceLevel(rate: number): StatusAppearance {
  return ATTENDANCE_LEVELS.find((level) => rate >= level.minRate) ?? LOW_ATTENDANCE_LEVEL;
}

/** Chu duoi so buoi vang, vd `có phép`, `không phép`, `1 có phép`. */
export function formatAbsenceCaption({
  absent,
  excused,
}: Pick<AttendanceCounts, 'absent' | 'excused'>): string {
  if (absent === 0) return 'buổi';
  if (excused === absent) return 'có phép';
  if (excused === 0) return 'không phép';
  return `${excused} có phép`;
}

/** Vd `7 buổi · 5 có mặt, 1 vắng, 1 học bù`, bo loai khong co buoi nao. */
export function formatAttendanceBreakdown(counts: AttendanceCounts): string {
  const parts = ATTENDANCE_BREAKDOWN.filter(({ count }) => counts[count] > 0).map(
    ({ count, label }) => `${counts[count]} ${label}`,
  );
  const total = ATTENDANCE_BREAKDOWN.reduce((sum, { count }) => sum + counts[count], 0);
  return [`${total} buổi`, parts.join(', ')].filter(Boolean).join(' · ');
}

/** Buoi vang chua duoc hoc bu xong, the can lam noi de phu huynh chu y. */
export function isOutstandingAbsence({
  attendance,
  makeup,
}: Pick<AttendanceRecord, 'attendance' | 'makeup'>): boolean {
  const isAbsent = attendance === 'ABSENT' || attendance === 'EXCUSED';
  return isAbsent && makeup?.status !== 'COMPLETED';
}

/** Nhan tren the lich su diem danh: buoi vang da hoc bu xong thi bao da hoc bu. */
export function getAttendanceRecordStatus({
  attendance,
  makeup,
}: Pick<AttendanceRecord, 'attendance' | 'makeup'>): StatusAppearance {
  if (makeup?.status === 'COMPLETED') return MADE_UP_STATUS;
  return ATTENDANCE_STATUSES[attendance];
}

/** Dong ghi chu duoi the: ly do nghi, buoi hoc bu cua buoi vang, buoi vang ma buoi hoc bu bu cho. */
export function getAttendanceNotes(
  { leaveReason, makeup, originalSession }: AttendanceRecord,
  now: Date = new Date(),
): AttendanceNote[] {
  const leaveNote: AttendanceNote[] = leaveReason
    ? [{ key: 'leave-reason', text: leaveReason, ...LEAVE_REASON_NOTE }]
    : [];
  const makeupNote: AttendanceNote[] = makeup
    ? [
        {
          key: 'makeup',
          text: `${MAKEUP_NOTES[makeup.status].label}: ${formatNextSession(makeup.startsAt, now)}`,
          icon: MAKEUP_NOTES[makeup.status].icon,
          tone: MAKEUP_NOTES[makeup.status].tone,
        },
      ]
    : [];
  const originalNote: AttendanceNote[] = originalSession
    ? [
        {
          key: 'original-session',
          text: `Học bù cho buổi nghỉ ngày ${formatDayMonth(originalSession.startsAt)}`,
          ...ORIGINAL_SESSION_NOTE,
        },
      ]
    : [];
  return [...leaveNote, ...makeupNote, ...originalNote];
}

/** Chia cac buoi theo thang, giu thu tu dau vao. */
export function groupAttendanceByMonth(records: readonly AttendanceRecord[]): AttendanceMonth[] {
  const recordsByMonth = new Map<string, AttendanceRecord[]>();
  records.forEach((record) => {
    const month = formatMonthYear(record.startsAt);
    recordsByMonth.set(month, [...(recordsByMonth.get(month) ?? []), record]);
  });
  return Array.from(recordsByMonth, ([month, monthRecords]) => ({
    label: `Tháng ${month}`,
    records: monthRecords,
  }));
}

type HasSubject = { subjectName: string };

/**
 * Chip loc theo mon (buoi hoc, bai tap), sap theo ten. Chi mot mon thi "Tất cả môn" trung voi no nen
 * tra rong.
 */
export function getSubjectFilterOptions(items: readonly HasSubject[]): FilterOption<string>[] {
  const subjects = Array.from(new Set(items.map((item) => item.subjectName))).sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  if (subjects.length < 2) return [];
  return [
    { filter: ALL_SUBJECTS, label: 'Tất cả môn' },
    ...subjects.map((subject) => ({ filter: subject, label: subject })),
  ];
}

export function filterBySubject<T extends HasSubject>(items: readonly T[], subject: string): T[] {
  if (subject === ALL_SUBJECTS) return [...items];
  return items.filter((item) => item.subjectName === subject);
}

/** Mon con dang di hoc (khong bao luu, chua ket thuc): chi cac mon nay co lo trinh dang dien ra. */
export function getStudyingEnrollments(
  enrollments: readonly StudentEnrollment[],
): StudentEnrollment[] {
  return enrollments.filter((enrollment) => getCourseStatus(enrollment) === 'ACTIVE');
}

/** Chip chon mon tren lo trinh, kem icon mon. Chi mot mon thi khong can chon nen tra rong. */
export function getRoadmapCourseOptions(
  enrollments: readonly StudentEnrollment[],
): FilterOption<string>[] {
  if (enrollments.length < 2) return [];
  return enrollments.map(({ id, className, subjectName }) => ({
    filter: id,
    label: className,
    icon: SUBJECT_ICONS[subjectName] ?? DEFAULT_SUBJECT_ICON,
  }));
}

function isLessonDone({ session }: Pick<EnrollmentLesson, 'session'>): boolean {
  return session?.status === 'COMPLETED';
}

function getLessonProgress(
  lesson: Pick<EnrollmentLesson, 'session'>,
  isFirstPending: boolean,
): LessonProgress {
  if (isLessonDone(lesson)) return 'DONE';
  if (isFirstPending && lesson.session?.status === 'SCHEDULED') return 'CURRENT';
  return 'UPCOMING';
}

/**
 * Sap theo thu tu bai va gan vi tri tren lo trinh. Bai dang hoc la bai dau tien chua hoc xong, va
 * chi khi lop da xep buoi cho bai do (dang bao luu hay buoi bi huy thi khong co bai dang hoc).
 */
export function getRoadmapLessons(lessons: readonly EnrollmentLesson[]): RoadmapLesson[] {
  const sorted = [...lessons].sort((a, b) => a.sequence - b.sequence);
  const firstPendingIndex = sorted.findIndex((lesson) => !isLessonDone(lesson));
  return sorted.map((lesson, index) => ({
    ...lesson,
    progress: getLessonProgress(lesson, index === firstPendingIndex),
  }));
}

export function summarizeRoadmap(lessons: readonly RoadmapLesson[]): RoadmapSummary {
  const counts: Record<LessonProgress, number> = { DONE: 0, CURRENT: 0, UPCOMING: 0 };
  lessons.forEach(({ progress }) => {
    counts[progress] += 1;
  });
  return {
    ...counts,
    total: lessons.length,
    percent:
      getCourseProgress({ completedSessions: counts.DONE, totalSessions: lessons.length }) ?? 0,
    nextAssessment:
      lessons.find(({ kind, progress }) => kind === 'ASSESSMENT' && progress !== 'DONE') ?? null,
  };
}

/** Vi tri (phan tram) cuoi moi bai kiem tra dinh ky tren thanh tien do cua lo trinh. */
export function getAssessmentMarkers(
  lessons: readonly RoadmapLesson[],
): { id: string; percent: number }[] {
  return lessons.flatMap(({ id, kind }, index) =>
    kind === 'ASSESSMENT' ? [{ id, percent: ((index + 1) / lessons.length) * PERCENT }] : [],
  );
}

/** Lo trinh thu gon: vai bai da hoc gan nhat, bai dang hoc (hoac chua hoc dau tien) va vai bai sau. */
export function getRoadmapWindow(lessons: readonly RoadmapLesson[]): RoadmapLesson[] {
  const firstPendingIndex = lessons.findIndex(({ progress }) => progress !== 'DONE');
  const anchor = firstPendingIndex === -1 ? lessons.length : firstPendingIndex;
  return lessons.slice(
    Math.max(0, anchor - ROADMAP_DONE_LESSONS_SHOWN),
    anchor + 1 + ROADMAP_UPCOMING_LESSONS_SHOWN,
  );
}

/** Nhan tren the bai: bai kiem tra chua lam thi bao la kiem tra dinh ky. */
export function getLessonBadge({
  kind,
  progress,
}: Pick<RoadmapLesson, 'kind' | 'progress'>): StatusAppearance {
  if (kind === 'ASSESSMENT' && progress !== 'DONE') return ASSESSMENT_BADGE;
  return LESSON_PROGRESSES[progress];
}

/** Vd `02/10` voi bai da hoc, `Hôm nay, 18:00` voi bai sap hoc, `Chưa xếp lịch`. */
export function formatLessonSchedule(
  { session, progress }: Pick<RoadmapLesson, 'session' | 'progress'>,
  now: Date = new Date(),
): string {
  if (!session) return 'Chưa xếp lịch';
  if (progress === 'DONE') return formatDayMonth(session.startsAt);
  return formatNextSession(session.startsAt, now);
}

/** Vd `Điểm bài tập: 9.0`, `Điểm kiểm tra: 8.5`. */
export function formatLessonScore(kind: LessonKind, score: number): string {
  return `${LESSON_SCORE_LABELS[kind]}: ${formatScore(score)}`;
}

function isPastDue(dueAt: string, now: Date): boolean {
  return new Date(dueAt) < now;
}

export function getAssignmentState(
  { submittedAt, dueAt }: Pick<LessonAssignment, 'submittedAt' | 'dueAt'>,
  now: Date = new Date(),
): AssignmentState {
  if (submittedAt) return 'SUBMITTED';
  return isPastDue(dueAt, now) ? 'OVERDUE' : 'PENDING';
}

/** Vd `Hạn nộp: 23:59, 18/10`. */
export function formatAssignmentDue(dueAt: string): string {
  return `Hạn nộp: ${formatTime(dueAt)}, ${formatDayMonth(dueAt)}`;
}

/** Vd `Đã nộp: 20:00, 17/10`. */
export function formatAssignmentSubmitted(submittedAt: string): string {
  return `Đã nộp: ${formatTime(submittedAt)}, ${formatDayMonth(submittedAt)}`;
}

/** Tab cua bai: da co diem, da nop cho cham, hay chua nop. */
export function getAssignmentTab({
  submission,
  grade,
}: Pick<StudentAssignment, 'submission' | 'grade'>): AssignmentTab {
  if (grade) return 'GRADED';
  return submission ? 'SUBMITTED' : 'TODO';
}

export function countAssignmentsByTab(
  assignments: readonly StudentAssignment[],
): Record<AssignmentTab, number> {
  const counts: Record<AssignmentTab, number> = { TODO: 0, SUBMITTED: 0, GRADED: 0 };
  assignments.forEach((assignment) => {
    counts[getAssignmentTab(assignment)] += 1;
  });
  return counts;
}

type AssignmentComparator = (a: StudentAssignment, b: StudentAssignment) => number;

function toTime(value: string | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

/** Bai con han truoc, han gan nhat truoc; bai qua han xep sau, moi qua han truoc. */
function compareToDo(now: Date): AssignmentComparator {
  return (a, b) => {
    const isAPastDue = isPastDue(a.dueAt, now);
    if (isAPastDue !== isPastDue(b.dueAt, now)) return isAPastDue ? 1 : -1;
    const dueDiff = toTime(a.dueAt) - toTime(b.dueAt);
    return isAPastDue ? -dueDiff : dueDiff;
  };
}

const TAB_COMPARATORS: Record<AssignmentTab, (now: Date) => AssignmentComparator> = {
  TODO: compareToDo,
  // Moi nop truoc
  SUBMITTED: () => (a, b) => toTime(b.submission?.submittedAt) - toTime(a.submission?.submittedAt),
  // Moi cong bo diem truoc
  GRADED: () => (a, b) => toTime(b.grade?.publishedAt) - toTime(a.grade?.publishedAt),
};

/** Cac bai thuoc tab `tab`, sap theo thu tu phu huynh can xem. Khong sua mang goc. */
export function getTabAssignments(
  assignments: readonly StudentAssignment[],
  tab: AssignmentTab,
  now: Date = new Date(),
): StudentAssignment[] {
  return assignments
    .filter((assignment) => getAssignmentTab(assignment) === tab)
    .sort(TAB_COMPARATORS[tab](now));
}

/** Bai chua nop con han co han nop gan nhat. null khi khong con bai nao nop duoc. */
export function findNearestDueAssignment(
  assignments: readonly StudentAssignment[],
  now: Date = new Date(),
): StudentAssignment | null {
  return (
    getTabAssignments(assignments, 'TODO', now).find(({ dueAt }) => !isPastDue(dueAt, now)) ?? null
  );
}

export type AssignmentDeadline = StatusAppearance & { isUrgent: boolean };

/** Nhan han nop cua bai chua nop, vd `Còn 2 ngày`, `Hạn hôm nay`, `Quá hạn`. */
export function getAssignmentDeadline(dueAt: string, now: Date = new Date()): AssignmentDeadline {
  if (isPastDue(dueAt, now)) return { ...ASSIGNMENT_STATES.OVERDUE, isUrgent: false };

  const daysLeft = diffInCalendarDays(now, new Date(dueAt));
  const isUrgent = daysLeft <= URGENT_DUE_DAYS;
  return {
    label: daysLeft === 0 ? 'Hạn hôm nay' : `Còn ${daysLeft} ngày`,
    ...DEADLINE_APPEARANCES[isUrgent ? 'urgent' : 'normal'],
    isUrgent,
  };
}

export function getAssignmentFormat(
  questionCounts: Record<QuestionKind, number>,
): AssignmentFormat {
  const hasMultipleChoice = questionCounts.MULTIPLE_CHOICE > 0;
  const hasEssay = questionCounts.ESSAY > 0;
  if (hasMultipleChoice && hasEssay) return 'MIXED';
  return hasMultipleChoice ? 'MULTIPLE_CHOICE' : 'ESSAY';
}

/** Vd `15 câu hỏi`. */
export function formatQuestionCount(questionCounts: Record<QuestionKind, number>): string {
  return `${questionCounts.MULTIPLE_CHOICE + questionCounts.ESSAY} câu hỏi`;
}

/** So lan con con duoc nop lai: het han nop thi khong nop lai duoc nua. */
export function getRemainingAttempts(
  {
    maxAttempts,
    dueAt,
    submission,
  }: Pick<StudentAssignment, 'maxAttempts' | 'dueAt' | 'submission'>,
  now: Date = new Date(),
): number {
  if (isPastDue(dueAt, now)) return 0;
  return Math.max(0, maxAttempts - (submission?.attemptNo ?? 0));
}

/** Xep loai diem bai tap theo `SCORE_LEVELS`, sau khi quy ve thang diem 10. */
export function getGradeLevel({
  totalScore,
  maxScore,
}: Pick<AssignmentGrade, 'totalScore' | 'maxScore'>): ScoreLevel {
  const score = maxScore > 0 ? (totalScore / maxScore) * SCORE_SCALE : 0;
  return getScoreLevel(score);
}

/** So cau cua de theo loai cau hoi, de hien hinh thuc bai (trac nghiem, tu luan). */
export function countQuestionKinds(
  questions: readonly Pick<AssignmentQuestion, 'kind'>[],
): Record<QuestionKind, number> {
  const counts: Record<QuestionKind, number> = { MULTIPLE_CHOICE: 0, ESSAY: 0 };
  questions.forEach(({ kind }) => {
    counts[kind] += 1;
  });
  return counts;
}

/** Tong diem toi da cua de. */
export function getAssignmentMaxScore(
  questions: readonly Pick<AssignmentQuestion, 'maxScore'>[],
): number {
  return questions.reduce((total, { maxScore }) => total + maxScore, 0);
}

/**
 * Recipient cua con dang xem. Mot bai co the giao cho nhieu con cua cung phu huynh nen tim theo ghi
 * danh cua con. null khi bai khong giao cho con nay.
 */
export function findStudentRecipient(
  recipients: readonly AssignmentRecipient[],
  enrollmentIds: readonly string[],
): AssignmentRecipient | null {
  return recipients.find(({ enrollmentId }) => enrollmentIds.includes(enrollmentId)) ?? null;
}

/** Lan nop moi nhat cua con. null khi con chua nop. */
export function findLatestSubmission(
  submissions: readonly SubmissionRecord[],
  recipientId: string,
): SubmissionRecord | null {
  return submissions
    .filter((submission) => submission.recipientId === recipientId)
    .reduce<SubmissionRecord | null>(
      (latest, submission) =>
        !latest || submission.attemptNo > latest.attemptNo ? submission : latest,
      null,
    );
}

/** Diem da cong bo cua lan nop. BE tra ban sua moi nhat truoc. null khi chua cong bo. */
export function getPublishedGrade(submission: SubmissionRecord | null): SubmissionGrade | null {
  return submission?.grades[0] ?? null;
}

/** Con con nop duoc: bai dang mo, chua qua han va con luot nop. */
export function canSubmitAssignment(
  { status, dueAt, maxAttempts }: Pick<AssignmentDetail, 'status' | 'dueAt' | 'maxAttempts'>,
  attemptsUsed: number,
  now: Date = new Date(),
): boolean {
  return status === 'PUBLISHED' && !isPastDue(dueAt, now) && attemptsUsed < maxAttempts;
}

/** Nhan trang thai tren man chi tiet bai: da co diem, dang cham, het han, hoac con bao nhieu ngay. */
export function getAssignmentDetailStatus(
  detail: Pick<AssignmentDetail, 'status' | 'dueAt' | 'maxAttempts'>,
  latest: SubmissionRecord | null,
  now: Date = new Date(),
): StatusAppearance {
  if (getPublishedGrade(latest)) return GRADED_STATUS;
  if (latest) return GRADING_STATUS;
  if (!canSubmitAssignment(detail, 0, now)) return CLOSED_ASSIGNMENT_STATUS;

  const { label, tone, icon } = getAssignmentDeadline(detail.dueAt, now);
  return { label, tone, icon };
}

/** So cau con chua tra loi. Cau chi co khoang trang coi nhu chua lam. */
export function countUnanswered(
  questions: readonly Pick<AssignmentQuestion, 'id'>[],
  draft: AnswerDraft,
): number {
  return questions.filter(({ id }) => (draft[id]?.trim() ?? '') === '').length;
}

/** Body nop bai: dung mot cau tra loi cho moi cau hoi, theo thu tu de. */
export function toSubmissionAnswers(
  questions: readonly Pick<AssignmentQuestion, 'id' | 'kind'>[],
  draft: AnswerDraft,
): SubmissionAnswer[] {
  return questions.map(({ id, kind }) => {
    const answer = draft[id] ?? '';
    // Lua chon trac nghiem phai khop tung ky tu voi de nen giu nguyen
    return { questionId: id, answer: kind === 'ESSAY' ? answer.trim() : answer };
  });
}

/** Bai lam cua mot lan nop sang cau tra loi dang lam, de con sua tu bai cu khi nop lai. */
export function toAnswerDraft(answers: readonly SubmissionAnswer[]): AnswerDraft {
  return Object.fromEntries(answers.map(({ questionId, answer }) => [questionId, answer]));
}

/** Ket qua mot cau cua lan nop: cau tra loi, diem, nhan xet va dap an neu da cong bo. */
export function getQuestionReview(
  question: AssignmentQuestion,
  submission: SubmissionRecord | null,
): QuestionReview {
  const answer =
    submission?.answers.find(({ questionId }) => questionId === question.id)?.answer ?? '';
  const questionScore = getPublishedGrade(submission)?.scores.find(
    ({ questionId }) => questionId === question.id,
  );
  const correctAnswer = question.correctAnswer ?? null;
  const canJudge =
    question.kind === 'MULTIPLE_CHOICE' && correctAnswer !== null && submission !== null;
  const feedback = questionScore?.feedback ?? '';

  return {
    answer,
    score: questionScore?.score ?? null,
    // Giao vien khong ghi nhan xet thi BE tra chuoi rong
    feedback: feedback === '' ? null : feedback,
    correctAnswer,
    isCorrect: canJudge ? answer === correctAnswer : null,
  };
}

/** Trang thai cua mot lua chon khi xem lai bai: chua co dap an thi chi danh dau lua chon cua con. */
export function getChoiceState(
  choice: string,
  { answer, correctAnswer }: Pick<QuestionReview, 'answer' | 'correctAnswer'>,
): ChoiceState {
  if (correctAnswer === null) return choice === answer ? 'SELECTED' : 'IDLE';
  if (choice === correctAnswer) return 'CORRECT';
  return choice === answer ? 'WRONG' : 'IDLE';
}

/** Vd `1 điểm`, `2.5 điểm`: khong them so 0 thua nhu diem tong ket. */
export function formatPoints(points: number): string {
  return `${points} điểm`;
}

/** Vd `Lần nộp 1/2`. */
export function formatAttempt(attemptNo: number, maxAttempts: number): string {
  return `Lần nộp ${attemptNo}/${maxAttempts}`;
}

/**
 * Ngay cua API hoc phi sang ngay theo gio cua may. BE tra cot ngay la 00:00 UTC (ghi danh) hoac
 * `YYYY-MM-DD` (bien lai); chi lay phan ngay de may o mui gio am khong bi lui mot ngay.
 */
export function parseApiDate(value: string | null): Date | null {
  return value ? parseDateKey(value.slice(0, API_DATE_LENGTH)) : null;
}

/** Vd `05/10/2026`. `--` khi API khong tra ngay. */
export function formatApiDate(value: string | null): string {
  const date = parseApiDate(value);
  return date ? formatDate(date) : '--';
}

/** Cot Decimal cua Prisma ra JSON la chuoi, vd `"3600000"`. null khi khong doc duoc thanh so. */
export function parseAmount(value: string | number): number | null {
  if (typeof value === 'string' && value.trim() === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/** Vd `3.600.000 ₫`. `--` khi so tien khong doc duoc. */
export function formatAmount(value: string | number, currency?: string): string {
  const amount = parseAmount(value);
  return amount === null ? '--' : formatCurrency(amount, currency);
}

/** Vd `Gói 3 tháng`. */
export function formatPackageLabel(packageMonths: number): string {
  return `Gói ${packageMonths} tháng`;
}

/** Thang bat dau ky hoc, vd `Kỳ 10/2026`. */
export function formatTermPeriod(startDate: string | null): string {
  const date = parseApiDate(startDate);
  return `Kỳ ${date ? formatMonthYear(date) : '--'}`;
}

/**
 * Ky hoc `[startDate, endDate)` so voi hom nay. Ghi danh `ACTIVE` chua chac dang hoc: co the chua
 * toi ngay bat dau hoac da qua ngay het han.
 */
export function getTermStatus(
  { status, startDate, endDate }: Pick<TuitionEnrollment, 'status' | 'startDate' | 'endDate'>,
  now: Date = new Date(),
): TermStatus {
  if (status === 'ENDED') return 'EXPIRED';

  const today = startOfDay(now);
  const start = parseApiDate(startDate);
  const end = parseApiDate(endDate);
  if (end && today >= end) return 'EXPIRED';
  if (start && today < start) return 'UPCOMING';
  return 'CURRENT';
}

/** Goi hoc con hieu luc (dang hoc hoac sap hoc), giu thu tu cua API. */
export function getActivePackages(
  enrollments: readonly TuitionEnrollment[],
  now: Date = new Date(),
): TuitionEnrollment[] {
  return enrollments.filter((enrollment) => getTermStatus(enrollment, now) !== 'EXPIRED');
}

function hasPayment(enrollment: TuitionEnrollment): enrollment is PaidEnrollment {
  return enrollment.registrationOrder.payment !== null;
}

/** Cac lan dong hoc phi da duoc xac nhan, moi xac nhan truoc. Khong sua mang goc. */
export function getPaymentHistory(enrollments: readonly TuitionEnrollment[]): PaidEnrollment[] {
  const confirmedTime = (enrollment: PaidEnrollment) =>
    new Date(enrollment.registrationOrder.payment.confirmedAt).getTime();
  return enrollments.filter(hasPayment).sort((a, b) => confirmedTime(b) - confirmedTime(a));
}

/** Don nhan vien da lap nhung trung tam chua xac nhan thu hoc phi. */
export function getPendingRegistrations(
  registrations: readonly StudentRegistration[],
): StudentRegistration[] {
  return registrations.filter(({ status }) => status === 'DRAFT');
}

function toIsoWeekday(date: Date): number {
  const day = date.getDay();
  return day === SUNDAY ? ISO_SUNDAY : day;
}

/** So lan thu `isoWeekday` xuat hien trong `days` ngay lien tiep ke tu `from`. */
function countWeekdayOccurrences(from: Date, days: number, isoWeekday: number): number {
  const firstOffset = (isoWeekday - toIsoWeekday(from) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  if (firstOffset >= days) return 0;
  return Math.floor((days - firstOffset - 1) / DAYS_PER_WEEK) + 1;
}

/**
 * So buoi cua ky hoc `[startDate, endDate)` theo lich co dinh cua lop va so buoi roi vao cac ngay
 * truoc hom nay. BE chua tra so buoi da hoc that, nen khong tinh ngay nghi, buoi huy hay hoc bu.
 * null khi thieu ngay hoac lop chua co lich.
 */
export function countTermSessions(
  enrollment: Pick<TuitionEnrollment, 'startDate' | 'endDate' | 'class'>,
  now: Date = new Date(),
): TermSessionCount | null {
  const start = parseApiDate(enrollment.startDate);
  const end = parseApiDate(enrollment.endDate);
  if (!start || !end) return null;

  const termDays = diffInCalendarDays(start, end);
  const elapsedDays = Math.min(Math.max(diffInCalendarDays(start, now), 0), termDays);
  const countIn = (days: number) =>
    enrollment.class.weeklySchedules.reduce(
      (sum, { weekday }) => sum + countWeekdayOccurrences(start, days, weekday),
      0,
    );

  const total = countIn(termDays);
  return total > 0 ? { elapsed: countIn(elapsedDays), total } : null;
}

/** Hoc phi moi thang cua bien lai: BE bao gia bang hoc phi thang nhan voi so thang. */
export function getMonthlyFee({
  quotedAmount,
  term,
}: Pick<TuitionReceipt, 'quotedAmount' | 'term'>): number | null {
  return term.packageMonths > 0 ? quotedAmount / term.packageMonths : null;
}

function readOnes(ones: number, tens: number): string {
  if (ones === 1 && tens > 1) return 'mốt';
  if (ones === 5 && tens > 0) return 'lăm';
  return DIGIT_WORDS[ones] ?? '';
}

function readTensAndOnes(tens: number, ones: number, hasHundreds: boolean): string[] {
  if (tens === 0 && ones === 0) return [];
  if (tens === 0) return hasHundreds ? ['linh', readOnes(ones, tens)] : [readOnes(ones, tens)];

  const tensWords = tens === 1 ? ['mười'] : [DIGIT_WORDS[tens] ?? '', 'mươi'];
  return ones === 0 ? tensWords : [...tensWords, readOnes(ones, tens)];
}

/** Doc mot nhom ba chu so. Nhom dung sau nhom khac phai doc ca hang tram, vd `không trăm linh năm`. */
function readDigitGroup(group: number, isLeading: boolean): string[] {
  const hundreds = Math.floor(group / HUNDRED);
  const tens = Math.floor((group % HUNDRED) / TEN);
  const ones = group % TEN;
  const hasHundreds = hundreds > 0 || !isLeading;
  const hundredsWords = hasHundreds ? [DIGIT_WORDS[hundreds] ?? '', 'trăm'] : [];
  return [...hundredsWords, ...readTensAndOnes(tens, ones, hasHundreds)];
}

/**
 * Doc so nguyen khong am bang chu, vd `3600000` -> `ba triệu sáu trăm nghìn`. null khi so am, so le
 * hoac tu mot nghin ty tro len.
 */
export function readVietnameseNumber(value: number): string | null {
  if (!Number.isInteger(value) || value < 0) return null;
  if (value === 0) return DIGIT_WORDS[0];

  const groupCount = Math.ceil(String(value).length / DIGITS_PER_GROUP);
  if (groupCount > GROUP_UNITS.length) return null;

  // Phan tu thu i la nhom ba chu so co don vi GROUP_UNITS[i], tinh tu hang don vi
  const groups = Array.from(
    { length: groupCount },
    (_, index) => Math.floor(value / GROUP_SIZE ** index) % GROUP_SIZE,
  );
  return groups
    .map((group, index) =>
      group === 0
        ? []
        : [...readDigitGroup(group, index === groupCount - 1), GROUP_UNITS[index] ?? ''],
    )
    .reverse()
    .flat()
    .filter(Boolean)
    .join(' ');
}

/** Dong "Bằng chữ" tren bien lai, vd `Ba triệu sáu trăm nghìn đồng chẵn`. null khi khong doc duoc. */
export function formatAmountInWords(amount: number): string | null {
  const words = readVietnameseNumber(amount);
  if (!words) return null;
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng${amount > 0 ? ' chẵn' : ''}`;
}

/** Noi dung bien lai dang chu de chia se qua ung dung khac (tin nhan, email). */
export function buildReceiptShareMessage({
  payment,
  student,
  class: classroom,
  term,
}: TuitionReceipt): string {
  return [
    `Biên lai thu học phí #${payment.receiptNumber}`,
    CENTER_NAME,
    `Học sinh: ${student.fullName} (khối ${student.grade})`,
    `Lớp: ${classroom.name}`,
    `${formatPackageLabel(term.packageMonths)}: bắt đầu ${formatApiDate(term.startDate)}, hết hạn ${formatApiDate(term.endDate)}`,
    `Số tiền đã thu: ${formatCurrency(payment.amount, payment.currency)}`,
    `Ngày thu: ${formatDate(payment.confirmedAt)}`,
  ].join('\n');
}
