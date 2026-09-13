import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';

import type { LoginInput, RegisterInput } from '../schemas';
import type { LoginResponse, User } from '../types';

export const authApi = {
  async login(payload: LoginInput): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      Endpoints.auth.login,
      payload,
    );
    return data.data;
  },

  async register(payload: Omit<RegisterInput, 'confirmPassword'>): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
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
