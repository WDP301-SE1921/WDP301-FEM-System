/**
 * Hop dong TAM cua trang chu va lich hoc phu huynh: BE chua co endpoint, xem dau file
 * `src/api/mocks/parent.ts`.
 * Doi lai theo DTO that khi BE lam xong.
 */

/** Response GET /parent/students: con da lien ket voi phu huynh (StudentProfile). */
export type LinkedStudent = {
  id: string;
  fullName: string;
  /** Khoi 6-9. */
  grade: number;
  /** Mon con dang hoc (Enrollment `ACTIVE`), vd `['Toán', 'Vật lý']`. */
  subjectNames: string[];
};

/** Response GET /parent/notifications/unread-count: tinh chung moi con cua phu huynh. */
export type UnreadNotificationCount = {
  unreadCount: number;
};

export type ClassSession = {
  id: string;
  className: string;
  subjectName: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
  teacherName: string;
};

export type SessionStatus = 'UPCOMING' | 'IN_PROGRESS' | 'FINISHED';

/** Buoi co dinh, buoi hoc bu hoac buoi da doi lich. */
export type ScheduleSessionType = 'REGULAR' | 'MAKEUP' | 'RESCHEDULED';

/** Mot phan tu cua response GET /parent/students/:studentId/schedule. */
export type ScheduleSession = ClassSession & {
  type: ScheduleSessionType;
  /** Noi dung buoi hoc, vd `Đại số`. */
  topic: string | null;
  /** Ghi chu cua trung tam, vd ly do hoc bu. */
  note: string | null;
};

/** Query cua lich hoc: ngay dang `YYYY-MM-DD` theo gio dia phuong, gom ca hai ngay. */
export type ScheduleRange = {
  from: string;
  to: string;
};

/** Mot ngay tren thanh chon ngay cua lich tuan. */
export type WeekDay = {
  date: Date;
  /** `toDateKey(date)`, dung de so sanh ngay. */
  key: string;
  /** Theo gio bat dau tang dan. */
  sessions: ScheduleSession[];
  /** Co buoi hoc bu hoac doi lich trong ngay. */
  hasScheduleChange: boolean;
};

export type DayPeriod = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type AttendanceSummary = {
  attendedSessions: number;
  totalSessions: number;
};

export type ScoreTrend = 'UP' | 'DOWN' | 'FLAT';

/** Diem trung binh thang nay, thang diem 10. */
export type ScoreSummary = {
  average: number;
  /** null khi thang truoc chua co diem. */
  changeFromLastMonth: number | null;
};

export type AttentionItemType = 'TUITION' | 'ASSIGNMENT';

export type AttentionItem = {
  id: string;
  type: AttentionItemType;
  title: string;
  description: string;
};

export type NotificationType = 'ATTENDANCE' | 'GRADE';

export type DashboardNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
};

/** Response GET /parent/students/:studentId/dashboard. */
export type StudentDashboard = {
  todaySessions: ClassSession[];
  attendance: AttendanceSummary;
  /** null khi con chua co diem nao. */
  scoreSummary: ScoreSummary | null;
  attentionItems: AttentionItem[];
  recentNotifications: DashboardNotification[];
};
