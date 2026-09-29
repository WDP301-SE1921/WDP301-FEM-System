import {
  addDays,
  diffInCalendarDays,
  parseDateKey,
  startOfDay,
  startOfWeek,
  toDateKey,
} from '@/utils/date';

describe('utils/date', () => {
  describe('startOfDay', () => {
    it('ve 00:00 cung ngay', () => {
      expect(startOfDay(new Date(2026, 9, 16, 18, 30))).toEqual(new Date(2026, 9, 16));
    });
  });

  describe('addDays', () => {
    it('cong qua cuoi thang, giu nguyen gio', () => {
      expect(addDays(new Date(2026, 9, 30, 8, 15), 3)).toEqual(new Date(2026, 10, 2, 8, 15));
    });

    it('tru ngay khi so am', () => {
      expect(addDays(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31));
    });
  });

  describe('startOfWeek', () => {
    it.each([
      ['Thu Hai', new Date(2026, 9, 12, 9, 0)],
      ['giua tuan', new Date(2026, 9, 15, 20, 0)],
      ['Chu nhat la ngay cuoi tuan', new Date(2026, 9, 18, 23, 59)],
    ])('%s -> 00:00 Thu Hai 12/10', (_case, date) => {
      expect(startOfWeek(date)).toEqual(new Date(2026, 9, 12));
    });

    it('tuan qua nam moi', () => {
      expect(startOfWeek(new Date(2027, 0, 1))).toEqual(new Date(2026, 11, 28));
    });
  });

  describe('diffInCalendarDays', () => {
    it('dem theo ngay lich, bo qua gio', () => {
      expect(diffInCalendarDays(new Date(2026, 9, 16, 23, 0), new Date(2026, 9, 17, 1, 0))).toBe(1);
      expect(diffInCalendarDays(new Date(2026, 9, 16), new Date(2026, 9, 16, 22, 0))).toBe(0);
    });

    it('am khi ngay dich o truoc', () => {
      expect(diffInCalendarDays(new Date(2026, 9, 16), new Date(2026, 9, 9))).toBe(-7);
    });
  });

  describe('toDateKey / parseDateKey', () => {
    it('ghi YYYY-MM-DD theo gio may va doc nguoc lai 00:00', () => {
      expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
      expect(parseDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5));
    });

    it.each(['2026-1-5', '2026-02-30', '2026-13-01', '', 'khong-phai-ngay'])(
      'tra null voi "%s"',
      (key) => {
        expect(parseDateKey(key)).toBeNull();
      },
    );
  });
});
