/**
 * Hoc sinh gia dung chung cho cac mock cua phu huynh, dong vai bang `student_profiles` cua BE
 * (StudentProfile: fullName, grade 6-9, dateOfBirth). Hoc sinh mau:
 * - phuhuynh@example.com    : Nguyễn Minh Anh (lop 8, sinh 15/03/2013), Nguyễn Hoàng Long (lop 6,
 *                             chua co ngay sinh)
 * - phuhuynh.cu@example.com : chua co con nao
 *
 * Con phu huynh tu tao qua POST /parent/students (`./parent.ts`) va thay doi qua
 * PATCH /me/students/:id (`./registration-flow.ts`) chi nam trong bo nho cho toi khi tai lai app.
 */

const SEED_TIMESTAMP = '2026-09-01T00:00:00.000Z';

export type MockStudent = {
  id: string;
  /** `User.id` cua phu huynh, xem `./mock-accounts.ts`. */
  parentUserId: string;
  fullName: string;
  grade: number;
  /** `YYYY-MM-DD`, null khi phu huynh bo trong. */
  dateOfBirth: string | null;
  /** Mon cua cac Enrollment `ACTIVE`, lay tu Program cua Class. */
  subjectNames: string[];
  createdAt: string;
  updatedAt: string;
};

/** Cac field phu huynh sua duoc (UpdateStudentDto cua BE). */
export type MockStudentChanges = Partial<Pick<MockStudent, 'fullName' | 'grade' | 'dateOfBirth'>>;

const students: MockStudent[] = [
  {
    id: 'mock-student-1',
    parentUserId: 'mock-user-1',
    fullName: 'Nguyễn Minh Anh',
    grade: 8,
    dateOfBirth: '2013-03-15',
    subjectNames: ['Toán', 'Vật lý', 'Hóa học'],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'mock-student-2',
    parentUserId: 'mock-user-1',
    fullName: 'Nguyễn Hoàng Long',
    grade: 6,
    dateOfBirth: null,
    subjectNames: ['Tiếng Anh'],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

let sequence = 0;

export function findStudentsByParent(parentUserId: string): MockStudent[] {
  return students.filter((student) => student.parentUserId === parentUserId);
}

/** Chi tra hoc sinh thuoc dung phu huynh, giong BE kiem tra quyen so huu truoc khi tra du lieu. */
export function findStudentOfParent(
  parentUserId: string,
  studentId: string,
): MockStudent | undefined {
  return students.find(
    (student) => student.id === studentId && student.parentUserId === parentUserId,
  );
}

/** Khong kiem tra phu huynh: dung khi route phan biet "khong ton tai" (404) voi "cua nguoi khac" (403). */
export function findStudentById(studentId: string): MockStudent | undefined {
  return students.find((student) => student.id === studentId);
}

export function addStudent(
  input: Omit<MockStudent, 'id' | 'createdAt' | 'updatedAt'>,
): MockStudent {
  sequence += 1;
  const now = new Date().toISOString();
  // Date.now giu id khong trung voi id da phat truoc lan tai lai app
  const student = {
    ...input,
    id: `mock-student-${Date.now().toString(36)}${sequence}`,
    createdAt: now,
    updatedAt: now,
  };
  students.push(student);
  return student;
}

/** Ghi thay doi vao ho so. Tra undefined khi khong co hoc sinh nay. */
export function updateStudent(
  studentId: string,
  changes: MockStudentChanges,
): MockStudent | undefined {
  const index = students.findIndex((student) => student.id === studentId);
  const current = students[index];
  if (!current) return undefined;

  const updated = { ...current, ...changes, updatedAt: new Date().toISOString() };
  students[index] = updated;
  return updated;
}
