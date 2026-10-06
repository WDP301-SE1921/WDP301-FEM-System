import {
  findSessionDetail,
  getCurrentClass,
  getStudentClassIds,
  getTermRange,
  isEnrollmentSession,
  toEnrollmentLessons,
  toStudentAssignment,
  toStudentEnrollments,
  toStudentSchedule,
} from '@/features/parent-dashboard/api/parent-data-mappers';
import type {
  AssignmentDetail,
  LeaveRequest,
  ScheduledSession,
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
    ...overrides,
  };
  return scheduled;
}

const ENGLISH_SESSION = session('english-1', at(10, 7, 17, 45), {
  classId: ENGLISH_CLASS.id,
  class: { name: ENGLISH_CLASS.name, program: { grade: 6, subject: 'Tiếng Anh' } },
});

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
  });

  describe('toStudentSchedule', () => {
    it('chi lay buoi cua con trong cac buoi BE tra chung cho moi con, giu thu tu', () => {
      const sessions = [
        session('math-1', at(10, 6)),
        ENGLISH_SESSION,
        session('math-2', at(10, 9), {
          lesson: { id: 'lesson-test', title: 'Kiểm tra tháng 10', kind: 'MONTHLY_TEST' },
        }),
      ];

      expect(toStudentSchedule(sessions, [enrollment()])).toEqual([
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
        expect.objectContaining({ id: 'math-2', topic: 'Kiểm tra tháng 10' }),
      ]);
      expect(toStudentSchedule(sessions, [])).toEqual([]);
    });
  });

  describe('findSessionDetail', () => {
    const sessions = [session('math-1', at(10, 6), { status: 'COMPLETED' }), ENGLISH_SESSION];

    it('tra chi tiet voi nhung gi BE co: chua co diem danh, nhan xet, tai lieu', () => {
      expect(findSessionDetail(sessions, [enrollment()], 'math-1')).toMatchObject({
        id: 'math-1',
        status: 'COMPLETED',
        lesson: { sequence: null, title: 'Bài của buổi math-1', description: null },
        attendance: null,
        checkedInAt: null,
        teacherComment: null,
        materials: [],
      });
    });

    it('buoi cua con khac hoac id la thi tra null', () => {
      expect(findSessionDetail(sessions, [enrollment()], 'english-1')).toBeNull();
      expect(findSessionDetail(sessions, [enrollment()], 'khong-co')).toBeNull();
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
        fromDate: dateColumn('2026-10-15'),
        toDate: dateColumn('2026-11-15'),
        status: 'APPROVED',
      };
      const courses = toStudentEnrollments({
        enrollments: [enrollment(), enrollment({ id: 'enrollment-other' })],
        pauses: [pause],
        upcomingSessions: [],
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
        now: afterTerm,
      });

      expect(expired).toMatchObject({ status: 'ENDED', nextSession: null, completedSessions: 26 });
      expect(ended).toMatchObject({ status: 'ENDED', nextSession: null });
    });

    it('chuyen lop thi hien lop con dang hoc', () => {
      const [course] = toStudentEnrollments({
        enrollments: [
          enrollment({
            placements: [
              {
                classId: MATH_CLASS_B.id,
                effectiveFrom: at(10, 5, 0),
                effectiveTo: null,
                class: MATH_CLASS_B,
              },
            ],
          }),
        ],
        pauses: [],
        upcomingSessions: [],
        now,
      });

      expect(course?.className).toBe('Toán nâng cao 8B1');
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
