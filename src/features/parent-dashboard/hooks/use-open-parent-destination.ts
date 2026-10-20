import { router } from 'expo-router';

import { useStudentSelectionStore } from '@/store/student-selection-store';

import type { ParentDestination } from '../types';
import { getParentHref, isTabDestination } from '../utils';

/**
 * Mo man hinh cua mot dich (thong bao, viec can chu y o trang chu). Dich la tab thi chon con cua dich
 * truoc khi chuyen tab, de tab mo dung con; dich khac dat man hinh len tren man hinh hien tai.
 */
export function useOpenParentDestination() {
  const selectStudent = useStudentSelectionStore((s) => s.selectStudent);

  return (destination: ParentDestination) => {
    const href = getParentHref(destination);
    if (isTabDestination(destination)) {
      selectStudent(destination.studentId);
      router.navigate(href);
      return;
    }
    router.push(href);
  };
}
