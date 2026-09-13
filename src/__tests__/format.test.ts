import { getInitials, truncate } from '@/utils/format';

describe('utils/format', () => {
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
