import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { AuthSession, User } from '@/types/auth';

import type { LoginInput, VerifyEmailInput } from '../schemas';
import type { RegisterPayload, ResendVerificationResult } from '../types';

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

  async logout(): Promise<void> {
    await apiClient.post(Endpoints.auth.logout);
  },

  /** Xac minh email bang ma BE gui qua email. Ma sai, da dung hoac qua 24 gio thi BE tra 400. */
  async verifyEmail(payload: VerifyEmailInput): Promise<void> {
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
