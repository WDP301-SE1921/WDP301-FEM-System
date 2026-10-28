import { create } from 'zustand';

type StudentSelectionState = {
  /** Con phu huynh dang xem. null khi chua chon: cac tab xem con dau tien. */
  selectedStudentId: string | null;
  selectStudent: (studentId: string) => void;
};

/**
 * Con dang xem, dung chung cho Trang chu, Lich hoc, Diem & Bai va Hoc phi: doi con o mot tab thi cac
 * tab khac doi theo, va nut dan sang tab khac (vd "Xem bài") mo dung con dang xem.
 */
export const useStudentSelectionStore = create<StudentSelectionState>((set) => ({
  selectedStudentId: null,
  selectStudent: (studentId) => set({ selectedStudentId: studentId }),
}));
