/**
 * Ghep du lieu cua BE thanh du lieu man hinh phu huynh. BE tra buoi hoc va bai tap chung cho moi con
 * cua phu huynh, khong kem id cua con, nen app tach theo ghi danh cua tung con
 * (GET /me/students/:id/enrollments). Cac field BE chua co (ten giao vien, phong, diem danh, nhan xet)
 * de null hoac rong.
 */
import { addDays, toDateKey } from '@/utils/date';

import type {
  AssignmentDetail,
  CurriculumItemKind,
  EnrollmentLesson,
  LeaveRequest,
  LessonKind,
  ScheduledSession,
  ScheduleRange,
  ScheduleSession,
  SessionDetail,
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

/**
 * Buoi thuoc ghi danh khi ghi danh con `ACTIVE`, buoi roi vao ky hoc `[startDate, endDate)` va dung
 * lop con hoc luc do, giong cach BE chon buoi cho phu huynh. Ngay hoc tinh theo gio cua may: app
 * dung o Viet Nam, cung mui gio BE dung de tinh ngay.
 */
export function isEnrollmentSession(
  session: Pick<ScheduledSession, 'classId' | 'startsAt'>,
  enrollment: Pick<TuitionEnrollment, 'status' | 'startDate' | 'endDate' | 'class' | 'placements'>,
): boolean {
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

function isStudentSession(
  session: ScheduledSession,
  enrollments: readonly TuitionEnrollment[],
): boolean {
  return enrollments.some((enrollment) => isEnrollmentSession(session, enrollment));
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
    type: 'REGULAR',
    topic: session.lesson.title,
    note: null,
  };
}

/** Cac buoi cua mot con trong cac buoi BE tra cho phu huynh, giu thu tu cua BE. */
export function toStudentSchedule(
  sessions: readonly ScheduledSession[],
  enrollments: readonly TuitionEnrollment[],
): ScheduleSession[] {
  return sessions
    .filter((session) => isStudentSession(session, enrollments))
    .map(toScheduleSession);
}

/** Chi tiet buoi `sessionId` cua con. null khi buoi khong thuoc con hoac BE khong tra (da huy). */
export function findSessionDetail(
  sessions: readonly ScheduledSession[],
  enrollments: readonly TuitionEnrollment[],
  sessionId: string,
): SessionDetail | null {
  const session = sessions.find(
    (item) => item.id === sessionId && isStudentSession(item, enrollments),
  );
  if (!session) return null;

  return {
    ...toScheduleSession(session),
    status: session.status,
    lesson: { sequence: null, title: session.lesson.title, description: null },
    attendance: null,
    checkedInAt: null,
    teacherComment: null,
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
  /** Buoi tu hom nay tro di, theo gio tang dan. */
  upcomingSessions: readonly ScheduledSession[];
  now?: Date;
};

/** Cac mon cua con, giu thu tu cua BE (moi ghi danh truoc). */
export function toStudentEnrollments({
  enrollments,
  pauses,
  upcomingSessions,
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
      room: null,
      weeklySlots: currentClass.weeklySchedules,
      completedSessions: termSessions?.elapsed ?? 0,
      totalSessions: termSessions?.total ?? 0,
      averageScore: null,
      nextSession: nextSession ? { id: nextSession.id, startsAt: nextSession.startsAt } : null,
      endDate: enrollment.endDate ? toApiDateKey(enrollment.endDate) : null,
    };
  });
}

/** Lo trinh cua ghi danh: moi buoi trong ky hoc la mot bai, theo gio hoc. */
export function toEnrollmentLessons(
  sessions: readonly ScheduledSession[],
  enrollment: TuitionEnrollment,
): EnrollmentLesson[] {
  return sessions
    .filter((session) => isEnrollmentSession(session, enrollment))
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

/** Lop cua bai tap trong cac lop con da hoc theo ghi danh. */
function findAssignmentClass(enrollment: TuitionEnrollment, classId: string): TuitionClass {
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

  const assignmentClass = findAssignmentClass(enrollment, detail.classId);
  const latest = findLatestSubmission(submissions, recipient.id);
  const grade = getPublishedGrade(latest);

  return {
    id: detail.id,
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
