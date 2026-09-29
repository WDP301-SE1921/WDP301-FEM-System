/**
 * Lich hoc gia cua hoc sinh mau (`./mock-students.ts`), dung cho route lich hoc trong `./parent.ts`.
 * Lich tinh theo so ngay ke tu hom nay chu khong theo thu, de buoi Toan 18:00 hom nay cua Minh Anh
 * khop voi `todaySessions` cua mock trang chu va tuan nao cung co du lieu:
 * - Minh Anh  : Toan va Vat ly, lap lai moi 7 ngay, nghi vao (hom nay + 2) va (hom nay + 6).
 *               Rieng 7 ngay tu hom nay: (hom nay + 2) co buoi hoc bu Vat ly, buoi Vat ly cua
 *               (hom nay + 4) doi len toi (hom nay + 3) nen (hom nay + 4) nghi
 * - Hoang Long: Tieng Anh vao (hom nay + 1) va (hom nay + 4), hom nay khong hoc
 * Hoc sinh vua lien ket bang ma lien ket chua co lich.
 */
import { addDays, diffInCalendarDays, startOfDay, toDateKey } from '@/utils/date';
import { formatDayMonth, formatWeekdayDate } from '@/utils/format';

const DAYS_PER_CYCLE = 7;

type ClassInfo = {
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

const MATH_8A2: ClassInfo = {
  className: 'Toán nâng cao 8A2',
  subjectName: 'Toán',
  teacherName: 'Đặng Hải Yến',
  room: 'P.203 (Tầng 2)',
};
const PHYSICS_8: ClassInfo = {
  className: 'Vật lý 8 chuyên sâu',
  subjectName: 'Vật lý',
  teacherName: 'Trần Quang Huy',
  room: 'Lab 102',
};
const ENGLISH_6A1: ClassInfo = {
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
          ...PHYSICS_HEAT,
          start: [8, 30],
          end: [10, 0],
          topic: 'Nhiệt học chuyên sâu',
          type: 'MAKEUP',
          // (hom nay - 3) la ngay co buoi Quang hoc cua chu ky truoc
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
      [regular(ENGLISH_6A1, [17, 45], [19, 15], 'Unit 3: My friends')],
      [],
      [],
      [regular(ENGLISH_6A1, [17, 45], [19, 15], null)],
      [],
      [],
    ],
    changes: {},
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
