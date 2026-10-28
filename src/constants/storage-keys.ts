/** Tap trung key luu tru de tranh go nham chuoi o nhieu noi. */
export const StorageKeys = {
  accessToken: 'fem.auth.access_token',
  refreshToken: 'fem.auth.refresh_token',
  user: 'fem.auth.user',
  onboardingDone: 'fem.app.onboarding_done',
} as const;

/** Bai lam dang do cua mot con cho mot bai tap, luu tren may de khong mat khi roi man hinh. */
export type AssignmentDraftKey = `fem.assignment_draft.${string}.${string}`;

/** Key co tham so. */
export const StorageKeyFactory = {
  assignmentDraft: (studentId: string, assignmentId: string): AssignmentDraftKey =>
    `fem.assignment_draft.${studentId}.${assignmentId}`,
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys] | AssignmentDraftKey;
