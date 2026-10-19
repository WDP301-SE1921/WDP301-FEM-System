/**
 * Ghep du lieu cua BE thanh du lieu man hinh phu huynh. Buoi hoc, bai tap, diem danh, diem va giao
 * trinh doc theo tung con (`studentId`); ten giao vien cua bai tap va phong cua lop lay them tu ghi danh
 * cua con (GET /me/students/:id/enrollments) va danh sach phong. Cac field BE chua co (gio vao lop, tai
 * lieu cua buoi) de null hoac rong.
 */
import { addDays, toDateKey } from '@/utils/date';

import type {
  AssignmentListItem,
  AttendanceHistoryItem,
  AttendanceRecord,
  ClassSessionStatus,
  CurriculumItemKind,
  CurriculumUnit,
  EnrollmentLesson,
  GradeHistoryItem,
  LeaveRequest,
  LessonKind,
  LessonSession,
  ParticipantKind,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  ScheduleRange,
  ScheduleSession,
  ScheduleSessionType,
  ScoreSummary,
  SessionDetail,
  StudentAssignment,
  StudentEnrollment,
  SubjectGradeAverage,
  TuitionClass,
  TuitionEnrollment,
} from '../types';
import { countTermSessions, getTermStatus, parseApiDate } from '../utils';

const LESSON_KINDS: Record<CurriculumItemKind, LessonKind> = {
  LESSON: 'LESSON',
  MONTHLY_TEST: 'ASSESSMENT',
};

/** Do dai phan `YYYY-MM-DD` o dau cot ngay cua Prisma (00:00 UTC cua ngay do). */
const DATE_KEY_LENGTH = 10;

function toTime(value: string): number {
  return new Date(value).getTime();
}

/** Cot ngay cua Prisma sang khoa `YYYY-MM-DD`, khong doi mui gio de khong lech mot ngay. */
function toApiDateKey(value: string): string {
  return value.slice(0, DATE_KEY_LENGTH);
}

/** Buoi trung tam da huy: van hien trong lich nhung khong con la buoi con hoc. */
function isCancelledSession({ status }: Pick<ScheduledSession, 'status'>): boolean {
  return status === 'CANCELLED';
}

/** Buoi con den hoc bu, khong phai buoi co dinh cua lop con. */
function isMakeupSession({ participations }: Pick<ScheduledSession, 'participations'>): boolean {
  return participations[0]?.kind === 'MAKEUP';
}

/** Buoi bi huy hien la buoi huy du con hoc buoi co dinh hay hoc bu. */
function getScheduleSessionType(
  status: ClassSessionStatus,
  participantKind: ParticipantKind | undefined,
): ScheduleSessionType {
  if (status === 'CANCELLED') return 'CANCELLED';
  return participantKind === 'MAKEUP' ? 'MAKEUP' : 'REGULAR';
}

/**
 * Buoi thuoc ghi danh. Co cho cua con trong buoi thi theo ghi danh cua cho do. Chua co thi giong cach
 * BE chon buoi: ghi danh con `ACTIVE`, buoi roi vao ky hoc `[startDate, endDate)` va dung lop con hoc
 * luc do. Ngay hoc tinh theo gio cua may: app dung o Viet Nam, cung mui gio BE dung de tinh ngay.
 */
export function isEnrollmentSession(
  session: Pick<ScheduledSession, 'classId' | 'startsAt' | 'participations'>,
  enrollment: Pick<
    TuitionEnrollment,
    'id' | 'status' | 'startDate' | 'endDate' | 'class' | 'placements'
  >,
): boolean {
  const [participation] = session.participations;
  if (participation) return participation.enrollmentId === enrollment.id;

  const { status, startDate, endDate } = enrollment;
  if (status !== 'ACTIVE' || !startDate || !endDate) return false;

  const day = toDateKey(new Date(session.startsAt));
  if (day < toApiDateKey(startDate) || day >= toApiDateKey(endDate)) return false;

  if (enrollment.placements.length === 0) return enrollment.class.id === session.classId;
  const startsAt = toTime(session.startsAt);
  return enrollment.placements.some(
    ({ classId, effectiveFrom, effectiveTo }) =>
      classId === session.classId &&
      toTime(effectiveFrom) <= startsAt &&
      (effectiveTo === null || toTime(effectiveTo) > startsAt),
  );
}

export function toScheduleSession(session: ScheduledSession): ScheduleSession {
  return {
    id: session.id,
    className: session.class.name,
    subjectName: session.class.program.subject,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    room: session.room?.name ?? null,
    teacherName: session.teacher.displayName,
    type: getScheduleSessionType(session.status, session.participations[0]?.kind),
    topic: session.lesson.title,
    note: isCancelledSession(session) ? session.cancelReason : null,
  };
}

/** Cac buoi BE tra cho mot con, giu thu tu cua BE. Buoi bi huy van giu de phu huynh biet. */
export function toStudentSchedule(sessions: readonly ScheduledSession[]): ScheduleSession[] {
  return sessions.map(toScheduleSession);
}

/** Ten phong theo id. null khi khong co phong hoac phong khong co trong danh sach. */
export function findRoomName(rooms: readonly Room[], roomId: string | null): string | null {
  if (!roomId) return null;
  return rooms.find(({ id }) => id === roomId)?.name ?? null;
}

/** Chi tiet mot buoi cua con. Buoi da huy van hien, kem ly do huy cua trung tam. */
export function toSessionDetail(detail: ScheduledSessionDetail): SessionDetail {
  const { participation } = detail;

  return {
    id: detail.id,
    className: detail.class.name,
    subjectName: detail.class.program.subject,
    startsAt: detail.startsAt,
    endsAt: detail.endsAt,
    room: detail.room?.name ?? null,
    teacherName: detail.teacher.displayName,
    type: getScheduleSessionType(detail.status, participation?.kind),
    topic: detail.lesson.title,
    note: detail.status === 'CANCELLED' ? detail.cancelReason : null,
    status: detail.status,
    // `sequence` cua BE dem trong tung hoc phan (thang), khong khop so bai tren lo trinh cua mon
    lesson: { sequence: null, title: detail.lesson.title, description: null },
    attendance: participation?.attendance ?? null,
    checkedInAt: null,
    // BE luu chuoi rong khi giao vien khong ghi
    teacherComment: detail.summary || null,
    materials: [],
  };
}

/** Lop con dang hoc: lan xep lop dang hieu luc, khong co thi lan xep gan nhat, roi lop luc dang ky. */
export function getCurrentClass(
  enrollment: Pick<TuitionEnrollment, 'class' | 'placements'>,
  now: Date = new Date(),
): TuitionClass {
  const { placements } = enrollment;
  const at = now.getTime();
  const current = placements.find(
    ({ effectiveFrom, effectiveTo }) =>
      toTime(effectiveFrom) <= at && (effectiveTo === null || toTime(effectiveTo) > at),
  );
  return (current ?? placements[placements.length - 1])?.class ?? enrollment.class;
}

/** Ngay cua ky hoc `[startDate, endDate)` de hoi lich. null khi ghi danh chua co ngay. */
export function getTermRange(
  enrollment: Pick<TuitionEnrollment, 'startDate' | 'endDate'>,
): ScheduleRange | null {
  const start = parseApiDate(enrollment.startDate);
  const end = parseApiDate(enrollment.endDate);
  if (!start || !end || end <= start) return null;
  return { from: toDateKey(start), to: toDateKey(addDays(end, -1)) };
}

export type EnrollmentSources = {
  enrollments: readonly TuitionEnrollment[];
  /** Don bao luu da duyet dang hieu luc hom nay cua con. */
  pauses: readonly LeaveRequest[];
  /** Buoi cua con tu hom nay tro di, theo gio tang dan. */
  upcomingSessions: readonly ScheduledSession[];
  rooms: readonly Room[];
  /** Diem trung binh theo mon cua con. */
  subjectGrades: readonly SubjectGradeAverage[];
  now?: Date;
};

/** Cac mon cua con, giu thu tu cua BE (moi ghi danh truoc). */
export function toStudentEnrollments({
  enrollments,
  pauses,
  upcomingSessions,
  rooms,
  subjectGrades,
  now = new Date(),
}: EnrollmentSources): StudentEnrollment[] {
  return enrollments.map((enrollment) => {
    const currentClass = getCurrentClass(enrollment, now);
    // BE khong tu chuyen ghi danh het han sang `ENDED`
    const status = getTermStatus(enrollment, now) === 'EXPIRED' ? 'ENDED' : enrollment.status;
    const isActive = status === 'ACTIVE';
    const pause = isActive
      ? pauses.find(({ enrollmentId }) => enrollmentId === enrollment.id)
      : undefined;
    const nextSession = isActive
      ? upcomingSessions.find(
          (session) =>
            !isCancelledSession(session) &&
            toTime(session.startsAt) > now.getTime() &&
            isEnrollmentSession(session, enrollment),
        )
      : undefined;
    const termSessions = countTermSessions({ ...enrollment, class: currentClass }, now);
    const subjectName = currentClass.program.subject;

    return {
      id: enrollment.id,
      status,
      pause: pause
        ? { fromDate: toApiDateKey(pause.fromDate), toDate: toApiDateKey(pause.toDate) }
        : null,
      programName: currentClass.program.name,
      subjectName,
      className: currentClass.name,
      teacherName: currentClass.teacher?.displayName ?? null,
      room: findRoomName(rooms, currentClass.roomId),
      weeklySlots: currentClass.weeklySchedules,
      completedSessions: termSessions?.elapsed ?? 0,
      totalSessions: termSessions?.total ?? 0,
      averageScore:
        subjectGrades.find(({ subject }) => subject === subjectName)?.averageOutOf10 ?? null,
      nextSession: nextSession ? { id: nextSession.id, startsAt: nextSession.startsAt } : null,
      endDate: enrollment.endDate ? toApiDateKey(enrollment.endDate) : null,
    };
  });
}

/**
 * Buoi day bai cua ghi danh, theo gio hoc. Buoi hoc bu day lai bai cua buoi vang, buoi bi huy khong
 * day bai nao, nen ca hai khong tinh.
 */
function getLessonSessions(
  sessions: readonly ScheduledSession[],
  enrollment: TuitionEnrollment,
): ScheduledSession[] {
  return sessions
    .filter(
      (session) =>
        isEnrollmentSession(session, enrollment) &&
        !isMakeupSession(session) &&
        !isCancelledSession(session),
    )
    .sort((a, b) => toTime(a.startsAt) - toTime(b.startsAt));
}

function toLessonSession({ id, startsAt, status }: ScheduledSession): LessonSession {
  return { id, startsAt, status };
}

/** Lo trinh khi lop chua co hoc phan: moi buoi la mot bai, theo gio hoc. */
function toSessionLessons(sessions: readonly ScheduledSession[]): EnrollmentLesson[] {
  return sessions.map((session, index) => ({
    id: session.id,
    sequence: index + 1,
    title: session.lesson.title,
    description: null,
    kind: LESSON_KINDS[session.lesson.kind],
    session: toLessonSession(session),
    assignment: null,
  }));
}

/**
 * Bai cua cac hoc phan lop con dang hoc, theo thu tu hoc phan (BE tra hoc phan som nhat truoc) roi thu
 * tu bai, kem buoi som nhat day bai do. Bai chua xep buoi thi khong co buoi.
 */
function toCurriculumLessons(
  units: readonly CurriculumUnit[],
  sessions: readonly ScheduledSession[],
  classId: string,
): EnrollmentLesson[] {
  const sessionByLesson = new Map<string, ScheduledSession>();
  sessions.forEach((session) => {
    if (!sessionByLesson.has(session.lesson.id)) sessionByLesson.set(session.lesson.id, session);
  });

  const seenLessonIds = new Set<string>();
  const lessons = units
    .filter((unit) => unit.classes.some(({ id }) => id === classId))
    .flatMap((unit) => [...unit.lessons].sort((a, b) => a.sequence - b.sequence))
    .filter(({ id }) => {
      // Phong khi hai phien ban cua mot hoc phan cung chua mot bai
      if (seenLessonIds.has(id)) return false;
      seenLessonIds.add(id);
      return true;
    });

  return lessons.map((lesson, index) => {
    const session = sessionByLesson.get(lesson.id);
    return {
      id: lesson.id,
      sequence: index + 1,
      title: lesson.title,
      description: null,
      kind: LESSON_KINDS[lesson.kind],
      session: session ? toLessonSession(session) : null,
      assignment: null,
    };
  });
}

export type LessonSources = {
  enrollment: TuitionEnrollment;
  /** Buoi cua con trong ky ghi danh. */
  sessions: readonly ScheduledSession[];
  /** Hoc phan da duyet cua cac lop con dang hoc. */
  units: readonly CurriculumUnit[];
  now?: Date;
};

/**
 * Lo trinh cua ghi danh: bai cua hoc phan da duyet (ca bai chua xep buoi), kem buoi day bai. Lop chua
 * co hoc phan nao (vd ky hoc chua bat dau, BE chi tra hoc phan cua ky dang hoc) thi moi buoi la mot bai.
 */
export function toEnrollmentLessons({
  enrollment,
  sessions,
  units,
  now = new Date(),
}: LessonSources): EnrollmentLesson[] {
  const lessonSessions = getLessonSessions(sessions, enrollment);
  const curriculumLessons = toCurriculumLessons(
    units,
    lessonSessions,
    getCurrentClass(enrollment, now).id,
  );
  return curriculumLessons.length > 0 ? curriculumLessons : toSessionLessons(lessonSessions);
}

/** Lop `classId` trong cac lop con da hoc theo ghi danh. null khi khong thay. */
function findStudentClass(
  enrollments: readonly TuitionEnrollment[],
  classId: string,
): TuitionClass | null {
  for (const enrollment of enrollments) {
    if (enrollment.class.id === classId) return enrollment.class;
    const placement = enrollment.placements.find((item) => item.classId === classId);
    if (placement) return placement.class;
  }
  return null;
}

export type AssignmentSources = {
  item: AssignmentListItem;
  studentId: string;
  enrollments: readonly TuitionEnrollment[];
};

/** Bai tap cua con kem lan nop gan nhat va diem da cong bo. null khi bai khong giao cho con nay. */
export function toStudentAssignment({
  item,
  studentId,
  enrollments,
}: AssignmentSources): StudentAssignment | null {
  const recipient = item.recipients.find((entry) => entry.studentId === studentId);
  if (!recipient) return null;

  const latest = recipient.latestSubmission;
  const grade = latest?.publishedGrade;

  return {
    id: item.id,
    testType: item.testType,
    title: item.title,
    subjectName: item.class.program.subject,
    className: item.class.name,
    teacherName: findStudentClass(enrollments, item.classId)?.teacher?.displayName ?? null,
    dueAt: item.dueAt,
    maxAttempts: item.maxAttempts,
    questionCounts: {
      MULTIPLE_CHOICE: item.questionCounts.multipleChoice,
      ESSAY: item.questionCounts.essay,
    },
    submission: latest ? { attemptNo: latest.attemptNo, submittedAt: latest.submittedAt } : null,
    grade: grade?.publishedAt
      ? {
          totalScore: grade.totalScore,
          maxScore: item.maxScore,
          // BE luu chuoi rong khi giao vien khong nhan xet
          feedback: grade.feedback || null,
          publishedAt: grade.publishedAt,
        }
      : null,
  };
}

/**
 * Lich su diem danh cua con, giu thu tu cua BE. Buoi con co mat thi khong kem don nghi hay lich hoc
 * bu.
 */
export function toAttendanceRecords(history: readonly AttendanceHistoryItem[]): AttendanceRecord[] {
  return history.map((item) => {
    const isPresent = item.effectiveStatus === 'PRESENT';
    const makeup = isPresent ? null : item.latestMakeup;
    return {
      sessionId: item.session.id,
      className: item.class.name,
      subjectName: item.class.program.subject,
      startsAt: item.session.startsAt,
      endsAt: item.session.endsAt,
      status: item.effectiveStatus,
      leaveReason: isPresent ? null : (item.approvedLeave?.reason ?? null),
      makeup: makeup
        ? { status: makeup.status, startsAt: makeup.replacement.session.startsAt }
        : null,
    };
  });
}

function averageOf(scores: readonly number[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Diem trung binh cac bai da cong bo (thang 10, khong trong so, cung cach BE tinh diem trung binh mon)
 * va chenh lech so voi diem trung binh tinh toi het thang truoc. null khi con chua co diem.
 */
export function toScoreSummary(
  history: readonly GradeHistoryItem[],
  now: Date = new Date(),
): ScoreSummary | null {
  const scored = history.filter(
    (item): item is GradeHistoryItem & { scoreOutOf10: number } => item.scoreOutOf10 !== null,
  );
  const average = averageOf(scored.map(({ scoreOutOf10 }) => scoreOutOf10));
  if (average === null) return null;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const previousAverage = averageOf(
    scored
      .filter(({ publishedAt }) => publishedAt !== null && toTime(publishedAt) < monthStart)
      .map(({ scoreOutOf10 }) => scoreOutOf10),
  );
  return {
    average,
    changeFromLastMonth: previousAverage === null ? null : average - previousAverage,
  };
}
