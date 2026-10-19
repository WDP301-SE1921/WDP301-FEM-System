/**
 * Kieu cua man hinh phu huynh. Lich hoc, chi tiet buoi, mon hoc, lo trinh, diem danh va bai tap ghep
 * tu cac endpoint that cua BE (xem `./api/parent-data-mappers.ts`); diem, viec can chu y va thong bao
 * o trang chu van la hop dong TAM chay bang mock (xem dau file `src/api/mocks/parent.ts`).
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
  /**
   * Ten phong do quan ly dat, vd `Phòng A101`. null khi khong co phong hoac BE khong tra phong (danh
   * sach buoi hoc cua BE khong co phong).
   */
  room: string | null;
  /** null khi app chua co ten giao vien: chi chi tiet buoi cua BE co ten giao vien. */
  teacherName: string | null;
};

export type SessionStatus = 'UPCOMING' | 'IN_PROGRESS' | 'FINISHED';

/** Buoi co dinh, buoi hoc bu hoac buoi da doi lich. */
export type ScheduleSessionType = 'REGULAR' | 'MAKEUP' | 'RESCHEDULED';

/**
 * Mot buoi trong lich hoc cua con, ghep tu GET /academic/scheduled-sessions. BE chua danh dau buoi doi
 * lich va chua tra ghi chu cua trung tam cho buoi con hoc, nen buoi chi la `REGULAR` hoac `MAKEUP`.
 */
export type ScheduleSession = ClassSession & {
  type: ScheduleSessionType;
  /** Ten bai hoc cua buoi, vd `Đại số`. */
  topic: string | null;
  /** Ghi chu cua trung tam, vd ly do huy buoi. */
  note: string | null;
};

/** Buoi hien tren the (buoi tiep theo cua mon, bai tren lo trinh): id buoi va gio bat dau. */
export type SessionLink = Pick<ClassSession, 'id' | 'startsAt'>;

/** Buoi hoc can mo chi tiet: phu huynh doc mot buoi theo con, nen luon di kem id cua con. */
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
  /** Thu tu bai trong chuong trinh, vd `12` -> `Bài 12`. null khi BE khong tra thu tu bai. */
  sequence: number | null;
  title: string;
  description: string | null;
};

export type SessionMaterial = {
  id: string;
  name: string;
  /** Cach tai lieu toi tay con, vd `Đã phát trên lớp`. */
  note: string | null;
};

/**
 * Chi tiet mot buoi cua con, ghep tu GET /academic/scheduled-sessions/:id va danh sach phong. BE chua
 * tra gio vao lop, nhan xet rieng cho tung con va tai lieu cua buoi.
 */
export type SessionDetail = ScheduleSession & {
  status: ClassSessionStatus;
  /** null khi buoi chua gan bai hoc. */
  lesson: SessionLesson | null;
  /** null khi con chua co trong danh sach diem danh cua buoi (giao vien chua chuan bi). */
  attendance: AttendanceStatus | null;
  /** Gio con vao lop. null khi chua diem danh hoac con khong co mat. */
  checkedInAt: string | null;
  /** Nhan xet chung cua giao vien ve buoi hoc, ghi khi chot diem danh. */
  teacherComment: string | null;
  materials: SessionMaterial[];
};

/** `ParticipantKind` cua BE: con hoc buoi co dinh cua lop hay buoi hoc bu. */
export type ParticipantKind = 'REGULAR' | 'MAKEUP';

/** `MakeupStatus` cua BE. */
export type MakeupStatus = 'BOOKED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

/** Buoi hoc bu (MakeupBooking) da xep cho mot buoi vang. Lich hoc bu da huy khong hien. */
export type AttendanceMakeup = {
  status: Exclude<MakeupStatus, 'CANCELLED'>;
  /** Gio bat dau cua buoi hoc bu. */
  startsAt: string;
};

/**
 * Ket qua diem danh sau khi tinh hoc bu (`effectiveStatus` cua BE), dung 4 trang thai cua SRS muc 5.5:
 * buoi vang da hoc bu xong la `MADE_UP`, buoi nghi trong thoi gian tam nghi la `EXCUSED`.
 */
export type AttendanceResult = 'PRESENT' | 'ABSENT' | 'MADE_UP' | 'EXCUSED';

/**
 * Mot buoi trong lich su diem danh cua con, ghep tu GET /academic/me/students/:id/attendance, ghi danh
 * cua con, lich hoc bu va don nghi da duyet. Chi gom buoi co dinh da chot diem danh: buoi hoc bu
 * nam o buoi vang ma no bu cho.
 */
export type AttendanceRecord = Pick<
  ClassSession,
  'className' | 'subjectName' | 'startsAt' | 'endsAt'
> & {
  /** Id buoi hoc, dung de mo chi tiet buoi. */
  sessionId: string;
  status: AttendanceResult;
  /** Ly do trong don nghi da duyet cua buoi (nghi mot buoi hoac tam nghi). Khong co khi co mat. */
  leaveReason: string | null;
  /** Lich hoc bu moi nhat cua buoi vang. null khi con co mat hoac chua xep hoc bu. */
  makeup: AttendanceMakeup | null;
};

/** So buoi theo ket qua diem danh. */
export type AttendanceCounts = Record<'present' | 'absent' | 'madeUp' | 'excused', number>;

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

/**
 * Mot mon con da ghi danh, ghep tu GET /me/students/:id/enrollments, don bao luu
 * (GET /academic/leaves) va buoi sap toi (GET /academic/scheduled-sessions).
 */
export type StudentEnrollment = {
  id: string;
  /** Ghi danh `ACTIVE` da qua ngay het han cung tinh la `ENDED`: BE khong tu ket thuc ghi danh. */
  status: EnrollmentStatus;
  /** null khi khong bao luu. Chi co o ghi danh `ACTIVE`. */
  pause: EnrollmentPause | null;
  /** `Program.name`, vd `Toán 8 – Chuyên đề nâng cao`. */
  programName: string;
  /** `Program.subject`, vd `Toán`. */
  subjectName: string;
  /** `Class.name` cua lop con dang hoc, trung voi `className` trong lich hoc. */
  className: string;
  /** null khi app chua co ten giao vien (ghi danh cua BE chi co `teacherId`). */
  teacherName: string | null;
  /** Ten phong cua lop, null khi lop chua xep phong. */
  room: string | null;
  /** Lich co dinh cua lop, rong khi lop chua xep lich. */
  weeklySlots: WeeklySlot[];
  /** So buoi theo lich co dinh tu dau ky toi hom nay, xem `countTermSessions`. */
  completedSessions: number;
  totalSessions: number;
  /** Diem trung binh mon, thang diem 10. null khi chua co diem (BE chua tinh). */
  averageScore: number | null;
  /** Buoi sap toi trong lich cua con. null khi da ket thuc, dang bao luu hoac chua co lich. */
  nextSession: SessionLink | null;
  /** Ngay het han `Enrollment.endDate` dang `YYYY-MM-DD`, null khi chua chot ngay. */
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
 * Mot bai tren lo trinh cua lop con dang hoc. BE chua cho phu huynh doc giao trinh, nen lo trinh
 * ghep tu cac buoi trong ky ghi danh (GET /academic/scheduled-sessions): moi buoi mot bai, theo gio
 * hoc. Bai chua xep buoi va bai tap gan voi bai thi chua co.
 */
export type EnrollmentLesson = Omit<SessionLesson, 'sequence'> & {
  /** Id cua buoi day bai: mot bai co the day o nhieu buoi. */
  id: string;
  /** Thu tu tren lo trinh, tinh tu 1. */
  sequence: number;
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

/**
 * Mot bai tap giao cho con, ghep tu GET /academic/assignments, de bai va bai nop cua tung bai. Lop va
 * mon lay tu ghi danh cua con.
 */
export type StudentAssignment = {
  id: string;
  /** Loai bai kiem tra, null voi bai tap ve nha. */
  testType: TestType | null;
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
 * Buoi hoc, don nghi, de bai, bai nop va diem: cac kieu tu day toi `SubmissionReceipt` theo module
 * `academic` va `curriculum-scheduling` tren nhanh `dev` cua BE, da noi BE that. BE tra nguyen ban ghi
 * Prisma, o day chi khai bao field app dung.
 */

/** Query phan trang cua module `academic` (PageDto): `limit` tu 1 toi 100. */
export type PageQuery = {
  page: number;
  limit: number;
};

/** `CurriculumItemKind` cua BE: bai hoc thuong hay bai kiem tra thang. */
export type CurriculumItemKind = 'LESSON' | 'MONTHLY_TEST';

/**
 * Query GET /academic/scheduled-sessions (SessionQueryDto), ngay dang `YYYY-MM-DD`. Phu huynh gui
 * `studentId` de chi lay buoi cua mot con.
 */
export type ScheduledSessionQuery = PageQuery & {
  studentId: string;
  fromDate: string;
  toDate: string;
};

/**
 * Cho cua con trong mot buoi (SessionParticipant). Chi co khi giao vien da chuan bi danh sach diem
 * danh, con xin nghi buoi do, hoac con duoc xep hoc bu vao buoi do.
 */
export type SessionParticipation = {
  enrollmentId: string;
  kind: ParticipantKind;
  attendance: AttendanceStatus;
  /** Cho da bi huy, vd con chuyen lop hoac lich hoc bu bi huy: con khong hoc buoi nay nua. */
  cancelled: boolean;
};

/**
 * Mot phan tu cua response GET /academic/scheduled-sessions voi role PARENT va `studentId`: buoi khong
 * bi huy cua con (gom buoi hoc bu o lop khac va buoi cua ghi danh da ket thuc), theo gio tang dan.
 */
export type ScheduledSession = {
  id: string;
  classId: string;
  startsAt: string;
  endsAt: string;
  status: ClassSessionStatus;
  class: { name: string; program: { grade: number; subject: string } };
  lesson: { id: string; title: string; kind: CurriculumItemKind };
  /** Cho cua con trong buoi, rong khi chua co. */
  participations: SessionParticipation[];
};

/**
 * Response GET /academic/scheduled-sessions/:id voi role PARENT: nguyen ban ghi ClassSession kem lop,
 * giao vien, bai hoc va cho cua con. Ca buoi da huy cung tra ve.
 */
export type ScheduledSessionDetail = {
  id: string;
  classId: string;
  /** Phong cua buoi, chep tu lop luc sinh buoi. null voi buoi tao truoc khi BE co phong. */
  roomId: string | null;
  startsAt: string;
  endsAt: string;
  status: ClassSessionStatus;
  /** Ghi chu chung cua giao vien khi chot diem danh. */
  summary: string | null;
  cancelReason: string | null;
  class: { name: string; roomId: string | null; program: { subject: string } };
  teacher: { id: string; displayName: string | null };
  /** Khong dung `content` cua bai: do la giao an, gom ca dap an bai tap. */
  lesson: { id: string; title: string; kind: CurriculumItemKind };
  participation: SessionParticipation | null;
};

/** Mot phan tu cua response GET /rooms. */
export type Room = {
  id: string;
  /** Ten do quan ly dat, vd `Phòng A101`. */
  name: string;
};

/** `LeaveKind` cua BE: nghi mot buoi hay bao luu mot khoang thoi gian. */
export type LeaveKind = 'SINGLE_ABSENCE' | 'PERIOD_PAUSE';

/** `RequestStatus` cua BE. */
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/**
 * Query GET /academic/leaves (LeaveFilterDto) cua mot con. Khoang ngay loc don giao voi
 * `[fromDate, toDate]`; bo trong thi khong loc theo field do.
 */
export type LeaveQuery = PageQuery & {
  studentId: string;
  kind?: LeaveKind;
  status?: RequestStatus;
  fromDate?: string;
  toDate?: string;
};

/** Mot phan tu cua response GET /academic/leaves: ban ghi LeaveRequest. */
export type LeaveRequest = {
  id: string;
  enrollmentId: string;
  kind: LeaveKind;
  /** Buoi xin nghi, chi co voi `SINGLE_ABSENCE`. */
  sessionId: string | null;
  /** Cot ngay cua Prisma: 00:00 UTC cua ngay do. Ca hai ngay deu thuoc don. */
  fromDate: string;
  toDate: string;
  reason: string;
  status: RequestStatus;
};

/** Mot phan tu cua response GET /academic/makeups voi role PARENT: lich hoc bu cua cac con. */
export type MakeupBooking = {
  id: string;
  status: MakeupStatus;
  /** Buoi vang can bu. */
  original: { sessionId: string; enrollmentId: string };
  /** Buoi con den hoc bu. */
  replacement: { session: { id: string; startsAt: string } };
};

/** Mot phan tu cua `history` trong response GET /academic/me/students/:id/attendance. */
export type AttendanceHistoryItem = {
  enrollmentId: string;
  effectiveStatus: AttendanceResult;
  session: { id: string; classId: string; startsAt: string; endsAt: string };
};

/**
 * Response GET /academic/me/students/:id/attendance. BE dung chung cong thuc voi web: ty le = (co mat
 * + hoc bu) / buoi phai hoc, buoi nghi co phep khong tinh vao buoi phai hoc (xem `toAttendanceSummary`).
 */
export type AttendanceReport = {
  counts: AttendanceCounts;
  /** Buoi co dinh da chot diem danh cua con, cu nhat truoc. */
  history: AttendanceHistoryItem[];
};

/** Bai tap can mo chi tiet: mot bai co the giao cho nhieu con nen luon di kem id cua con. */
export type AssignmentRef = {
  studentId: string;
  assignmentId: string;
};

/** `AssignmentStatus` cua BE. Phu huynh khong thay bai `DRAFT`; `CLOSED`: giao vien da dong nhan bai. */
export type AssignmentStatus = 'PUBLISHED' | 'CLOSED';

/** `kind` cua bai o BE: bai tap ve nha, hay bai kiem tra gan voi mot buoi hoc. */
export type AssessmentKind = 'HOMEWORK' | 'TEST';

/** `testType` cua bai kiem tra o BE. */
export type TestType = 'FIFTEEN_MINUTES' | 'ONE_PERIOD' | 'MIDTERM' | 'FINAL';

/** Mot phan tu cua response GET /academic/assignments voi role PARENT: bai cua moi con, moi tao truoc. */
export type AssignmentSummary = {
  id: string;
  classId: string;
  kind: AssessmentKind;
  /** null voi bai tap ve nha. */
  testType: TestType | null;
  title: string;
  dueAt: string;
  status: AssignmentStatus;
  maxAttempts: number;
};

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
  classId: string;
  kind: AssessmentKind;
  /** null voi bai tap ve nha. */
  testType: TestType | null;
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
 * cua BE (`enrollmentsOf`, `billResponse` va `receiptResponse` trong `registration-flow.service.ts`),
 * da noi BE that. Ghi danh la nguyen ban ghi Prisma, o day chi khai bao field app dung.
 */

/** `PaymentStatus` cua BE: hoc phi thu tai trung tam, chi ghi nhan khi da thu du. */
export type PaymentStatus = 'CONFIRMED';

/** `RegistrationStatus` cua BE. `PAYMENT_CONFIRMED` va `LINKED` thuoc luong ma lien ket cu. */
export type RegistrationStatus =
  'DRAFT' | 'COMPLETED' | 'PAYMENT_CONFIRMED' | 'LINKED' | 'CANCELLED';

/** Lop cua ghi danh, xep lop va don dang ky (`Class` kem `program`, `weeklySchedules`). */
export type TuitionClass = {
  id: string;
  name: string;
  /** Phong cua lop (xem GET /rooms), null khi lop chua xep phong. */
  roomId: string | null;
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

/**
 * Mot lan xep lop (EnrollmentPlacement): con hoc lop `classId` tu `effectiveFrom` toi truoc
 * `effectiveTo`. Chuyen lop thi dong lan xep cu va mo lan xep moi.
 */
export type EnrollmentPlacement = {
  classId: string;
  /** Thoi diem bat dau, xac nhan thu tien thi la 00:00 gio Viet Nam cua ngay bat dau ky hoc. */
  effectiveFrom: string;
  /** null khi con dang hoc lop nay. */
  effectiveTo: string | null;
  class: TuitionClass;
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
  /** Lop luc dang ky. Lop con dang hoc nam trong `placements` neu co. */
  class: TuitionClass;
  /** Cac lan xep lop, som nhat truoc. Rong voi ghi danh tao truoc khi BE co xep lop. */
  placements: EnrollmentPlacement[];
  registrationOrder: { payment: TuitionPayment | null };
};

/** Ghi danh da co thanh toan: mot dong cua lich su dong hoc phi. */
export type PaidEnrollment = TuitionEnrollment & {
  registrationOrder: { payment: TuitionPayment };
};

/** Trang thai bill: chua thu tien, da xac nhan thu tien, hoac don da huy. */
export type BillStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

/**
 * Mot phan tu cua `items` trong response GET /me/bills: bill cua mot don dang ky (`billResponse`
 * cua BE). Thong tin con, lop va hoc phi la ban chup luc nhan vien lap don.
 */
export type TuitionBill = {
  registrationId: string;
  status: BillStatus;
  /** Luc nhan vien lap don. */
  issuedAt: string;
  student: { id: string; fullName: string; grade: number };
  class: { id: string; name: string; subject: string; grade: number; schedules: WeeklySlot[] };
  term: {
    packageMonths: number;
    /** Dang `YYYY-MM-DD`. */
    startDate: string | null;
    /** Ngay het han dang `YYYY-MM-DD`, khong thuoc ky hoc. */
    endDate: string | null;
  };
  /** So tien la chuoi thap phan, vd `"2400000.00"`. */
  pricing: { monthlyFee: string; packageMonths: number; total: string; currency: string };
  /** null khi trung tam chua xac nhan thu tien. */
  payment: { receiptNumber: string; paidAmount: string; confirmedAt: string } | null;
};

/** Phu huynh tren bill, chup luc nhan vien lap don. */
export type BillParent = {
  displayName: string | null;
  email: string;
  phone: string | null;
};

/**
 * Response GET /registrations/:id/bill: cung dang voi mot phan tu cua GET /me/bills, them ma bill va
 * phu huynh. Bill khong co QR va khong ghi hinh thuc thanh toan (BE chua luu).
 */
export type TuitionBillDetail = TuitionBill & {
  /** Hien bang id don dang ky. */
  billNumber: string;
  parent: BillParent;
};

/** Response GET /me/bills: bill cua moi con, moi lap truoc. */
export type BillPage = {
  items: TuitionBill[];
  page: number;
  limit: number;
  total: number;
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

/**
 * Response GET /parent/students/:studentId/dashboard (mock). Buoi hoc hom nay lay tu lich hoc, ty le
 * di hoc lay tu diem danh cua BE.
 */
export type StudentDashboard = {
  /** null khi con chua co diem nao. */
  scoreSummary: ScoreSummary | null;
  attentionItems: AttentionItem[];
  recentNotifications: DashboardNotification[];
};
