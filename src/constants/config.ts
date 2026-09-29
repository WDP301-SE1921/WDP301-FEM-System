import { z } from 'zod';

/**
 * Kiem tra bien moi truong (.env, prefix EXPO_PUBLIC_) ngay khi app khoi dong.
 * Phai doc tung bien bang ten day du `process.env.EXPO_PUBLIC_X` thi Expo moi inline duoc vao bundle.
 */
const envSchema = z
  .object({
    EXPO_PUBLIC_API_URL: z.url('Phai la URL day du, vi du http://192.168.1.10:3000/api/v1'),
    EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    EXPO_PUBLIC_API_MOCK: z.enum(['true', 'false']).default('false'),
  })
  .refine((env) => !(env.EXPO_PUBLIC_ENV === 'production' && env.EXPO_PUBLIC_API_MOCK === 'true'), {
    message: 'Khong duoc bat mock API o production',
    path: ['EXPO_PUBLIC_API_MOCK'],
  });

function readEnv() {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
    EXPO_PUBLIC_API_MOCK: process.env.EXPO_PUBLIC_API_MOCK,
  });

  if (!result.success) {
    throw new Error(
      `[config] Bien moi truong khong hop le. Copy .env.example thanh .env va dien gia tri.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

const env = readEnv();

export const Config = {
  apiUrl: env.EXPO_PUBLIC_API_URL,
  env: env.EXPO_PUBLIC_ENV,
  /** Timeout mac dinh cho moi request (ms) */
  requestTimeout: 15_000,
  /**
   * Tra loi bang mock (src/api/mocks) cho moi endpoint co route mock. Endpoint khong co route
   * mock van goi BE that. Chi tat khi nguoi dung yeu cau noi toan bo BE that.
   */
  useMockApi: env.EXPO_PUBLIC_API_MOCK === 'true',
} as const;

export const isDev = Config.env === 'development';
