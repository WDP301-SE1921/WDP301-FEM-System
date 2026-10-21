/**
 * Ho so con cua phu huynh, theo module `registration-flow` cua BE nhanh `dev` va da noi BE that:
 * GET, POST /me/students va PATCH /me/students/:id. BE chi cho tao va sua khi email cua phu huynh da
 * xac minh (409 `PARENT_EMAIL_UNVERIFIED`).
 */
import type { CHILD_GRADES } from './constants';

export type ChildGrade = (typeof CHILD_GRADES)[number];

/** Body POST /me/students (CreateStudentDto). */
export type CreateChildPayload = {
  fullName: string;
  grade: ChildGrade;
  /** `YYYY-MM-DD`. Khong gui khi phu huynh bo trong. */
  dateOfBirth?: string;
};

/**
 * Ban ghi StudentProfile: mot phan tu cua GET /me/students, response POST /me/students va
 * PATCH /me/students/:id. BE tra nguyen ban ghi Prisma, o day chi khai bao field app dung.
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
