/**
 * Chi tiet buoi hoc gia. Man chi tiet buoi da noi BE that; du lieu nay con la nguon ket qua diem
 * danh cua mock diem danh (`./mock-attendance.ts`). Buoi hoc tim theo id trong lich gia
 * (`./mock-schedule.ts`). Bai hoc lay tu `./mock-lessons.ts`; buoi hoc bu day lai bai cua buoi con
 * nghi. Phan them tinh
 * theo gio ket thuc cua buoi so voi luc goi:
 * - Buoi chua ket thuc: `SCHEDULED`, chua diem danh, chua co nhan xet va tai lieu
 * - Buoi da ket thuc: da chot diem danh (`COMPLETED`), con vao lop som 5 phut, co nhan xet va tai
 *   lieu cua bai. Ngoai le theo so ngay tinh tu hom nay:
 *   - Minh Anh  : (hom nay - 3) nghi co phep buoi Quang hoc, la buoi duoc hoc bu o (hom nay + 2);
 *                 (hom nay - 2) vao lop muon 10 phut
 *   - Hoang Long: (hom nay - 6) vang khong phep; (hom nay - 20) nghi co phep, la buoi duoc hoc bu
 *                 o (hom nay - 18)
 * Chua gia lap buoi hoc bi huy (`CANCELLED`).
 */
import { addDays, diffInCalendarDays, startOfDay } from '@/utils/date';

import { findMockSessionLesson, type MockSessionLesson } from './mock-lessons';
import { buildMockSchedule, findMockSession, type MockScheduleSession } from './mock-schedule';

const MINUTE_MS = 60 * 1000;
/** Mac dinh con vao lop truoc gio hoc 5 phut. */
const ON_TIME_CHECK_IN_OFFSET_MINUTES = -5;

type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'EXCUSED';

type AttendanceRecord =
  | {
      attendance: 'PRESENT';
      /** Phut vao lop so voi gio bat dau, am la vao som. */
      checkInOffsetMinutes: number;
      teacherComment: string | null;
    }
  | { attendance: 'ABSENT' | 'EXCUSED'; teacherComment: string | null };

/** Response chi tiet buoi hoc. */
export type MockSessionDetail = MockScheduleSession & {
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  lesson: Omit<MockSessionLesson, 'materialName'> | null;
  attendance: AttendanceStatus;
  checkedInAt: string | null;
  teacherComment: string | null;
  materials: { id: string; name: string; note: string | null }[];
};

const DEFAULT_COMMENTS: Partial<Record<string, string>> = {
  'mock-student-1':
    'Minh Anh tiếp thu bài tốt, hoàn thành đầy đủ bài tập chuẩn bị và tích cực xây dựng bài trên lớp.',
  'mock-student-2': 'Hoàng Long phát âm tốt, cần luyện thêm phần từ vựng của bài.',
};

/** Key ngoai la id hoc sinh, key trong la so ngay tu hom nay toi buoi hoc (am la da qua). */
const ATTENDANCE_EXCEPTIONS: Partial<Record<string, Partial<Record<number, AttendanceRecord>>>> = {
  'mock-student-1': {
    [-3]: { attendance: 'EXCUSED', teacherComment: null },
    [-2]: {
      attendance: 'PRESENT',
      checkInOffsetMinutes: 10,
      teacherComment:
        'Minh Anh đến muộn nên chưa kịp phần chữa đề đầu giờ, cô đã gửi lại để con xem ở nhà.',
    },
  },
  'mock-student-2': {
    [-6]: {
      attendance: 'ABSENT',
      teacherComment:
        'Hoàng Long vắng buổi này, phụ huynh nhắc con làm bài trong Workbook giúp cô.',
    },
    [-20]: { attendance: 'EXCUSED', teacherComment: null },
  },
};

function addMinutes(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * MINUTE_MS).toISOString();
}

function daysFromToday(now: Date, value: string): number {
  return diffInCalendarDays(now, new Date(value));
}

function findAttendanceRecord(
  studentId: string,
  session: MockScheduleSession,
  now: Date,
): AttendanceRecord {
  return (
    ATTENDANCE_EXCEPTIONS[studentId]?.[daysFromToday(now, session.startsAt)] ?? {
      attendance: 'PRESENT',
      checkInOffsetMinutes: ON_TIME_CHECK_IN_OFFSET_MINUTES,
      teacherComment: DEFAULT_COMMENTS[studentId] ?? null,
    }
  );
}

/** Buoi co dinh gan nhat truoc buoi hoc bu `makeup` ma con nghi, cung lop. */
function findMissedSession(
  studentId: string,
  makeup: MockScheduleSession,
  now: Date,
): MockScheduleSession | undefined {
  const makeupDay = daysFromToday(now, makeup.startsAt);
  const absentDays = Object.entries(ATTENDANCE_EXCEPTIONS[studentId] ?? {})
    .filter(([day, record]) => record && record.attendance !== 'PRESENT' && Number(day) < makeupDay)
    .map(([day]) => Number(day))
    .sort((a, b) => b - a);

  return absentDays
    .map((day) => {
      const date = addDays(startOfDay(now), day);
      return buildMockSchedule(studentId, date, date, now).find(
        (session) => session.className === makeup.className && session.type !== 'MAKEUP',
      );
    })
    .find((session) => session !== undefined);
}

/** Buoi hoc bu day lai bai cua buoi con nghi. */
function findLesson(
  studentId: string,
  session: MockScheduleSession,
  now: Date,
): MockSessionLesson | null {
  const taughtSession =
    session.type === 'MAKEUP' ? findMissedSession(studentId, session, now) : session;
  return taughtSession ? findMockSessionLesson(studentId, taughtSession, now) : null;
}

/** Chi tiet buoi `sessionId` cua hoc sinh, null neu hoc sinh khong co buoi do. */
export function buildMockSessionDetail(
  studentId: string,
  sessionId: string,
  now: Date = new Date(),
): MockSessionDetail | null {
  const session = findMockSession(studentId, sessionId, now);
  if (!session) return null;

  const lesson = findLesson(studentId, session, now);
  const lessonDto = lesson
    ? { sequence: lesson.sequence, title: lesson.title, description: lesson.description }
    : null;

  // BE chi cho chot diem danh khi buoi hoc da ket thuc (loi SESSION_NOT_FINISHED)
  if (new Date(session.endsAt) > now) {
    return {
      ...session,
      status: 'SCHEDULED',
      lesson: lessonDto,
      attendance: 'UNMARKED',
      checkedInAt: null,
      teacherComment: null,
      materials: [],
    };
  }

  const record = findAttendanceRecord(studentId, session, now);
  const isPresent = record.attendance === 'PRESENT';
  return {
    ...session,
    status: 'COMPLETED',
    lesson: lessonDto,
    attendance: record.attendance,
    checkedInAt: isPresent ? addMinutes(session.startsAt, record.checkInOffsetMinutes) : null,
    teacherComment: record.teacherComment,
    materials: lesson?.materialName
      ? [
          {
            id: `${session.id}-material-1`,
            name: lesson.materialName,
            note: isPresent ? 'Đã phát trên lớp' : 'Nhận lại tại quầy lễ tân',
          },
        ]
      : [],
  };
}
