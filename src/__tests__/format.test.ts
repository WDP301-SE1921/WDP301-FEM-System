import {
  formatDate,
  formatDayMonth,
  formatRelativeTime,
  formatShortWeekday,
  formatTime,
  formatWeekdayDate,
  getInitials,
  getShortName,
  truncate,
} from '@/utils/format';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

describe('utils/format', () => {
  describe('formatDate', () => {
    it('format theo dd/mm/yyyy', () => {
      expect(formatDate(new Date(2026, 8, 27))).toBe('27/09/2026');
    });

    it('tra -- khi ngay khong hop le', () => {
      expect(formatDate('khong-phai-ngay')).toBe('--');
    });
  });

  describe('formatTime', () => {
    it('format HH:mm theo gio may, them so 0 o dau', () => {
      expect(formatTime(new Date(2026, 9, 16, 8, 5))).toBe('08:05');
      expect(formatTime(new Date(2026, 9, 16, 18, 30))).toBe('18:30');
    });

    it('tra -- khi ngay khong hop le', () => {
      expect(formatTime('khong-phai-ngay')).toBe('--');
    });
  });

  describe('formatWeekdayDate', () => {
    it('ghi thu tieng Viet kem ngay/thang', () => {
      expect(formatWeekdayDate(new Date(2026, 9, 12))).toBe('Thứ Hai 12/10');
      expect(formatWeekdayDate(new Date(2026, 9, 18))).toBe('Chủ nhật 18/10');
    });
  });

  describe('formatDayMonth', () => {
    it('ghi dd/mm, them so 0 o dau', () => {
      expect(formatDayMonth(new Date(2026, 0, 5))).toBe('05/01');
    });

    it('tra -- khi ngay khong hop le', () => {
      expect(formatDayMonth('khong-phai-ngay')).toBe('--');
    });
  });

  describe('formatShortWeekday', () => {
    it('ghi T2..T7 va CN', () => {
      expect(formatShortWeekday(new Date(2026, 9, 12))).toBe('T2');
      expect(formatShortWeekday(new Date(2026, 9, 17))).toBe('T7');
      expect(formatShortWeekday(new Date(2026, 9, 18))).toBe('CN');
    });

    it('tra -- khi ngay khong hop le', () => {
      expect(formatShortWeekday('khong-phai-ngay')).toBe('--');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date(2026, 9, 16, 12, 0);
    const ago = (ms: number) => new Date(now.getTime() - ms);

    it.each([
      ['duoi 1 phut', ago(30 * 1000), 'Vừa xong'],
      ['thoi diem o tuong lai (lech gio may)', ago(-5 * MINUTE_MS), 'Vừa xong'],
      ['duoi 1 gio', ago(15 * MINUTE_MS), '15 phút trước'],
      ['duoi 1 ngay', ago(2 * HOUR_MS), '2 giờ trước'],
      ['1 ngay', ago(26 * HOUR_MS), 'Hôm qua'],
      ['duoi 1 tuan', ago(3 * DAY_MS), '3 ngày trước'],
      ['tu 1 tuan tro len', ago(8 * DAY_MS), '08/10/2026'],
    ])('%s', (_case, value, expected) => {
      expect(formatRelativeTime(value, now)).toBe(expected);
    });

    it('nhan chuoi ISO', () => {
      expect(formatRelativeTime(ago(HOUR_MS).toISOString(), now)).toBe('1 giờ trước');
    });
  });

  describe('getShortName', () => {
    it('lay 2 tu cuoi mac dinh, bo khoang trang thua', () => {
      expect(getShortName('  Nguyễn   Minh Anh ')).toBe('Minh Anh');
    });

    it('lay ten goi khi wordCount = 1, ten ngan hon giu nguyen', () => {
      expect(getShortName('Phạm Thu Hà', 1)).toBe('Hà');
      expect(getShortName('Hà')).toBe('Hà');
    });
  });

  describe('getInitials', () => {
    it('lay 2 chu cai cuoi cua ho ten', () => {
      expect(getInitials('Le Phuc Thanh Nhan')).toBe('TN');
    });

    it('xu ly ten mot tu', () => {
      expect(getInitials('Nhan')).toBe('N');
    });
  });

  describe('truncate', () => {
    it('giu nguyen chuoi ngan', () => {
      expect(truncate('abc', 10)).toBe('abc');
    });

    it('cat chuoi dai va them dau ...', () => {
      expect(truncate('abcdefghij', 5)).toBe('abcd…');
    });
  });
});
