/**
 * Bai hoc gia (Lesson cua Program) cua cac lop trong lich gia (`./mock-schedule.ts`), dung cho bai hoc
 * cua chi tiet buoi (`./mock-session-details.ts`) trong mock diem danh. Bai thu n cua lop day o buoi
 * thu n cua lop (bo buoi hoc bu) tinh tu ngay lop bat dau (`CLASS_START_DAYS`). Lo trinh va bai tap
 * da noi BE that nen khong con du lieu mau o day.
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

/** 13 tuan: du xep het 24 bai cua lop hoc 2 buoi moi tuan. */
const CURRICULUM_SPAN_DAYS = 91;

type LessonTemplate = {
  title: string;
  description?: string;
  /** Bai kiem tra dinh ky, lam tren lop. */
  isAssessment?: boolean;
};

type Curriculum = {
  lessons: readonly LessonTemplate[];
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

/** Key la `className`. */
const CURRICULA: Partial<Record<string, Curriculum>> = {
  [MATH_8A2.className]: {
    lessons: MATH_LESSONS,
    getMaterialName: (sequence) => `Phiếu bài tập số ${sequence}`,
  },
  [PHYSICS_8.className]: {
    lessons: PHYSICS_LESSONS,
    getMaterialName: (sequence) => `Phiếu thí nghiệm số ${sequence}`,
  },
  [ENGLISH_6A1.className]: {
    lessons: ENGLISH_LESSONS,
    getMaterialName: (sequence) => `Workbook – bài ${sequence}`,
  },
};

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
