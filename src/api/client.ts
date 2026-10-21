import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { Config } from '@/constants/config';
import { ErrorMessages } from '@/constants/messages';
import { StorageKeys } from '@/constants/storage-keys';
import { logger } from '@/lib/logger';
import { secureStorage } from '@/lib/storage';
import { AppError, type ApiErrorBody, type ApiResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';
import { getApiErrorMessage } from '@/utils/error';

import { Endpoints } from './endpoints';
import { MOCK_ROUTES, mockAdapter } from './mocks';
import { createApiAdapter, WIRED_ROUTES } from './wired-routes';

/**
 * `baseURL` chi co tac dung voi endpoint da wire (`./wired-routes.ts`): adapter chi cho cac endpoint
 * do ra BE that, moi request khac do server gia (`./mocks`) tra loi va khong ra mang.
 */
const clientConfig = {
  baseURL: Config.apiUrl,
  timeout: Config.requestTimeout,
  headers: { 'Content-Type': 'application/json' },
  adapter: createApiAdapter(mockAdapter, () => axios.getAdapter(axios.defaults.adapter)),
};

export const apiClient = axios.create(clientConfig);

/**
 * Chi dung cho refresh token. Khong gan interceptor de 401 cua chinh no khong kich hoat
 * refresh lan nua (vong lap vo han), nhung van dung chung adapter voi apiClient.
 */
const refreshClient = axios.create(clientConfig);

logger.info(
  `[api] ${WIRED_ROUTES.length} endpoint goi BE that tai ${Config.apiUrl}, ${MOCK_ROUTES.length} endpoint con gia lap`,
);

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
    const { data } = await refreshClient.post<ApiResponse<AuthSession>>(Endpoints.auth.refresh, {
      refreshToken,
    });
    // BE xoay vong refresh token sau moi lan dung: phai luu ca cap, dung lai token cu se bi thu hoi phien
    const { tokens } = data.data;
    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, tokens.accessToken),
      secureStorage.set(StorageKeys.refreshToken, tokens.refreshToken),
    ]);
    return tokens.accessToken;
  } catch (error) {
    logger.warn('Refresh token that bai', error);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Partial<ApiErrorBody>>) => {
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

/**
 * Bien loi axios thanh AppError de UI xu ly thong nhat.
 * Body loi co the khong theo envelope (vd trang HTML cua proxy) nen doc `error.code` kieu Partial.
 */
function normalizeError(error: AxiosError<Partial<ApiErrorBody>>): AppError {
  if (error.response) {
    const { status, data } = error.response;
    const code = data?.error?.code;
    return new AppError(getApiErrorMessage(code, status), status, code);
  }
  if (error.code === 'ECONNABORTED') {
    return new AppError(ErrorMessages.timeout);
  }
  return new AppError(ErrorMessages.network);
}
