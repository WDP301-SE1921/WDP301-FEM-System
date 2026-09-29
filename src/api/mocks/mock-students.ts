/**
 * Hoc sinh gia dung chung cho cac mock (parent, link-invitations), dong vai bang `student_profiles`
 * cua BE (StudentProfile: fullName, grade 6-9). Hoc sinh mau:
 * - phuhuynh@example.com    : Nguyễn Minh Anh (lop 8), Nguyễn Hoàng Long (lop 6)
 * - phuhuynh.cu@example.com : chua lien ket con nao
 *
 * Tai khoan tao bang ma DEMONEW1, hoac phu huynh dung ma DEMOADD1/DEMOOLD1 khi da dang nhap
 * (`./link-invitations.ts`), duoc lien ket them mot hoc sinh, chi nam trong bo nho cho toi khi
 * tai lai app.
 */

export type MockStudent = {
  id: string;
  /** `User.id` cua phu huynh, xem `./mock-accounts.ts`. */
  parentUserId: string;
  fullName: string;
  grade: number;
  /** Mon cua cac Enrollment `ACTIVE`, lay tu Program cua Class. */
  subjectNames: string[];
};

const students: MockStudent[] = [
  {
    id: 'mock-student-1',
    parentUserId: 'mock-user-1',
    fullName: 'Nguyễn Minh Anh',
    grade: 8,
    subjectNames: ['Toán', 'Vật lý'],
  },
  {
    id: 'mock-student-2',
    parentUserId: 'mock-user-1',
    fullName: 'Nguyễn Hoàng Long',
    grade: 6,
    subjectNames: ['Tiếng Anh'],
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

export function linkStudent(input: Omit<MockStudent, 'id'>): MockStudent {
  sequence += 1;
  // Date.now giu id khong trung voi id da phat truoc lan tai lai app
  const student = { ...input, id: `mock-student-${Date.now().toString(36)}${sequence}` };
  students.push(student);
  return student;
}
