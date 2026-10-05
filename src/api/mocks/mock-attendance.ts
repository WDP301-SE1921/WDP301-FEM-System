/**
 * Lich su diem danh gia cua hoc sinh mau (`./mock-students.ts`), dung cho route diem danh trong
 * `./parent.ts`. Buoi hoc lay tu lich gia (`./mock-schedule.ts`), ket qua diem danh lay tu chi tiet
 * buoi gia (`./mock-session-details.ts`), nen khop voi lich tuan va man chi tiet buoi hoc. Chi tra
 * buoi da ket thuc, tu ngay con vao lop (`CLASS_START_DAYS`), moi nhat truoc. Ngay tinh tu hom nay:
 * - Minh Anh  : Vat ly tu (hom nay - 28), Toan tu (hom nay - 21), khop so buoi da hoc cua mock mon
 *               hoc. 17 buoi truoc hom nay, nghi co phep (hom nay - 3) va da xep hoc bu vao
 *               (hom nay + 2): 16/17 nhu mock trang chu. Buoi Toan hom nay tinh them khi ket thuc
 * - Hoang Long: Tieng Anh tu (hom nay - 42): 12 buoi co dinh, vang khong phep (hom nay - 6), nghi co
 *               phep (hom nay - 20) va da hoc bu vao (hom nay - 18): 11/13 nhu mock trang chu
 * Con phu huynh vua tao chua co buoi hoc.
 */
import { addDays, diffInCalendarDays, startOfDay } from '@/utils/date';

import { buildMockSchedule, CLASS_START_DAYS, type MockScheduleSession } from './mock-schedule';
import { buildMockSessionDetail, type MockSessionDetail } from './mock-session-details';

/** Du de lay het buoi cua lop vao som nhat trong `CLASS_START_DAYS`. */
const HISTORY_DAYS = 42;

type AttendanceStatus = MockSessionDetail['attendance'];

type MakeupStatus = 'BOOKED' | 'COMPLETED' | 'MISSED';

type AbsenceFollowUp = {
  /** Ly do trong don xin nghi da duyet, chi tra o buoi nghi co phep. */
  leaveReason: string | null;
  /** Ngay co buoi `MAKEUP` trong lich gia, tinh tu hom nay. null khi chua xep hoc bu. */
  makeupDay: number | null;
};

/** Response diem danh. */
export type MockAttendanceRecord = Pick<
  MockScheduleSession,
  'className' | 'subjectName' | 'startsAt' | 'endsAt' | 'room'
> & {
  sessionId: string;
  kind: 'REGULAR' | 'MAKEUP';
  attendance: AttendanceStatus;
  leaveReason: string | null;
  makeup: { status: MakeupStatus; startsAt: string } | null;
  originalSession: { startsAt: string } | null;
};

/**
 * Don xin nghi va buoi hoc bu cua buoi vang. Key ngoai la id hoc sinh, key trong la so ngay tu hom
 * nay toi buoi vang, phai trung ngay vang trong `./mock-session-details.ts`.
 */
const ABSENCE_FOLLOW_UPS: Partial<Record<string, Partial<Record<number, AbsenceFollowUp>>>> = {
  'mock-student-1': {
    [-3]: {
      leaveReason: 'Con bị sốt, gia đình đã báo giáo vụ và xin xếp lịch học bù',
      makeupDay: 2,
    },
  },
  'mock-student-2': {
    [-20]: { leaveReason: 'Gia đình về quê có việc', makeupDay: -18 },
  },
};

function daysFromToday(now: Date, value: string): number {
  return diffInCalendarDays(now, new Date(value));
}

function findSessionOnDay(
  studentId: string,
  day: number,
  now: Date,
  predicate: (session: MockScheduleSession) => boolean,
): MockScheduleSession | undefined {
  const date = addDays(startOfDay(now), day);
  return buildMockSchedule(studentId, date, date, now).find(predicate);
}

function getAttendance(studentId: string, sessionId: string, now: Date): AttendanceStatus {
  return buildMockSessionDetail(studentId, sessionId, now)?.attendance ?? 'UNMARKED';
}

function getMakeupStatus(studentId: string, session: MockScheduleSession, now: Date): MakeupStatus {
  if (new Date(session.endsAt) > now) return 'BOOKED';
  return getAttendance(studentId, session.id, now) === 'PRESENT' ? 'COMPLETED' : 'MISSED';
}

function findMakeup(
  studentId: string,
  makeupDay: number,
  now: Date,
): MockAttendanceRecord['makeup'] {
  const session = findSessionOnDay(studentId, makeupDay, now, ({ type }) => type === 'MAKEUP');
  return session
    ? { status: getMakeupStatus(studentId, session, now), startsAt: session.startsAt }
    : null;
}

/** Buoi vang ma buoi hoc bu `makeup` bu cho. */
function findOriginalSession(
  studentId: string,
  makeup: MockScheduleSession,
  now: Date,
): MockAttendanceRecord['originalSession'] {
  const makeupDay = daysFromToday(now, makeup.startsAt);
  const absenceDay = Object.entries(ABSENCE_FOLLOW_UPS[studentId] ?? {}).find(
    ([, followUp]) => followUp?.makeupDay === makeupDay,
  )?.[0];
  if (absenceDay === undefined) return null;

  const original = findSessionOnDay(
    studentId,
    Number(absenceDay),
    now,
    ({ className }) => className === makeup.className,
  );
  return original ? { startsAt: original.startsAt } : null;
}

function toRecord(
  studentId: string,
  session: MockScheduleSession,
  now: Date,
): MockAttendanceRecord {
  const attendance = getAttendance(studentId, session.id, now);
  const kind = session.type === 'MAKEUP' ? 'MAKEUP' : 'REGULAR';
  const isAbsent = attendance === 'ABSENT' || attendance === 'EXCUSED';
  const followUp = isAbsent
    ? ABSENCE_FOLLOW_UPS[studentId]?.[daysFromToday(now, session.startsAt)]
    : undefined;
  const makeupDay = followUp?.makeupDay;

  return {
    sessionId: session.id,
    className: session.className,
    subjectName: session.subjectName,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    room: session.room,
    kind,
    attendance,
    leaveReason: attendance === 'EXCUSED' ? (followUp?.leaveReason ?? null) : null,
    makeup: typeof makeupDay === 'number' ? findMakeup(studentId, makeupDay, now) : null,
    originalSession: kind === 'MAKEUP' ? findOriginalSession(studentId, session, now) : null,
  };
}

function hasJoinedClass(session: MockScheduleSession, now: Date): boolean {
  const startDay = CLASS_START_DAYS[session.className];
  return startDay === undefined || daysFromToday(now, session.startsAt) >= startDay;
}

/** Cac buoi da ket thuc cua hoc sinh kem ket qua diem danh, moi nhat truoc. */
export function buildMockAttendance(
  studentId: string,
  now: Date = new Date(),
): MockAttendanceRecord[] {
  const today = startOfDay(now);
  return buildMockSchedule(studentId, addDays(today, -HISTORY_DAYS), today, now)
    .filter((session) => new Date(session.endsAt) <= now && hasJoinedClass(session, now))
    .map((session) => toRecord(studentId, session, now))
    .reverse();
}
