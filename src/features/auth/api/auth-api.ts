import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { appendImageToForm, type PickedImage } from '@/lib/image-picker';
import { AppError, type ApiResponse } from '@/types/api';
import type { AuthSession, User } from '@/types/auth';

import type { LoginInput } from '../schemas';
import type {
  AvatarAccess,
  ChangePasswordPayload,
  RegisterPayload,
  ResendVerificationResult,
  UpdateProfilePayload,
  VerifyEmailPayload,
} from '../types';

/** Anh dai dien toi da 5 MB, BE con day tiep len kho luu tru (cho toi 30 giay). */
const AVATAR_UPLOAD_TIMEOUT_MS = 60_000;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_SERVICE_UNAVAILABLE = 503;
const AVATAR_TOO_LARGE_MESSAGE = 'Ảnh đại diện phải nhỏ hơn 5 MB.';

/**
 * Thong bao khi gui anh dai dien loi. `INVALID_FILE_SIZE` dung chung voi anh bai lam (10 MB) nen phai
 * ghi de; anh vuot gioi han cua BE va kho luu tru loi chi co ma chung `HTTP_ERROR`, phan biet bang
 * status.
 */
const AVATAR_UPLOAD_CODE_MESSAGES: Partial<Record<string, string>> = {
  INVALID_FILE_SIZE: AVATAR_TOO_LARGE_MESSAGE,
};
const AVATAR_UPLOAD_STATUS_MESSAGES: Partial<Record<number, string>> = {
  [HTTP_PAYLOAD_TOO_LARGE]: AVATAR_TOO_LARGE_MESSAGE,
  [HTTP_SERVICE_UNAVAILABLE]: 'Chưa lưu được ảnh đại diện lúc này. Vui lòng thử lại sau.',
};

function toAvatarUploadError(error: unknown): unknown {
  if (!(error instanceof AppError)) return error;
  const message =
    (error.code ? AVATAR_UPLOAD_CODE_MESSAGES[error.code] : undefined) ??
    AVATAR_UPLOAD_STATUS_MESSAGES[error.status ?? 0];
  return message ? new AppError(message, error.status, error.code) : error;
}

export const authApi = {
  async login(payload: LoginInput): Promise<AuthSession> {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(Endpoints.auth.login, payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      Endpoints.auth.register,
      payload,
    );
    return data.data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>(Endpoints.auth.me);
    return data.data;
  },

  /** Sua ten hien thi va so dien thoai. BE tra tai khoan da sua, khong kem so dien thoai. */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await apiClient.patch<ApiResponse<User>>(Endpoints.auth.me, payload);
    return data.data;
  },

  /**
   * Doi mat khau. BE giu phien hien tai va dang xuat cac thiet bi khac; sai mat khau hien tai thi tra
   * 400 `AUTH_CURRENT_PASSWORD_INVALID`.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post(Endpoints.auth.changePassword, payload);
  },

  /**
   * Gui email chua lien ket dat lai mat khau (trang web cua trung tam). BE luon tra thanh cong de khong
   * lo email nao da dang ky.
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(Endpoints.auth.forgotPassword, { email });
  },

  /** Link xem anh dai dien; `url` null khi tai khoan chua co anh. */
  async getAvatar(): Promise<AvatarAccess> {
    const { data } = await apiClient.get<ApiResponse<AvatarAccess>>(Endpoints.auth.avatar);
    return data.data;
  },

  /** Thay anh dai dien (PNG hoac JPEG toi da 5 MB), BE tra link xem anh moi. */
  async uploadAvatar(image: PickedImage): Promise<AvatarAccess> {
    const form = new FormData();
    await appendImageToForm(form, 'file', image);
    try {
      const { data } = await apiClient.put<ApiResponse<AvatarAccess>>(Endpoints.auth.avatar, form, {
        // apiClient mac dinh gui JSON: axios se doi FormData thanh JSON neu khong doi header
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: AVATAR_UPLOAD_TIMEOUT_MS,
      });
      return data.data;
    } catch (error) {
      throw toAvatarUploadError(error);
    }
  },

  /** Go anh dai dien. Tai khoan chua co anh thi BE van tra thanh cong. */
  async deleteAvatar(): Promise<void> {
    await apiClient.delete(Endpoints.auth.avatar);
  },

  async logout(): Promise<void> {
    await apiClient.post(Endpoints.auth.logout);
  },

  /**
   * Thu hoi phien BE vua tao nhung app khong luu (tai khoan khong dung app mobile). Token chua nam
   * trong SecureStore nen interceptor khong gan, phai gan header o day.
   */
  async revokeSession(accessToken: string): Promise<void> {
    await apiClient.post(Endpoints.auth.logout, undefined, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  /**
   * Xac minh email bang ma 6 so BE gui qua email. Ma sai, da dung, qua 15 phut hay da co ma moi hon
   * thi BE tra 400; sai 5 lan thi ma do het hieu luc.
   */
  async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    await apiClient.post(Endpoints.auth.verifyEmail, payload);
  },

  /** Gui lai email chua ma xac minh toi `email`. */
  async resendVerification(email: string): Promise<ResendVerificationResult> {
    const { data } = await apiClient.post<ApiResponse<ResendVerificationResult>>(
      Endpoints.auth.resendVerification,
      { email },
    );
    return data.data;
  },
};
