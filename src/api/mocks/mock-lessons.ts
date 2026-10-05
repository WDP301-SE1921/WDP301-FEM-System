/**
 * Lo trinh bai hoc gia (Lesson cua Program) cua cac lop trong lich gia (`./mock-schedule.ts`), dung
 * cho route lo trinh trong `./parent.ts` va bai hoc cua chi tiet buoi (`./mock-session-details.ts`).
 * Bai thu n cua lop day o buoi thu n cua lop (bo buoi hoc bu) tinh tu ngay lop bat dau
 * (`CLASS_START_DAYS`), nen lo trinh khop voi lich tuan, chi tiet buoi hoc va so buoi da hoc cua mock
 * mon hoc. Ngay tinh tu hom nay:
 * - Toan nang cao 8A2  : 9 bai truoc hom nay, bai 10 hoc 18:00 hom nay, bai 12 (hom nay + 5) la bai
 *                        kiem tra giua khoa
 * - Vat ly 8 chuyen sau: 8 bai truoc hom nay (con nghi bai 8, hoc bu vao hom nay + 2), bai 9 o
 *                        (hom nay + 1)
 * - Tieng Anh 6A1      : 12 bai truoc hom nay, bai 13 o (hom nay + 1), bai 16 la bai kiem tra giua
 *                        khoa
 * Buoi da ket thuc thi `COMPLETED`; bai tap cua bai do nop mot ngay sau buoi hoc, giao vien cong bo
 * diem hai ngay sau khi nop (`GRADED_AFTER_DAYS`), nen bai da hoc gan nhat thuong con cho cham. Bai
 * dau tien chua hoc co bai tap chua nop, han 23:59 hai ngay sau buoi hoc; bai kiem tra lam tren lop
 * nen khong giao truoc. Cac bai sau chua co bai tap. Bai tap gia (`./mock-assignments.ts`) lay tu day.
 * Lop khong co trong lich gia (dang bao luu, da ket thuc) chua co lo trinh: tra mang rong.
 * Bai con nop trong app (`./mock-submissions.ts`) ghi de len trang thai tinh theo ngay: da nop,
 * chua co diem.
 */
import { addDays, startOfDay } from '@/utils/date';

import {
  buildMockSchedule,
  CLASS_START_DAYS,
  ENGLISH_6A1,
  MATH_8A2,
  PHYSICS_8,
  type MockScheduleSession,
} from './mock-schedule';
import { findLatestStoredSubmission } from './mock-submissions';

/** 13 tuan: du xep het 24 bai cua lop hoc 2 buoi moi tuan. */
const CURRICULUM_SPAN_DAYS = 91;
const ASSIGNMENT_ID_PREFIX = 'mock-assignment';
const ASSIGNMENT_DUE_DAYS = 2;
const ASSIGNMENT_DUE_TIME = [23, 59] as const;
const SUBMITTED_AFTER_DAYS = 1;
const SUBMITTED_TIME = [20, 0] as const;
/** So ngay tu luc con nop toi luc giao vien cong bo diem. */
export const GRADED_AFTER_DAYS = 2;

type LessonTemplate = {
  title: string;
  description?: string;
  /** Bai kiem tra dinh ky, lam tren lop. */
  isAssessment?: boolean;
};

type Curriculum = {
  /** Dung trong id bai hoc va bai tap, vd `math-8` -> `mock-lesson-math-8-10`. */
  code: string;
  lessons: readonly LessonTemplate[];
  /** Diem bai tap cua cac bai da hoc, lap lai theo vong. */
  scores: readonly number[];
  /** Tai lieu phat trong buoi hoc bai thuong. */
  getMaterialName: (sequence: number) => string;
};

/** Bai hoc cua mot buoi, dung cho chi tiet buoi hoc. */
export type MockSessionLesson = {
  sequence: number;
  title: string;
  description: string | null;
  /** null voi bai kiem tra. */
  materialName: string | null;
};

/** Response lo trinh. */
export type MockEnrollmentLesson = {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  kind: 'LESSON' | 'ASSESSMENT';
  session: { id: string; startsAt: string; status: 'SCHEDULED' | 'COMPLETED' } | null;
  assignment: {
    id: string;
    title: string;
    dueAt: string;
    submittedAt: string | null;
    score: number | null;
  } | null;
};

/** Bai le la Nhiet hoc, bai chan la Quang hoc, khop `topic` cua lich gia. */
const PHYSICS_LESSONS: readonly LessonTemplate[] = [
  { title: 'Nhiệt năng và nhiệt lượng' },
  { title: 'Sự truyền ánh sáng' },
  { title: 'Dẫn nhiệt' },
  { title: 'Định luật phản xạ ánh sáng' },
  { title: 'Đối lưu và bức xạ nhiệt' },
  { title: 'Gương cầu lồi và gương cầu lõm' },
  { title: 'Công thức tính nhiệt lượng' },
  { title: 'Khúc xạ ánh sáng', description: 'Thí nghiệm với lăng kính tại phòng Lab' },
  { title: 'Phương trình cân bằng nhiệt', description: 'Bài toán nhiều vật trao đổi nhiệt' },
  { title: 'Thấu kính hội tụ', description: 'Dựng ảnh qua thấu kính hội tụ' },
  { title: 'Năng suất tỏa nhiệt của nhiên liệu' },
  {
    title: 'Kiểm tra giữa khóa',
    description: 'Bài kiểm tra 90 phút phần nhiệt học và quang học',
    isAssessment: true,
  },
  { title: 'Sự nóng chảy và đông đặc' },
  { title: 'Thấu kính phân kỳ' },
  { title: 'Sự bay hơi và ngưng tụ' },
  { title: 'Mắt và máy ảnh' },
  { title: 'Sự sôi' },
  { title: 'Kính lúp' },
  { title: 'Động cơ nhiệt' },
  { title: 'Ánh sáng trắng và ánh sáng màu' },
  { title: 'Hiệu suất của động cơ nhiệt' },
  { title: 'Các tác dụng của ánh sáng' },
  { title: 'Ôn tập nhiệt học và quang học' },
  { title: 'Kiểm tra cuối khóa', isAssessment: true },
];

/** Bai 1, 4, 7... la Dai so, bai 2, 5, 8... la Hinh hoc, con lai la Luyen de, khop lich gia. */
const MATH_LESSONS: readonly LessonTemplate[] = [
  { title: 'Đơn thức và đa thức nhiều biến' },
  { title: 'Tứ giác và tổng các góc của tứ giác' },
  { title: 'Luyện đề: Đa thức và tứ giác' },
  { title: 'Hằng đẳng thức đáng nhớ' },
  { title: 'Hình thang cân' },
  { title: 'Luyện đề: Hằng đẳng thức' },
  { title: 'Phân tích đa thức thành nhân tử', description: 'Đặt nhân tử chung, nhóm hạng tử' },
  { title: 'Hình bình hành' },
  { title: 'Luyện đề: Phân tích đa thức thành nhân tử' },
  { title: 'Phân thức đại số', description: 'Rút gọn phân thức và quy đồng mẫu thức' },
  { title: 'Hình chữ nhật và hình thoi', description: 'Dấu hiệu nhận biết và bài tập chứng minh' },
  {
    title: 'Kiểm tra giữa khóa',
    description: 'Bài kiểm tra 90 phút: đa thức, hằng đẳng thức và các loại tứ giác',
    isAssessment: true,
  },
  { title: 'Cộng, trừ phân thức' },
  { title: 'Hình vuông' },
  { title: 'Luyện đề: Phân thức đại số' },
  { title: 'Nhân, chia phân thức' },
  { title: 'Định lý Thalès trong tam giác' },
  { title: 'Luyện đề: Định lý Thalès' },
  { title: 'Phương trình bậc nhất một ẩn' },
  { title: 'Tam giác đồng dạng' },
  { title: 'Luyện đề: Phương trình và tam giác đồng dạng' },
  { title: 'Hàm số bậc nhất và đồ thị' },
  { title: 'Định lý Pythagore' },
  {
    title: 'Kiểm tra cuối khóa',
    description: 'Bài kiểm tra tổng hợp toàn bộ chương trình',
    isAssessment: true,
  },
];

const ENGLISH_LESSONS: readonly LessonTemplate[] = [
  { title: 'Unit 1: My new school – Getting started' },
  { title: 'Unit 1: My new school – A closer look 1' },
  { title: 'Unit 1: My new school – A closer look 2' },
  { title: 'Unit 1: My new school – Communication' },
  { title: 'Unit 1: My new school – Skills' },
  { title: 'Unit 2: My house – Getting started' },
  { title: 'Unit 2: My house – A closer look 1' },
  { title: 'Unit 2: My house – A closer look 2' },
  { title: 'Unit 2: My house – Communication' },
  { title: 'Unit 2: My house – Skills' },
  { title: 'Unit 3: My friends – Getting started' },
  { title: 'Unit 3: My friends – A closer look 1' },
  {
    title: 'Unit 3: My friends – A closer look 2',
    description: 'Từ vựng miêu tả tính cách, thì hiện tại tiếp diễn',
  },
  { title: 'Unit 3: My friends – Communication' },
  { title: 'Unit 3: My friends – Skills' },
  {
    title: 'Kiểm tra giữa khóa',
    description: 'Nghe, đọc và viết theo nội dung Unit 1–3',
    isAssessment: true,
  },
  { title: 'Unit 4: My neighbourhood – Getting started' },
  { title: 'Unit 4: My neighbourhood – A closer look 1' },
  { title: 'Unit 4: My neighbourhood – A closer look 2' },
  { title: 'Unit 4: My neighbourhood – Communication' },
  { title: 'Unit 4: My neighbourhood – Skills' },
  { title: 'Review: Unit 1–4' },
  { title: 'Kiểm tra nói', description: 'Giới thiệu về bạn thân và khu phố', isAssessment: true },
  { title: 'Kiểm tra cuối khóa', isAssessment: true },
];

/** Key la `className`. Diem trung binh gan voi `averageScore` cua mock mon hoc. */
const CURRICULA: Partial<Record<string, Curriculum>> = {
  [MATH_8A2.className]: {
    code: 'math-8',
    lessons: MATH_LESSONS,
    scores: [8.5, 9, 8, 9.5, 8.5, 9, 8, 8.5, 9],
    getMaterialName: (sequence) => `Phiếu bài tập số ${sequence}`,
  },
  [PHYSICS_8.className]: {
    code: 'physics-8',
    lessons: PHYSICS_LESSONS,
    scores: [7.5, 8, 7, 8.5, 8, 7.5, 8, 7.5],
    getMaterialName: (sequence) => `Phiếu thí nghiệm số ${sequence}`,
  },
  [ENGLISH_6A1.className]: {
    code: 'english-6',
    lessons: ENGLISH_LESSONS,
    scores: [7, 6.5, 7, 6, 7.5, 6.5, 7, 6.5],
    getMaterialName: (sequence) => `Workbook – bài ${sequence}`,
  },
};

function atTime(date: Date, [hours, minutes]: readonly [number, number]): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function isFinished(session: MockScheduleSession, now: Date): boolean {
  return new Date(session.endsAt) <= now;
}

/** Buoi cua lop tu ngay bat dau theo thu tu, bo buoi hoc bu vi buoi hoc bu day lai bai cu. */
function findClassSessions(studentId: string, className: string, now: Date): MockScheduleSession[] {
  const startDay = CLASS_START_DAYS[className];
  if (startDay === undefined) return [];

  const from = addDays(startOfDay(now), startDay);
  return buildMockSchedule(studentId, from, addDays(from, CURRICULUM_SPAN_DAYS), now).filter(
    (session) => session.className === className && session.type !== 'MAKEUP',
  );
}

/**
 * Bai day o buoi `session` (khong phai buoi hoc bu). null voi buoi truoc khi lop bat dau hoac lop
 * chua co lo trinh.
 */
export function findMockSessionLesson(
  studentId: string,
  session: MockScheduleSession,
  now: Date = new Date(),
): MockSessionLesson | null {
  const curriculum = CURRICULA[session.className];
  if (!curriculum) return null;

  const index = findClassSessions(studentId, session.className, now).findIndex(
    ({ id }) => id === session.id,
  );
  const lesson = curriculum.lessons[index];
  if (index < 0 || !lesson) return null;

  const sequence = index + 1;
  return {
    sequence,
    title: lesson.title,
    description: lesson.description ?? null,
    materialName: lesson.isAssessment ? null : curriculum.getMaterialName(sequence),
  };
}

type AssignmentInput = {
  curriculum: Curriculum;
  lesson: LessonTemplate;
  sequence: number;
  session: MockScheduleSession;
  isFirstPending: boolean;
};

function buildAssignment(
  { curriculum, lesson, sequence, session, isFirstPending }: AssignmentInput,
  now: Date,
): MockEnrollmentLesson['assignment'] {
  const lessonDate = new Date(session.startsAt);
  const assignment = {
    id: `${ASSIGNMENT_ID_PREFIX}-${curriculum.code}-${sequence}`,
    title: lesson.isAssessment ? lesson.title : `Bài tập về nhà bài ${sequence}`,
    dueAt: atTime(addDays(lessonDate, ASSIGNMENT_DUE_DAYS), ASSIGNMENT_DUE_TIME).toISOString(),
  };

  if (isFinished(session, now)) {
    const submittedAt = atTime(addDays(lessonDate, SUBMITTED_AFTER_DAYS), SUBMITTED_TIME);
    // Buoi vua xong thi con chua kip nop
    if (submittedAt > now) return { ...assignment, submittedAt: null, score: null };
    const isGraded = addDays(submittedAt, GRADED_AFTER_DAYS) <= now;
    return {
      ...assignment,
      submittedAt: submittedAt.toISOString(),
      score: isGraded
        ? (curriculum.scores[(sequence - 1) % curriculum.scores.length] ?? null)
        : null,
    };
  }
  if (isFirstPending && !lesson.isAssessment) {
    return { ...assignment, submittedAt: null, score: null };
  }
  return null;
}

/** Bai con nop trong app thi lay gio nop do va chua co diem (giao vien chua cham lan nop moi). */
function withStoredSubmission(
  studentId: string,
  assignment: MockEnrollmentLesson['assignment'],
): MockEnrollmentLesson['assignment'] {
  const stored = assignment ? findLatestStoredSubmission(studentId, assignment.id) : undefined;
  return assignment && stored
    ? { ...assignment, submittedAt: stored.submittedAt, score: null }
    : assignment;
}

/**
 * Diem giao vien cong bo cho bai tap `assignmentId` (ke ca khi chua toi ngay cong bo), de bai lam
 * gia cua con khop voi diem. null khi id khong phai bai tap cua lo trinh gia.
 */
export function findMockAssignmentScore(assignmentId: string): number | null {
  const curriculum = Object.values(CURRICULA).find((item) =>
    assignmentId.startsWith(`${ASSIGNMENT_ID_PREFIX}-${item?.code}-`),
  );
  if (!curriculum) return null;

  const sequence = Number(assignmentId.slice(assignmentId.lastIndexOf('-') + 1));
  if (!Number.isInteger(sequence) || sequence < 1) return null;
  return curriculum.scores[(sequence - 1) % curriculum.scores.length] ?? null;
}

/** Cac bai cua lop `className` theo thu tu, kem buoi day va bai tap cua hoc sinh. */
export function buildMockLessons(
  studentId: string,
  className: string,
  now: Date = new Date(),
): MockEnrollmentLesson[] {
  const curriculum = CURRICULA[className];
  if (!curriculum) return [];

  const sessions = findClassSessions(studentId, className, now);
  const firstPendingIndex = sessions.findIndex((session) => !isFinished(session, now));

  return curriculum.lessons.map((lesson, index) => {
    const sequence = index + 1;
    const session = sessions[index];
    return {
      id: `mock-lesson-${curriculum.code}-${sequence}`,
      sequence,
      title: lesson.title,
      description: lesson.description ?? null,
      kind: lesson.isAssessment ? 'ASSESSMENT' : 'LESSON',
      session: session
        ? {
            id: session.id,
            startsAt: session.startsAt,
            status: isFinished(session, now) ? 'COMPLETED' : 'SCHEDULED',
          }
        : null,
      assignment: session
        ? withStoredSubmission(
            studentId,
            buildAssignment(
              {
                curriculum,
                lesson,
                sequence,
                session,
                isFirstPending: index === firstPendingIndex,
              },
              now,
            ),
          )
        : null,
    };
  });
}
