import { addChildSchema } from '@/features/children/schemas';
import {
  formatBirthDate,
  formatBirthDateInput,
  parseBirthDate,
  toChildFormDefaults,
  toCreateChildPayload,
  toUpdateChildPayload,
} from '@/features/children/utils';
import { addDays, startOfDay, toDateKey } from '@/utils/date';

const VALID_INPUT = { fullName: 'Nguyễn Gia Huy', grade: 7, dateOfBirth: '20/05/2014' };

function firstErrorMessage(input: unknown): string | undefined {
  const result = addChildSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('features/children', () => {
  describe('formatBirthDateInput', () => {
    it('chen dau / khi go tung chu so', () => {
      expect(formatBirthDateInput('1')).toBe('1');
      expect(formatBirthDateInput('150')).toBe('15/0');
      expect(formatBirthDateInput('15082')).toBe('15/08/2');
      expect(formatBirthDateInput('15082013')).toBe('15/08/2013');
    });

    it('xoa lui qua dau / khong de lai dau / thua', () => {
      expect(formatBirthDateInput('15/')).toBe('15');
      expect(formatBirthDateInput('15/08/')).toBe('15/08');
    });

    it('giu dung chuoi dan vao, bo ky tu la va chu so thua', () => {
      expect(formatBirthDateInput('15/08/2013')).toBe('15/08/2013');
      expect(formatBirthDateInput('15-08-2013 ')).toBe('15/08/2013');
      expect(formatBirthDateInput('150820139')).toBe('15/08/2013');
    });
  });

  describe('parseBirthDate', () => {
    it('doc ngay dd/mm/yyyy', () => {
      expect(parseBirthDate('20/05/2014')).toEqual(new Date(2014, 4, 20));
    });

    it.each(['', '20/05/14', '2014-05-20', '31/02/2014', '00/05/2014', '20/13/2014'])(
      'tra null voi "%s"',
      (text) => {
        expect(parseBirthDate(text)).toBeNull();
      },
    );
  });

  describe('addChildSchema', () => {
    it('chap nhan du lieu hop le, ngay sinh co the bo trong', () => {
      expect(addChildSchema.safeParse(VALID_INPUT).success).toBe(true);
      expect(addChildSchema.safeParse({ ...VALID_INPUT, dateOfBirth: '' }).success).toBe(true);
    });

    it('bat buoc ho ten va lop', () => {
      expect(firstErrorMessage({ ...VALID_INPUT, fullName: '  ' })).toBe(
        'Vui lòng nhập họ tên của con',
      );
      expect(firstErrorMessage({ ...VALID_INPUT, grade: undefined })).toBe(
        'Vui lòng chọn lớp của con',
      );
      expect(firstErrorMessage({ ...VALID_INPUT, grade: 10 })).toBe('Vui lòng chọn lớp của con');
    });

    it('chan ngay sinh sai hoac sau hom nay', () => {
      expect(firstErrorMessage({ ...VALID_INPUT, dateOfBirth: '31/02/2014' })).toBe(
        'Ngày sinh không hợp lệ, nhập theo dạng ngày/tháng/năm',
      );
      expect(firstErrorMessage({ ...VALID_INPUT, dateOfBirth: '20/05' })).toBe(
        'Ngày sinh không hợp lệ, nhập theo dạng ngày/tháng/năm',
      );

      const tomorrow = toDateKey(addDays(startOfDay(new Date()), 1))
        .split('-')
        .reverse()
        .join('/');
      expect(firstErrorMessage({ ...VALID_INPUT, dateOfBirth: tomorrow })).toBe(
        'Ngày sinh không được sau hôm nay',
      );
    });
  });

  describe('toCreateChildPayload', () => {
    it('doi ngay sinh sang YYYY-MM-DD va cat khoang trang cua ho ten', () => {
      expect(
        toCreateChildPayload({ fullName: ' Nguyễn Gia Huy ', grade: 7, dateOfBirth: '20/05/2014' }),
      ).toEqual({ fullName: 'Nguyễn Gia Huy', grade: 7, dateOfBirth: '2014-05-20' });
    });

    it('khong gui ngay sinh khi bo trong', () => {
      expect(
        toCreateChildPayload({ fullName: 'Nguyễn Gia Huy', grade: 7, dateOfBirth: '' }),
      ).toEqual({ fullName: 'Nguyễn Gia Huy', grade: 7 });
    });
  });

  describe('formatBirthDate', () => {
    it('doi cot ngay cua BE sang dd/mm/yyyy, khong lech ngay theo mui gio', () => {
      expect(formatBirthDate('2013-03-15T00:00:00.000Z')).toBe('15/03/2013');
      expect(formatBirthDate('2014-05-20')).toBe('20/05/2014');
    });

    it('chua co ngay sinh hoac sai dinh dang thi tra chuoi rong', () => {
      expect(formatBirthDate(null)).toBe('');
      expect(formatBirthDate('15/03/2013')).toBe('');
    });
  });

  describe('toUpdateChildPayload', () => {
    it('gui du ba field, ngay sinh bo trong thi gui null de xoa ngay sinh cu', () => {
      expect(
        toUpdateChildPayload({ fullName: ' Nguyễn Gia Huy ', grade: 7, dateOfBirth: '20/05/2014' }),
      ).toEqual({ fullName: 'Nguyễn Gia Huy', grade: 7, dateOfBirth: '2014-05-20' });
      expect(
        toUpdateChildPayload({ fullName: 'Nguyễn Gia Huy', grade: 8, dateOfBirth: '' }),
      ).toEqual({ fullName: 'Nguyễn Gia Huy', grade: 8, dateOfBirth: null });
    });
  });

  describe('toChildFormDefaults', () => {
    const child = { id: 'student-1', fullName: 'Nguyễn Minh Anh', grade: 8 };

    it('lay ho ten, khoi va ngay sinh hien tai lam gia tri ban dau cua form', () => {
      expect(toChildFormDefaults({ ...child, dateOfBirth: '2013-03-15T00:00:00.000Z' })).toEqual({
        fullName: 'Nguyễn Minh Anh',
        grade: 8,
        dateOfBirth: '15/03/2013',
      });
    });

    it('khoi ngoai 6-9 thi de trong cho phu huynh chon lai', () => {
      expect(toChildFormDefaults({ ...child, grade: 10, dateOfBirth: null })).toEqual({
        fullName: 'Nguyễn Minh Anh',
        grade: undefined,
        dateOfBirth: '',
      });
    });
  });
});
