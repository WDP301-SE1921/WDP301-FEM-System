/** Tap trung key luu tru de tranh go nham chuoi o nhieu noi. */
export const StorageKeys = {
  accessToken: 'fem.auth.access_token',
  refreshToken: 'fem.auth.refresh_token',
  user: 'fem.auth.user',
  onboardingDone: 'fem.app.onboarding_done',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
