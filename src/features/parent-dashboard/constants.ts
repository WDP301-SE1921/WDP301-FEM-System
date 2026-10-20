import type { IconName } from '@/components/ui/icon';
import type { ThemeColor } from '@/constants/theme';

import type {
  AssignmentFormat,
  AssignmentState,
  AssignmentTab,
  AttendanceCounts,
  AttendanceMakeup,
  AttendanceResult,
  AttendanceStatus,
  BillStatus,
  CourseStatus,
  DayPeriod,
  ImagePickProblem,
  LessonKind,
  LessonProgress,
  NotificationTargetKind,
  NotificationType,
  PaymentStatus,
  ScheduleSessionType,
  ScheduleView,
  SessionStatus,
  TermStatus,
  TestType,
} from './types';

/**
 * Mau cua mot sac thai: `color` cho icon, vach va nen dac; `soft` cho nen chip va icon tron; `text`
 * cho chu (nhan, so lieu) tren nen `soft` hoac nen trang, du tuong phan cho chu nho.
 */
export const TONES = {
  primary: { color: 'primary', soft: 'primarySoft', text: 'primaryStrong' },
  accent: { color: 'accent', soft: 'accentSoft', text: 'accentStrong' },
  success: { color: 'success', soft: 'successSoft', text: 'successStrong' },
  danger: { color: 'danger', soft: 'dangerSoft', text: 'dangerStrong' },
  neutral: { color: 'textSecondary', soft: 'backgroundSelected', text: 'textSecondary' },
} as const satisfies Record<string, { color: ThemeColor; soft: ThemeColor; text: ThemeColor }>;

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

/** Nhan tren the lich su diem danh: ket qua sau khi tinh hoc bu, theo 4 trang thai cua SRS. */
export const ATTENDANCE_RESULTS: Record<AttendanceResult, StatusAppearance> = {
  PRESENT: ATTENDANCE_STATUSES.PRESENT,
  ABSENT: ATTENDANCE_STATUSES.ABSENT,
  MADE_UP: { label: 'Đã học bù', tone: 'primary', icon: 'swap-horizontal' },
  EXCUSED: ATTENDANCE_STATUSES.EXCUSED,
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

/**
 * Thu tu va nhan tung loai buoi o the ty le di hoc va dong tom tat cua moi thang, vd `5 có mặt, 1
 * vắng`. `counter` la nhan ngan tren the ty le di hoc.
 */
export const ATTENDANCE_BREAKDOWN = [
  { count: 'present', label: 'có mặt', counter: 'Có mặt', tone: 'success' },
  { count: 'madeUp', label: 'học bù', counter: 'Học bù', tone: 'primary' },
  { count: 'absent', label: 'vắng', counter: 'Vắng', tone: 'danger' },
  { count: 'excused', label: 'nghỉ có phép', counter: 'Có phép', tone: 'accent' },
] as const satisfies readonly {
  count: keyof AttendanceCounts;
  label: string;
  counter: string;
  tone: Tone;
}[];

type NoteAppearance = { icon: IconName; tone: Tone };

export const LEAVE_REASON_NOTE: NoteAppearance = { icon: 'document-text-outline', tone: 'accent' };

/** Ghi chu o buoi vang theo trang thai buoi hoc bu, `label` dung truoc ngay gio buoi bu. */
export const MAKEUP_NOTES: Record<AttendanceMakeup['status'], NoteAppearance & { label: string }> =
  {
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
  CANCELLED: {
    tone: 'danger',
    badge: { label: 'Đã huỷ', icon: 'ban' },
    noteIcon: 'ban',
    noteTitle: 'Lý do huỷ buổi',
  },
};

/** Icon va mau cua mot thong bao trong hop thu. */
export type NotificationAppearance = { icon: IconName; tone: Tone };

/** Theo loai ban ghi thong bao tro toi; `NOTIFICATION_TYPE_APPEARANCES` ghi de cho loai can noi. */
export const NOTIFICATION_TARGET_APPEARANCES: Record<
  NotificationTargetKind,
  NotificationAppearance
> = {
  ASSIGNMENT: { icon: 'create-outline', tone: 'primary' },
  SUBMISSION: { icon: 'create-outline', tone: 'primary' },
  SESSION: { icon: 'calendar-outline', tone: 'primary' },
  CLASS: { icon: 'megaphone-outline', tone: 'accent' },
  LEAVE: { icon: 'document-text-outline', tone: 'accent' },
  MAKEUP: { icon: 'swap-horizontal', tone: 'primary' },
  ENROLLMENT: { icon: 'school-outline', tone: 'primary' },
  REGISTRATION: { icon: 'wallet-outline', tone: 'accent' },
  CURRICULUM_UNIT: { icon: 'book-outline', tone: 'neutral' },
  FEEDBACK: { icon: 'chatbubble-outline', tone: 'neutral' },
};

export const NOTIFICATION_TYPE_APPEARANCES: Partial<
  Record<NotificationType, NotificationAppearance>
> = {
  GRADE_PUBLISHED: { icon: 'star-outline', tone: 'accent' },
  ANSWERS_PUBLISHED: { icon: 'checkmark-done-outline', tone: 'primary' },
  ATTENDANCE_FINALIZED: { icon: 'checkmark-circle-outline', tone: 'success' },
  SESSION_CANCELLED: { icon: 'ban', tone: 'danger' },
  SESSION_RESCHEDULED: { icon: 'repeat', tone: 'accent' },
  MAKEUP_MISSED: { icon: 'alert-circle-outline', tone: 'danger' },
  LEAVE_REJECTED: { icon: 'close-circle-outline', tone: 'danger' },
  PAYMENT_CONFIRMED: { icon: 'checkmark-circle-outline', tone: 'success' },
  BILL_CANCELLED: { icon: 'close-circle-outline', tone: 'neutral' },
};

/** Nhan o diem trung binh o trang chu, dung chung cho luc dang tai, loi va da co diem. */
export const SCORE_STAT_LABEL = 'Điểm trung bình';

/** So thong bao moi nhat cua con hien o trang chu. */
export const RECENT_NOTIFICATION_COUNT = 3;
/** So thong bao moi lan tai o man thong bao. */
export const NOTIFICATION_PAGE_SIZE = 20;

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
  PAUSED: { label: 'Tạm nghỉ', tone: 'accent', progressLabel: 'Đã học trước khi tạm nghỉ' },
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

/** Nhan bai kiem tra tren the bai tap, cung chu voi web (`TEST_TYPE_TEXT`). */
export const TEST_TYPE_LABELS: Record<TestType, string> = {
  FIFTEEN_MINUTES: 'Kiểm tra 15 phút',
  ONE_PERIOD: 'Kiểm tra một tiết',
  MIDTERM: 'Kiểm tra giữa kỳ',
  FINAL: 'Kiểm tra học kỳ',
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

/** Cac che do xem cua tab Lich hoc, theo thu tu tren thanh chuyen. */
export const SCHEDULE_VIEW_ORDER: readonly ScheduleView[] = [
  'WEEK',
  'COURSES',
  'ROADMAP',
  'ATTENDANCE',
];

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
  correct: { label: 'Học sinh trả lời đúng', tone: 'success', icon: 'checkmark-circle' },
  wrong: { label: 'Học sinh trả lời chưa đúng', tone: 'danger', icon: 'close-circle' },
};

/** Gioi han `fileIds` cua SubmissionDto. */
export const MAX_SUBMISSION_FILES = 5;

/** Bao khi mo camera hoac thu vien ma khong co anh gui duoc. */
export const IMAGE_PICK_PROBLEMS: Record<ImagePickProblem, string> = {
  PERMISSION_DENIED:
    'Ứng dụng chưa được phép dùng camera. Mở Cài đặt để cho phép, hoặc bấm "Chọn ảnh" để lấy ảnh có sẵn.',
  UNSUPPORTED: 'Chỉ gửi được ảnh JPG hoặc PNG. Hãy bấm "Chụp ảnh" để chụp lại bài làm.',
  TOO_LARGE: 'Ảnh lớn hơn 10 MB. Hãy chụp lại hoặc chọn ảnh khác.',
  FAILED: 'Không mở được camera hoặc thư viện ảnh trên máy này.',
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

type BillStatusAppearance = StatusAppearance & {
  /** Nhan cua o tong tien tren bill. */
  totalLabel: string;
  /** Loi nhan duoi tong tien. */
  note: string;
};

/**
 * Nhan theo `status` cua bill, cung chu voi web va `PAYMENT_BILL_API.md` cua BE: chi bill `PAID` moi
 * duoc ghi la da thanh toan.
 */
export const BILL_STATUSES: Record<BillStatus, BillStatusAppearance> = {
  UNPAID: {
    label: 'Chưa thanh toán',
    tone: 'accent',
    icon: 'time-outline',
    totalLabel: 'Học phí cần đóng',
    note: 'Vui lòng đóng học phí tại trung tâm và báo mã bill cho nhân viên. Gói học được kích hoạt sau khi trung tâm xác nhận đã thu đủ học phí.',
  },
  PAID: {
    label: 'Đã thanh toán',
    tone: 'success',
    icon: 'checkmark-circle',
    totalLabel: 'Tổng học phí đã thu',
    note: 'Trung tâm đã xác nhận thu đủ học phí của bill này.',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    tone: 'neutral',
    icon: 'close-circle',
    totalLabel: 'Học phí của đơn đã huỷ',
    note: 'Đơn đăng ký này đã huỷ, không cần đóng học phí.',
  },
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
