import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { AuthSession, User } from '@/types/auth';

import type { LoginInput } from '../schemas';
import type { RegisterPayload } from '../types';

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
};
