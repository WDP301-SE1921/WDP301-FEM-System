/**
 * Lich hoc gia cua hoc sinh mau (`./mock-students.ts`), dung cho route lich hoc trong `./parent.ts`.
 * Lich tinh theo so ngay ke tu hom nay chu khong theo thu, de buoi Toan 18:00 hom nay cua Minh Anh
 * khop voi `todaySessions` cua mock trang chu va tuan nao cung co du lieu:
 * - Minh Anh  : Toan va Vat ly, lap lai moi 7 ngay, nghi vao (hom nay + 2) va (hom nay + 6).
 *               Rieng 7 ngay tu hom nay: (hom nay + 2) co buoi hoc bu Vat ly, buoi Vat ly cua
 *               (hom nay + 4) doi len toi (hom nay + 3) nen (hom nay + 4) nghi
 * - Hoang Long: Tieng Anh vao (hom nay + 1) va (hom nay + 4), hom nay khong hoc. Rieng
 *               (hom nay - 18) co buoi hoc bu cho buoi nghi (hom nay - 20)
 * Con phu huynh vua tao chua co lich.
 */
import { addDays, diffInCalendarDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date';
import { formatDayMonth, formatWeekdayDate } from '@/utils/format';

const DAYS_PER_CYCLE = 7;
/** Ngay cua buoi nam trong id do `toSession` tao, vd `mock-schedule-<hoc sinh>-2026-10-16-0`. */
const SESSION_ID_DATE_PATTERN = /-(\d{4}-\d{2}-\d{2})-\d+$/;

/** Lop trong lich gia, dung chung voi mock mon hoc (`./mock-enrollments.ts`). */
export type ClassInfo = {
  className: string;
  subjectName: string;
  teacherName: string;
  room: string | null;
};

type SessionType = 'REGULAR' | 'MAKEUP' | 'RESCHEDULED';

type SessionTemplate = {
  classInfo: ClassInfo;
  start: readonly [hours: number, minutes: number];
  end: readonly [hours: number, minutes: number];
  topic: string | null;
  type: SessionType;
  /** Ghi chu tinh theo ngay cua buoi hoc, vd ngay nghi duoc bu. */
  getNote: ((date: Date) => string) | null;
};

type Timetable = {
  /** Lich lap lai moi 7 ngay, phan tu thu i la cac buoi cua ngay (hom nay + i), theo gio tang dan. */
  cycle: readonly (readonly SessionTemplate[])[];
  /** Thay ca lich cua mot ngay, key la so ngay tinh tu hom nay. */
  changes: Partial<Record<number, readonly SessionTemplate[]>>;
};

/** Mot buoi trong response lich hoc. */
export type MockScheduleSession = ClassInfo & {
  id: string;
  startsAt: string;
  endsAt: string;
  type: SessionType;
  topic: string | null;
  note: string | null;
};

export const MATH_8A2: ClassInfo = {
  className: 'Toán nâng cao 8A2',
  subjectName: 'Toán',
  teacherName: 'Đặng Hải Yến',
  room: 'P.203 (Tầng 2)',
};
export const PHYSICS_8: ClassInfo = {
  className: 'Vật lý 8 chuyên sâu',
  subjectName: 'Vật lý',
  teacherName: 'Trần Quang Huy',
  room: 'Lab 102',
};
export const ENGLISH_6A1: ClassInfo = {
  className: 'Tiếng Anh 6A1',
  subjectName: 'Tiếng Anh',
  teacherName: 'Jessica Phạm',
  room: 'P.105',
};

function regular(
  classInfo: ClassInfo,
  start: SessionTemplate['start'],
  end: SessionTemplate['end'],
  topic: string | null,
): SessionTemplate {
  return { classInfo, start, end, topic, type: 'REGULAR', getNote: null };
}

const MATH_ALGEBRA = regular(MATH_8A2, [18, 0], [19, 30], 'Đại số');
const MATH_GEOMETRY = regular(MATH_8A2, [18, 0], [19, 30], 'Hình học');
const MATH_PRACTICE = regular(MATH_8A2, [8, 0], [9, 30], 'Luyện đề');
const PHYSICS_HEAT = regular(PHYSICS_8, [17, 30], [19, 0], 'Nhiệt học');
const PHYSICS_OPTICS = regular(PHYSICS_8, [17, 30], [19, 0], 'Quang học');
const ENGLISH_VOCABULARY = regular(ENGLISH_6A1, [17, 45], [19, 15], 'Từ vựng và ngữ pháp');

/**
 * Ngay con bat dau hoc lop (`Enrollment.startDate`), tinh tu hom nay. Mock coi day cung la ngay lop
 * hoc bai 1 cua chuong trinh (`./mock-lessons.ts`).
 */
export const CLASS_START_DAYS: Partial<Record<string, number>> = {
  [MATH_8A2.className]: -21,
  [PHYSICS_8.className]: -28,
  [ENGLISH_6A1.className]: -42,
};

const TIMETABLES: Partial<Record<string, Timetable>> = {
  'mock-student-1': {
    cycle: [
      [MATH_ALGEBRA],
      [PHYSICS_HEAT],
      [],
      [MATH_GEOMETRY],
      [PHYSICS_OPTICS],
      [MATH_PRACTICE],
      [],
    ],
    changes: {
      2: [
        {
          // Hoc lai bai Quang hoc cua buoi nghi (hom nay - 3)
          ...PHYSICS_OPTICS,
          start: [8, 30],
          end: [10, 0],
          type: 'MAKEUP',
          getNote: (date) => `Bù cho buổi nghỉ ngày ${formatDayMonth(addDays(date, -5))}`,
        },
      ],
      3: [
        MATH_GEOMETRY,
        {
          ...PHYSICS_OPTICS,
          start: [19, 45],
          end: [21, 15],
          type: 'RESCHEDULED',
          getNote: (date) =>
            `Chuyển từ ${formatWeekdayDate(addDays(date, 1))} theo yêu cầu của lớp`,
        },
      ],
      4: [],
    },
  },
  'mock-student-2': {
    cycle: [
      [],
      [ENGLISH_VOCABULARY],
      [],
      [],
      [regular(ENGLISH_6A1, [17, 45], [19, 15], null)],
      [],
      [],
    ],
    changes: {
      [-18]: [
        {
          ...ENGLISH_VOCABULARY,
          type: 'MAKEUP',
          getNote: (date) => `Bù cho buổi nghỉ ngày ${formatDayMonth(addDays(date, -2))}`,
        },
      ],
    },
  },
};

function atTime(date: Date, [hours, minutes]: SessionTemplate['start']): string {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

function toSession(
  studentId: string,
  date: Date,
  template: SessionTemplate,
  index: number,
): MockScheduleSession {
  return {
    ...template.classInfo,
    id: `mock-schedule-${studentId}-${toDateKey(date)}-${index}`,
    startsAt: atTime(date, template.start),
    endsAt: atTime(date, template.end),
    type: template.type,
    topic: template.topic,
    note: template.getNote?.(date) ?? null,
  };
}

/** Cac buoi cua hoc sinh tu ngay `from` toi ngay `to` (gom ca hai ngay), theo gio tang dan. */
export function buildMockSchedule(
  studentId: string,
  from: Date,
  to: Date,
  now: Date = new Date(),
): MockScheduleSession[] {
  const timetable = TIMETABLES[studentId];
  if (!timetable) return [];

  const dayCount = diffInCalendarDays(from, to) + 1;
  return Array.from({ length: dayCount }, (_, offset) => addDays(startOfDay(from), offset)).flatMap(
    (date) => {
      const daysFromToday = diffInCalendarDays(now, date);
      const cycleDay = ((daysFromToday % DAYS_PER_CYCLE) + DAYS_PER_CYCLE) % DAYS_PER_CYCLE;
      const templates = timetable.changes[daysFromToday] ?? timetable.cycle[cycleDay] ?? [];
      return templates.map((template, index) => toSession(studentId, date, template, index));
    },
  );
}

/** Buoi co id `sessionId` trong lich cua hoc sinh, undefined neu id khong thuoc hoc sinh do. */
export function findMockSession(
  studentId: string,
  sessionId: string,
  now: Date = new Date(),
): MockScheduleSession | undefined {
  const dateKey = SESSION_ID_DATE_PATTERN.exec(sessionId)?.[1];
  const date = dateKey ? parseDateKey(dateKey) : null;
  if (!date) return undefined;
  return buildMockSchedule(studentId, date, date, now).find((session) => session.id === sessionId);
}
