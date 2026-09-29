import { WEEKS_AFTER, WEEKS_BEFORE } from '@/features/parent-dashboard/constants';
import type { ScheduleSession } from '@/features/parent-dashboard/types';
import {
  buildWeekDays,
  findNextFreeDay,
  formatScore,
  formatScoreChange,
  formatWeekRange,
  getAttendanceRate,
  getDayPeriod,
  getDefaultDayOfWeek,
  getRelativeWeekLabel,
  getScoreLevel,
  getScoreTrend,
  getSessionStatus,
  getWeekOptions,
  getWeekRange,
} from '@/features/parent-dashboard/utils';

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
  });
});
