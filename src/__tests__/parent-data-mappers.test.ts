import {
  findRoomName,
  getCurrentClass,
  getStudentClassIds,
  getTermRange,
  isAttendedSession,
  isEnrollmentSession,
  toAttendanceRecords,
  toEnrollmentLessons,
  toSessionDetail,
  toStudentAssignment,
  toStudentEnrollments,
  toStudentSchedule,
} from '@/features/parent-dashboard/api/parent-data-mappers';
import type {
  AssignmentDetail,
  AttendanceHistoryItem,
  LeaveRequest,
  MakeupBooking,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  SessionParticipation,
  SubmissionRecord,
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

const MATH_CLASS: TuitionClass = {
  id: 'class-math',
  name: 'Toán nâng cao 8A2',
  roomId: null,
  program: { name: 'Toán 8 – Chuyên đề nâng cao', subject: 'Toán', grade: 8 },
  weeklySchedules: [
    { weekday: 2, startTime: '18:00', endTime: '19:30' },
    { weekday: 5, startTime: '18:00', endTime: '19:30' },
  ],
};
const MATH_CLASS_B: TuitionClass = { ...MATH_CLASS, id: 'class-math-b', name: 'Toán nâng cao 8B1' };
const ENGLISH_CLASS: TuitionClass = {
  id: 'class-english',
  name: 'Tiếng Anh 6A1',
  roomId: 'room-b201',
  program: { name: 'Tiếng Anh 6 – Giao tiếp', subject: 'Tiếng Anh', grade: 6 },
  weeklySchedules: [{ weekday: 3, startTime: '17:45', endTime: '19:15' }],
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
    class: { name: MATH_CLASS.name, program: { grade: 8, subject: 'Toán' } },
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
    cancelled: false,
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
      const moved = session('da-chuyen', at(10, 6), {
        participations: [participation({ cancelled: true })],
      });

      expect(isEnrollmentSession(MAKEUP_SESSION, enrollment())).toBe(true);
      expect(isEnrollmentSession(MAKEUP_SESSION, enrollment({ id: 'enrollment-khac' }))).toBe(
        false,
      );
      expect(isEnrollmentSession(moved, enrollment())).toBe(false);
    });
  });

  describe('isAttendedSession', () => {
    it('buoi chua co danh sach hoac con con cho thi con hoc; moi cho deu da huy thi khong', () => {
      expect(isAttendedSession(session('chua-co', at(10, 6)))).toBe(true);
      expect(isAttendedSession(MAKEUP_SESSION)).toBe(true);
      expect(
        isAttendedSession(
          session('huy', at(10, 6), { participations: [participation({ cancelled: true })] }),
        ),
      ).toBe(false);
    });
  });

  describe('toStudentSchedule', () => {
    it('giu thu tu cua BE, danh dau buoi hoc bu va bo buoi ma cho cua con da bi huy', () => {
      const sessions = [
        session('math-1', at(10, 6)),
        session('da-chuyen-lop', at(10, 7), {
          participations: [participation({ cancelled: true })],
        }),
        session('math-2', at(10, 9), {
          lesson: { id: 'lesson-test', title: 'Kiểm tra tháng 10', kind: 'MONTHLY_TEST' },
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
          room: null,
          teacherName: null,
          type: 'REGULAR',
          topic: 'Bài của buổi math-1',
          note: null,
        },
        expect.objectContaining({ id: 'math-2', topic: 'Kiểm tra tháng 10', type: 'REGULAR' }),
        expect.objectContaining({ id: 'bu-8b1', className: 'Toán nâng cao 8B1', type: 'MAKEUP' }),
      ]);
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
      roomId: 'room-a101',
      startsAt: at(10, 6),
      endsAt: at(10, 6, 19, 30),
      status: 'COMPLETED',
      summary: 'Cả lớp làm tốt phần luyện tập.',
      cancelReason: null,
      class: { name: MATH_CLASS.name, roomId: 'room-b201', program: { subject: 'Toán' } },
      teacher: { id: 'teacher-1', displayName: 'Đặng Hải Yến' },
      lesson: { id: 'lesson-1', title: 'Phương trình bậc nhất', kind: 'LESSON' },
      participation: participation({ attendance: 'PRESENT' }),
    };

    it('lay giao vien, phong cua buoi, ghi chu cua giao vien va ket qua diem danh cua con', () => {
      expect(toSessionDetail(detail, ROOMS)).toEqual({
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

    it('buoi chua co phong thi lay phong cua lop; chua co danh sach diem danh thi chua co ket qua', () => {
      expect(
        toSessionDetail({ ...detail, roomId: null, participation: null, summary: '' }, ROOMS),
      ).toMatchObject({ room: 'Phòng B201', attendance: null, teacherComment: null });
    });

    it('buoi hoc bu va buoi da huy', () => {
      expect(
        toSessionDetail(
          { ...detail, participation: participation({ kind: 'MAKEUP', attendance: 'PRESENT' }) },
          ROOMS,
        ),
      ).toMatchObject({ type: 'MAKEUP', attendance: 'PRESENT' });
      expect(
        toSessionDetail(
          {
            ...detail,
            status: 'CANCELLED',
            cancelReason: 'Giáo viên ốm',
            participation: participation({ cancelled: true }),
          },
          ROOMS,
        ),
      ).toMatchObject({ status: 'CANCELLED', note: 'Giáo viên ốm', attendance: null });
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
      session('tiep-theo', at(10, 23)),
      session('sau-do', at(10, 27)),
    ];

    it('mon dang hoc: lop, lich co dinh, so buoi theo lich va buoi tiep theo', () => {
      const [course] = toStudentEnrollments({
        enrollments: [enrollment()],
        pauses: [],
        upcomingSessions,
        rooms: ROOMS,
        now,
      });

      expect(course).toEqual({
        id: 'enrollment-math',
        status: 'ACTIVE',
        pause: null,
        programName: 'Toán 8 – Chuyên đề nâng cao',
        subjectName: 'Toán',
        className: 'Toán nâng cao 8A2',
        teacherName: null,
        room: null,
        weeklySlots: MATH_CLASS.weeklySchedules,
        // Thu Ba va thu Sau tu 05/10: 06, 09, 13, 16 truoc ngay 20/10
        completedSessions: 4,
        totalSessions: 26,
        averageScore: null,
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
        enrollments: [enrollment(), enrollment({ id: 'enrollment-other' })],
        pauses: [pause],
        upcomingSessions: [],
        rooms: [],
        now,
      });

      expect(courses.map((course) => course.pause)).toEqual([
        { fromDate: '2026-10-15', toDate: '2026-11-15' },
        null,
      ]);
    });

    it('ghi danh het han hoac da ket thuc thi la ENDED, khong co buoi tiep theo va bao luu', () => {
      const afterTerm = new Date(at(1, 10, 12, 0, 2027));
      const [expired, ended] = toStudentEnrollments({
        enrollments: [enrollment(), enrollment({ id: 'enrollment-ended', status: 'ENDED' })],
        pauses: [],
        upcomingSessions: [session('con-lich', at(1, 12, 18, 0, 2027))],
        rooms: [],
        now: afterTerm,
      });

      expect(expired).toMatchObject({ status: 'ENDED', nextSession: null, completedSessions: 26 });
      expect(ended).toMatchObject({ status: 'ENDED', nextSession: null });
    });

    it('chuyen lop thi hien lop va phong cua lop con dang hoc', () => {
      const [course] = toStudentEnrollments({
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
        pauses: [],
        upcomingSessions: [],
        rooms: ROOMS,
        now,
      });

      expect(course).toMatchObject({ className: 'Tiếng Anh 6A1', room: 'Phòng B201' });
    });

    it('buoi hoc bu o lop khac cung la buoi tiep theo cua mon', () => {
      const [course] = toStudentEnrollments({
        enrollments: [enrollment()],
        pauses: [],
        upcomingSessions: [{ ...MAKEUP_SESSION, startsAt: at(10, 21, 9) }, ...upcomingSessions],
        rooms: [],
        now,
      });

      expect(course?.nextSession).toEqual({ id: 'bu-8b1', startsAt: at(10, 21, 9) });
    });
  });

  describe('toEnrollmentLessons', () => {
    it('moi buoi trong ky la mot bai theo gio hoc, bai kiem tra thang la ASSESSMENT', () => {
      const sessions = [
        session('buoi-3', at(10, 13), {
          lesson: { id: 'lesson-test', title: 'Kiểm tra tháng 10', kind: 'MONTHLY_TEST' },
        }),
        ENGLISH_SESSION,
        session('buoi-1', at(10, 6), { status: 'COMPLETED' }),
        session('buoi-2', at(10, 9)),
        session('ngoai-ky', at(10, 2)),
        // Buoi hoc bu day lai bai cua buoi vang, khong them bai moi
        MAKEUP_SESSION,
      ];

      expect(toEnrollmentLessons(sessions, enrollment())).toEqual([
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
  });

  describe('toStudentAssignment', () => {
    const detail: AssignmentDetail = {
      id: 'assignment-1',
      classId: MATH_CLASS.id,
      kind: 'TEST',
      testType: 'FIFTEEN_MINUTES',
      title: 'Bài tập về nhà bài 10',
      instructions: 'Làm trực tiếp trên EduGrade.',
      dueAt: at(10, 25, 23, 59),
      status: 'PUBLISHED',
      maxAttempts: 2,
      recipients: [
        { id: 'recipient-sibling', enrollmentId: 'enrollment-sibling' },
        { id: 'recipient-1', enrollmentId: 'enrollment-math' },
      ],
      questions: [
        {
          id: 'q1',
          kind: 'MULTIPLE_CHOICE',
          prompt: '1 + 1 = ?',
          choices: ['1', '2'],
          maxScore: 4,
        },
        { id: 'q2', kind: 'ESSAY', prompt: 'Giải phương trình', choices: null, maxScore: 6 },
      ],
    };

    function submission(
      attemptNo: number,
      overrides: Partial<SubmissionRecord> = {},
    ): SubmissionRecord {
      return {
        id: `submission-${attemptNo}`,
        recipientId: 'recipient-1',
        attemptNo,
        answers: [],
        submittedAt: at(10, 20 + attemptNo),
        grades: [],
        ...overrides,
      };
    }

    it('chua nop: lay lop va mon tu ghi danh cua con, dem cau theo loai', () => {
      expect(toStudentAssignment({ detail, submissions: [], enrollments: [enrollment()] })).toEqual(
        {
          id: 'assignment-1',
          testType: 'FIFTEEN_MINUTES',
          title: 'Bài tập về nhà bài 10',
          instructions: 'Làm trực tiếp trên EduGrade.',
          subjectName: 'Toán',
          className: 'Toán nâng cao 8A2',
          teacherName: null,
          dueAt: detail.dueAt,
          maxAttempts: 2,
          questionCounts: { MULTIPLE_CHOICE: 1, ESSAY: 1 },
          submission: null,
          grade: null,
        },
      );
    });

    it('lay lan nop moi nhat cua con va diem da cong bo cua lan do', () => {
      const submissions = [
        submission(1, {
          grades: [
            { id: 'g1', scores: [], totalScore: 5, feedback: 'Cũ', publishedAt: at(10, 22) },
          ],
        }),
        submission(2, {
          grades: [
            { id: 'g2', scores: [], totalScore: 8.5, feedback: '', publishedAt: at(10, 24) },
          ],
        }),
        submission(3, { recipientId: 'recipient-sibling' }),
      ];

      expect(
        toStudentAssignment({ detail, submissions, enrollments: [enrollment()] }),
      ).toMatchObject({
        submission: { attemptNo: 2, submittedAt: at(10, 22) },
        grade: { totalScore: 8.5, maxScore: 10, feedback: null, publishedAt: at(10, 24) },
      });
    });

    it('da nop nhung chua cong bo diem thi chua co diem', () => {
      expect(
        toStudentAssignment({ detail, submissions: [submission(1)], enrollments: [enrollment()] }),
      ).toMatchObject({ submission: { attemptNo: 1 }, grade: null });
    });

    it('bai khong giao cho con nay thi tra null', () => {
      const other = enrollment({ id: 'enrollment-khac' });
      expect(toStudentAssignment({ detail, submissions: [], enrollments: [other] })).toBeNull();
    });

    it('bai cua lop con da hoc truoc khi chuyen lop thi lay ten lop do', () => {
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
        toStudentAssignment({ detail, submissions: [], enrollments: [transferred] }),
      ).toMatchObject({ className: 'Toán nâng cao 8A2' });
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
        ...overrides,
      };
    }

    function leave(overrides: Partial<LeaveRequest>): LeaveRequest {
      return {
        id: 'leave-1',
        enrollmentId: 'enrollment-math',
        kind: 'SINGLE_ABSENCE',
        sessionId: null,
        fromDate: dateColumn('2026-10-09'),
        toDate: dateColumn('2026-10-09'),
        reason: 'Con bị sốt',
        status: 'APPROVED',
        ...overrides,
      };
    }

    function makeup(overrides: Partial<MakeupBooking>): MakeupBooking {
      return {
        id: 'makeup-1',
        status: 'BOOKED',
        original: { sessionId: 'vang', enrollmentId: 'enrollment-math' },
        replacement: { session: { id: 'bu', startsAt: at(10, 12, 9) } },
        ...overrides,
      };
    }

    it('lay lop, mon theo ghi danh; buoi co mat khong kem don nghi hay hoc bu', () => {
      const records = toAttendanceRecords({
        history: [historyItem('co-mat', at(10, 6))],
        enrollments: [enrollment()],
        makeups: [makeup({ original: { sessionId: 'co-mat', enrollmentId: 'enrollment-math' } })],
        leaves: [leave({ sessionId: 'co-mat' })],
      });

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

    it('buoi vang kem ly do nghi va lich hoc bu moi nhat chua huy', () => {
      const [record] = toAttendanceRecords({
        history: [historyItem('vang', at(10, 9), { effectiveStatus: 'ABSENT' })],
        enrollments: [enrollment()],
        makeups: [
          makeup({ id: 'moi-huy', status: 'CANCELLED' }),
          makeup({ id: 'dang-xep' }),
          makeup({ id: 'cu', status: 'MISSED' }),
          makeup({
            id: 'cua-anh-chi-em',
            original: { sessionId: 'vang', enrollmentId: 'enrollment-sibling' },
          }),
        ],
        leaves: [
          leave({ sessionId: 'buoi-khac', reason: 'Không phải buổi này' }),
          leave({ sessionId: 'vang', status: 'REJECTED', reason: 'Bị từ chối' }),
          leave({ sessionId: 'vang' }),
        ],
      });

      expect(record).toMatchObject({
        status: 'ABSENT',
        leaveReason: 'Con bị sốt',
        makeup: { status: 'BOOKED', startsAt: at(10, 12, 9) },
      });
    });

    it('buoi nghi trong thoi gian tam nghi lay ly do cua don tam nghi', () => {
      const [record] = toAttendanceRecords({
        history: [historyItem('tam-nghi', at(10, 20), { effectiveStatus: 'EXCUSED' })],
        enrollments: [enrollment()],
        makeups: [],
        leaves: [
          leave({
            kind: 'PERIOD_PAUSE',
            fromDate: dateColumn('2026-10-15'),
            toDate: dateColumn('2026-10-20'),
            reason: 'Con ôn thi học kỳ',
          }),
        ],
      });

      expect(record).toMatchObject({ status: 'EXCUSED', leaveReason: 'Con ôn thi học kỳ' });
    });

    it('buoi cua lop cu sau khi chuyen lop lay ten lop do; ghi danh la thi bo qua', () => {
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

      const records = toAttendanceRecords({
        history: [
          historyItem('lop-cu', at(10, 6), { effectiveStatus: 'MADE_UP' }),
          historyItem('la', at(10, 9), { enrollmentId: 'enrollment-khac' }),
        ],
        enrollments: [transferred],
        makeups: [
          makeup({
            status: 'COMPLETED',
            original: { sessionId: 'lop-cu', enrollmentId: 'enrollment-math' },
          }),
        ],
        leaves: [],
      });

      expect(records).toEqual([
        expect.objectContaining({
          className: 'Toán nâng cao 8A2',
          status: 'MADE_UP',
          makeup: { status: 'COMPLETED', startsAt: at(10, 12, 9) },
        }),
      ]);
    });
  });

  describe('getStudentClassIds', () => {
    it('gom lop luc dang ky va cac lop da xep, moi lop mot lan', () => {
      const classIds = getStudentClassIds([
        enrollment(),
        enrollment({
          class: ENGLISH_CLASS,
          placements: [
            {
              classId: MATH_CLASS.id,
              effectiveFrom: at(10, 5, 0),
              effectiveTo: null,
              class: MATH_CLASS,
            },
          ],
        }),
      ]);

      expect([...classIds].sort()).toEqual(['class-english', 'class-math']);
    });
  });
});
