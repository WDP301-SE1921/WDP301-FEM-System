import type { IconName } from '@/components/ui/icon';
import type { ThemeColor } from '@/constants/theme';

import type {
  AssignmentFormat,
  AssignmentState,
  AssignmentTab,
  AttendanceCounts,
  AttendanceStatus,
  CourseStatus,
  DayPeriod,
  LessonKind,
  LessonProgress,
  MakeupStatus,
  PaymentStatus,
  ScheduleSessionType,
  SessionStatus,
  TermStatus,
} from './types';

/** Cap mau cua mot sac thai: mau chinh cho chu/icon, mau nhat cho nen chip va icon tron. */
export const TONES = {
  primary: { color: 'primary', soft: 'primarySoft' },
  accent: { color: 'accent', soft: 'accentSoft' },
  success: { color: 'success', soft: 'successSoft' },
  danger: { color: 'danger', soft: 'dangerSoft' },
  neutral: { color: 'textSecondary', soft: 'backgroundSelected' },
} as const satisfies Record<string, { color: ThemeColor; soft: ThemeColor }>;

export type Tone = keyof typeof TONES;

export type ScoreLevel = { label: string; tone: Tone };

/**
 * Xep loai diem trung binh theo muc cua Thong tu 22/2021 (THCS, thang diem 10), sap tu cao xuong
 * thap. Trung tam chua chot cach xep loai: doi nguong o day.
 */
export const SCORE_LEVELS = [
  { minScore: 8, label: 'Tốt', tone: 'success' },
  { minScore: 6.5, label: 'Khá', tone: 'primary' },
  { minScore: 5, label: 'Đạt', tone: 'accent' },
] as const satisfies readonly (ScoreLevel & { minScore: number })[];

/** Diem duoi nguong thap nhat cua `SCORE_LEVELS`. */
export const FAILING_SCORE_LEVEL: ScoreLevel = { label: 'Chưa đạt', tone: 'danger' };

/** Nhan trang thai hien bang `ToneBadge`. */
export type StatusAppearance = { label: string; tone: Tone; icon?: IconName };

export const SESSION_STATUSES: Record<SessionStatus, StatusAppearance> = {
  UPCOMING: { label: 'Sắp diễn ra', tone: 'primary' },
  IN_PROGRESS: { label: 'Đang diễn ra', tone: 'success' },
  FINISHED: { label: 'Đã kết thúc', tone: 'neutral' },
};

export const ATTENDANCE_STATUSES: Record<AttendanceStatus, StatusAppearance> = {
  UNMARKED: { label: 'Chưa điểm danh', tone: 'neutral', icon: 'hourglass-outline' },
  PRESENT: { label: 'Có mặt', tone: 'success', icon: 'checkmark-circle' },
  ABSENT: { label: 'Vắng mặt', tone: 'danger', icon: 'close-circle' },
  EXCUSED: { label: 'Nghỉ có phép', tone: 'accent', icon: 'document-text' },
};

export const CANCELLED_SESSION_STATUS: StatusAppearance = {
  label: 'Buổi học bị huỷ',
  tone: 'danger',
  icon: 'ban',
};

/** Buoi vang da hoc bu xong: hien thay ket qua diem danh tren the lich su diem danh. */
export const MADE_UP_STATUS: StatusAppearance = {
  label: 'Đã học bù',
  tone: 'primary',
  icon: 'swap-horizontal',
};

/**
 * Muc chuyen can theo ty le di hoc (phan tram), sap tu cao xuong thap. Trung tam chua chot nguong:
 * doi o day.
 */
export const ATTENDANCE_LEVELS = [
  { minRate: 90, label: 'Chuyên cần tốt', tone: 'success', icon: 'shield-checkmark' },
  { minRate: 75, label: 'Cần chú ý', tone: 'accent', icon: 'alert-circle' },
] as const satisfies readonly (StatusAppearance & { minRate: number })[];

/** Ty le di hoc duoi nguong thap nhat cua `ATTENDANCE_LEVELS`. */
export const LOW_ATTENDANCE_LEVEL: StatusAppearance = {
  label: 'Vắng nhiều',
  tone: 'danger',
  icon: 'warning',
};

/** Thu tu va nhan cac loai buoi trong dong tom tat cua moi thang, vd `5 có mặt, 1 vắng`. */
export const ATTENDANCE_BREAKDOWN = [
  { count: 'present', label: 'có mặt' },
  { count: 'absent', label: 'vắng' },
  { count: 'madeUp', label: 'học bù' },
  { count: 'unmarked', label: 'chưa điểm danh' },
] as const satisfies readonly { count: keyof AttendanceCounts; label: string }[];

type NoteAppearance = { icon: IconName; tone: Tone };

export const LEAVE_REASON_NOTE: NoteAppearance = { icon: 'document-text-outline', tone: 'accent' };

/** Ghi chu o buoi hoc bu, tro ve buoi vang duoc bu. */
export const ORIGINAL_SESSION_NOTE: NoteAppearance = { icon: 'swap-horizontal', tone: 'primary' };

/** Ghi chu o buoi vang theo trang thai buoi hoc bu, `label` dung truoc ngay gio buoi bu. */
export const MAKEUP_NOTES: Record<MakeupStatus, NoteAppearance & { label: string }> = {
  BOOKED: { label: 'Lịch học bù', icon: 'calendar-outline', tone: 'primary' },
  COMPLETED: { label: 'Đã hoàn thành học bù', icon: 'checkmark-done-outline', tone: 'primary' },
  MISSED: { label: 'Vắng buổi học bù', icon: 'alert-circle-outline', tone: 'danger' },
};

/** Gia tri chip "Tất cả môn" o lich su diem danh va bai tap, cac chip con lai la `subjectName`. */
export const ALL_SUBJECTS = 'ALL';

type SessionTypeAppearance = {
  /** Mau vach ben trai the, icon gio va khung ghi chu. */
  tone: Tone;
  /** Nhan hien thay trang thai buoi hoc. Buoi co dinh khong co nhan rieng. */
  badge: { label: string; icon: IconName } | null;
  noteIcon: IconName;
  /** Tieu de khung ghi chu cua trung tam o man chi tiet buoi hoc. */
  noteTitle: string;
};

export const SESSION_TYPES: Record<ScheduleSessionType, SessionTypeAppearance> = {
  REGULAR: {
    tone: 'primary',
    badge: null,
    noteIcon: 'information-circle-outline',
    noteTitle: 'Ghi chú của trung tâm',
  },
  MAKEUP: {
    tone: 'primary',
    badge: { label: 'Học bù', icon: 'swap-horizontal' },
    noteIcon: 'information-circle-outline',
    noteTitle: 'Thông báo buổi học bù',
  },
  RESCHEDULED: {
    tone: 'accent',
    badge: { label: 'Đổi lịch', icon: 'repeat' },
    noteIcon: 'megaphone-outline',
    noteTitle: 'Thông báo đổi lịch',
  },
};

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  MORNING: 'Sáng',
  AFTERNOON: 'Chiều',
  EVENING: 'Tối',
};

type CourseStatusAppearance = StatusAppearance & {
  /** Nhan cua thanh tien do tren the mon hoc. */
  progressLabel: string;
};

export const COURSE_STATUSES: Record<CourseStatus, CourseStatusAppearance> = {
  ACTIVE: { label: 'Đang học', tone: 'primary', progressLabel: 'Tiến độ khóa học' },
  PAUSED: { label: 'Tạm nghỉ', tone: 'accent', progressLabel: 'Đã học trước khi bảo lưu' },
  ENDED: { label: 'Đã kết thúc', tone: 'neutral', progressLabel: 'Đã hoàn thành' },
};

/** Thu tu hien the mon hoc va chip loc. */
export const COURSE_STATUS_ORDER: readonly CourseStatus[] = ['ACTIVE', 'PAUSED', 'ENDED'];

/**
 * Icon theo `Program.subject`. Ten mon do quan ly nhap tay (vd `Hóa học` va `Hoá học`) nen mon
 * khong co trong bang dung `DEFAULT_SUBJECT_ICON`.
 */
export const SUBJECT_ICONS: Partial<Record<string, IconName>> = {
  Toán: 'calculator-outline',
  'Vật lý': 'magnet-outline',
  'Hóa học': 'flask-outline',
  'Tiếng Anh': 'language-outline',
  'Ngữ văn': 'book-outline',
};

export const DEFAULT_SUBJECT_ICON: IconName = 'school-outline';

export const LESSON_PROGRESSES: Record<LessonProgress, StatusAppearance> = {
  DONE: { label: 'Đã học', tone: 'primary', icon: 'checkmark-done' },
  CURRENT: { label: 'Đang học', tone: 'primary', icon: 'radio-button-on' },
  UPCOMING: { label: 'Chưa học', tone: 'neutral' },
};

/** Nhan cua bai kiem tra dinh ky chua lam, hien thay `LESSON_PROGRESSES`. */
export const ASSESSMENT_BADGE: StatusAppearance = {
  label: 'Kiểm tra định kỳ',
  tone: 'accent',
  icon: 'ribbon',
};

/** Nhan truoc diem cua bai tren lo trinh: bai tap ve nha hay bai kiem tra. */
export const LESSON_SCORE_LABELS: Record<LessonKind, string> = {
  LESSON: 'Điểm bài tập',
  ASSESSMENT: 'Điểm kiểm tra',
};

export const ASSIGNMENT_STATES: Record<AssignmentState, StatusAppearance> = {
  SUBMITTED: { label: 'Đã nộp', tone: 'success', icon: 'checkmark-circle' },
  PENDING: { label: 'Chưa nộp', tone: 'accent', icon: 'time-outline' },
  OVERDUE: { label: 'Quá hạn', tone: 'danger', icon: 'alert-circle' },
};

export const ASSIGNMENT_FORMATS: Record<AssignmentFormat, StatusAppearance> = {
  MULTIPLE_CHOICE: { label: 'Trắc nghiệm', tone: 'primary' },
  ESSAY: { label: 'Tự luận', tone: 'accent' },
  MIXED: { label: 'Trắc nghiệm & tự luận', tone: 'primary' },
};

type AssignmentTabAppearance = {
  label: string;
  /** Man hinh rong khi tab (sau khi loc theo mon) khong co bai nao. */
  empty: { title: string; description: string };
};

export const ASSIGNMENT_TABS: Record<AssignmentTab, AssignmentTabAppearance> = {
  TODO: {
    label: 'Cần làm',
    empty: { title: 'Không còn bài cần làm', description: 'Các bài được giao đều đã nộp.' },
  },
  SUBMITTED: {
    label: 'Đã nộp',
    empty: {
      title: 'Không có bài chờ chấm',
      description: 'Bài đã nộp nằm ở đây cho tới khi giáo viên công bố điểm.',
    },
  },
  GRADED: {
    label: 'Đã có điểm',
    empty: {
      title: 'Chưa có bài nào có điểm',
      description: 'Điểm và nhận xét của giáo viên sẽ hiện ở đây sau khi chấm.',
    },
  },
};

/** Thu tu cac tab tren man hinh bai tap. */
export const ASSIGNMENT_TAB_ORDER: readonly AssignmentTab[] = ['TODO', 'SUBMITTED', 'GRADED'];

/** Nhan tren the bai da nop, cho giao vien cong bo diem. */
export const GRADING_STATUS: StatusAppearance = {
  label: 'Đang chấm bài',
  tone: 'primary',
  icon: 'checkmark-done',
};

/** Nhan tren man chi tiet cua bai da duoc giao vien cong bo diem. */
export const GRADED_STATUS: StatusAppearance = {
  label: 'Đã có điểm',
  tone: 'success',
  icon: 'ribbon',
};

/** Nhan cua bai con chua nop ma khong nop duoc nua: het han hoac giao vien da dong nhan bai. */
export const CLOSED_ASSIGNMENT_STATUS: StatusAppearance = {
  label: 'Đã hết hạn nộp',
  tone: 'danger',
  icon: 'lock-closed',
};

/** Ket qua cau trac nghiem khi giao vien da cong bo dap an. */
export const ANSWER_RESULTS: Record<'correct' | 'wrong', StatusAppearance> = {
  correct: { label: 'Con trả lời đúng', tone: 'success', icon: 'checkmark-circle' },
  wrong: { label: 'Con trả lời chưa đúng', tone: 'danger', icon: 'close-circle' },
};

/** Bai con han nop trong chung nay ngay (ke ca hom nay) thi can nhac gap. */
export const URGENT_DUE_DAYS = 2;

/** Mau va icon cua nhan han nop, theo bai co gap hay khong. */
export const DEADLINE_APPEARANCES: Record<'urgent' | 'normal', { tone: Tone; icon: IconName }> = {
  urgent: { tone: 'danger', icon: 'timer-outline' },
  normal: { tone: 'neutral', icon: 'hourglass-outline' },
};

/** Ten trung tam in tren bien lai. BE chua co thong tin trung tam nen dat co dinh o day. */
export const CENTER_NAME = 'Trung tâm bồi dưỡng văn hóa EduGrade';

/** BE chi ghi nhan hoc phi thu tai trung tam (khong co thanh toan online) nen hinh thuc la co dinh. */
export const PAYMENT_METHOD_LABEL = 'Đóng tại trung tâm';

export const PAYMENT_STATUSES: Record<PaymentStatus, StatusAppearance> = {
  CONFIRMED: { label: 'Đã xác nhận', tone: 'success', icon: 'checkmark-circle' },
};

/** Nhan tren bien lai: bien lai chi co khi trung tam da xac nhan thu du hoc phi. */
export const RECEIPT_PAID_STATUS: StatusAppearance = {
  label: 'Đã thanh toán',
  tone: 'success',
  icon: 'checkmark-circle',
};

/** Don `DRAFT`: nhan vien da lap don, trung tam chua xac nhan thu hoc phi. */
export const PENDING_REGISTRATION_STATUS: StatusAppearance = {
  label: 'Chờ xác nhận',
  tone: 'accent',
  icon: 'time-outline',
};

export const TERM_STATUSES: Record<TermStatus, StatusAppearance> = {
  UPCOMING: { label: 'Sắp học', tone: 'accent' },
  CURRENT: { label: 'Đang học', tone: 'primary' },
  EXPIRED: { label: 'Hết hạn', tone: 'neutral' },
};

/**
 * Lo trinh thu gon chi hien vai bai da hoc gan nhat, bai dang hoc va vai bai tiep theo; con lai
 * mo bang nut "Xem toàn bộ".
 */
export const ROADMAP_DONE_LESSONS_SHOWN = 2;
export const ROADMAP_UPCOMING_LESSONS_SHOWN = 3;

/** Pham vi chon tuan cua lich hoc, tinh tu tuan hien tai. */
export const WEEKS_BEFORE = 2;
export const WEEKS_AFTER = 4;
