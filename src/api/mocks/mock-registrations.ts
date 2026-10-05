/**
 * Don dang ky (RegistrationOrder), thanh toan (Payment) va ghi danh (Enrollment) gia cua hoc sinh mau
 * (`./mock-students.ts`), dong vai cac bang `registration_orders`, `payments`, `enrollments`,
 * `classes`, `programs`, `class_weekly_schedules` cua BE (nhanh `dev`, module `registration-flow`).
 * Dung cho cac route trong `./registration-flow.ts`.
 *
 * Ghi danh trung id, lop, chuong trinh va trang thai voi mock mon hoc (`./mock-enrollments.ts`); lop
 * dang hoc lay lich co dinh va ngay bat dau tu lich gia nen khop voi tab Lich hoc. Ngay tinh theo so
 * ngay ke tu hom nay:
 * - Minh Anh  : Toan (goi 3 thang), Vat ly (goi 3 thang), Hoa hoc (goi 6 thang) da xac nhan thu hoc
 *               phi; Ngu van (goi 2 thang) da ket thuc; mot don Hinh hoc bo tro con `DRAFT` (nhan vien
 *               da lap, chua xac nhan thu hoc phi)
 * - Hoang Long: Tieng Anh (goi 3 thang) da xac nhan thu hoc phi
 * Con phu huynh vua tao chua co don nao.
 *
 * Giong BE: `quotedAmount = monthlyFee * packageMonths`, `endDate = startDate + packageMonths` thang
 * duong lich, cot Decimal serialize thanh chuoi, cot `@db.Date` thanh 00:00 UTC, hoc phi thu truoc
 * ngay bat dau.
 */
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date';

import { findUserById } from './mock-accounts';
import { buildMockEnrollments, type MockEnrollment } from './mock-enrollments';
import { CLASS_START_DAYS } from './mock-schedule';
import { findStudentById, type MockStudent } from './mock-students';

const CURRENCY = 'VND';
/** `User.id` cua nhan vien lap don va xac nhan thu tien. Mock chua co tai khoan nay. */
const STAFF_USER_ID = 'mock-staff-1';
/** `createdAt` cua lop, chuong trinh va lich co dinh: co truoc moi don dang ky. */
const SEED_TIMESTAMP = '2026-01-05T02:00:00.000Z';
const CLASS_CAPACITY = 20;
/** Do dai cua `YYYY-MM-DD`. */
const DATE_KEY_LENGTH = 10;
/** Phu huynh dong hoc phi tai trung tam truoc ngay bat dau hoc chung nay ngay. */
const PAYMENT_LEAD_DAYS = 3;
/** Gio nhan vien lap don va gio xac nhan da thu tien trong ngay. */
const ORDER_CREATED_TIME = [9, 0] as const;
const PAYMENT_CONFIRMED_TIME = [9, 30] as const;

type WeeklySlot = { weekday: number; startTime: string; endTime: string };

type MockProgram = {
  id: string;
  name: string;
  subject: string;
  grade: number;
  createdAt: string;
  updatedAt: string;
};

type MockClassWeeklySchedule = WeeklySlot & {
  id: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
};

type MockClass = {
  id: string;
  programId: string;
  name: string;
  capacity: number;
  isOpen: boolean;
  /** Prisma Decimal. */
  monthlyFee: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  program: MockProgram;
  weeklySchedules: MockClassWeeklySchedule[];
};

type MockPayment = {
  id: string;
  registrationOrderId: string;
  /** Prisma Decimal. */
  amount: string;
  currency: string;
  status: 'CONFIRMED';
  confirmedByManagerId: string;
  confirmedAt: string;
  receiptNumber: string;
  createdAt: string;
};

type MockEnrollmentRow = {
  id: string;
  registrationOrderId: string;
  studentProfileId: string;
  classId: string;
  packageMonths: number;
  status: 'ACTIVE' | 'ENDED';
  startDate: string;
  endDate: string;
  activatedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockOrderRow = {
  id: string;
  type: 'EXISTING_STUDENT_NEW_SUBJECT';
  parentEmail: string;
  parentPhone: string | null;
  studentFullName: string;
  studentGrade: number;
  targetStudentId: string;
  classId: string;
  packageMonths: number;
  /** Prisma Decimal. */
  quotedAmount: string;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'COMPLETED';
  createdByManagerId: string;
  confirmedAt: string | null;
  linkedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** RegistrationOrder kem `registrationInclude` cua BE, nhu GET /registrations/:id. */
export type MockRegistration = MockOrderRow & {
  targetStudent: { id: string; fullName: string; grade: number };
  class: MockClass;
  payment: MockPayment | null;
  enrollment: MockEnrollmentRow | null;
};

/** Mot phan tu cua response GET /me/students/:id/enrollments. */
export type MockTuitionEnrollment = MockEnrollmentRow & {
  class: MockClass;
  registrationOrder: MockOrderRow & { payment: MockPayment | null };
};

/** Response GET /registrations/:id/receipt (`receiptResponse` cua BE). */
export type MockReceipt = {
  registrationId: string;
  status: MockOrderRow['status'];
  parentEmail: string;
  student: { fullName: string; grade: number };
  class: {
    id: string;
    name: string;
    subject: string;
    grade: number;
    schedules: MockClassWeeklySchedule[];
  };
  term: { packageMonths: number; startDate: string; endDate: string; label: string };
  payment: {
    id: string;
    receiptNumber: string;
    amount: number;
    currency: string;
    confirmedAt: string;
  };
  enrollment: { id: string; status: MockEnrollmentRow['status'] } | null;
  quotedAmount: number;
  currency: string;
};

type OrderTemplate = {
  id: string;
  studentId: string;
  packageMonths: number;
  monthlyFee: number;
};

type PaidOrderTemplate = OrderTemplate & {
  /** Id ghi danh trong `./mock-enrollments.ts`: lop, chuong trinh va trang thai lay tu do. */
  enrollmentId: string;
  /** So bien lai nhan vien nhap khi xac nhan thu tien. */
  receiptNumber: string;
  /** Lich co dinh cua lop khi mock mon hoc khong tra (con dang bao luu hoac da hoc xong). */
  fallbackSlots: readonly WeeklySlot[];
  /** `Enrollment.startDate` cua lop khong co trong `CLASS_START_DAYS`, so ngay tinh tu hom nay. */
  startDay?: number;
};

type DraftOrderTemplate = OrderTemplate & {
  className: string;
  programName: string;
  subject: string;
  weeklySlots: readonly WeeklySlot[];
  /** Ngay bat dau hoc du kien va ngay nhan vien lap don, so ngay tinh tu hom nay. */
  startDay: number;
  createdDay: number;
};

const PAID_ORDERS: readonly PaidOrderTemplate[] = [
  {
    id: 'mock-order-1',
    studentId: 'mock-student-1',
    enrollmentId: 'mock-enrollment-1',
    packageMonths: 3,
    monthlyFee: 1_200_000,
    receiptNumber: 'PT-1082',
    fallbackSlots: [],
  },
  {
    id: 'mock-order-2',
    studentId: 'mock-student-1',
    enrollmentId: 'mock-enrollment-2',
    packageMonths: 3,
    monthlyFee: 800_000,
    receiptNumber: 'PT-1057',
    fallbackSlots: [],
  },
  {
    id: 'mock-order-3',
    studentId: 'mock-student-1',
    enrollmentId: 'mock-enrollment-3',
    packageMonths: 6,
    monthlyFee: 700_000,
    receiptNumber: 'PT-0964',
    fallbackSlots: [
      { weekday: 3, startTime: '19:45', endTime: '21:15' },
      { weekday: 7, startTime: '09:45', endTime: '11:15' },
    ],
    startDay: -60,
  },
  {
    id: 'mock-order-4',
    studentId: 'mock-student-1',
    enrollmentId: 'mock-enrollment-4',
    packageMonths: 2,
    monthlyFee: 900_000,
    receiptNumber: 'PT-0741',
    fallbackSlots: [
      { weekday: 2, startTime: '08:00', endTime: '09:30' },
      { weekday: 5, startTime: '08:00', endTime: '09:30' },
    ],
  },
  {
    id: 'mock-order-6',
    studentId: 'mock-student-2',
    enrollmentId: 'mock-enrollment-5',
    packageMonths: 3,
    monthlyFee: 1_000_000,
    receiptNumber: 'PT-0893',
    fallbackSlots: [],
  },
];

const DRAFT_ORDERS: readonly DraftOrderTemplate[] = [
  {
    id: 'mock-order-5',
    studentId: 'mock-student-1',
    className: 'Hình học 8 bổ trợ',
    programName: 'Toán 8 – Hình học bổ trợ',
    subject: 'Toán',
    packageMonths: 2,
    monthlyFee: 600_000,
    weeklySlots: [{ weekday: 7, startTime: '14:00', endTime: '15:30' }],
    startDay: 6,
    createdDay: -1,
  },
];

/** Du lieu chung cua don da thu tien va don nhap truoc khi doi sang hop dong BE. */
type OrderSeed = OrderTemplate & {
  className: string;
  programName: string;
  subject: string;
  weeklySlots: readonly WeeklySlot[];
  startDate: Date;
  endDate: Date;
  /** Ngay nhan vien lap don. Don da thu tien thi xac nhan trong cung ngay. */
  createdDate: Date;
  paid:
    | (Pick<PaidOrderTemplate, 'enrollmentId' | 'receiptNumber'> & {
        enrollmentStatus: MockEnrollmentRow['status'];
      })
    | null;
};

/** Giong `addCalendarMonths` cua BE: thang dich thieu ngay tuong ung thi lay ngay cuoi thang. */
function addCalendarMonths(date: Date, months: number): Date {
  const targetFirst = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0).getDate();
  return new Date(
    targetFirst.getFullYear(),
    targetFirst.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

/** Cot `@db.Date` cua Prisma ra JSON la 00:00 UTC cua ngay do. */
function toDateColumn(date: Date): string {
  return `${toDateKey(date)}T00:00:00.000Z`;
}

/** Giong `dateOnly` cua BE: bien lai tra ngay dang `YYYY-MM-DD`. */
function toDateOnly(dateColumn: string): string {
  return dateColumn.slice(0, DATE_KEY_LENGTH);
}

function atTime(date: Date, [hours, minutes]: readonly [number, number]): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  ).toISOString();
}

/**
 * Ky hoc cua don da thu tien. Mon da ket thuc khong co ngay bat dau trong lich gia nen tinh nguoc tu
 * `endDate` cua mock mon hoc, de ngay het han khop voi the mon hoc.
 */
function resolvePaidTerm(
  { packageMonths, startDay }: PaidOrderTemplate,
  enrollment: MockEnrollment,
  today: Date,
): Pick<OrderSeed, 'startDate' | 'endDate'> {
  const resolvedStartDay = CLASS_START_DAYS[enrollment.className] ?? startDay;
  if (resolvedStartDay !== undefined) {
    const startDate = addDays(today, resolvedStartDay);
    return { startDate, endDate: addCalendarMonths(startDate, packageMonths) };
  }

  const endDate = (enrollment.endDate ? parseDateKey(enrollment.endDate) : null) ?? today;
  return { startDate: addCalendarMonths(endDate, -packageMonths), endDate };
}

function toPaidSeed(
  template: PaidOrderTemplate,
  enrollment: MockEnrollment,
  today: Date,
): OrderSeed {
  const term = resolvePaidTerm(template, enrollment, today);
  return {
    ...template,
    ...term,
    className: enrollment.className,
    programName: enrollment.programName,
    subject: enrollment.subjectName,
    weeklySlots:
      enrollment.weeklySlots.length > 0 ? enrollment.weeklySlots : template.fallbackSlots,
    createdDate: addDays(term.startDate, -PAYMENT_LEAD_DAYS),
    paid: {
      enrollmentId: template.enrollmentId,
      receiptNumber: template.receiptNumber,
      enrollmentStatus: enrollment.status,
    },
  };
}

function toDraftSeed(template: DraftOrderTemplate, today: Date): OrderSeed {
  const startDate = addDays(today, template.startDay);
  return {
    ...template,
    startDate,
    endDate: addCalendarMonths(startDate, template.packageMonths),
    createdDate: addDays(today, template.createdDay),
    paid: null,
  };
}

function buildSeeds(studentId: string, now: Date): OrderSeed[] {
  const today = startOfDay(now);
  const enrollments = buildMockEnrollments(studentId, now);

  const paidSeeds = PAID_ORDERS.filter((template) => template.studentId === studentId).flatMap(
    (template) => {
      const enrollment = enrollments.find(({ id }) => id === template.enrollmentId);
      return enrollment ? [toPaidSeed(template, enrollment, today)] : [];
    },
  );
  const draftSeeds = DRAFT_ORDERS.filter((template) => template.studentId === studentId).map(
    (template) => toDraftSeed(template, today),
  );
  return [...paidSeeds, ...draftSeeds];
}

function toClass(seed: OrderSeed, grade: number): MockClass {
  const classId = `mock-class-${seed.id}`;
  const programId = `mock-program-${seed.id}`;
  return {
    id: classId,
    programId,
    name: seed.className,
    capacity: CLASS_CAPACITY,
    isOpen: true,
    monthlyFee: String(seed.monthlyFee),
    teacherId: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    program: {
      id: programId,
      name: seed.programName,
      subject: seed.subject,
      grade,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    weeklySchedules: seed.weeklySlots.map((slot, index) => ({
      ...slot,
      id: `${classId}-schedule-${index + 1}`,
      classId,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    })),
  };
}

function toRegistration(seed: OrderSeed, student: MockStudent): MockRegistration {
  const classroom = toClass(seed, student.grade);
  const quotedAmount = String(seed.monthlyFee * seed.packageMonths);
  const createdAt = atTime(seed.createdDate, ORDER_CREATED_TIME);
  const confirmedAt = seed.paid ? atTime(seed.createdDate, PAYMENT_CONFIRMED_TIME) : null;
  const startDate = toDateColumn(seed.startDate);
  const endDate = toDateColumn(seed.endDate);
  const hasEnded = seed.paid?.enrollmentStatus === 'ENDED';

  return {
    id: seed.id,
    type: 'EXISTING_STUDENT_NEW_SUBJECT',
    parentEmail: findUserById(student.parentUserId)?.email ?? '',
    parentPhone: null,
    studentFullName: student.fullName,
    studentGrade: student.grade,
    targetStudentId: student.id,
    classId: classroom.id,
    packageMonths: seed.packageMonths,
    quotedAmount,
    currency: CURRENCY,
    startDate,
    endDate,
    status: seed.paid ? 'COMPLETED' : 'DRAFT',
    createdByManagerId: STAFF_USER_ID,
    confirmedAt,
    linkedAt: confirmedAt,
    createdAt,
    updatedAt: confirmedAt ?? createdAt,
    targetStudent: { id: student.id, fullName: student.fullName, grade: student.grade },
    class: classroom,
    payment:
      seed.paid && confirmedAt
        ? {
            id: `mock-payment-${seed.id}`,
            registrationOrderId: seed.id,
            amount: quotedAmount,
            currency: CURRENCY,
            status: 'CONFIRMED',
            confirmedByManagerId: STAFF_USER_ID,
            confirmedAt,
            receiptNumber: seed.paid.receiptNumber,
            createdAt: confirmedAt,
          }
        : null,
    enrollment:
      seed.paid && confirmedAt
        ? {
            id: seed.paid.enrollmentId,
            registrationOrderId: seed.id,
            studentProfileId: student.id,
            classId: classroom.id,
            packageMonths: seed.packageMonths,
            status: seed.paid.enrollmentStatus,
            startDate,
            endDate,
            activatedAt: confirmedAt,
            endedAt: hasEnded ? seed.endDate.toISOString() : null,
            createdAt: confirmedAt,
            updatedAt: hasEnded ? seed.endDate.toISOString() : confirmedAt,
          }
        : null,
  };
}

function byNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** Moi don dang ky cua hoc sinh, moi lap truoc. */
export function buildMockRegistrations(
  student: MockStudent,
  now: Date = new Date(),
): MockRegistration[] {
  return buildSeeds(student.id, now)
    .map((seed) => toRegistration(seed, student))
    .sort(byNewest);
}

/** Ghi danh cua hoc sinh kem lop va thanh toan, moi tao truoc nhu `orderBy createdAt desc` cua BE. */
export function buildMockTuitionEnrollments(
  student: MockStudent,
  now: Date = new Date(),
): MockTuitionEnrollment[] {
  return buildMockRegistrations(student, now)
    .flatMap(({ enrollment, class: classroom, payment, targetStudent: _student, ...order }) =>
      enrollment
        ? [{ ...enrollment, class: classroom, registrationOrder: { ...order, payment } }]
        : [],
    )
    .sort(byNewest);
}

/** Tim don theo id tren moi hoc sinh, de route tu kiem tra quyen so huu nhu BE. */
export function findMockRegistration(
  registrationId: string,
  now: Date = new Date(),
): MockRegistration | undefined {
  const template = [...PAID_ORDERS, ...DRAFT_ORDERS].find(({ id }) => id === registrationId);
  const student = template ? findStudentById(template.studentId) : undefined;
  if (!student) return undefined;
  return buildMockRegistrations(student, now).find(({ id }) => id === registrationId);
}

/** Giong `receiptResponse` cua BE. null khi don chua xac nhan thu tien. */
export function toMockReceipt(order: MockRegistration, now: Date = new Date()): MockReceipt | null {
  if (!order.payment) return null;

  const { program, weeklySchedules } = order.class;
  return {
    registrationId: order.id,
    status: order.status,
    parentEmail: order.parentEmail,
    student: { fullName: order.studentFullName, grade: order.studentGrade },
    class: {
      id: order.class.id,
      name: order.class.name,
      subject: program.subject,
      grade: program.grade,
      schedules: weeklySchedules,
    },
    term: {
      packageMonths: order.packageMonths,
      startDate: toDateOnly(order.startDate),
      endDate: toDateOnly(order.endDate),
      // BE chi phan biet ngay bat dau o tuong lai hay khong, khong bao ky da het han
      label: order.startDate > toDateColumn(startOfDay(now)) ? 'Sắp học' : 'Đang học',
    },
    payment: {
      id: order.payment.id,
      receiptNumber: order.payment.receiptNumber,
      amount: Number(order.payment.amount),
      currency: order.payment.currency,
      confirmedAt: order.payment.confirmedAt,
    },
    enrollment: order.enrollment
      ? { id: order.enrollment.id, status: order.enrollment.status }
      : null,
    quotedAmount: Number(order.quotedAmount),
    currency: order.currency,
  };
}
