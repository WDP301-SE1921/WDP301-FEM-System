import { useStudentSelectionStore } from '@/store/student-selection-store';

import { useLinkedStudents } from './use-parent-dashboard';

/**
 * Danh sach con va con dang xem, chung cho moi tab. Chua chon, hoac con da chon khong con trong danh
 * sach (vd dang nhap tai khoan khac tren cung may), thi xem con dau tien.
 */
export function useSelectedStudent() {
  const students = useLinkedStudents();
  const selectedId = useStudentSelectionStore((s) => s.selectedStudentId);
  const selectStudent = useStudentSelectionStore((s) => s.selectStudent);

  const selected =
    students.data?.find((student) => student.id === selectedId) ?? students.data?.[0];

  return { students, selected, selectStudent };
}
