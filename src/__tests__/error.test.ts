import { ApiErrorMessages, ErrorMessages } from '@/constants/messages';
import { AppError } from '@/types/api';
import { getApiErrorMessage, getErrorMessage } from '@/utils/error';

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

  describe('getApiErrorMessage', () => {
    it('tra thong bao tieng Viet theo error.code cua BE', () => {
      expect(getApiErrorMessage('INVITATION_EXPIRED', 410)).toBe(
        ApiErrorMessages.INVITATION_EXPIRED,
      );
    });

    it('nhan dien rate limit bang status 429 vi BE tra code chung', () => {
      expect(getApiErrorMessage('HTTP_ERROR', 429)).toBe(ErrorMessages.tooManyRequests);
    });

    it('khong lo thong bao tieng Anh khi gap code la', () => {
      expect(getApiErrorMessage('SOMETHING_NEW', 418)).toBe(ErrorMessages.unknown);
      expect(getApiErrorMessage(undefined, 502)).toBe(ErrorMessages.unknown);
    });
  });
});
