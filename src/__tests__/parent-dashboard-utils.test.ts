import { WEEKS_AFTER, WEEKS_BEFORE } from '@/features/parent-dashboard/constants';
import type {
  AttendanceRecord,
  EnrollmentLesson,
  LessonSession,
  ScheduleSession,
  StudentAssignment,
  StudentEnrollment,
} from '@/features/parent-dashboard/types';
import {
  buildWeekDays,
  countAssignmentsByTab,
  countAttendance,
  countCoursesByStatus,
  filterBySubject,
  filterEnrollments,
  findNearestDueAssignment,
  findNextFreeDay,
  formatAssignmentDue,
  formatAssignmentSubmitted,
  formatAttendanceBreakdown,
  formatCourseSummary,
  formatDateKey,
  formatLessonSchedule,
  formatLessonScore,
  formatLessonTitle,
  formatNextSession,
  formatQuestionCount,
  formatScore,
  formatScoreChange,
  formatWeekRange,
  formatWeeklySlots,
  getAdjacentWeek,
  getAssessmentMarkers,
  getAssignmentDeadline,
  getAssignmentFormat,
  getAssignmentState,
  getAssignmentTab,
  getAttendanceBadge,
  getAttendanceLevel,
  getAttendanceNotes,
  getParentGreeting,
  getAttendanceRate,
  getAttendanceRecordStatus,
  getCourseFilterOptions,
  getCourseProgress,
  getCourseStatus,
  getDayPeriod,
  getDefaultDayOfWeek,
  getGradeLevel,
  getLessonBadge,
  getMinutesBetween,
  getRelativeWeekLabel,
  getRemainingAttempts,
  getRoadmapCourseOptions,
  getRoadmapLessons,
  getRoadmapWindow,
  getScoreLevel,
  getScoreTrend,
  getSessionDetailStatus,
  getSessionStatus,
  getStudyingEnrollments,
  getSubjectFilterOptions,
  getTabAssignments,
  getWeekOptions,
  getWeekRange,
  groupAttendanceByMonth,
  isOutstandingAbsence,
  sortAttendanceRecords,
  sortEnrollments,
  summarizeRoadmap,
  toAttendanceSummary,
} from '@/features/parent-dashboard/utils';
import { addDays } from '@/utils/date';

describe('features/parent-dashboard/utils', () => {
  describe('getSessionStatus', () => {
    const session = {
      startsAt: new Date(2026, 9, 16, 18, 0).toISOString(),
      endsAt: new Date(2026, 9, 16, 19, 30).toISOString(),
    };

    it.each([
      ['truoc gio bat dau', new Date(2026, 9, 16, 17, 59), 'UPCOMING'],
      ['dung gio bat dau', new Date(2026, 9, 16, 18, 0), 'IN_PROGRESS'],
      ['giua buoi', new Date(2026, 9, 16, 19, 0), 'IN_PROGRESS'],
      ['dung gio ket thuc', new Date(2026, 9, 16, 19, 30), 'FINISHED'],
    ])('%s -> %s', (_case, now, expected) => {
      expect(getSessionStatus(session, now)).toBe(expected);
    });
  });

  describe('chi tiet buoi hoc', () => {
    const startsAt = new Date(2026, 9, 16, 18, 0).toISOString();
    const endsAt = new Date(2026, 9, 16, 19, 30).toISOString();
    const before = new Date(2026, 9, 16, 17, 0);
    const after = new Date(2026, 9, 16, 20, 0);

    function atMinute(minutes: number): string {
      return new Date(2026, 9, 16, 18, minutes).toISOString();
    }

    it('getMinutesBetween tinh thoi luong, am khi dao nguoc', () => {
      expect(getMinutesBetween(startsAt, endsAt)).toBe(90);
      expect(getMinutesBetween(endsAt, startsAt)).toBe(-90);
    });

    it.each([
      ['bi huy thi uu tien hon diem danh', 'CANCELLED', 'PRESENT', after, 'Buổi học bị huỷ'],
      ['da co ket qua diem danh', 'COMPLETED', 'EXCUSED', after, 'Nghỉ có phép'],
      ['chua diem danh, chua toi gio', 'SCHEDULED', 'UNMARKED', before, 'Sắp diễn ra'],
      ['chua diem danh, da het gio', 'SCHEDULED', 'UNMARKED', after, 'Chưa điểm danh'],
      ['app khong co ket qua diem danh, chua toi gio', 'SCHEDULED', null, before, 'Sắp diễn ra'],
      ['app khong co ket qua diem danh, da het gio', 'COMPLETED', null, after, 'Đã kết thúc'],
      ['app khong co ket qua diem danh, buoi bi huy', 'CANCELLED', null, after, 'Buổi học bị huỷ'],
    ] as const)('getSessionDetailStatus: %s', (_case, status, attendance, now, label) => {
      expect(getSessionDetailStatus({ status, attendance, startsAt, endsAt }, now).label).toBe(
        label,
      );
    });

    it.each([
      ['vao som', atMinute(-5), 'Có mặt · Đúng giờ', 'success'],
      ['vao dung gio bat dau', atMinute(0), 'Có mặt · Đúng giờ', 'success'],
      ['vao muon', atMinute(10), 'Có mặt · Muộn 10 phút', 'accent'],
    ])('getAttendanceBadge co mat, %s', (_case, checkedInAt, label, tone) => {
      expect(getAttendanceBadge({ attendance: 'PRESENT', startsAt, checkedInAt })).toEqual({
        label,
        tone,
        icon: 'checkmark-circle',
      });
    });

    it('formatLessonTitle kem thu tu bai khi co', () => {
      expect(formatLessonTitle({ sequence: 12, title: 'Phương trình bậc hai' })).toBe(
        'Bài 12: Phương trình bậc hai',
      );
      expect(formatLessonTitle({ sequence: null, title: 'Phương trình bậc hai' })).toBe(
        'Phương trình bậc hai',
      );
    });

    it('getAttendanceBadge khong co gio vao lop thi chi hien ket qua', () => {
      expect(getAttendanceBadge({ attendance: 'ABSENT', startsAt, checkedInAt: null }).label).toBe(
        'Vắng mặt',
      );
      expect(getAttendanceBadge({ attendance: 'PRESENT', startsAt, checkedInAt: null }).label).toBe(
        'Có mặt',
      );
    });
  });

  describe('getAttendanceRate', () => {
    it('lam tron theo phan tram', () => {
      expect(getAttendanceRate({ attendedSessions: 16, totalSessions: 17 })).toBe(94);
      expect(getAttendanceRate({ attendedSessions: 12, totalSessions: 12 })).toBe(100);
    });

    it('tra null khi chua co buoi hoc nao', () => {
      expect(getAttendanceRate({ attendedSessions: 0, totalSessions: 0 })).toBeNull();
    });
  });

  describe('getScoreLevel', () => {
    it.each([
      [10, 'Tốt'],
      [8, 'Tốt'],
      [7.9, 'Khá'],
      [6.5, 'Khá'],
      [5, 'Đạt'],
      [4.9, 'Chưa đạt'],
      [0, 'Chưa đạt'],
    ])('diem %d -> %s', (score, label) => {
      expect(getScoreLevel(score).label).toBe(label);
    });
  });

  describe('formatScore', () => {
    it('giu mot chu so thap phan', () => {
      expect(formatScore(9)).toBe('9.0');
      expect(formatScore(8.25)).toBe('8.3');
    });
  });

  describe('getScoreTrend / formatScoreChange', () => {
    it.each([
      [0.4, 'UP', '+0.4'],
      [-0.3, 'DOWN', '-0.3'],
      [0, 'FLAT', '0.0'],
      // Lam tron ve 0 thi coi nhu khong doi, khong hien +0.0 hay -0.0
      [0.04, 'FLAT', '0.0'],
      [-0.04, 'FLAT', '0.0'],
    ])('%d -> %s, %s', (change, trend, label) => {
      expect(getScoreTrend(change)).toBe(trend);
      expect(formatScoreChange(change)).toBe(label);
    });
  });

  describe('getDayPeriod', () => {
    it.each([
      [new Date(2026, 9, 16, 8, 30), 'MORNING'],
      [new Date(2026, 9, 16, 11, 59), 'MORNING'],
      [new Date(2026, 9, 16, 12, 0), 'AFTERNOON'],
      [new Date(2026, 9, 16, 17, 45), 'AFTERNOON'],
      [new Date(2026, 9, 16, 18, 0), 'EVENING'],
    ])('%s -> %s', (startsAt, period) => {
      expect(getDayPeriod(startsAt.toISOString())).toBe(period);
    });
  });

  describe('lich tuan', () => {
    /** Thu Hai 12/10/2026. */
    const WEEK_START = new Date(2026, 9, 12);

    function session(
      id: string,
      start: Date,
      type: ScheduleSession['type'] = 'REGULAR',
    ): ScheduleSession {
      return {
        id,
        className: 'Toán nâng cao 8A2',
        subjectName: 'Toán',
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + 90 * 60 * 1000).toISOString(),
        room: null,
        teacherName: 'Đặng Hải Yến',
        type,
        topic: null,
        note: null,
      };
    }

    it('getWeekRange / formatWeekRange tu Thu Hai toi Chu nhat', () => {
      expect(getWeekRange(WEEK_START)).toEqual({ from: '2026-10-12', to: '2026-10-18' });
      expect(formatWeekRange(new Date(2026, 11, 28))).toBe('28/12 – 03/01');
    });

    it('buildWeekDays chia buoi theo ngay, sap theo gio va danh dau ngay doi lich', () => {
      const days = buildWeekDays(WEEK_START, [
        session('evening', new Date(2026, 9, 12, 18, 0)),
        session('makeup', new Date(2026, 9, 12, 8, 30), 'MAKEUP'),
        session('wednesday', new Date(2026, 9, 14, 17, 30)),
        session('next-week', new Date(2026, 9, 19, 18, 0)),
      ]);

      expect(days.map((day) => day.key)).toEqual([
        '2026-10-12',
        '2026-10-13',
        '2026-10-14',
        '2026-10-15',
        '2026-10-16',
        '2026-10-17',
        '2026-10-18',
      ]);
      expect(days[0]?.sessions.map((item) => item.id)).toEqual(['makeup', 'evening']);
      expect(days[0]?.hasScheduleChange).toBe(true);
      expect(days[2]?.hasScheduleChange).toBe(false);
      expect(days.flatMap((day) => day.sessions)).toHaveLength(3);
    });

    it('findNextFreeDay tim ngay nghi sau ngay dang chon', () => {
      const days = buildWeekDays(WEEK_START, [
        session('mon', new Date(2026, 9, 12, 18, 0)),
        session('wed', new Date(2026, 9, 14, 18, 0)),
        session('thu', new Date(2026, 9, 15, 18, 0)),
        session('fri', new Date(2026, 9, 16, 18, 0)),
        session('sat', new Date(2026, 9, 17, 18, 0)),
        session('sun', new Date(2026, 9, 18, 18, 0)),
      ]);

      expect(findNextFreeDay(days, '2026-10-12')?.key).toBe('2026-10-13');
      expect(findNextFreeDay(days, '2026-10-14')).toBeUndefined();
    });

    it('getDefaultDayOfWeek mo hom nay o tuan hien tai, Thu Hai o tuan khac', () => {
      const today = new Date(2026, 9, 15);
      expect(getDefaultDayOfWeek(WEEK_START, today)).toBe(today);
      expect(getDefaultDayOfWeek(new Date(2026, 9, 19), today)).toEqual(new Date(2026, 9, 19));
    });

    it('getWeekOptions quanh tuan hien tai, kem nhan tuong doi', () => {
      const options = getWeekOptions(new Date(2026, 9, 15));

      expect(options).toHaveLength(WEEKS_BEFORE + WEEKS_AFTER + 1);
      expect(options[WEEKS_BEFORE]).toEqual({ weekStart: WEEK_START, offset: 0 });
      expect(options.map(({ offset }) => getRelativeWeekLabel(offset))).toEqual([
        '2 tuần trước',
        'Tuần trước',
        'Tuần này',
        'Tuần sau',
        '2 tuần sau',
        '3 tuần sau',
        '4 tuần sau',
      ]);
    });

    it('getAdjacentWeek cho mui ten doi tuan, het pham vi chon tuan thi null', () => {
      const today = new Date(2026, 9, 15);
      const weekAt = (offset: number) => addDays(WEEK_START, offset * 7);

      expect(getAdjacentWeek(WEEK_START, 1, today)).toEqual(weekAt(1));
      expect(getAdjacentWeek(WEEK_START, -1, today)).toEqual(weekAt(-1));
      expect(getAdjacentWeek(weekAt(-WEEKS_BEFORE), -1, today)).toBeNull();
      expect(getAdjacentWeek(weekAt(WEEKS_AFTER), 1, today)).toBeNull();
    });
  });

  describe('mon hoc', () => {
    function enrollment(id: string, overrides: Partial<StudentEnrollment> = {}): StudentEnrollment {
      return {
        id,
        status: 'ACTIVE',
        pause: null,
        programName: 'Toán 8 – Chuyên đề nâng cao',
        subjectName: 'Toán',
        className: 'Toán nâng cao 8A2',
        teacherName: 'Đặng Hải Yến',
        room: 'P.203',
        weeklySlots: [],
        completedSessions: 9,
        totalSessions: 24,
        averageScore: 8.6,
        nextSession: null,
        endDate: null,
        ...overrides,
      };
    }

    const PAUSE = { fromDate: '2026-09-20', toDate: '2026-11-18' };
    const ENDED = enrollment('ended', { status: 'ENDED' });
    const PAUSED = enrollment('paused', { pause: PAUSE });
    const ACTIVE = enrollment('active');
    const OTHER_ACTIVE = enrollment('other-active');

    it('getCourseStatus: ghi danh ACTIVE dang bao luu la tam nghi', () => {
      expect(getCourseStatus(ACTIVE)).toBe('ACTIVE');
      expect(getCourseStatus(PAUSED)).toBe('PAUSED');
      expect(getCourseStatus(ENDED)).toBe('ENDED');
      expect(getCourseStatus({ status: 'ENDED', pause: PAUSE })).toBe('ENDED');
    });

    it('sortEnrollments: dang hoc, tam nghi, da ket thuc; giu thu tu API trong cung nhom', () => {
      const input = [ENDED, ACTIVE, PAUSED, OTHER_ACTIVE];

      expect(sortEnrollments(input).map(({ id }) => id)).toEqual([
        'active',
        'other-active',
        'paused',
        'ended',
      ]);
      // Khong sua mang goc
      expect(input[0]).toBe(ENDED);
    });

    it('dem theo trang thai, tom tat bo trang thai khong co mon', () => {
      const counts = countCoursesByStatus([ACTIVE, OTHER_ACTIVE, ENDED]);

      expect(counts).toEqual({ ACTIVE: 2, PAUSED: 0, ENDED: 1 });
      expect(formatCourseSummary(counts)).toBe('2 đang học · 1 đã kết thúc');
    });

    it('getCourseFilterOptions: chi hien chip khi co tu hai trang thai', () => {
      expect(getCourseFilterOptions({ ACTIVE: 2, PAUSED: 0, ENDED: 0 })).toEqual([]);
      expect(getCourseFilterOptions({ ACTIVE: 2, PAUSED: 1, ENDED: 1 })).toEqual([
        { filter: 'ALL', label: 'Tất cả' },
        { filter: 'ACTIVE', label: 'Đang học (2)' },
        { filter: 'PAUSED', label: 'Tạm nghỉ (1)' },
        { filter: 'ENDED', label: 'Đã kết thúc (1)' },
      ]);
    });

    it('filterEnrollments theo trang thai hien thi', () => {
      const all = [ACTIVE, PAUSED, ENDED];

      expect(filterEnrollments(all, 'ALL')).toEqual(all);
      expect(filterEnrollments(all, 'PAUSED')).toEqual([PAUSED]);
      expect(filterEnrollments(all, 'ACTIVE')).toEqual([ACTIVE]);
    });

    it.each([
      [9, 24, 38],
      [20, 20, 100],
      [0, 24, 0],
      [25, 24, 100],
      [3, 0, null],
    ])('getCourseProgress %p/%p -> %p', (completedSessions, totalSessions, expected) => {
      expect(getCourseProgress({ completedSessions, totalSessions })).toBe(expected);
    });

    it('formatWeeklySlots gom thu cung gio, sap tu Thu Hai toi Chu nhat', () => {
      expect(
        formatWeeklySlots([
          { weekday: 7, startTime: '08:00', endTime: '09:30' },
          { weekday: 4, startTime: '18:00', endTime: '19:30' },
          { weekday: 1, startTime: '18:00', endTime: '19:30' },
        ]),
      ).toEqual(['T2, T5 · 18:00 – 19:30', 'CN · 08:00 – 09:30']);
      expect(formatWeeklySlots([])).toEqual([]);
    });

    it('formatNextSession ghi "Hôm nay" khi buoi hoc trong ngay', () => {
      const now = new Date(2026, 9, 12, 9, 0);

      expect(formatNextSession(new Date(2026, 9, 12, 18, 0).toISOString(), now)).toBe(
        'Hôm nay, 18:00',
      );
      expect(formatNextSession(new Date(2026, 9, 13, 17, 30).toISOString(), now)).toBe(
        'Thứ Ba 13/10, 17:30',
      );
    });

    it('formatDateKey doi YYYY-MM-DD sang dd/mm/yyyy, sai dinh dang tra --', () => {
      expect(formatDateKey('2026-08-28')).toBe('28/08/2026');
      expect(formatDateKey('28/08/2026')).toBe('--');
    });

    it('lo trinh chi co o mon dang di hoc; chip chon mon kem icon, mot mon thi khong can chon', () => {
      const physics = enrollment('physics', { subjectName: 'Vật lý', className: 'Vật lý 8' });
      const studying = getStudyingEnrollments([ENDED, ACTIVE, PAUSED, physics]);

      expect(studying.map(({ id }) => id)).toEqual(['active', 'physics']);
      expect(getRoadmapCourseOptions(studying)).toEqual([
        { filter: 'active', label: 'Toán nâng cao 8A2', icon: 'calculator-outline' },
        { filter: 'physics', label: 'Vật lý 8', icon: 'magnet-outline' },
      ]);
      expect(getRoadmapCourseOptions([ACTIVE])).toEqual([]);
    });
  });

  describe('lo trinh', () => {
    const NOW = new Date(2026, 9, 16, 12, 0);

    function session(status: LessonSession['status'], day: number): LessonSession {
      return {
        id: `session-${day}`,
        startsAt: new Date(2026, 9, day, 18, 0).toISOString(),
        status,
      };
    }

    function lesson(sequence: number, overrides: Partial<EnrollmentLesson> = {}): EnrollmentLesson {
      return {
        id: `lesson-${sequence}`,
        sequence,
        title: `Bài số ${sequence}`,
        description: null,
        kind: 'LESSON',
        session: null,
        assignment: null,
        ...overrides,
      };
    }

    // API tra lung tung thu tu, lo trinh phai tu sap theo thu tu bai
    const LESSONS = [
      lesson(3, { session: session('SCHEDULED', 16) }),
      lesson(1, { session: session('COMPLETED', 9) }),
      lesson(5, { kind: 'ASSESSMENT', session: session('SCHEDULED', 23) }),
      lesson(2, { session: session('COMPLETED', 12) }),
      lesson(4, { session: session('SCHEDULED', 19) }),
      lesson(6),
      lesson(7),
      lesson(8, { kind: 'ASSESSMENT' }),
    ];

    /** 12 bai, 6 bai dau da hoc, cac bai con lai da xep buoi. */
    const TWELVE_LESSONS = Array.from({ length: 12 }, (_, index) =>
      lesson(index + 1, { session: session(index < 6 ? 'COMPLETED' : 'SCHEDULED', index + 1) }),
    );

    function progresses(lessons: EnrollmentLesson[]) {
      return getRoadmapLessons(lessons).map(({ sequence, progress }) => [sequence, progress]);
    }

    function windowSequences(lessons: EnrollmentLesson[]) {
      return getRoadmapWindow(getRoadmapLessons(lessons)).map(({ sequence }) => sequence);
    }

    it('getRoadmapLessons: bai dang hoc la bai dau tien chua hoc xong da xep buoi', () => {
      expect(progresses(LESSONS)).toEqual([
        [1, 'DONE'],
        [2, 'DONE'],
        [3, 'CURRENT'],
        [4, 'UPCOMING'],
        [5, 'UPCOMING'],
        [6, 'UPCOMING'],
        [7, 'UPCOMING'],
        [8, 'UPCOMING'],
      ]);
    });

    it('khong co bai dang hoc khi bai tiep theo chua xep buoi (bao luu) hoac buoi bi huy', () => {
      expect(
        progresses([
          lesson(1, { session: session('COMPLETED', 9) }),
          lesson(2),
          lesson(3, { session: session('SCHEDULED', 16) }),
        ]),
      ).toEqual([
        [1, 'DONE'],
        [2, 'UPCOMING'],
        [3, 'UPCOMING'],
      ]);
      expect(
        progresses([
          lesson(1, { session: session('CANCELLED', 9) }),
          lesson(2, { session: session('SCHEDULED', 16) }),
        ]),
      ).toEqual([
        [1, 'UPCOMING'],
        [2, 'UPCOMING'],
      ]);
    });

    it('summarizeRoadmap dem bai theo vi tri, tim bai kiem tra gan nhat chua lam', () => {
      const summary = summarizeRoadmap(getRoadmapLessons(LESSONS));

      expect(summary).toMatchObject({ DONE: 2, CURRENT: 1, UPCOMING: 5, total: 8, percent: 25 });
      expect(summary.nextAssessment?.sequence).toBe(5);
      expect(summarizeRoadmap([])).toMatchObject({ total: 0, percent: 0, nextAssessment: null });
    });

    it('getAssessmentMarkers dat cham o cuoi moi bai kiem tra', () => {
      expect(getAssessmentMarkers(getRoadmapLessons(LESSONS))).toEqual([
        { id: 'lesson-5', percent: 62.5 },
        { id: 'lesson-8', percent: 100 },
      ]);
    });

    it('getRoadmapWindow giu 2 bai da hoc gan nhat, bai dang hoc va 3 bai sau', () => {
      expect(windowSequences(TWELVE_LESSONS)).toEqual([5, 6, 7, 8, 9, 10]);
      expect(
        windowSequences(
          TWELVE_LESSONS.map((item) => ({ ...item, session: session('COMPLETED', item.sequence) })),
        ),
      ).toEqual([11, 12]);
      expect(
        windowSequences(
          TWELVE_LESSONS.map((item) => ({ ...item, session: session('SCHEDULED', item.sequence) })),
        ),
      ).toEqual([1, 2, 3, 4]);
    });

    it('getLessonBadge: bai kiem tra chua lam hien nhan kiem tra dinh ky', () => {
      expect(getLessonBadge({ kind: 'ASSESSMENT', progress: 'UPCOMING' }).label).toBe(
        'Kiểm tra định kỳ',
      );
      expect(getLessonBadge({ kind: 'ASSESSMENT', progress: 'DONE' }).label).toBe('Đã học');
      expect(getLessonBadge({ kind: 'LESSON', progress: 'CURRENT' }).label).toBe('Đang học');
    });

    it('formatLessonSchedule: ngay da hoc, lich buoi sap toi hoac chua xep lich', () => {
      expect(
        formatLessonSchedule({ progress: 'DONE', session: session('COMPLETED', 9) }, NOW),
      ).toBe('09/10');
      expect(
        formatLessonSchedule({ progress: 'CURRENT', session: session('SCHEDULED', 16) }, NOW),
      ).toBe('Hôm nay, 18:00');
      expect(
        formatLessonSchedule({ progress: 'UPCOMING', session: session('SCHEDULED', 19) }, NOW),
      ).toBe('Thứ Hai 19/10, 18:00');
      expect(formatLessonSchedule({ progress: 'UPCOMING', session: null }, NOW)).toBe(
        'Chưa xếp lịch',
      );
    });

    it('bai tap: trang thai theo lan nop va han nop, han nop va diem de doc', () => {
      const dueAt = new Date(2026, 9, 18, 23, 59).toISOString();
      const afterDue = new Date(2026, 9, 19, 8, 0);

      expect(getAssignmentState({ dueAt, submittedAt: null }, NOW)).toBe('PENDING');
      expect(getAssignmentState({ dueAt, submittedAt: null }, afterDue)).toBe('OVERDUE');
      expect(getAssignmentState({ dueAt, submittedAt: NOW.toISOString() }, afterDue)).toBe(
        'SUBMITTED',
      );
      expect(formatAssignmentDue(dueAt)).toBe('Hạn nộp: 23:59, 18/10');
      expect(formatLessonScore('LESSON', 9)).toBe('Điểm bài tập: 9.0');
      expect(formatLessonScore('ASSESSMENT', 8.5)).toBe('Điểm kiểm tra: 8.5');
    });
  });

  describe('lich su diem danh', () => {
    function at(month: number, day: number, hours = 18): string {
      return new Date(2026, month - 1, day, hours, 0).toISOString();
    }

    function record(
      sessionId: string,
      overrides: Partial<AttendanceRecord> = {},
    ): AttendanceRecord {
      return {
        sessionId,
        className: 'Toán nâng cao 8A2',
        subjectName: 'Toán',
        startsAt: at(10, 12),
        endsAt: at(10, 12, 19),
        status: 'PRESENT',
        leaveReason: null,
        makeup: null,
        ...overrides,
      };
    }

    const PRESENT = record('present', { startsAt: at(10, 16) });
    const MADE_UP = record('made-up', {
      subjectName: 'Vật lý',
      status: 'MADE_UP',
      leaveReason: 'Con bị ốm',
      makeup: { status: 'COMPLETED', startsAt: at(10, 14, 17) },
    });
    const EXCUSED = record('excused', {
      startsAt: at(10, 2),
      status: 'EXCUSED',
      leaveReason: 'Tạm nghỉ ôn thi',
    });
    const ABSENT = record('absent', { startsAt: at(9, 26), status: 'ABSENT' });
    const ALL_RECORDS = [PRESENT, MADE_UP, EXCUSED, ABSENT];

    it('sortAttendanceRecords moi nhat truoc, khong sua mang goc', () => {
      const input = [ABSENT, PRESENT, EXCUSED, MADE_UP];

      expect(sortAttendanceRecords(input).map(({ sessionId }) => sessionId)).toEqual([
        'present',
        'made-up',
        'excused',
        'absent',
      ]);
      expect(input[0]).toBe(ABSENT);
    });

    it('countAttendance dem theo 4 trang thai cua SRS', () => {
      expect(countAttendance(ALL_RECORDS)).toEqual({
        present: 1,
        madeUp: 1,
        absent: 1,
        excused: 1,
      });
    });

    it('ty le di hoc = (co mat + hoc bu) / buoi phai hoc, nghi co phep khong tinh', () => {
      // Vi du cua BE: 6 co mat, 2 hoc bu, 2 vang, 1 nghi co phep -> 8/10
      const summary = toAttendanceSummary({ present: 6, madeUp: 2, absent: 2, excused: 1 });

      expect(summary).toEqual({ attendedSessions: 8, totalSessions: 10 });
      expect(getAttendanceRate(summary)).toBe(80);
      expect(getAttendanceRate(toAttendanceSummary(countAttendance([EXCUSED])))).toBeNull();
    });

    it.each([
      [100, 'Chuyên cần tốt'],
      [90, 'Chuyên cần tốt'],
      [89, 'Cần chú ý'],
      [75, 'Cần chú ý'],
      [74, 'Vắng nhiều'],
    ])('getAttendanceLevel %p%% -> %p', (rate, label) => {
      expect(getAttendanceLevel(rate).label).toBe(label);
    });

    it('formatAttendanceBreakdown dem tong va bo loai khong co buoi', () => {
      expect(formatAttendanceBreakdown(countAttendance(ALL_RECORDS))).toBe(
        '4 buổi · 1 có mặt, 1 học bù, 1 vắng, 1 nghỉ có phép',
      );
      expect(formatAttendanceBreakdown(countAttendance([PRESENT]))).toBe('1 buổi · 1 có mặt');
    });

    it('nhan theo ket qua; chi buoi vang chua hoc bu moi can lam noi', () => {
      expect(getAttendanceRecordStatus(MADE_UP)).toMatchObject({
        label: 'Đã học bù',
        tone: 'primary',
      });
      expect(getAttendanceRecordStatus(EXCUSED).label).toBe('Nghỉ có phép');
      expect(getAttendanceRecordStatus(ABSENT).label).toBe('Vắng mặt');
      expect(getAttendanceRecordStatus(PRESENT).label).toBe('Có mặt');

      expect(isOutstandingAbsence(MADE_UP)).toBe(false);
      expect(isOutstandingAbsence(EXCUSED)).toBe(false);
      expect(isOutstandingAbsence(ABSENT)).toBe(true);
      expect(isOutstandingAbsence(PRESENT)).toBe(false);
    });

    it('getAttendanceNotes: ly do nghi va lich hoc bu cua buoi vang', () => {
      const now = new Date(2026, 9, 14, 8, 0);
      const texts = (item: AttendanceRecord) =>
        getAttendanceNotes(item, now).map(({ text }) => text);

      expect(texts(MADE_UP)).toEqual(['Con bị ốm', 'Đã hoàn thành học bù: Hôm nay, 17:00']);
      expect(texts(PRESENT)).toEqual([]);
      expect(
        getAttendanceNotes({ ...ABSENT, makeup: { status: 'MISSED', startsAt: at(9, 28) } }, now),
      ).toEqual([
        expect.objectContaining({ text: 'Vắng buổi học bù: Thứ Hai 28/09, 18:00', tone: 'danger' }),
      ]);
    });

    it('groupAttendanceByMonth chia theo thang, giu thu tu dau vao', () => {
      expect(
        groupAttendanceByMonth(ALL_RECORDS).map(({ label, records }) => [
          label,
          records.map(({ sessionId }) => sessionId),
        ]),
      ).toEqual([
        ['Tháng 10/2026', ['present', 'made-up', 'excused']],
        ['Tháng 09/2026', ['absent']],
      ]);
    });

    it('chip loc theo mon sap theo ten, con chi hoc mot mon thi khong can loc', () => {
      expect(getSubjectFilterOptions([PRESENT, ABSENT])).toEqual([]);
      expect(getSubjectFilterOptions([MADE_UP, PRESENT])).toEqual([
        { filter: 'ALL', label: 'Tất cả môn' },
        { filter: 'Toán', label: 'Toán' },
        { filter: 'Vật lý', label: 'Vật lý' },
      ]);

      expect(filterBySubject(ALL_RECORDS, 'Vật lý')).toEqual([MADE_UP]);
      expect(filterBySubject(ALL_RECORDS, 'ALL')).toEqual(ALL_RECORDS);
    });
  });

  describe('bai tap', () => {
    // Thu Sau 16/10/2026
    const NOW = new Date(2026, 9, 16, 10, 0);
    const due = (day: number) => new Date(2026, 9, day, 23, 59).toISOString();
    const submittedOn = (day: number, attemptNo = 1) => ({
      attemptNo,
      submittedAt: new Date(2026, 9, day, 20, 0).toISOString(),
    });
    const gradedOn = (day: number) => ({
      totalScore: 8,
      maxScore: 10,
      feedback: null,
      publishedAt: new Date(2026, 9, day, 20, 0).toISOString(),
    });

    function assignment(id: string, overrides: Partial<StudentAssignment> = {}): StudentAssignment {
      return {
        id,
        testType: null,
        title: `Bài ${id}`,
        subjectName: 'Toán',
        className: 'Toán nâng cao 8A2',
        teacherName: 'Đặng Hải Yến',
        dueAt: due(18),
        maxAttempts: 1,
        questionCounts: { MULTIPLE_CHOICE: 0, ESSAY: 4 },
        submission: null,
        grade: null,
        ...overrides,
      };
    }

    const DUE_TODAY = assignment('due-today', { dueAt: due(16) });
    const DUE_SOON = assignment('due-soon', { dueAt: due(18) });
    const DUE_LATER = assignment('due-later', { dueAt: due(21) });
    const OVERDUE_OLD = assignment('overdue-old', { dueAt: due(10) });
    const OVERDUE_RECENT = assignment('overdue-recent', { dueAt: due(14) });
    const SUBMITTED_OLD = assignment('submitted-old', { submission: submittedOn(12) });
    const SUBMITTED_NEW = assignment('submitted-new', { submission: submittedOn(15) });
    const GRADED_OLD = assignment('graded-old', { submission: submittedOn(5), grade: gradedOn(7) });
    const GRADED_NEW = assignment('graded-new', {
      submission: submittedOn(9),
      grade: gradedOn(11),
    });
    // API tra lung tung thu tu, man hinh phai tu sap xep
    const ALL_ASSIGNMENTS = [
      OVERDUE_OLD,
      GRADED_OLD,
      DUE_LATER,
      SUBMITTED_OLD,
      DUE_TODAY,
      OVERDUE_RECENT,
      GRADED_NEW,
      DUE_SOON,
      SUBMITTED_NEW,
    ];
    const ids = (items: readonly StudentAssignment[]) => items.map(({ id }) => id);

    it('chia tab theo lan nop va diem, dem so bai moi tab', () => {
      expect(getAssignmentTab(DUE_SOON)).toBe('TODO');
      expect(getAssignmentTab(SUBMITTED_NEW)).toBe('SUBMITTED');
      expect(getAssignmentTab(GRADED_NEW)).toBe('GRADED');
      expect(countAssignmentsByTab(ALL_ASSIGNMENTS)).toEqual({ TODO: 5, SUBMITTED: 2, GRADED: 2 });
      expect(countAssignmentsByTab([])).toEqual({ TODO: 0, SUBMITTED: 0, GRADED: 0 });
    });

    it('can lam: bai con han theo han gan nhat, bai qua han xep sau, moi qua han truoc', () => {
      const snapshot = [...ALL_ASSIGNMENTS];

      expect(ids(getTabAssignments(ALL_ASSIGNMENTS, 'TODO', NOW))).toEqual([
        'due-today',
        'due-soon',
        'due-later',
        'overdue-recent',
        'overdue-old',
      ]);
      expect(ALL_ASSIGNMENTS).toEqual(snapshot);
    });

    it('da nop moi nop truoc, da co diem moi cong bo truoc', () => {
      expect(ids(getTabAssignments(ALL_ASSIGNMENTS, 'SUBMITTED', NOW))).toEqual([
        'submitted-new',
        'submitted-old',
      ]);
      expect(ids(getTabAssignments(ALL_ASSIGNMENTS, 'GRADED', NOW))).toEqual([
        'graded-new',
        'graded-old',
      ]);
    });

    it('han nop gan nhat bo qua bai qua han, khong con bai nop duoc thi null', () => {
      expect(findNearestDueAssignment(ALL_ASSIGNMENTS, NOW)).toBe(DUE_TODAY);
      expect(findNearestDueAssignment([OVERDUE_OLD, SUBMITTED_NEW], NOW)).toBeNull();
      expect(findNearestDueAssignment([], NOW)).toBeNull();
    });

    it.each([
      ['han cuoi hom nay', due(16), 'Hạn hôm nay', 'danger', true],
      ['con 2 ngay la gap', due(18), 'Còn 2 ngày', 'danger', true],
      ['con 3 ngay chua gap', due(19), 'Còn 3 ngày', 'neutral', false],
      ['qua han', due(14), 'Quá hạn', 'danger', false],
    ])('getAssignmentDeadline: %s', (_case, dueAt, label, tone, isUrgent) => {
      expect(getAssignmentDeadline(dueAt, NOW)).toMatchObject({ label, tone, isUrgent });
    });

    it('hinh thuc bai theo loai cau hoi va tong so cau', () => {
      expect(getAssignmentFormat({ MULTIPLE_CHOICE: 15, ESSAY: 0 })).toBe('MULTIPLE_CHOICE');
      expect(getAssignmentFormat({ MULTIPLE_CHOICE: 0, ESSAY: 4 })).toBe('ESSAY');
      expect(getAssignmentFormat({ MULTIPLE_CHOICE: 10, ESSAY: 2 })).toBe('MIXED');
      expect(formatQuestionCount({ MULTIPLE_CHOICE: 10, ESSAY: 2 })).toBe('12 câu hỏi');
    });

    it('so lan con duoc nop lai, het han nop thi khong nop lai duoc', () => {
      const multipleChoice = assignment('mc', { maxAttempts: 2, submission: submittedOn(15) });

      expect(getRemainingAttempts(multipleChoice, NOW)).toBe(1);
      expect(getRemainingAttempts({ ...multipleChoice, dueAt: due(15) }, NOW)).toBe(0);
      expect(getRemainingAttempts({ ...multipleChoice, submission: submittedOn(15, 2) }, NOW)).toBe(
        0,
      );
      expect(getRemainingAttempts(SUBMITTED_NEW, NOW)).toBe(0);
    });

    it.each([
      [8.5, 10, 'Tốt'],
      [17, 20, 'Tốt'],
      [7, 10, 'Khá'],
      [12, 20, 'Đạt'],
      [4, 10, 'Chưa đạt'],
      [0, 0, 'Chưa đạt'],
    ])('getGradeLevel: %s/%s quy ve thang 10 -> %s', (totalScore, maxScore, label) => {
      expect(getGradeLevel({ totalScore, maxScore }).label).toBe(label);
    });

    it('formatAssignmentSubmitted hien gio va ngay nop', () => {
      expect(formatAssignmentSubmitted(submittedOn(15).submittedAt)).toBe('Đã nộp: 20:00, 15/10');
    });
  });

  describe('getParentGreeting', () => {
    it('goi phu huynh bang tu cuoi cua ho ten', () => {
      expect(getParentGreeting('Phạm Thu Hà')).toBe('Chào Hà 👋');
    });

    it('chua dat ten thi chao chung', () => {
      expect(getParentGreeting(null)).toBe('Xin chào 👋');
    });
  });
});
