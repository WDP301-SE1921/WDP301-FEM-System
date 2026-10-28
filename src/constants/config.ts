import { z } from 'zod';

/** So dien thoai: chu so, khoang trang, dau `.` hoac `-`, cho phep `+` o dau. */
const PHONE_PATTERN = /^\+?\d[\d\s.-]{6,18}\d$/;

/**
 * Kiem tra bien moi truong (.env, prefix EXPO_PUBLIC_) ngay khi app khoi dong.
 * Phai doc tung bien bang ten day du `process.env.EXPO_PUBLIC_X` thi Expo moi inline duoc vao bundle.
 */
const envSchema = z.object({
  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  /** Dia chi BE kem prefix, vd `http://192.168.1.10:3000/api/v1`. Chi endpoint da wire goi toi. */
  EXPO_PUBLIC_API_URL: z.url({
    protocol: /^https?$/,
    error: 'Can dia chi BE dang http(s)://<host>:<cong>/api/v1',
  }),
  /** So dien thoai trung tam cho nut goi o tab Hoc phi. Bo trong thi khong hien nut. */
  EXPO_PUBLIC_CENTER_PHONE: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().regex(PHONE_PATTERN, 'So dien thoai trung tam khong hop le').optional(),
  ),
});

function readEnv() {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_CENTER_PHONE: process.env.EXPO_PUBLIC_CENTER_PHONE,
  });

  if (!result.success) {
    throw new Error(
      `[config] Bien moi truong khong hop le. Copy .env.example thanh .env va dien gia tri.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** `http(s)://<host>:<cong>` cua dia chi BE, bo prefix `/api/v1`. */
const ORIGIN_PATTERN = /^https?:\/\/[^/?#]+/;

/**
 * Socket.IO cua BE nam o goc server, khong nam duoi prefix REST. Khong dung `new URL().origin` vi
 * React Native chua cai dat `origin`.
 */
function toServerOrigin(apiUrl: string): string {
  return ORIGIN_PATTERN.exec(apiUrl)?.[0] ?? apiUrl;
}

const env = readEnv();

export const Config = {
  env: env.EXPO_PUBLIC_ENV,
  apiUrl: env.EXPO_PUBLIC_API_URL,
  /** Goc server cua BE, vd `http://192.168.1.10:3000`, dung cho thong bao realtime (Socket.IO). */
  serverOrigin: toServerOrigin(env.EXPO_PUBLIC_API_URL),
  /** So dien thoai trung tam, null khi chua cau hinh. */
  centerPhone: env.EXPO_PUBLIC_CENTER_PHONE ?? null,
  /** Timeout mac dinh cho moi request (ms) */
  requestTimeout: 15_000,
} as const;

export const isDev = Config.env === 'development';
