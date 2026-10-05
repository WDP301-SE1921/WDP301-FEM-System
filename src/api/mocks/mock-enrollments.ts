/**
 * Mon hoc (Enrollment) gia cua hoc sinh mau (`./mock-students.ts`), dung cho route mon hoc trong
 * `./parent.ts`. Mon dang hoc lay lich co dinh va buoi tiep theo tu lich gia (`./mock-schedule.ts`)
 * nen khop voi lich tuan. Ngay tinh theo so ngay ke tu hom nay:
 * - Minh Anh  : Toan, Vat ly dang hoc; Hoa hoc dang bao luu tu (hom nay - 10) toi (hom nay + 49),
 *               chua co diem; Ngu van da ket thuc vao (hom nay - 33)
 * - Hoang Long: Tieng Anh dang hoc
 * Mon dang bao luu hoac da ket thuc tra `weeklySlots` rong va khong co buoi tiep theo. Con phu huynh
 * vua tao chua co mon hoc.
 */
import { addDays, startOfDay, toDateKey } from '@/utils/date';
import { formatTime } from '@/utils/format';

import {
  buildMockSchedule,
  ENGLISH_6A1,
  MATH_8A2,
  PHYSICS_8,
  type ClassInfo,
  type MockScheduleSession,
} from './mock-schedule';

const DAYS_PER_WEEK = 7;
/** `Date.getDay()` cua Chu nhat; ISO 8601 ghi Chu nhat la 7. */
const SUNDAY = 0;
const ISO_SUNDAY = 7;
/** Hai tuan du de moi lop dang hoc co it nhat mot buoi. */
const NEXT_SESSION_LOOKAHEAD_DAYS = 14;

type MockWeeklySlot = { weekday: number; startTime: string; endTime: string };

/** Response mon hoc. */
export type MockEnrollment = ClassInfo & {
  id: string;
  status: 'ACTIVE' | 'ENDED';
  pause: { fromDate: string; toDate: string } | null;
  programName: string;
  weeklySlots: MockWeeklySlot[];
  completedSessions: number;
  totalSessions: number;
  averageScore: number | null;
  nextSession: { id: string; startsAt: string } | null;
  endDate: string | null;
};

type EnrollmentTemplate = Pick<
  MockEnrollment,
  'id' | 'status' | 'programName' | 'completedSessions' | 'totalSessions' | 'averageScore'
> & {
  classInfo: ClassInfo;
  /** Ngay bat dau va ket thuc cua don bao luu, tinh tu hom nay. */
  pauseDays: readonly [from: number, to: number] | null;
  /** Ngay `endDate`, tinh tu hom nay. */
  endDay: number;
};

/** Lop khong co trong lich gia vi con dang bao luu hoac da hoc xong. */
const CHEMISTRY_8: ClassInfo = {
  className: 'Hóa học 8 cơ bản',
  subjectName: 'Hóa học',
  teacherName: 'Hoàng Tuấn Tú',
  room: 'P.105',
};
const LITERATURE_8: ClassInfo = {
  className: 'Ngữ văn 8 ôn hè',
  subjectName: 'Ngữ văn',
  teacherName: 'Mai Phương Linh',
  room: 'P.201',
};

/** Diem Toan va Vat ly cua Minh Anh trung binh ra 8.2, khop voi mock trang chu. */
const ENROLLMENTS: Partial<Record<string, readonly EnrollmentTemplate[]>> = {
  'mock-student-1': [
    {
      id: 'mock-enrollment-1',
      status: 'ACTIVE',
      classInfo: MATH_8A2,
      programName: 'Toán 8 – Chuyên đề nâng cao',
      completedSessions: 9,
      totalSessions: 24,
      averageScore: 8.6,
      pauseDays: null,
      endDay: 105,
    },
    {
      id: 'mock-enrollment-2',
      status: 'ACTIVE',
      classInfo: PHYSICS_8,
      programName: 'Vật lý 8 – Chuyên sâu và thí nghiệm',
      completedSessions: 8,
      totalSessions: 24,
      averageScore: 7.8,
      pauseDays: null,
      endDay: 112,
    },
    {
      id: 'mock-enrollment-3',
      status: 'ACTIVE',
      classInfo: CHEMISTRY_8,
      programName: 'Hóa học 8 – Củng cố kiến thức',
      completedSessions: 6,
      totalSessions: 20,
      averageScore: null,
      pauseDays: [-10, 49],
      endDay: 140,
    },
    {
      id: 'mock-enrollment-4',
      status: 'ENDED',
      classInfo: LITERATURE_8,
      programName: 'Ngữ văn 8 – Ôn luyện hè',
      completedSessions: 20,
      totalSessions: 20,
      averageScore: 9,
      pauseDays: null,
      endDay: -33,
    },
  ],
  'mock-student-2': [
    {
      id: 'mock-enrollment-5',
      status: 'ACTIVE',
      classInfo: ENGLISH_6A1,
      programName: 'Tiếng Anh 6 – Giao tiếp cơ bản',
      completedSessions: 12,
      totalSessions: 24,
      averageScore: 6.8,
      pauseDays: null,
      endDay: 98,
    },
  ],
};

function toIsoWeekday(date: Date): number {
  const day = date.getDay();
  return day === SUNDAY ? ISO_SUNDAY : day;
}

function dateKeyFromToday(now: Date, days: number): string {
  return toDateKey(addDays(startOfDay(now), days));
}

function sessionsOfClass(sessions: MockScheduleSession[], className: string) {
  return sessions.filter((session) => session.className === className);
}

/** Lay tu tuan sau vi 7 ngay toi co the co buoi hoc bu, doi lich. */
function findWeeklySlots(studentId: string, className: string, now: Date): MockWeeklySlot[] {
  const nextWeek = addDays(startOfDay(now), DAYS_PER_WEEK);
  const sessions = buildMockSchedule(
    studentId,
    nextWeek,
    addDays(nextWeek, DAYS_PER_WEEK - 1),
    now,
  );
  return sessionsOfClass(sessions, className)
    .map((session) => ({
      weekday: toIsoWeekday(new Date(session.startsAt)),
      startTime: formatTime(session.startsAt),
      endTime: formatTime(session.endsAt),
    }))
    .sort((a, b) => a.weekday - b.weekday);
}

/** Buoi chua ket thuc som nhat, ke ca buoi dang dien ra. */
function findNextSession(
  studentId: string,
  className: string,
  now: Date,
): MockEnrollment['nextSession'] {
  const today = startOfDay(now);
  const sessions = buildMockSchedule(
    studentId,
    today,
    addDays(today, NEXT_SESSION_LOOKAHEAD_DAYS - 1),
    now,
  );
  const next = sessionsOfClass(sessions, className).find(
    (session) => new Date(session.endsAt) > now,
  );
  return next ? { id: next.id, startsAt: next.startsAt } : null;
}

function toEnrollment(
  studentId: string,
  { classInfo, pauseDays, endDay, ...enrollment }: EnrollmentTemplate,
  now: Date,
): MockEnrollment {
  const isStudying = enrollment.status === 'ACTIVE' && !pauseDays;
  return {
    ...enrollment,
    ...classInfo,
    pause: pauseDays
      ? {
          fromDate: dateKeyFromToday(now, pauseDays[0]),
          toDate: dateKeyFromToday(now, pauseDays[1]),
        }
      : null,
    weeklySlots: isStudying ? findWeeklySlots(studentId, classInfo.className, now) : [],
    nextSession: isStudying ? findNextSession(studentId, classInfo.className, now) : null,
    endDate: dateKeyFromToday(now, endDay),
  };
}

/** Cac mon hoc sinh da ghi danh, khong theo thu tu nao (BE chua chot cach sap xep). */
export function buildMockEnrollments(studentId: string, now: Date = new Date()): MockEnrollment[] {
  return (ENROLLMENTS[studentId] ?? []).map((template) => toEnrollment(studentId, template, now));
}
