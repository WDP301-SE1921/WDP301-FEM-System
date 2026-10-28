import type {
  AppNotification,
  StudentAssignment,
  TuitionBill,
} from '@/features/parent-dashboard/types';
import {
  getAttentionItems,
  getNotificationAppearance,
  getNotificationDestination,
  getNotificationStudentLabel,
  getParentHref,
  isTabDestination,
  mergeNotificationPages,
  toAssignmentTab,
  toScheduleView,
} from '@/features/parent-dashboard/utils';

const NOW = new Date(2026, 9, 20, 12, 0);

function notification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'notification-1',
    type: 'ASSIGNMENT_PUBLISHED',
    title: 'Cập nhật học tập',
    body: 'Có bài tập mới được giao.',
    target: { kind: 'ASSIGNMENT', id: 'assignment-1' },
    context: { classId: 'class-math', studentIds: ['student-1'] },
    createdAt: new Date(2026, 9, 20, 9).toISOString(),
    readAt: null,
    ...overrides,
  };
}

function bill(overrides: Partial<TuitionBill> = {}): TuitionBill {
  return {
    registrationId: 'order-1',
    status: 'UNPAID',
    issuedAt: new Date(2026, 9, 18).toISOString(),
    student: { id: 'student-1', fullName: 'Nguyễn Minh Anh', grade: 8 },
    class: {
      id: 'class-math',
      name: 'Toán nâng cao 8A2',
      subject: 'Toán',
      grade: 8,
      schedules: [],
    },
    term: { packageMonths: 3, startDate: '2026-10-06', endDate: '2027-01-06' },
    pricing: { monthlyFee: '800000.00', packageMonths: 3, total: '2400000.00', currency: 'VND' },
    payment: null,
    ...overrides,
  };
}

function assignment(id: string, dueAt: Date, overrides: Partial<StudentAssignment> = {}) {
  const value: StudentAssignment = {
    id,
    testType: null,
    title: `Bài ${id}`,
    subjectName: 'Toán',
    className: 'Toán nâng cao 8A2',
    teacherName: null,
    dueAt: dueAt.toISOString(),
    maxAttempts: 1,
    questionCounts: { MULTIPLE_CHOICE: 1, ESSAY: 0 },
    submission: null,
    grade: null,
    ...overrides,
  };
  return value;
}

describe('features/parent-dashboard/utils (thong bao, viec can chu y)', () => {
  describe('getAttentionItems', () => {
    it('bill chua thanh toan truoc, roi bai chua nop sap het han, han gan nhat truoc', () => {
      const items = getAttentionItems({
        studentId: 'student-1',
        bills: [bill(), bill({ registrationId: 'order-paid', status: 'PAID' })],
        assignments: [
          assignment('ngay-kia', new Date(2026, 9, 22, 23, 59)),
          assignment('toi-nay', new Date(2026, 9, 20, 23, 59)),
          assignment('con-xa', new Date(2026, 9, 30, 23, 59)),
          assignment('qua-han', new Date(2026, 9, 19, 23, 59)),
          assignment('da-nop', new Date(2026, 9, 21, 23, 59), {
            submission: { attemptNo: 1, submittedAt: NOW.toISOString() },
          }),
        ],
        now: NOW,
      });

      expect(items.map(({ id, type }) => [id, type])).toEqual([
        ['bill-order-1', 'TUITION'],
        ['assignment-toi-nay', 'ASSIGNMENT'],
        ['assignment-ngay-kia', 'ASSIGNMENT'],
      ]);
      expect(items[0]).toMatchObject({ title: 'Học phí lớp Toán nâng cao 8A2' });
      expect(items[0]?.description).toMatch(/^Chưa thanh toán 2\.400\.000/);
      expect(items[1]).toMatchObject({
        title: 'Bài toi-nay',
        description: 'Hạn nộp: 23:59, 20/10',
      });
    });

    it('bam viec thi mo dung bill hoac bai tap cua con dang xem', () => {
      const [tuition, homework] = getAttentionItems({
        studentId: 'student-1',
        bills: [bill()],
        assignments: [assignment('toi-nay', new Date(2026, 9, 20, 23, 59))],
        now: NOW,
      });

      expect(tuition?.destination).toEqual({ kind: 'BILL', registrationId: 'order-1' });
      expect(homework?.destination).toEqual({
        kind: 'ASSIGNMENT',
        studentId: 'student-1',
        assignmentId: 'toi-nay',
      });
    });

    it('khong co bill chua dong va bai gap thi rong', () => {
      expect(
        getAttentionItems({ studentId: 'student-1', bills: [], assignments: [], now: NOW }),
      ).toEqual([]);
    });
  });

  describe('getNotificationDestination', () => {
    it('bai tap va buoi hoc mo theo con dau tien trong thong bao', () => {
      expect(getNotificationDestination(notification())).toEqual({
        kind: 'ASSIGNMENT',
        studentId: 'student-1',
        assignmentId: 'assignment-1',
      });
      expect(
        getNotificationDestination(
          notification({
            target: { kind: 'SESSION', id: 'session-1' },
            context: { studentIds: ['student-2', 'student-1'] },
          }),
        ),
      ).toEqual({ kind: 'SESSION', studentId: 'student-2', sessionId: 'session-1' });
    });

    it('thong bao hoc phi mo bill; loai khong co man hinh hoac thieu con thi khong mo', () => {
      expect(
        getNotificationDestination(
          notification({
            target: { kind: 'REGISTRATION', id: 'order-1' },
            context: { studentIds: [] },
          }),
        ),
      ).toEqual({ kind: 'BILL', registrationId: 'order-1' });
      expect(
        getNotificationDestination(notification({ target: { kind: 'CLASS', id: 'class-math' } })),
      ).toBeNull();
      expect(getNotificationDestination(notification({ context: { studentIds: [] } }))).toBeNull();
    });

    it('don nghi, hoc bu, ghi danh, giao trinh, diem mo tab chua thong tin do theo con', () => {
      const open = (kind: AppNotification['target']['kind']) =>
        getNotificationDestination(notification({ target: { kind, id: 'x' } }));

      expect(open('LEAVE')).toEqual({
        kind: 'SCHEDULE',
        view: 'ATTENDANCE',
        studentId: 'student-1',
      });
      expect(open('MAKEUP')).toEqual({
        kind: 'SCHEDULE',
        view: 'ATTENDANCE',
        studentId: 'student-1',
      });
      expect(open('ENROLLMENT')).toEqual({
        kind: 'SCHEDULE',
        view: 'COURSES',
        studentId: 'student-1',
      });
      expect(open('CURRICULUM_UNIT')).toEqual({
        kind: 'SCHEDULE',
        view: 'ROADMAP',
        studentId: 'student-1',
      });
      expect(open('SUBMISSION')).toEqual({
        kind: 'ASSIGNMENTS',
        tab: 'GRADED',
        studentId: 'student-1',
      });
      expect(open('FEEDBACK')).toBeNull();
    });
  });

  it('isTabDestination chi dung voi dich la tab', () => {
    expect(isTabDestination({ kind: 'SCHEDULE', studentId: 's1', view: 'WEEK' })).toBe(true);
    expect(isTabDestination({ kind: 'ASSIGNMENTS', studentId: 's1', tab: 'TODO' })).toBe(true);
    expect(isTabDestination({ kind: 'BILL', registrationId: 'o1' })).toBe(false);
  });

  it('toScheduleView va toAssignmentTab doc tham so URL, sai thi ve mac dinh', () => {
    expect(toScheduleView('ATTENDANCE')).toBe('ATTENDANCE');
    expect(toScheduleView(undefined)).toBe('WEEK');
    expect(toScheduleView('la')).toBe('WEEK');
    expect(toScheduleView(['ROADMAP'])).toBe('WEEK');
    expect(toAssignmentTab('GRADED')).toBe('GRADED');
    expect(toAssignmentTab(undefined)).toBe('TODO');
  });

  it('getParentHref dua ra route kem tham so', () => {
    expect(getParentHref({ kind: 'ASSIGNMENT', studentId: 's1', assignmentId: 'a1' })).toEqual({
      pathname: '/assignments/[assignmentId]',
      params: { assignmentId: 'a1', studentId: 's1' },
    });
    expect(getParentHref({ kind: 'SESSION', studentId: 's1', sessionId: 'x1' })).toEqual({
      pathname: '/sessions/[sessionId]',
      params: { sessionId: 'x1', studentId: 's1' },
    });
    expect(getParentHref({ kind: 'BILL', registrationId: 'o1' })).toEqual({
      pathname: '/bills/[registrationId]',
      params: { registrationId: 'o1' },
    });
    expect(getParentHref({ kind: 'SCHEDULE', studentId: 's1', view: 'ATTENDANCE' })).toEqual({
      pathname: '/schedule',
      params: { view: 'ATTENDANCE' },
    });
    expect(getParentHref({ kind: 'ASSIGNMENTS', studentId: 's1', tab: 'GRADED' })).toEqual({
      pathname: '/grades',
      params: { tab: 'GRADED' },
    });
  });

  it('getNotificationAppearance uu tien loai thong bao, khong thi theo ban ghi', () => {
    expect(getNotificationAppearance(notification({ type: 'GRADE_PUBLISHED' }))).toEqual({
      icon: 'star-outline',
      tone: 'accent',
    });
    expect(getNotificationAppearance(notification())).toEqual({
      icon: 'create-outline',
      tone: 'primary',
    });
  });

  it('mergeNotificationPages bo thong bao bi day sang trang sau', () => {
    const first = notification({ id: 'n1' });
    const second = notification({ id: 'n2' });
    const third = notification({ id: 'n3' });

    expect(
      mergeNotificationPages([{ items: [first, second] }, { items: [second, third] }]).map(
        ({ id }) => id,
      ),
    ).toEqual(['n1', 'n2', 'n3']);
  });

  it('getNotificationStudentLabel ghi ten ngan cac con lien quan', () => {
    const students = [
      { id: 'student-1', fullName: 'Nguyễn Minh Anh' },
      { id: 'student-2', fullName: 'Nguyễn Hoàng Long' },
    ];

    expect(
      getNotificationStudentLabel(
        notification({ context: { studentIds: ['student-1', 'student-2'] } }),
        students,
      ),
    ).toBe('Minh Anh, Hoàng Long');
    expect(
      getNotificationStudentLabel(notification({ context: { studentIds: ['la'] } }), students),
    ).toBeNull();
  });
});
