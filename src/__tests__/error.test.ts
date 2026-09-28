import { ErrorMessages } from '@/constants/messages';
import { AppError } from '@/types/api';
import { getErrorMessage } from '@/utils/error';

describe('utils/error', () => {
  describe('getErrorMessage', () => {
    it('tra message cua AppError', () => {
      expect(getErrorMessage(new AppError('Sai mật khẩu', 401))).toBe('Sai mật khẩu');
    });

    it('an chi tiet ky thuat cua loi khac', () => {
      expect(getErrorMessage(new TypeError('undefined is not a function'))).toBe(
        ErrorMessages.unknown,
      );
    });

    it('dung fallback truyen vao', () => {
      expect(getErrorMessage('loi la', 'Không tải được dữ liệu')).toBe('Không tải được dữ liệu');
    });
  });
});
