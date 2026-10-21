/**
 * Hoc sinh mau cho du lieu hoc tap gia cua cac route con chay bang mock (`./parent.ts`). Ho so con
 * that do BE quan ly qua /me/students (da noi BE that), server gia khong tao, sua hay liet ke ho so nao.
 *
 * Hoc sinh mau thuoc phu huynh mau `SAMPLE_PARENT`: Nguyễn Minh Anh (lop 8) va Nguyễn Hoàng Long
 * (lop 6). Tai khoan that cua BE khong trung id nay nen khong thay du lieu mau.
 */

/** Phu huynh so huu cac hoc sinh mau: `id` la `sub` cua access token. */
export const SAMPLE_PARENT = { id: 'mock-user-1' } as const;

export type MockStudent = {
  id: string;
  /** `User.id` cua phu huynh. */
  parentUserId: string;
  fullName: string;
  grade: number;
};

const students: readonly MockStudent[] = [
  { id: 'mock-student-1', parentUserId: SAMPLE_PARENT.id, fullName: 'Nguyễn Minh Anh', grade: 8 },
  { id: 'mock-student-2', parentUserId: SAMPLE_PARENT.id, fullName: 'Nguyễn Hoàng Long', grade: 6 },
];

/** Khong kiem tra phu huynh: route tu so `parentUserId` de biet hoc sinh mau co thuoc nguoi goi khong. */
export function findStudentById(studentId: string): MockStudent | undefined {
  return students.find((student) => student.id === studentId);
}
