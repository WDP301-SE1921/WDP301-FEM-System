import { LEAVE_REASON_MAX_LENGTH, sessionLeaveSchema } from '@/features/parent-dashboard/schemas';

describe('features/parent-dashboard/schemas', () => {
  describe('sessionLeaveSchema', () => {
    it('nhan ly do va bo khoang trang hai dau', () => {
      expect(sessionLeaveSchema.parse({ reason: '  Con bị ốm  ' })).toEqual({
        reason: 'Con bị ốm',
      });
    });

    it('bao loi khi de trong hoac chi co khoang trang', () => {
      const result = sessionLeaveSchema.safeParse({ reason: '   ' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Nhập lý do xin nghỉ để trung tâm biết.');
    });

    it('chan ly do dai hon gioi han cua BE', () => {
      expect(
        sessionLeaveSchema.safeParse({ reason: 'a'.repeat(LEAVE_REASON_MAX_LENGTH + 1) }).success,
      ).toBe(false);
      expect(
        sessionLeaveSchema.safeParse({ reason: 'a'.repeat(LEAVE_REASON_MAX_LENGTH) }).success,
      ).toBe(true);
    });
  });
});
