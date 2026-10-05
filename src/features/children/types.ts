/**
 * Ho so con cua phu huynh. Tao con dung route TAM POST /parent/students (BE da co POST /me/students
 * nhung mobile chua chuyen, xem dau file `src/api/mocks/parent.ts`). Xem va sua ho so theo module
 * `registration-flow` cua BE nhanh `dev`: GET /me/students, PATCH /me/students/:id (xem dau file
 * `src/api/mocks/registration-flow.ts`).
 */
import type { CHILD_GRADES } from './constants';

export type ChildGrade = (typeof CHILD_GRADES)[number];

/** Body POST /parent/students. */
export type CreateChildPayload = {
  fullName: string;
  grade: ChildGrade;
  /** `YYYY-MM-DD`. Khong gui khi phu huynh bo trong. */
  dateOfBirth?: string;
};

/** Response POST /parent/students: con vua tao, cung dang phan tu cua GET /parent/students. */
export type CreatedChild = {
  id: string;
  fullName: string;
  grade: number;
  subjectNames: string[];
};

/**
 * Mot phan tu cua GET /me/students va response PATCH /me/students/:id: ban ghi StudentProfile. BE tra
 * nguyen ban ghi Prisma, o day chi khai bao field app dung.
 */
export type ChildProfile = {
  id: string;
  fullName: string;
  /** Khoi 6-9. */
  grade: number;
  /** Cot ngay cua Prisma: 00:00 UTC cua ngay do, vd `2013-03-15T00:00:00.000Z`. null khi chua nhap. */
  dateOfBirth: string | null;
};

/** Body PATCH /me/students/:id (UpdateStudentDto). */
export type UpdateChildPayload = {
  fullName: string;
  grade: ChildGrade;
  /** `YYYY-MM-DD`, null de xoa ngay sinh. */
  dateOfBirth: string | null;
};

/** Gia tri ban dau cua form ho so con. `grade` bo trong khi chua chon hoac khoi ngoai 6-9. */
export type ChildFormDefaults = {
  fullName: string;
  grade?: ChildGrade;
  /** Dang `dd/mm/yyyy`, chuoi rong khi chua co ngay sinh. */
  dateOfBirth: string;
};
