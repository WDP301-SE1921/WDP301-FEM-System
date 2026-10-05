/**
 * Bai nop gia con nop trong app qua POST /academic/submissions (`./academic.ts`), dong vai bang
 * `submissions` cua BE. Chi nam trong bo nho cho toi khi tai lai app. Lo trinh
 * (`./mock-lessons.ts`) va danh sach bai tap (`./mock-assignments.ts`) doc tu day de bai vua nop
 * chuyen sang "da nop" o moi man hinh. Bai nop trong app chua duoc giao vien cham nen khong co diem.
 */

export type MockAnswer = { questionId: string; answer: string };

export type MockStoredSubmission = {
  id: string;
  /** Lan nop thu may, tinh tu 1. */
  attemptNo: number;
  answers: MockAnswer[];
  submittedAt: string;
};

/** Key la `studentId:assignmentId`, gia tri theo thu tu nop. */
const submissions = new Map<string, MockStoredSubmission[]>();

function toKey(studentId: string, assignmentId: string): string {
  return `${studentId}:${assignmentId}`;
}

export function findStoredSubmissions(
  studentId: string,
  assignmentId: string,
): readonly MockStoredSubmission[] {
  return submissions.get(toKey(studentId, assignmentId)) ?? [];
}

export function findLatestStoredSubmission(
  studentId: string,
  assignmentId: string,
): MockStoredSubmission | undefined {
  const stored = findStoredSubmissions(studentId, assignmentId);
  return stored[stored.length - 1];
}

export function storeSubmission(
  studentId: string,
  assignmentId: string,
  submission: MockStoredSubmission,
) {
  const key = toKey(studentId, assignmentId);
  submissions.set(key, [...(submissions.get(key) ?? []), submission]);
}
