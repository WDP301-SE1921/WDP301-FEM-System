import {
  findRoomName,
  getCurrentClass,
  getTermRange,
  isEnrollmentSession,
  toAttendanceRecords,
  toEnrollmentLessons,
  toScoreSummary,
  toSessionDetail,
  toStudentAssignment,
  toStudentEnrollments,
  toStudentSchedule,
} from '@/features/parent-dashboard/api/parent-data-mappers';
import type {
  AssignmentListItem,
  AssignmentListRecipient,
  AttendanceHistoryItem,
  CurriculumUnit,
  GradeHistoryItem,
  LeaveRequest,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  SessionParticipation,
  TuitionClass,
  TuitionEnrollment,
} from '@/features/parent-dashboard/types';

/** Gio dia phuong, de ngay hoc khong doi theo mui gio cua may chay test. */
function at(month: number, day: number, hours = 18, minutes = 0, year = 2026): string {
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

/** Cot ngay cua Prisma: 00:00 UTC cua ngay do. */
function dateColumn(key: string): string {
  return `${key}T00:00:00.000Z`;
}

const TEACHER = { id: 'teacher-1', displayName: 'Đặng Hải Yến' };

const MATH_CLASS: TuitionClass = {
  id: 'class-math',
  name: 'Toán nâng cao 8A2',
  roomId: null,
  program: { name: 'Toán 8 – Chuyên đề nâng cao', subject: 'Toán', grade: 8 },
  weeklySchedules: [
    { weekday: 2, startTime: '18:00', endTime: '19:30' },
    { weekday: 5, startTime: '18:00', endTime: '19:30' },
  ],
  teacher: TEACHER,
};
const MATH_CLASS_B: TuitionClass = {
  ...MATH_CLASS,
  id: 'class-math-b',
  name: 'Toán nâng cao 8B1',
  teacher: { id: 'teacher-2', displayName: 'Lê Minh Quân' },
};
const ENGLISH_CLASS: TuitionClass = {
  id: 'class-english',
  name: 'Tiếng Anh 6A1',
  roomId: 'room-b201',
  program: { name: 'Tiếng Anh 6 – Giao tiếp', subject: 'Tiếng Anh', grade: 6 },
  weeklySchedules: [{ weekday: 3, startTime: '17:45', endTime: '19:15' }],
  teacher: null,
};

function enrollment(overrides: Partial<TuitionEnrollment> = {}): TuitionEnrollment {
  return {
    id: 'enrollment-math',
    registrationOrderId: 'order-math',
    packageMonths: 3,
    status: 'ACTIVE',
    // Ky hoc tu 05/10 toi het 04/01
    startDate: dateColumn('2026-10-05'),
    endDate: dateColumn('2027-01-05'),
    activatedAt: at(10, 2, 9),
    class: MATH_CLASS,
    placements: [],
    registrationOrder: { payment: null },
    ...overrides,
  };
}

function session(id: string, startsAt: string, overrides: Partial<ScheduledSession> = {}) {
  const start = new Date(startsAt);
  const scheduled: ScheduledSession = {
    id,
    classId: MATH_CLASS.id,
    startsAt,
    endsAt: new Date(start.getTime() + 90 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
    cancelReason: null,
    class: { name: MATH_CLASS.name, program: { grade: 8, subject: 'Toán' } },
    teacher: TEACHER,
    room: null,
    lesson: { id: `lesson-${id}`, title: `Bài của buổi ${id}`, kind: 'LESSON' },
    participations: [],
    ...overrides,
  };
  return scheduled;
}

function participation(overrides: Partial<SessionParticipation> = {}): SessionParticipation {
  return {
    enrollmentId: 'enrollment-math',
    kind: 'REGULAR',
    attendance: 'UNMARKED',
    ...overrides,
  };
}

const ENGLISH_SESSION = session('english-1', at(10, 7, 17, 45), {
  classId: ENGLISH_CLASS.id,
  class: { name: ENGLISH_CLASS.name, program: { grade: 6, subject: 'Tiếng Anh' } },
});

/** Con hoc bu buoi Toan o lop 8B1. */
const MAKEUP_SESSION = session('bu-8b1', at(10, 10, 9), {
  classId: MATH_CLASS_B.id,
  class: { name: MATH_CLASS_B.name, program: { grade: 8, subject: 'Toán' } },
  participations: [participation({ kind: 'MAKEUP' })],
});

const ROOMS: Room[] = [
  { id: 'room-a101', name: 'Phòng A101' },
  { id: 'room-b201', name: 'Phòng B201' },
];

describe('features/parent-dashboard/api/parent-data-mappers', () => {
  describe('isEnrollmentSession', () => {
    it.each([
      ['ngay bat dau ky hoc', at(10, 5), true],
      ['giua ky hoc', at(11, 20), true],
      ['ngay cuoi ky hoc', at(1, 4, 18, 0, 2027), true],
      ['truoc ngay bat dau', at(10, 4), false],
      ['ngay het han khong thuoc ky hoc', at(1, 5, 18, 0, 2027), false],
    ])('buoi vao %s', (_case, startsAt, expected) => {
      expect(isEnrollmentSession(session('s', startsAt), enrollment())).toBe(expected);
    });

    it('buoi cua lop khac, ghi danh da ket thuc hoac chua co ngay thi khong thuoc ghi danh', () => {
      const inTerm = session('s', at(10, 6));

      expect(isEnrollmentSession(ENGLISH_SESSION, enrollment())).toBe(false);
      expect(isEnrollmentSession(inTerm, enrollment({ status: 'ENDED' }))).toBe(false);
      expect(isEnrollmentSession(inTerm, enrollment({ startDate: null, endDate: null }))).toBe(
        false,
      );
    });

    it('chuyen lop: buoi tinh theo lop con hoc luc do', () => {
      const transferred = enrollment({
        placements: [
          {
            classId: MATH_CLASS.id,
            effectiveFrom: at(10, 5, 0),
            effectiveTo: at(11, 2, 0),
            class: MATH_CLASS,
          },
          {
            classId: MATH_CLASS_B.id,
            effectiveFrom: at(11, 2, 0),
            effectiveTo: null,
            class: MATH_CLASS_B,
          },
        ],
      });
      const inNewClass = { classId: MATH_CLASS_B.id };

      expect(isEnrollmentSession(session('truoc', at(10, 30)), transferred)).toBe(true);
      expect(isEnrollmentSession(session('sau', at(11, 3)), transferred)).toBe(false);
      expect(isEnrollmentSession(session('truoc', at(10, 30), inNewClass), transferred)).toBe(
        false,
      );
      expect(isEnrollmentSession(session('sau', at(11, 3), inNewClass), transferred)).toBe(true);
    });

    it('co cho cua con trong buoi thi theo ghi danh cua cho do, ke ca buoi hoc bu o lop khac', () => {
      expect(isEnrollmentSession(MAKEUP_SESSION, enrollment())).toBe(true);
      expect(isEnrollmentSession(MAKEUP_SESSION, enrollment({ id: 'enrollment-khac' }))).toBe(
        false,
      );
    });
  });

  describe('toStudentSchedule', () => {
    it('giu thu tu cua BE, lay giao vien va phong cua buoi, danh dau buoi hoc bu', () => {
      const sessions = [
        session('math-1', at(10, 6), { room: ROOMS[0] ?? null }),
        session('math-2', at(10, 9), {
          lesson: { id: 'lesson-test', title: 'Kiểm tra tháng 10', kind: 'MONTHLY_TEST' },
          teacher: { id: 'teacher-3', displayName: null },
        }),
        MAKEUP_SESSION,
      ];

      expect(toStudentSchedule(sessions)).toEqual([
        {
          id: 'math-1',
          className: 'Toán nâng cao 8A2',
          subjectName: 'Toán',
          startsAt: at(10, 6),
          endsAt: at(10, 6, 19, 30),
          room: 'Phòng A101',
          teacherName: 'Đặng Hải Yến',
          type: 'REGULAR',
          topic: 'Bài của buổi math-1',
          note: null,
        },
        expect.objectContaining({
          id: 'math-2',
          topic: 'Kiểm tra tháng 10',
          type: 'REGULAR',
          teacherName: null,
        }),
        expect.objectContaining({ id: 'bu-8b1', className: 'Toán nâng cao 8B1', type: 'MAKEUP' }),
      ]);
    });

    it('buoi trung tam da huy van hien, kem ly do huy; buoi hoc bu bi huy cung la buoi huy', () => {
      const [cancelled, cancelledMakeup] = toStudentSchedule([
        session('huy', at(10, 13), { status: 'CANCELLED', cancelReason: 'Giáo viên ốm' }),
        { ...MAKEUP_SESSION, status: 'CANCELLED', cancelReason: 'Mất điện' },
      ]);

      expect(cancelled).toMatchObject({ id: 'huy', type: 'CANCELLED', note: 'Giáo viên ốm' });
      expect(cancelledMakeup).toMatchObject({ type: 'CANCELLED', note: 'Mất điện' });
    });
  });

  describe('findRoomName', () => {
    it('tim ten phong theo id; khong co phong hoac phong la thi null', () => {
      expect(findRoomName(ROOMS, 'room-b201')).toBe('Phòng B201');
      expect(findRoomName(ROOMS, null)).toBeNull();
      expect(findRoomName(ROOMS, 'room-khong-co')).toBeNull();
    });
  });

  describe('toSessionDetail', () => {
    const detail: ScheduledSessionDetail = {
      id: 'math-1',
      classId: MATH_CLASS.id,
      startsAt: at(10, 6),
      endsAt: at(10, 6, 19, 30),
      status: 'COMPLETED',
      summary: 'Cả lớp làm tốt phần luyện tập.',
      cancelReason: null,
      class: { name: MATH_CLASS.name, program: { subject: 'Toán' } },
      teacher: TEACHER,
      room: { id: 'room-a101', name: 'Phòng A101' },
      lesson: { id: 'lesson-1', title: 'Phương trình bậc nhất', kind: 'LESSON' },
      participation: participation({ attendance: 'PRESENT' }),
    };

    it('lay giao vien, phong cua buoi, ghi chu cua giao vien va ket qua diem danh cua con', () => {
      expect(toSessionDetail(detail)).toEqual({
        id: 'math-1',
        className: 'Toán nâng cao 8A2',
        subjectName: 'Toán',
        startsAt: at(10, 6),
        endsAt: at(10, 6, 19, 30),
        room: 'Phòng A101',
        teacherName: 'Đặng Hải Yến',
        type: 'REGULAR',
        topic: 'Phương trình bậc nhất',
        note: null,
        status: 'COMPLETED',
        lesson: { sequence: null, title: 'Phương trình bậc nhất', description: null },
        attendance: 'PRESENT',
        checkedInAt: null,
        teacherComment: 'Cả lớp làm tốt phần luyện tập.',
        materials: [],
      });
    });

    it('buoi chua xep phong, chua co danh sach diem danh, giao vien khong ghi chu', () => {
      expect(
        toSessionDetail({ ...detail, room: null, participation: null, summary: '' }),
      ).toMatchObject({ room: null, attendance: null, teacherComment: null });
    });

    it('buoi hoc bu va buoi da huy', () => {
      expect(
        toSessionDetail({
          ...detail,
          participation: participation({ kind: 'MAKEUP', attendance: 'PRESENT' }),
        }),
      ).toMatchObject({ type: 'MAKEUP', attendance: 'PRESENT' });
      expect(
        toSessionDetail({
          ...detail,
          status: 'CANCELLED',
          cancelReason: 'Giáo viên ốm',
          participation: null,
        }),
      ).toMatchObject({
        type: 'CANCELLED',
        status: 'CANCELLED',
        note: 'Giáo viên ốm',
        attendance: null,
      });
    });
  });

  describe('getCurrentClass', () => {
    const placements = [
      {
        classId: MATH_CLASS.id,
        effectiveFrom: at(10, 5, 0),
        effectiveTo: at(11, 2, 0),
        class: MATH_CLASS,
      },
      {
        classId: MATH_CLASS_B.id,
        effectiveFrom: at(11, 2, 0),
        effectiveTo: null,
        class: MATH_CLASS_B,
      },
    ];

    it('khong co lan xep lop thi la lop luc dang ky', () => {
      expect(getCurrentClass(enrollment())).toBe(MATH_CLASS);
    });

    it('lay lop cua lan xep dang hieu luc; chua toi ngay nao thi lay lan xep gan nhat', () => {
      const transferred = enrollment({ class: ENGLISH_CLASS, placements });

      expect(getCurrentClass(transferred, new Date(at(10, 20)))).toBe(MATH_CLASS);
      expect(getCurrentClass(transferred, new Date(at(11, 20)))).toBe(MATH_CLASS_B);
      expect(getCurrentClass(transferred, new Date(at(9, 1)))).toBe(MATH_CLASS_B);
    });
  });

  describe('getTermRange', () => {
    it('ky hoc khong gom ngay het han', () => {
      expect(getTermRange(enrollment())).toEqual({ from: '2026-10-05', to: '2027-01-04' });
    });

    it('thieu ngay hoac ngay het han khong sau ngay bat dau thi tra null', () => {
      expect(getTermRange(enrollment({ endDate: null }))).toBeNull();
      expect(getTermRange(enrollment({ endDate: dateColumn('2026-10-05') }))).toBeNull();
    });
  });

  describe('toStudentEnrollments', () => {
    const now = new Date(at(10, 20, 12));
    const upcomingSessions = [
      session('da-qua', at(10, 20, 8)),
      ENGLISH_SESSION,
      session('bi-huy', at(10, 22), { status: 'CANCELLED', cancelReason: 'Nghỉ lễ' }),
      session('tiep-theo', at(10, 23)),
      session('sau-do', at(10, 27)),
    ];
    const sources = { pauses: [], rooms: ROOMS, subjectGrades: [], now };

    it('mon dang hoc: lop, giao vien, lich co dinh, so buoi theo lich va buoi tiep theo chua huy', () => {
      const [course] = toStudentEnrollments({
        ...sources,
        enrollments: [enrollment()],
        upcomingSessions,
        subjectGrades: [
          { subject: 'Tiếng Anh', count: 1, averageOutOf10: 6 },
          { subject: 'Toán', count: 3, averageOutOf10: 8.33 },
        ],
      });

      expect(course).toEqual({
        id: 'enrollment-math',
        status: 'ACTIVE',
        pause: null,
        programName: 'Toán 8 – Chuyên đề nâng cao',
        subjectName: 'Toán',
        className: 'Toán nâng cao 8A2',
        teacherName: 'Đặng Hải Yến',
        room: null,
        weeklySlots: MATH_CLASS.weeklySchedules,
        // Thu Ba va thu Sau tu 05/10: 06, 09, 13, 16 truoc ngay 20/10
        completedSessions: 4,
        totalSessions: 26,
        averageScore: 8.33,
        nextSession: { id: 'tiep-theo', startsAt: at(10, 23) },
        endDate: '2027-01-05',
      });
    });

    it('don bao luu dang hieu luc cua dung ghi danh thanh tam nghi', () => {
      const pause: LeaveRequest = {
        id: 'leave-1',
        enrollmentId: 'enrollment-math',
        kind: 'PERIOD_PAUSE',
        sessionId: null,
        fromDate: dateColumn('2026-10-15'),
        toDate: dateColumn('2026-11-15'),
        reason: 'Con ôn thi học kỳ ở trường',
        status: 'APPROVED',
      };
      const courses = toStudentEnrollments({
        ...sources,
        enrollments: [enrollment(), enrollment({ id: 'enrollment-other' })],
        pauses: [pause],
        upcomingSessions: [],
      });

      expect(courses.map((course) => course.pause)).toEqual([
        { fromDate: '2026-10-15', toDate: '2026-11-15' },
        null,
      ]);
    });

    it('ghi danh het han hoac da ket thuc thi la ENDED, khong co buoi tiep theo va bao luu', () => {
      const afterTerm = new Date(at(1, 10, 12, 0, 2027));
      const [expired, ended] = toStudentEnrollments({
        ...sources,
        enrollments: [enrollment(), enrollment({ id: 'enrollment-ended', status: 'ENDED' })],
        upcomingSessions: [session('con-lich', at(1, 12, 18, 0, 2027))],
        now: afterTerm,
      });

      expect(expired).toMatchObject({ status: 'ENDED', nextSession: null, completedSessions: 26 });
      expect(ended).toMatchObject({ status: 'ENDED', nextSession: null });
    });

    it('chuyen lop thi hien lop, giao vien va phong cua lop con dang hoc', () => {
      const [course] = toStudentEnrollments({
        ...sources,
        enrollments: [
          enrollment({
            placements: [
              {
                classId: ENGLISH_CLASS.id,
                effectiveFrom: at(10, 5, 0),
                effectiveTo: null,
                class: ENGLISH_CLASS,
              },
            ],
          }),
        ],
        upcomingSessions: [],
      });

      expect(course).toMatchObject({
        className: 'Tiếng Anh 6A1',
        room: 'Phòng B201',
        teacherName: null,
        averageScore: null,
      });
    });

    it('buoi hoc bu o lop khac cung la buoi tiep theo cua mon', () => {
      const [course] = toStudentEnrollments({
        ...sources,
        enrollments: [enrollment()],
        upcomingSessions: [{ ...MAKEUP_SESSION, startsAt: at(10, 21, 9) }, ...upcomingSessions],
      });

      expect(course?.nextSession).toEqual({ id: 'bu-8b1', startsAt: at(10, 21, 9) });
    });
  });

  describe('toEnrollmentLessons', () => {
    const now = new Date(at(10, 20, 12));
    const sessions = [
      session('buoi-3', at(10, 13), {
        lesson: { id: 'lesson-test', title: 'Kiểm tra tháng 10', kind: 'MONTHLY_TEST' },
      }),
      ENGLISH_SESSION,
      session('buoi-1', at(10, 6), {
        status: 'COMPLETED',
        lesson: { id: 'lesson-1', title: 'Bài của buổi buoi-1', kind: 'LESSON' },
      }),
      session('buoi-2', at(10, 9), {
        lesson: { id: 'lesson-2', title: 'Bài của buổi buoi-2', kind: 'LESSON' },
      }),
      session('ngoai-ky', at(10, 2)),
      // Buoi hoc bu day lai bai cua buoi vang, khong them bai moi
      MAKEUP_SESSION,
      // Buoi bi huy khong day bai nao
      session('bi-huy', at(10, 16), { status: 'CANCELLED', cancelReason: 'Nghỉ lễ' }),
    ];

    function unit(overrides: Partial<CurriculumUnit> = {}): CurriculumUnit {
      return {
        id: 'unit-10',
        title: 'Tháng 10',
        programId: 'program-math-8',
        fromDate: dateColumn('2026-10-01'),
        toDate: dateColumn('2026-10-31'),
        version: 1,
        program: { subject: 'Toán', grade: 8 },
        classes: [{ id: MATH_CLASS.id, name: MATH_CLASS.name }],
        lessons: [
          { id: 'lesson-2', title: 'Hằng đẳng thức', sequence: 2, kind: 'LESSON', monthKey: null },
          { id: 'lesson-1', title: 'Đơn thức', sequence: 1, kind: 'LESSON', monthKey: null },
          {
            id: 'lesson-test',
            title: 'Kiểm tra tháng 10',
            sequence: 3,
            kind: 'MONTHLY_TEST',
            monthKey: '2026-10',
          },
        ],
        ...overrides,
      };
    }

    it('lop chua co hoc phan: moi buoi trong ky la mot bai theo gio hoc', () => {
      expect(toEnrollmentLessons({ enrollment: enrollment(), sessions, units: [], now })).toEqual([
        {
          id: 'buoi-1',
          sequence: 1,
          title: 'Bài của buổi buoi-1',
          description: null,
          kind: 'LESSON',
          session: { id: 'buoi-1', startsAt: at(10, 6), status: 'COMPLETED' },
          assignment: null,
        },
        expect.objectContaining({ id: 'buoi-2', sequence: 2, kind: 'LESSON' }),
        expect.objectContaining({ id: 'buoi-3', sequence: 3, kind: 'ASSESSMENT' }),
      ]);
    });

    it('co hoc phan: bai theo thu tu hoc phan, kem buoi day bai, ca bai chua xep buoi', () => {
      const units = [
        unit(),
        unit({
          id: 'unit-11',
          title: 'Tháng 11',
          fromDate: dateColumn('2026-11-01'),
          toDate: dateColumn('2026-11-30'),
          lessons: [
            { id: 'lesson-4', title: 'Phân thức', sequence: 1, kind: 'LESSON', monthKey: null },
          ],
        }),
        // Hoc phan cua lop khac cung chuong trinh
        unit({ id: 'unit-khac', classes: [{ id: 'class-khac', name: 'Toán 8C' }] }),
      ];

      const lessons = toEnrollmentLessons({ enrollment: enrollment(), sessions, units, now });

      expect(lessons).toEqual([
        {
          id: 'lesson-1',
          sequence: 1,
          title: 'Đơn thức',
          description: null,
          kind: 'LESSON',
          session: { id: 'buoi-1', startsAt: at(10, 6), status: 'COMPLETED' },
          assignment: null,
        },
        expect.objectContaining({ id: 'lesson-2', sequence: 2, session: expect.anything() }),
        expect.objectContaining({ id: 'lesson-test', sequence: 3, kind: 'ASSESSMENT' }),
        expect.objectContaining({ id: 'lesson-4', sequence: 4, session: null }),
      ]);
    });

    it('bai trung giua hai phien ban hoc phan chi hien mot lan', () => {
      const lessons = toEnrollmentLessons({
        enrollment: enrollment(),
        sessions: [],
        units: [unit(), unit({ id: 'unit-10-v2', version: 2 })],
        now,
      });

      expect(lessons.map(({ id }) => id)).toEqual(['lesson-1', 'lesson-2', 'lesson-test']);
    });
  });

  describe('toStudentAssignment', () => {
    function recipient(overrides: Partial<AssignmentListRecipient> = {}): AssignmentListRecipient {
      return {
        id: 'recipient-1',
        enrollmentId: 'enrollment-math',
        studentId: 'student-1',
        latestSubmission: null,
        ...overrides,
      };
    }

    function item(overrides: Partial<AssignmentListItem> = {}): AssignmentListItem {
      return {
        id: 'assignment-1',
        classId: MATH_CLASS.id,
        kind: 'TEST',
        testType: 'FIFTEEN_MINUTES',
        title: 'Bài tập về nhà bài 10',
        dueAt: at(10, 25, 23, 59),
        status: 'PUBLISHED',
        maxAttempts: 2,
        class: { id: MATH_CLASS.id, name: MATH_CLASS.name, program: { subject: 'Toán', grade: 8 } },
        questionCounts: { multipleChoice: 1, essay: 1, total: 2 },
        maxScore: 10,
        recipients: [recipient()],
        ...overrides,
      };
    }

    it('chua nop: lay lop, mon tu bai, giao vien tu ghi danh cua con, so cau theo loai', () => {
      expect(
        toStudentAssignment({ item: item(), studentId: 'student-1', enrollments: [enrollment()] }),
      ).toEqual({
        id: 'assignment-1',
        testType: 'FIFTEEN_MINUTES',
        title: 'Bài tập về nhà bài 10',
        subjectName: 'Toán',
        className: 'Toán nâng cao 8A2',
        teacherName: 'Đặng Hải Yến',
        dueAt: at(10, 25, 23, 59),
        maxAttempts: 2,
        questionCounts: { MULTIPLE_CHOICE: 1, ESSAY: 1 },
        submission: null,
        grade: null,
      });
    });

    it('lay lan nop moi nhat cua con va diem da cong bo cua lan do', () => {
      const assignment = item({
        recipients: [
          recipient({ id: 'recipient-sibling', studentId: 'student-2' }),
          recipient({
            latestSubmission: {
              id: 'submission-2',
              attemptNo: 2,
              submittedAt: at(10, 22),
              publishedGrade: { totalScore: 8.5, feedback: '', publishedAt: at(10, 24) },
            },
          }),
        ],
      });

      expect(
        toStudentAssignment({ item: assignment, studentId: 'student-1', enrollments: [] }),
      ).toMatchObject({
        teacherName: null,
        submission: { attemptNo: 2, submittedAt: at(10, 22) },
        grade: { totalScore: 8.5, maxScore: 10, feedback: null, publishedAt: at(10, 24) },
      });
    });

    it('da nop nhung chua cong bo diem thi chua co diem', () => {
      const assignment = item({
        recipients: [
          recipient({
            latestSubmission: {
              id: 'submission-1',
              attemptNo: 1,
              submittedAt: at(10, 21),
              publishedGrade: null,
            },
          }),
        ],
      });

      expect(
        toStudentAssignment({ item: assignment, studentId: 'student-1', enrollments: [] }),
      ).toMatchObject({ submission: { attemptNo: 1 }, grade: null });
    });

    it('bai khong giao cho con nay thi tra null', () => {
      expect(
        toStudentAssignment({ item: item(), studentId: 'student-khac', enrollments: [] }),
      ).toBeNull();
    });

    it('bai cua lop con da hoc truoc khi chuyen lop thi lay giao vien lop do', () => {
      const transferred = enrollment({
        class: MATH_CLASS_B,
        placements: [
          {
            classId: MATH_CLASS.id,
            effectiveFrom: at(10, 5, 0),
            effectiveTo: at(11, 2, 0),
            class: MATH_CLASS,
          },
        ],
      });

      expect(
        toStudentAssignment({ item: item(), studentId: 'student-1', enrollments: [transferred] }),
      ).toMatchObject({ className: 'Toán nâng cao 8A2', teacherName: 'Đặng Hải Yến' });
    });
  });

  describe('toAttendanceRecords', () => {
    function historyItem(
      sessionId: string,
      startsAt: string,
      overrides: Partial<AttendanceHistoryItem> = {},
    ): AttendanceHistoryItem {
      return {
        enrollmentId: 'enrollment-math',
        effectiveStatus: 'PRESENT',
        session: {
          id: sessionId,
          classId: MATH_CLASS.id,
          startsAt,
          endsAt: new Date(new Date(startsAt).getTime() + 90 * 60 * 1000).toISOString(),
        },
        class: { name: MATH_CLASS.name, program: { subject: 'Toán' } },
        approvedLeave: null,
        latestMakeup: null,
        ...overrides,
      };
    }

    const makeup = {
      id: 'makeup-1',
      status: 'BOOKED' as const,
      replacement: {
        sessionId: 'bu',
        session: { id: 'bu', startsAt: at(10, 12, 9), endsAt: at(10, 12, 10, 30) },
      },
    };
    const leave = { id: 'leave-1', kind: 'SINGLE_ABSENCE' as const, reason: 'Con bị sốt' };

    it('lay lop, mon cua buoi; buoi co mat khong kem don nghi hay hoc bu', () => {
      const records = toAttendanceRecords([
        historyItem('co-mat', at(10, 6), { approvedLeave: leave, latestMakeup: makeup }),
      ]);

      expect(records).toEqual([
        {
          sessionId: 'co-mat',
          className: 'Toán nâng cao 8A2',
          subjectName: 'Toán',
          startsAt: at(10, 6),
          endsAt: at(10, 6, 19, 30),
          status: 'PRESENT',
          leaveReason: null,
          makeup: null,
        },
      ]);
    });

    it('buoi vang kem ly do nghi va lich hoc bu chua huy moi nhat cua BE', () => {
      const [record] = toAttendanceRecords([
        historyItem('vang', at(10, 9), {
          effectiveStatus: 'ABSENT',
          approvedLeave: leave,
          latestMakeup: makeup,
        }),
      ]);

      expect(record).toMatchObject({
        status: 'ABSENT',
        leaveReason: 'Con bị sốt',
        makeup: { status: 'BOOKED', startsAt: at(10, 12, 9) },
      });
    });

    it('buoi da hoc bu va buoi nghi trong thoi gian tam nghi', () => {
      const [madeUp, excused] = toAttendanceRecords([
        historyItem('da-bu', at(10, 6), {
          effectiveStatus: 'MADE_UP',
          latestMakeup: { ...makeup, status: 'COMPLETED' },
        }),
        historyItem('tam-nghi', at(10, 20), {
          effectiveStatus: 'EXCUSED',
          approvedLeave: { id: 'pause-1', kind: 'PERIOD_PAUSE', reason: 'Con ôn thi học kỳ' },
        }),
      ]);

      expect(madeUp).toMatchObject({ makeup: { status: 'COMPLETED' }, leaveReason: null });
      expect(excused).toMatchObject({ status: 'EXCUSED', leaveReason: 'Con ôn thi học kỳ' });
    });
  });

  describe('toScoreSummary', () => {
    const now = new Date(at(10, 20, 12));

    function grade(scoreOutOf10: number | null, publishedAt: string | null): GradeHistoryItem {
      return {
        recipientId: 'recipient-1',
        assignment: {
          id: `assignment-${publishedAt}`,
          title: 'Bài',
          kind: 'HOMEWORK',
          testType: null,
          class: { id: MATH_CLASS.id, name: MATH_CLASS.name, program: { subject: 'Toán' } },
        },
        submissionId: 'submission-1',
        attemptNo: 1,
        totalScore: scoreOutOf10 ?? 0,
        maxScore: scoreOutOf10 === null ? 0 : 10,
        scoreOutOf10,
        feedback: '',
        publishedAt,
      };
    }

    it('chua co diem thi null', () => {
      expect(toScoreSummary([], now)).toBeNull();
      expect(toScoreSummary([grade(null, at(10, 2))], now)).toBeNull();
    });

    it('trung binh moi bai va chenh lech so voi trung binh toi het thang truoc', () => {
      const summary = toScoreSummary(
        [grade(9, at(10, 15)), grade(6, at(9, 28)), grade(8, at(9, 10)), grade(null, at(10, 1))],
        now,
      );

      expect(summary?.average).toBeCloseTo(23 / 3);
      expect(summary?.gradedCount).toBe(3);
      expect(summary?.changeFromLastMonth).toBeCloseTo(23 / 3 - 7);
    });

    it('thang truoc chua co diem thi khong co chenh lech', () => {
      expect(toScoreSummary([grade(9, at(10, 15))], now)).toEqual({
        average: 9,
        gradedCount: 1,
        changeFromLastMonth: null,
      });
    });
  });
});
