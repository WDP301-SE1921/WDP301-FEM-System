/**
 * Hop dong TAM cua trang chu, lich hoc, mon hoc, lo trinh va bai tap phu huynh: BE chua co endpoint,
 * xem dau file `src/api/mocks/parent.ts`.
 * Doi lai theo DTO that khi BE lam xong. Danh sach con, hoc phi va bien lai thi theo BE that.
 */
import type { IconName } from '@/components/ui/icon';

/**
 * Mot phan tu cua GET /me/students (module `registration-flow` cua BE, da noi BE that): ban ghi
 * StudentProfile. BE tra nguyen ban ghi Prisma, o day chi khai bao field app dung.
 */
export type StudentProfile = {
  id: string;
  fullName: string;
  /** Khoi 6-9. */
  grade: number;
};

/** Con cua phu huynh kem mon dang hoc, ghep tu GET /me/students va ghi danh cua tung con. */
export type LinkedStudent = StudentProfile & {
  /** Mon cua cac goi hoc con hieu luc (dang hoc hoac sap hoc), vd `['Toán', 'Vật lý']`. */
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

/** Buoi hoc can mo chi tiet: id buoi chi co nghia trong lich cua mot con. */
export type SessionRef = {
  studentId: string;
  sessionId: string;
};

/**
 * Trang thai cua buoi o BE (`SessionStatus` nhanh `feature/academic-workflows`), khac
 * `SessionStatus` o tren von tinh theo gio. `COMPLETED`: giao vien da chot diem danh.
 */
export type ClassSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** Ket qua diem danh cua con (`AttendanceStatus` nhanh `feature/academic-workflows`). */
export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'EXCUSED';

/** Bai hoc theo chuong trinh day trong buoi (Lesson). */
export type SessionLesson = {
  /** Thu tu bai trong chuong trinh, vd `12` -> `Bài 12`. */
  sequence: number;
  title: string;
  description: string | null;
};

export type SessionMaterial = {
  id: string;
  name: string;
  /** Cach tai lieu toi tay con, vd `Đã phát trên lớp`. */
  note: string | null;
};

/** Response GET /parent/students/:studentId/sessions/:sessionId. */
export type SessionDetail = ScheduleSession & {
  status: ClassSessionStatus;
  /** null khi buoi chua gan bai hoc. */
  lesson: SessionLesson | null;
  attendance: AttendanceStatus;
  /** Gio con vao lop. null khi chua diem danh hoac con khong co mat. */
  checkedInAt: string | null;
  /** Nhan xet rieng cho con sau buoi hoc. */
  teacherComment: string | null;
  materials: SessionMaterial[];
};

/** `ParticipantKind` cua BE: con hoc buoi co dinh cua lop hay buoi hoc bu. */
export type ParticipantKind = 'REGULAR' | 'MAKEUP';

/** `MakeupStatus` cua BE. Buoi hoc bu da huy (`CANCELLED`) khong tra ve. */
export type MakeupStatus = 'BOOKED' | 'COMPLETED' | 'MISSED';

/** Buoi hoc bu (MakeupBooking) da xep cho mot buoi vang. */
export type AttendanceMakeup = {
  status: MakeupStatus;
  /** Gio bat dau cua buoi hoc bu. */
  startsAt: string;
};

/**
 * Mot phan tu cua response GET /parent/students/:studentId/attendance: mot buoi da ket thuc cua
 * con (SessionParticipant), moi nhat truoc.
 */
export type AttendanceRecord = Pick<
  ClassSession,
  'className' | 'subjectName' | 'startsAt' | 'endsAt' | 'room'
> & {
  /** Id buoi hoc, dung de mo chi tiet buoi. */
  sessionId: string;
  kind: ParticipantKind;
  attendance: AttendanceStatus;
  /** Ly do trong don xin nghi da duyet (LeaveRequest `SINGLE_ABSENCE`). Chi co khi `EXCUSED`. */
  leaveReason: string | null;
  /** Buoi hoc bu cua buoi vang. null khi con co mat hoac chua xep buoi bu. */
  makeup: AttendanceMakeup | null;
  /** Buoi vang ma buoi hoc bu nay bu cho. Chi co khi `kind` la `MAKEUP`. */
  originalSession: { startsAt: string } | null;
};

/** So buoi theo ket qua diem danh. */
export type AttendanceCounts = {
  /** Buoi co dinh con co mat. */
  present: number;
  /** Buoi hoc bu con co mat. */
  madeUp: number;
  /** Buoi con vang, ke ca nghi co phep va vang buoi hoc bu. */
  absent: number;
  /** Trong so `absent`, buoi nghi co phep. */
  excused: number;
  /** Buoi da ket thuc nhung giao vien chua chot diem danh. */
  unmarked: number;
};

/** Cac buoi trong mot thang cua lich su diem danh. */
export type AttendanceMonth = {
  /** Vd `Tháng 10/2026`, dung lam key. */
  label: string;
  records: AttendanceRecord[];
};

/** Mot chip tren hang chip loc. */
export type FilterOption<T extends string> = {
  filter: T;
  label: string;
  /** Icon dat truoc chu, vd icon mon hoc. */
  icon?: IconName;
};

/** `EnrollmentStatus` cua BE. Phu huynh khong thay ghi danh `PENDING_LINK` (chua lien ket). */
export type EnrollmentStatus = 'ACTIVE' | 'ENDED';

/** Don bao luu (LeaveRequest `PERIOD_PAUSE` da duyet) dang hieu luc, ngay dang `YYYY-MM-DD`. */
export type EnrollmentPause = {
  fromDate: string;
  toDate: string;
};

/** Mot buoi co dinh trong tuan cua lop, gio dang `HH:mm`. */
export type WeeklySlot = {
  /** Thu theo ISO 8601: 1 = Thu Hai ... 7 = Chu nhat. */
  weekday: number;
  startTime: string;
  endTime: string;
};

/** Mot phan tu cua response GET /parent/students/:studentId/enrollments: mot mon con da ghi danh. */
export type StudentEnrollment = {
  id: string;
  status: EnrollmentStatus;
  /** null khi khong bao luu. Chi co o ghi danh `ACTIVE`. */
  pause: EnrollmentPause | null;
  /** `Program.name`, vd `Toán 8 – Chuyên đề nâng cao`. */
  programName: string;
  /** `Program.subject`, vd `Toán`. */
  subjectName: string;
  /** `Class.name`, trung voi `className` trong lich hoc. */
  className: string;
  /** null khi lop chua co giao vien. */
  teacherName: string | null;
  room: string | null;
  /** Lich co dinh cua lop, rong khi lop chua xep lich. */
  weeklySlots: WeeklySlot[];
  completedSessions: number;
  totalSessions: number;
  /** Diem trung binh mon, thang diem 10. null khi chua co diem. */
  averageScore: number | null;
  /** Buoi sap toi trong lich cua con. null khi da ket thuc, dang bao luu hoac chua co lich. */
  nextSession: { id: string; startsAt: string } | null;
  /** `Enrollment.endDate` dang `YYYY-MM-DD`, null khi chua chot ngay ket thuc. */
  endDate: string | null;
};

/** Trang thai hien tren the mon hoc: ghi danh `ACTIVE` dang bao luu thi la tam nghi. */
export type CourseStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export type CourseFilter = 'ALL' | CourseStatus;

/** Bai thuong hay bai kiem tra dinh ky cua chuong trinh. */
export type LessonKind = 'LESSON' | 'ASSESSMENT';

/** Buoi cua lop day bai nay (ClassSession co `lessonId` la bai). */
export type LessonSession = {
  id: string;
  startsAt: string;
  status: ClassSessionStatus;
};

/** Bai tap cua lop giao kem bai hoc va ket qua cua con. */
export type LessonAssignment = {
  id: string;
  title: string;
  dueAt: string;
  /** Lan nop gan nhat cua con, null khi chua nop. */
  submittedAt: string | null;
  /** Diem da cong bo, thang diem 10. null khi chua cham hoac chua nop. */
  score: number | null;
};

/**
 * Mot phan tu cua response GET /parent/students/:studentId/enrollments/:enrollmentId/lessons: mot
 * bai trong chuong trinh cua lop con dang hoc.
 */
export type EnrollmentLesson = SessionLesson & {
  id: string;
  kind: LessonKind;
  /** null khi lop chua xep buoi day bai nay. */
  session: LessonSession | null;
  /** null khi bai chua co bai tap. */
  assignment: LessonAssignment | null;
};

/** Vi tri cua bai tren lo trinh: da hoc, bai con dang hoc (buoi gan nhat chua xong) hay chua hoc. */
export type LessonProgress = 'DONE' | 'CURRENT' | 'UPCOMING';

export type RoadmapLesson = EnrollmentLesson & { progress: LessonProgress };

/** So bai theo vi tri tren lo trinh. */
export type RoadmapSummary = Record<LessonProgress, number> & {
  total: number;
  /** Phan tram bai da hoc, 0-100. */
  percent: number;
  /** Bai kiem tra dinh ky gan nhat chua hoc. */
  nextAssessment: RoadmapLesson | null;
};

/** Trang thai bai tap cua con, tinh tu `submittedAt` va `dueAt`. */
export type AssignmentState = 'SUBMITTED' | 'PENDING' | 'OVERDUE';

/** `QuestionKind` cua BE: cau trac nghiem hay tu luan. */
export type QuestionKind = 'MULTIPLE_CHOICE' | 'ESSAY';

/** Lan nop gan nhat cua con (Submission). */
export type AssignmentSubmission = {
  /** Lan nop thu may, tinh tu 1. */
  attemptNo: number;
  submittedAt: string;
};

/** Diem da cong bo gan nhat cua lan nop (GradeReview `PUBLISHED`). */
export type AssignmentGrade = {
  totalScore: number;
  /** Tong diem toi da cua cac cau, vd `10`. */
  maxScore: number;
  /** Nhan xet cua giao vien, null khi khong nhan xet. */
  feedback: string | null;
  publishedAt: string;
};

/** Mot phan tu cua response GET /parent/students/:studentId/assignments: mot bai tap giao cho con. */
export type StudentAssignment = {
  id: string;
  title: string;
  instructions: string;
  subjectName: string;
  /** `Class.name`, trung voi `className` trong lich hoc. */
  className: string;
  /** null khi lop chua co giao vien. */
  teacherName: string | null;
  dueAt: string;
  /** So lan con duoc nop, gom ca lan dau. */
  maxAttempts: number;
  /** So cau cua bai theo loai cau hoi. */
  questionCounts: Record<QuestionKind, number>;
  /** null khi con chua nop. */
  submission: AssignmentSubmission | null;
  /** null khi chua nop hoac giao vien chua cong bo diem. */
  grade: AssignmentGrade | null;
};

/** Hinh thuc bai tap theo loai cau hoi: chi trac nghiem, chi tu luan hay ca hai. */
export type AssignmentFormat = QuestionKind | 'MIXED';

/** Cac tab cua man hinh bai tap: chua nop, da nop cho cham, da co diem. */
export type AssignmentTab = 'TODO' | 'SUBMITTED' | 'GRADED';

/**
 * De bai, bai nop va diem: cac kieu tu day toi `SubmissionReceipt` theo module `academic` tren nhanh
 * `dev` cua BE (xem dau file `src/api/mocks/academic.ts`). BE tra nguyen ban ghi Prisma, o day chi
 * khai bao field app dung.
 */

/** Bai tap can mo chi tiet: mot bai co the giao cho nhieu con nen luon di kem id cua con. */
export type AssignmentRef = {
  studentId: string;
  assignmentId: string;
};

/** `AssignmentStatus` cua BE. Phu huynh khong thay bai `DRAFT`; `CLOSED`: giao vien da dong nhan bai. */
export type AssignmentStatus = 'PUBLISHED' | 'CLOSED';

/** Mot cau cua de (AssignmentQuestion), theo thu tu trong de. */
export type AssignmentQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** Cac lua chon cua cau trac nghiem; null voi cau tu luan. */
  choices: string[] | null;
  maxScore: number;
  /** Lua chon dung hoac loi giai mau. Chi co sau khi giao vien cong bo dap an. */
  correctAnswer?: string | null;
};

/** Con duoc giao bai (AssignmentRecipient): mot ghi danh cua con trong lop cua bai. */
export type AssignmentRecipient = {
  id: string;
  enrollmentId: string;
};

/** Response GET /academic/assignments/:id. */
export type AssignmentDetail = {
  id: string;
  title: string;
  instructions: string;
  dueAt: string;
  status: AssignmentStatus;
  maxAttempts: number;
  /** Chi gom con cua phu huynh dang dang nhap. */
  recipients: AssignmentRecipient[];
  questions: AssignmentQuestion[];
};

export type SubmissionAnswer = {
  questionId: string;
  answer: string;
};

/** Diem mot cau trong GradeReview. */
export type QuestionScore = {
  questionId: string;
  score: number;
  /** Nhan xet rieng cho cau, chuoi rong khi giao vien khong ghi. */
  feedback: string;
};

/** GradeReview da cong bo cua mot lan nop. */
export type SubmissionGrade = {
  id: string;
  scores: QuestionScore[];
  totalScore: number;
  feedback: string;
  publishedAt: string | null;
};

/** Mot phan tu cua response GET /academic/assignments/:id/submissions: mot lan nop cua con. */
export type SubmissionRecord = {
  id: string;
  /** Con nao nop, xem `AssignmentDetail.recipients`. */
  recipientId: string;
  attemptNo: number;
  answers: SubmissionAnswer[];
  submittedAt: string;
  /** Chi gom diem da cong bo, ban sua moi nhat truoc. Rong khi giao vien chua cong bo. */
  grades: SubmissionGrade[];
};

/** Body POST /academic/submissions (SubmissionDto): dung mot cau tra loi cho moi cau hoi. */
export type SubmitAssignmentPayload = {
  recipientId: string;
  answers: SubmissionAnswer[];
};

/** Response POST /academic/submissions. */
export type SubmissionReceipt = {
  id: string;
  recipientId: string;
  attemptNo: number;
  submittedAt: string;
};

/** Cau tra loi con dang lam, key la id cau hoi. Cau chua lam thi khong co key. */
export type AnswerDraft = Partial<Record<string, string>>;

/** Trang thai mot lua chon khi xem lai bai: chua chon, con chon (chua biet dung sai), dung, sai. */
export type ChoiceState = 'IDLE' | 'SELECTED' | 'CORRECT' | 'WRONG';

/** Ket qua mot cau cua lan nop dang xem. */
export type QuestionReview = {
  /** Cau tra loi cua con, chuoi rong khi khong co bai nop. */
  answer: string;
  /** null khi giao vien chua cong bo diem. */
  score: number | null;
  feedback: string | null;
  /** null khi giao vien chua cong bo dap an. */
  correctAnswer: string | null;
  /** Chi tinh duoc voi cau trac nghiem da co dap an. */
  isCorrect: boolean | null;
};

/**
 * Hoc phi: cac kieu tu day toi `TermSessionCount` theo module `registration-flow` tren nhanh `dev`
 * cua BE (`enrollmentsOf` va `receiptResponse` trong `registration-flow.service.ts`), da noi BE that.
 * Rieng `StudentRegistration` la TAM va con chay bang mock (xem dau file
 * `src/api/mocks/registration-flow.ts`). BE tra nguyen ban ghi Prisma, o day chi khai bao field app
 * dung.
 */

/** `PaymentStatus` cua BE: hoc phi thu tai trung tam, chi ghi nhan khi da thu du. */
export type PaymentStatus = 'CONFIRMED';

/** `RegistrationStatus` cua BE. `PAYMENT_CONFIRMED` va `LINKED` thuoc luong ma lien ket cu. */
export type RegistrationStatus =
  'DRAFT' | 'COMPLETED' | 'PAYMENT_CONFIRMED' | 'LINKED' | 'CANCELLED';

/** Lop cua ghi danh va don dang ky (`Class` kem `program`, `weeklySchedules`). */
export type TuitionClass = {
  id: string;
  name: string;
  program: { name: string; subject: string; grade: number };
  weeklySchedules: WeeklySlot[];
};

/** `Payment` cua don dang ky. */
export type TuitionPayment = {
  id: string;
  /** Prisma Decimal, BE serialize thanh chuoi, vd `"3600000"`. */
  amount: string;
  currency: string;
  status: PaymentStatus;
  confirmedAt: string;
  receiptNumber: string;
};

/** Mot phan tu cua response GET /me/students/:id/enrollments: ghi danh kem lop va thanh toan. */
export type TuitionEnrollment = {
  id: string;
  /** Id don dang ky, dung de mo bien lai. */
  registrationOrderId: string;
  packageMonths: number;
  status: EnrollmentStatus;
  /** Cot ngay cua Prisma: 00:00 UTC cua ngay do, vd `2026-10-05T00:00:00.000Z`. */
  startDate: string | null;
  /** Ngay het han, khong thuoc ky hoc: ky hoc la `[startDate, endDate)`. */
  endDate: string | null;
  activatedAt: string | null;
  class: TuitionClass;
  registrationOrder: { payment: TuitionPayment | null };
};

/** Ghi danh da co thanh toan: mot dong cua lich su dong hoc phi. */
export type PaidEnrollment = TuitionEnrollment & {
  registrationOrder: { payment: TuitionPayment };
};

/**
 * Mot phan tu cua response TAM GET /me/students/:id/registrations: mot don dang ky cua con, cung
 * dang GET /registrations/:id cua BE.
 */
export type StudentRegistration = {
  id: string;
  status: RegistrationStatus;
  packageMonths: number;
  /** Prisma Decimal: hoc phi thang cua lop luc lap don nhan voi so thang. */
  quotedAmount: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  /** Luc nhan vien lap don. */
  createdAt: string;
  class: TuitionClass;
};

/** Response GET /registrations/:id/receipt (`receiptResponse` cua BE). */
export type TuitionReceipt = {
  registrationId: string;
  status: RegistrationStatus;
  /** Email phu huynh luu luc lap don. */
  parentEmail: string;
  student: { fullName: string; grade: number };
  class: { id: string; name: string; subject: string; grade: number; schedules: WeeklySlot[] };
  term: {
    packageMonths: number;
    /** Dang `YYYY-MM-DD`. */
    startDate: string | null;
    /** Ngay het han dang `YYYY-MM-DD`, khong thuoc ky hoc. */
    endDate: string | null;
  };
  /** Khong null: route chi tra bien lai cua don da xac nhan thu tien. */
  payment: {
    id: string;
    receiptNumber: string;
    amount: number;
    currency: string;
    confirmedAt: string;
  };
  /** Hoc phi bao luc lap don: hoc phi thang nhan voi so thang. */
  quotedAmount: number;
  currency: string;
};

/** Ky hoc so voi hom nay: chua toi ngay bat dau, dang trong ky hay da het han. */
export type TermStatus = 'UPCOMING' | 'CURRENT' | 'EXPIRED';

/** So buoi cua ky hoc tinh theo lich co dinh cua lop. */
export type TermSessionCount = {
  /** Buoi roi vao cac ngay truoc hom nay. */
  elapsed: number;
  total: number;
};

/**
 * Cac cach xem cua tab Lich hoc: lich theo tuan, danh sach mon, lo trinh bai hoc tung mon, lich su
 * diem danh cua con.
 */
export type ScheduleView = 'WEEK' | 'COURSES' | 'ROADMAP' | 'ATTENDANCE';

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
