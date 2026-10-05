import { z } from 'zod';

/**
 * Kiem tra bien moi truong (.env, prefix EXPO_PUBLIC_) ngay khi app khoi dong.
 * Phai doc tung bien bang ten day du `process.env.EXPO_PUBLIC_X` thi Expo moi inline duoc vao bundle.
 */
const envSchema = z
  .object({
    EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    /** Dia chi BE kem prefix, vd `http://192.168.1.10:3000/api/v1`. Chi endpoint da wire goi toi. */
    EXPO_PUBLIC_API_URL: z.url({
      protocol: /^https?$/,
      error: 'Can dia chi BE dang http(s)://<host>:<cong>/api/v1',
    }),
  })
  // Mot so man hinh con dung du lieu gia (src/api/mocks), khong duoc dua toi nguoi dung that
  .refine((env) => env.EXPO_PUBLIC_ENV !== 'production', {
    message: 'App con man hinh dung mock API, chua build production duoc',
    path: ['EXPO_PUBLIC_ENV'],
  });

function readEnv() {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
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
  apiUrl: env.EXPO_PUBLIC_API_URL,
  /** Timeout mac dinh cho moi request (ms) */
  requestTimeout: 15_000,
} as const;

export const isDev = Config.env === 'development';
