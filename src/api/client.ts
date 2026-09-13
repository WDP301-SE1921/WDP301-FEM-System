import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { Config } from '@/constants/config';
import { StorageKeys } from '@/constants/storage-keys';
import { logger } from '@/lib/logger';
import { secureStorage } from '@/lib/storage';
import { AppError, type ApiErrorBody } from '@/types/api';

import { Endpoints } from './endpoints';

export const apiClient = axios.create({
  baseURL: Config.apiUrl,
  timeout: Config.requestTimeout,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Auth store dang ky callback nay de tranh vong lap import
 * (client -> store -> client).
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// --- Request: gan access token ---
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.get(StorageKeys.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  logger.debug(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// --- Response: tu dong refresh token khi gap 401 ---
type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.get(StorageKeys.refreshToken);
  if (!refreshToken) return null;

  try {
    // Dung axios goc de khong bi interceptor bat lai -> vong lap vo han
    const { data } = await axios.post(`${Config.apiUrl}${Endpoints.auth.refresh}`, {
      refreshToken,
    });
    const accessToken: string | undefined = data?.data?.accessToken ?? data?.accessToken;
    if (!accessToken) return null;

    await secureStorage.set(StorageKeys.accessToken, accessToken);
    return accessToken;
  } catch (error) {
    logger.warn('Refresh token that bai', error);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;

      // Gom nhieu request 401 dong thoi vao 1 lan refresh
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      }

      onUnauthorized?.();
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Bien loi axios thanh AppError de UI xu ly thong nhat. */
function normalizeError(error: AxiosError<ApiErrorBody>): AppError {
  if (error.response) {
    const body = error.response.data;
    return new AppError(
      body?.message ?? 'Da co loi xay ra, vui long thu lai.',
      error.response.status,
      body?.errors,
    );
  }
  if (error.code === 'ECONNABORTED') {
    return new AppError('Yeu cau qua thoi gian cho. Kiem tra ket noi mang.');
  }
  return new AppError('Khong ket noi duoc toi may chu.');
}
