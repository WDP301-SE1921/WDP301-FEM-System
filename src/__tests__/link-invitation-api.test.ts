import { ApiErrorMessages, ErrorMessages } from '@/constants/messages';
import {
  INVALID_CODE_MESSAGE,
  INVITATION_ERROR_MESSAGES,
} from '@/features/link-invitation/constants';
import { AppError } from '@/types/api';

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/storage', () => ({
  secureStorage: { get: jest.fn(async () => null), set: jest.fn(), remove: jest.fn() },
  storage: { getJson: jest.fn(async () => null), setJson: jest.fn(), remove: jest.fn() },
}));

/**
 * Chay qua apiClient that (interceptor + unwrap + normalizeError) voi mock bat,
 * de chac code feature giu nguyen khi doi sang BE that.
 */
type ApiModule = typeof import('@/features/link-invitation/api/link-invitation-api');

describe('linkInvitationApi qua apiClient + mock', () => {
  let linkInvitationApi: ApiModule['linkInvitationApi'];

  beforeAll(() => {
    // Config doc env ngay khi import nen phai gan env truoc roi moi nap module
    process.env.EXPO_PUBLIC_API_URL = 'http://mock.test/api/v1';
    process.env.EXPO_PUBLIC_API_MOCK = 'true';
    ({ linkInvitationApi } = jest.requireActual<ApiModule>(
      '@/features/link-invitation/api/link-invitation-api',
    ));
  });

  it('tra InvitationPreview da unwrap', async () => {
    await expect(linkInvitationApi.inspect('DEMOOLD1')).resolves.toMatchObject({
      valid: true,
      mode: 'SIGN_IN',
      studentName: 'Trần Minh Khang',
    });
  });

  it('chuan hoa loi BE thanh AppError tieng Viet', async () => {
    const error = await linkInvitationApi.inspect('DEMOEXP1').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      status: 410,
      code: 'INVITATION_EXPIRED',
      message: ApiErrorMessages.INVITATION_EXPIRED,
    });
  });

  it('dung thong bao theo ngu canh cho ma khong ton tai', async () => {
    const error = await linkInvitationApi.inspect('KHONGCO1').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 404, message: INVALID_CODE_MESSAGE });
  });

  it.each([
    ['DEMOUSE1', 409, INVITATION_ERROR_MESSAGES.SIGN_UP.INVITATION_ALREADY_USED],
    ['DEMOLIMT', 429, ErrorMessages.tooManyRequests],
    ['DEMOFAIL', 500, ErrorMessages.unknown],
  ])('ma %s tra %i voi thong bao tieng Viet hien duoc', async (token, status, message) => {
    const error = await linkInvitationApi.inspect(token).catch((e: unknown) => e);
    expect(error).toMatchObject({ status, message });
  });
});
