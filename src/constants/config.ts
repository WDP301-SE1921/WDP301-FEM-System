import { z } from 'zod';

/**
 * Kiem tra bien moi truong (.env, prefix EXPO_PUBLIC_) ngay khi app khoi dong.
 * Phai doc tung bien bang ten day du `process.env.EXPO_PUBLIC_X` thi Expo moi inline duoc vao bundle.
 */
const envSchema = z
  .object({
    EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  })
  // App chi dung mock (src/api/mocks), khong co dia chi BE va khong duoc dua du lieu gia toi
  // nguoi dung that
  .refine((env) => env.EXPO_PUBLIC_ENV !== 'production', {
    message: 'App dang chi dung mock API, chua build production duoc',
    path: ['EXPO_PUBLIC_ENV'],
  });

function readEnv() {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
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
  env: env.EXPO_PUBLIC_ENV,
  /** Timeout mac dinh cho moi request (ms) */
  requestTimeout: 15_000,
} as const;

export const isDev = Config.env === 'development';
