/**
 * Ghep du lieu cua BE thanh du lieu man hinh phu huynh. Buoi hoc doc theo tung con (`studentId`) kem cho
 * cua con trong buoi; bai tap, lich hoc bu va lich su diem danh chi co id ghi danh hoac id lop, nen app
 * lay ten lop, mon tu ghi danh cua con (GET /me/students/:id/enrollments). Cac field BE chua co (ten
 * giao vien o lich tuan, gio vao lop, tai lieu) de null hoac rong.
 */
import { addDays, toDateKey } from '@/utils/date';

import type {
  AssignmentDetail,
  AttendanceHistoryItem,
  AttendanceMakeup,
  AttendanceRecord,
  CurriculumItemKind,
  EnrollmentLesson,
  LeaveRequest,
  LessonKind,
  MakeupBooking,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  ScheduleRange,
  ScheduleSession,
  SessionDetail,
  SessionParticipation,
  StudentAssignment,
  StudentEnrollment,
  SubmissionRecord,
  TuitionClass,
  TuitionEnrollment,
} from '../types';
import {
  countQuestionKinds,
  countTermSessions,
  findLatestSubmission,
  findStudentRecipient,
  getAssignmentMaxScore,
  getPublishedGrade,
  getTermStatus,
  parseApiDate,
} from '../utils';

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

/** Cho con hieu luc cua con trong buoi. undefined khi con chua co trong buoi hoac cho da bi huy. */
function findActiveParticipation(
  participations: readonly SessionParticipation[],
): SessionParticipation | undefined {
  return participations.find(({ cancelled }) => !cancelled);
}

/**
 * Con con hoc buoi nay. BE tra ca buoi ma cho cua con da bi huy (con chuyen lop, lich hoc bu bi huy);
 * buoi chua co danh sach diem danh thi BE da chon theo lop va ky hoc cua con.
 */
export function isAttendedSession({
  participations,
}: Pick<ScheduledSession, 'participations'>): boolean {
  return participations.length === 0 || findActiveParticipation(participations) !== undefined;
}

/** Buoi con den hoc bu, khong phai buoi co dinh cua lop con. */
function isMakeupSession({ participations }: Pick<ScheduledSession, 'participations'>): boolean {
  return findActiveParticipation(participations)?.kind === 'MAKEUP';
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
  if (session.participations.length > 0) {
    return findActiveParticipation(session.participations)?.enrollmentId === enrollment.id;
  }

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
    room: null,
    teacherName: null,
    type: isMakeupSession(session) ? 'MAKEUP' : 'REGULAR',
    topic: session.lesson.title,
    note: null,
  };
}

/** Cac buoi con con hoc trong cac buoi BE tra cho mot con, giu thu tu cua BE. */
export function toStudentSchedule(sessions: readonly ScheduledSession[]): ScheduleSession[] {
  return sessions.filter(isAttendedSession).map(toScheduleSession);
}

/** Ten phong theo id. null khi khong co phong hoac phong khong co trong danh sach. */
export function findRoomName(rooms: readonly Room[], roomId: string | null): string | null {
  if (!roomId) return null;
  return rooms.find(({ id }) => id === roomId)?.name ?? null;
}

/** Chi tiet mot buoi cua con. Buoi da huy van hien, kem ly do huy cua trung tam. */
export function toSessionDetail(
  detail: ScheduledSessionDetail,
  rooms: readonly Room[],
): SessionDetail {
  const participation =
    detail.participation && !detail.participation.cancelled ? detail.participation : null;

  return {
    id: detail.id,
    className: detail.class.name,
    subjectName: detail.class.program.subject,
    startsAt: detail.startsAt,
    endsAt: detail.endsAt,
    room: findRoomName(rooms, detail.roomId ?? detail.class.roomId),
    teacherName: detail.teacher.displayName,
    type: participation?.kind === 'MAKEUP' ? 'MAKEUP' : 'REGULAR',
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
  now?: Date;
};

/** Cac mon cua con, giu thu tu cua BE (moi ghi danh truoc). */
export function toStudentEnrollments({
  enrollments,
  pauses,
  upcomingSessions,
  rooms,
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
            toTime(session.startsAt) > now.getTime() && isEnrollmentSession(session, enrollment),
        )
      : undefined;
    const termSessions = countTermSessions({ ...enrollment, class: currentClass }, now);

    return {
      id: enrollment.id,
      status,
      pause: pause
        ? { fromDate: toApiDateKey(pause.fromDate), toDate: toApiDateKey(pause.toDate) }
        : null,
      programName: currentClass.program.name,
      subjectName: currentClass.program.subject,
      className: currentClass.name,
      teacherName: null,
      room: findRoomName(rooms, currentClass.roomId),
      weeklySlots: currentClass.weeklySchedules,
      completedSessions: termSessions?.elapsed ?? 0,
      totalSessions: termSessions?.total ?? 0,
      averageScore: null,
      nextSession: nextSession ? { id: nextSession.id, startsAt: nextSession.startsAt } : null,
      endDate: enrollment.endDate ? toApiDateKey(enrollment.endDate) : null,
    };
  });
}

/**
 * Lo trinh cua ghi danh: moi buoi co dinh trong ky hoc la mot bai, theo gio hoc. Buoi hoc bu day lai
 * bai cua buoi vang nen khong tinh them.
 */
export function toEnrollmentLessons(
  sessions: readonly ScheduledSession[],
  enrollment: TuitionEnrollment,
): EnrollmentLesson[] {
  return sessions
    .filter((session) => isEnrollmentSession(session, enrollment) && !isMakeupSession(session))
    .sort((a, b) => toTime(a.startsAt) - toTime(b.startsAt))
    .map((session, index) => ({
      id: session.id,
      sequence: index + 1,
      title: session.lesson.title,
      description: null,
      kind: LESSON_KINDS[session.lesson.kind],
      session: { id: session.id, startsAt: session.startsAt, status: session.status },
      assignment: null,
    }));
}

/** Lop `classId` trong cac lop con da hoc theo ghi danh, khong thay thi lop luc dang ky. */
function findEnrollmentClass(enrollment: TuitionEnrollment, classId: string): TuitionClass {
  const placement = enrollment.placements.find((item) => item.classId === classId);
  return placement?.class ?? enrollment.class;
}

export type AssignmentSources = {
  detail: AssignmentDetail;
  submissions: readonly SubmissionRecord[];
  enrollments: readonly TuitionEnrollment[];
};

/** Bai tap cua con kem lan nop gan nhat va diem da cong bo. null khi bai khong giao cho con nay. */
export function toStudentAssignment({
  detail,
  submissions,
  enrollments,
}: AssignmentSources): StudentAssignment | null {
  const recipient = findStudentRecipient(
    detail.recipients,
    enrollments.map(({ id }) => id),
  );
  const enrollment = enrollments.find(({ id }) => id === recipient?.enrollmentId);
  if (!recipient || !enrollment) return null;

  const assignmentClass = findEnrollmentClass(enrollment, detail.classId);
  const latest = findLatestSubmission(submissions, recipient.id);
  const grade = getPublishedGrade(latest);

  return {
    id: detail.id,
    testType: detail.testType,
    title: detail.title,
    instructions: detail.instructions,
    subjectName: assignmentClass.program.subject,
    className: assignmentClass.name,
    teacherName: null,
    dueAt: detail.dueAt,
    maxAttempts: detail.maxAttempts,
    questionCounts: countQuestionKinds(detail.questions),
    submission: latest ? { attemptNo: latest.attemptNo, submittedAt: latest.submittedAt } : null,
    grade: grade?.publishedAt
      ? {
          totalScore: grade.totalScore,
          maxScore: getAssignmentMaxScore(detail.questions),
          // BE luu chuoi rong khi giao vien khong nhan xet
          feedback: grade.feedback || null,
          publishedAt: grade.publishedAt,
        }
      : null,
  };
}

/** Lop ma con da hoc theo cac ghi danh: chi bai tap cua cac lop nay moi co the giao cho con. */
export function getStudentClassIds(enrollments: readonly TuitionEnrollment[]): Set<string> {
  return new Set(
    enrollments.flatMap(({ class: { id }, placements }) => [
      id,
      ...placements.map(({ classId }) => classId),
    ]),
  );
}

type ActiveMakeupBooking = MakeupBooking & { status: AttendanceMakeup['status'] };

function isActiveBooking(booking: MakeupBooking): booking is ActiveMakeupBooking {
  return booking.status !== 'CANCELLED';
}

/** Lich hoc bu moi nhat chua huy cua buoi vang (BE tra lich moi xep truoc). */
function findMakeup(
  makeups: readonly MakeupBooking[],
  { enrollmentId, session }: AttendanceHistoryItem,
): AttendanceMakeup | null {
  const booking = makeups
    .filter(isActiveBooking)
    .find(
      ({ original }) => original.sessionId === session.id && original.enrollmentId === enrollmentId,
    );
  return booking
    ? { status: booking.status, startsAt: booking.replacement.session.startsAt }
    : null;
}

/** Ly do cua don nghi da duyet ap cho buoi: don nghi dung buoi do, hoac don tam nghi chua ngay hoc. */
function findLeaveReason(
  leaves: readonly LeaveRequest[],
  { enrollmentId, session }: AttendanceHistoryItem,
): string | null {
  const day = toDateKey(new Date(session.startsAt));
  const leave = leaves.find(
    (item) =>
      item.status === 'APPROVED' &&
      item.enrollmentId === enrollmentId &&
      (item.kind === 'SINGLE_ABSENCE'
        ? item.sessionId === session.id
        : toApiDateKey(item.fromDate) <= day && day <= toApiDateKey(item.toDate)),
  );
  return leave?.reason ?? null;
}

export type AttendanceSources = {
  history: readonly AttendanceHistoryItem[];
  enrollments: readonly TuitionEnrollment[];
  makeups: readonly MakeupBooking[];
  leaves: readonly LeaveRequest[];
};

/**
 * Lich su diem danh cua con, giu thu tu cua BE. Lop va mon lay theo ghi danh cua buoi; buoi con co mat
 * thi khong kem don nghi hay lich hoc bu.
 */
export function toAttendanceRecords({
  history,
  enrollments,
  makeups,
  leaves,
}: AttendanceSources): AttendanceRecord[] {
  return history.flatMap((item) => {
    const enrollment = enrollments.find(({ id }) => id === item.enrollmentId);
    if (!enrollment) return [];

    const sessionClass = findEnrollmentClass(enrollment, item.session.classId);
    const isPresent = item.effectiveStatus === 'PRESENT';
    return [
      {
        sessionId: item.session.id,
        className: sessionClass.name,
        subjectName: sessionClass.program.subject,
        startsAt: item.session.startsAt,
        endsAt: item.session.endsAt,
        status: item.effectiveStatus,
        leaveReason: isPresent ? null : findLeaveReason(leaves, item),
        makeup: isPresent ? null : findMakeup(makeups, item),
      },
    ];
  });
}
