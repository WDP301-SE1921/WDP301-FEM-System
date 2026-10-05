import { CENTER_NAME } from '@/features/parent-dashboard/constants';
import type {
  StudentRegistration,
  TuitionClass,
  TuitionEnrollment,
  TuitionPayment,
  TuitionReceipt,
} from '@/features/parent-dashboard/types';
import {
  buildReceiptShareMessage,
  countTermSessions,
  formatAmount,
  formatAmountInWords,
  formatApiDate,
  formatPackageLabel,
  formatTermPeriod,
  getActivePackages,
  getMonthlyFee,
  getPaymentHistory,
  getPendingRegistrations,
  getTermStatus,
  parseAmount,
  parseApiDate,
  readVietnameseNumber,
} from '@/features/parent-dashboard/utils';
import { toDateKey } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

/** Thu Sau 16/10/2026. */
const NOW = new Date(2026, 9, 16, 10, 0);

const MATH_CLASS: TuitionClass = {
  id: 'class-1',
  name: 'Toán nâng cao 8A2',
  program: { name: 'Toán 8 – Chuyên đề nâng cao', subject: 'Toán', grade: 8 },
  // Thu Hai va thu Nam
  weeklySchedules: [
    { weekday: 1, startTime: '18:00', endTime: '19:30' },
    { weekday: 4, startTime: '18:00', endTime: '19:30' },
  ],
};

/** Cot ngay cua Prisma ra JSON la 00:00 UTC. */
function dateColumn(dateKey: string): string {
  return `${dateKey}T00:00:00.000Z`;
}

function payment(receiptNumber: string, confirmedAt: Date): TuitionPayment {
  return {
    id: `payment-${receiptNumber}`,
    amount: '3600000',
    currency: 'VND',
    status: 'CONFIRMED',
    confirmedAt: confirmedAt.toISOString(),
    receiptNumber,
  };
}

function enrollment(id: string, overrides: Partial<TuitionEnrollment> = {}): TuitionEnrollment {
  return {
    id,
    registrationOrderId: `order-${id}`,
    packageMonths: 1,
    status: 'ACTIVE',
    // Thu Hai 05/10 toi het thu Tu 04/11
    startDate: dateColumn('2026-10-05'),
    endDate: dateColumn('2026-11-05'),
    activatedAt: new Date(2026, 9, 2, 9, 30).toISOString(),
    class: MATH_CLASS,
    registrationOrder: { payment: payment(`PT-${id}`, new Date(2026, 9, 2, 9, 30)) },
    ...overrides,
  };
}

describe('features/parent-dashboard/utils: hoc phi', () => {
  describe('ngay va so tien cua API', () => {
    it.each([
      ['cot ngay 00:00 UTC cua ghi danh', '2026-10-05T00:00:00.000Z'],
      ['ngay YYYY-MM-DD cua bien lai', '2026-10-05'],
    ])('parseApiDate giu dung ngay cua %s', (_case, value) => {
      const date = parseApiDate(value);

      expect(date && toDateKey(date)).toBe('2026-10-05');
      expect(formatApiDate(value)).toBe('05/10/2026');
    });

    it('khong co ngay hoac sai dinh dang thi tra null va hien --', () => {
      expect(parseApiDate(null)).toBeNull();
      expect(parseApiDate('05/10/2026')).toBeNull();
      expect(formatApiDate(null)).toBe('--');
    });

    it.each([
      ['chuoi Decimal', '3600000', 3_600_000],
      ['chuoi co phan le', '3600000.50', 3_600_000.5],
      ['so cua bien lai', 2_400_000, 2_400_000],
      ['chuoi rong', '', null],
      ['khong phai so', 'abc', null],
    ])('parseAmount: %s', (_case, value, expected) => {
      expect(parseAmount(value)).toBe(expected);
    });

    it('formatAmount hien tien Viet, khong doc duoc thi hien --', () => {
      expect(formatAmount('3600000', 'VND')).toBe(formatCurrency(3_600_000));
      expect(formatAmount('abc')).toBe('--');
    });

    it('nhan goi hoc va ky hoc', () => {
      expect(formatPackageLabel(3)).toBe('Gói 3 tháng');
      expect(formatTermPeriod(dateColumn('2026-10-05'))).toBe('Kỳ 10/2026');
      expect(formatTermPeriod(null)).toBe('Kỳ --');
    });
  });

  describe('getTermStatus', () => {
    it.each([
      ['dang trong ky', '2026-10-05', '2027-01-05', 'CURRENT'],
      ['bat dau dung hom nay', '2026-10-16', '2027-01-16', 'CURRENT'],
      ['chua toi ngay bat dau', '2026-10-17', '2027-01-17', 'UPCOMING'],
      ['het han ngay mai', '2026-07-17', '2026-10-17', 'CURRENT'],
      ['ngay het han la hom nay, khong thuoc ky hoc', '2026-07-16', '2026-10-16', 'EXPIRED'],
    ])('ghi danh ACTIVE %s', (_case, startDate, endDate, expected) => {
      const term = { startDate: dateColumn(startDate), endDate: dateColumn(endDate) };
      expect(getTermStatus(enrollment('a', term), NOW)).toBe(expected);
    });

    it('ghi danh ENDED luon het han; thieu ngay thi coi la dang hoc', () => {
      expect(getTermStatus(enrollment('a', { status: 'ENDED' }), NOW)).toBe('EXPIRED');
      expect(getTermStatus(enrollment('a', { startDate: null, endDate: null }), NOW)).toBe(
        'CURRENT',
      );
    });
  });

  describe('danh sach tren man hinh hoc phi', () => {
    const CURRENT = enrollment('current');
    const UPCOMING = enrollment('upcoming', {
      startDate: dateColumn('2026-11-02'),
      endDate: dateColumn('2027-02-02'),
      registrationOrder: { payment: payment('PT-upcoming', new Date(2026, 9, 14, 9, 30)) },
    });
    const EXPIRED = enrollment('expired', {
      status: 'ENDED',
      startDate: dateColumn('2026-06-01'),
      endDate: dateColumn('2026-08-01'),
      registrationOrder: { payment: payment('PT-expired', new Date(2026, 4, 29, 9, 30)) },
    });
    const UNPAID = enrollment('unpaid', { registrationOrder: { payment: null } });

    it('goi dang ap dung bo goi het han, giu thu tu cua API', () => {
      const ids = getActivePackages([EXPIRED, UPCOMING, CURRENT], NOW).map(({ id }) => id);
      expect(ids).toEqual(['upcoming', 'current']);
    });

    it('lich su dong hoc phi moi xac nhan truoc, bo ghi danh chua co thanh toan', () => {
      const enrollments = [EXPIRED, UNPAID, CURRENT, UPCOMING];

      expect(getPaymentHistory(enrollments).map(({ id }) => id)).toEqual([
        'upcoming',
        'current',
        'expired',
      ]);
      expect(enrollments.map(({ id }) => id)).toEqual(['expired', 'unpaid', 'current', 'upcoming']);
    });

    it('don cho xac nhan chi gom don DRAFT', () => {
      const registration = (id: string, status: StudentRegistration['status']) => ({
        id,
        status,
        packageMonths: 2,
        quotedAmount: '1200000',
        currency: 'VND',
        startDate: dateColumn('2026-10-22'),
        endDate: dateColumn('2026-12-22'),
        createdAt: NOW.toISOString(),
        class: MATH_CLASS,
      });
      const registrations = [
        registration('completed', 'COMPLETED'),
        registration('draft', 'DRAFT'),
        registration('cancelled', 'CANCELLED'),
      ];

      expect(getPendingRegistrations(registrations).map(({ id }) => id)).toEqual(['draft']);
    });
  });

  describe('countTermSessions', () => {
    it('dem buoi theo lich co dinh trong [startDate, endDate), buoi da qua tinh toi hom qua', () => {
      // Thu Hai: 05, 12, 19, 26/10 va 02/11. Thu Nam: 08, 15, 22, 29/10 (05/11 la ngay het han)
      expect(countTermSessions(enrollment('a'), NOW)).toEqual({ elapsed: 4, total: 9 });
    });

    it('buoi cua hom nay chua tinh la da qua', () => {
      const thursday = new Date(2026, 9, 15, 21, 0);
      expect(countTermSessions(enrollment('a'), thursday)).toEqual({ elapsed: 3, total: 9 });
    });

    it('truoc ngay bat dau chua qua buoi nao, sau ngay het han da qua het', () => {
      expect(countTermSessions(enrollment('a'), new Date(2026, 9, 1))).toEqual({
        elapsed: 0,
        total: 9,
      });
      expect(countTermSessions(enrollment('a'), new Date(2026, 11, 1))).toEqual({
        elapsed: 9,
        total: 9,
      });
    });

    it('Chu nhat la thu 7 cua ISO; hai khung gio cung thu tinh hai buoi', () => {
      const withSlots = (weekdays: number[]) =>
        enrollment('a', {
          class: {
            ...MATH_CLASS,
            weeklySchedules: weekdays.map((weekday) => ({
              weekday,
              startTime: '08:00',
              endTime: '09:30',
            })),
          },
        });

      // Chu nhat: 11, 18, 25/10 va 01/11
      expect(countTermSessions(withSlots([7]), NOW)).toEqual({ elapsed: 1, total: 4 });
      expect(countTermSessions(withSlots([1, 1]), NOW)).toEqual({ elapsed: 4, total: 10 });
    });

    it('thieu ngay hoac lop chua co lich thi tra null', () => {
      expect(countTermSessions(enrollment('a', { endDate: null }), NOW)).toBeNull();
      expect(
        countTermSessions(enrollment('a', { class: { ...MATH_CLASS, weeklySchedules: [] } }), NOW),
      ).toBeNull();
    });
  });

  describe('doc so tien bang chu', () => {
    it.each([
      [0, 'không'],
      [5, 'năm'],
      [10, 'mười'],
      [11, 'mười một'],
      [15, 'mười lăm'],
      [21, 'hai mươi mốt'],
      [55, 'năm mươi lăm'],
      [101, 'một trăm linh một'],
      [105, 'một trăm linh năm'],
      [110, 'một trăm mười'],
      [1_000, 'một nghìn'],
      [1_005, 'một nghìn không trăm linh năm'],
      [1_050, 'một nghìn không trăm năm mươi'],
      [1_200_000, 'một triệu hai trăm nghìn'],
      [3_600_000, 'ba triệu sáu trăm nghìn'],
      [12_345_678, 'mười hai triệu ba trăm bốn mươi lăm nghìn sáu trăm bảy mươi tám'],
      [1_000_000_000, 'một tỷ'],
      [2_000_000_500, 'hai tỷ năm trăm'],
    ])('readVietnameseNumber(%i) -> %s', (value, expected) => {
      expect(readVietnameseNumber(value)).toBe(expected);
    });

    it.each([
      ['so am', -1],
      ['so le', 1.5],
      ['tu mot nghin ty', 1_000_000_000_000],
      ['NaN', Number.NaN],
    ])('readVietnameseNumber khong doc %s', (_case, value) => {
      expect(readVietnameseNumber(value)).toBeNull();
    });

    it('formatAmountInWords viet hoa chu dau va them "đồng chẵn"', () => {
      expect(formatAmountInWords(3_600_000)).toBe('Ba triệu sáu trăm nghìn đồng chẵn');
      expect(formatAmountInWords(0)).toBe('Không đồng');
      expect(formatAmountInWords(1_200_000.5)).toBeNull();
    });
  });

  describe('bien lai', () => {
    const RECEIPT: TuitionReceipt = {
      registrationId: 'order-1',
      status: 'COMPLETED',
      parentEmail: 'phuhuynh@example.com',
      student: { fullName: 'Nguyễn Minh Anh', grade: 8 },
      class: {
        id: 'class-1',
        name: 'Toán nâng cao 8A2',
        subject: 'Toán',
        grade: 8,
        schedules: MATH_CLASS.weeklySchedules,
      },
      term: { packageMonths: 3, startDate: '2026-10-05', endDate: '2027-01-05' },
      payment: {
        id: 'payment-1',
        receiptNumber: 'PT-1082',
        amount: 3_600_000,
        currency: 'VND',
        confirmedAt: new Date(2026, 9, 2, 9, 30).toISOString(),
      },
      quotedAmount: 3_600_000,
      currency: 'VND',
    };

    it('hoc phi moi thang bang hoc phi bao gia chia so thang', () => {
      expect(getMonthlyFee(RECEIPT)).toBe(1_200_000);
      expect(getMonthlyFee({ ...RECEIPT, term: { ...RECEIPT.term, packageMonths: 0 } })).toBeNull();
    });

    it('noi dung chia se gom ma bien lai, hoc sinh, lop, ky hoc, so tien va ngay thu', () => {
      expect(buildReceiptShareMessage(RECEIPT).split('\n')).toEqual([
        'Biên lai thu học phí #PT-1082',
        CENTER_NAME,
        'Học sinh: Nguyễn Minh Anh (khối 8)',
        'Lớp: Toán nâng cao 8A2',
        'Gói 3 tháng: bắt đầu 05/10/2026, hết hạn 05/01/2027',
        `Số tiền đã thu: ${formatCurrency(3_600_000)}`,
        'Ngày thu: 02/10/2026',
      ]);
    });
  });
});
