/**
 * Doc bien moi truong tu .env (prefix EXPO_PUBLIC_).
 * Fail-fast ngay khi app khoi dong neu thieu bien bat buoc.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[config] Thieu bien moi truong "${name}". Copy .env.example thanh .env va dien gia tri.`,
    );
  }
  return value;
}

export const Config = {
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
  env: (process.env.EXPO_PUBLIC_ENV ?? 'development') as 'development' | 'staging' | 'production',
  /** Timeout mac dinh cho moi request (ms) */
  requestTimeout: 15_000,
} as const;

export const isDev = Config.env === 'development';
