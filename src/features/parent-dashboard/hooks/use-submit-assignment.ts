import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { AssignmentRef, SubmitAssignmentPayload } from '../types';

/**
 * Nop bai cua con roi tai lai cac lan nop cua bai va du lieu hoc tap cua con (danh sach bai tap, lo
 * trinh, trang chu), de bai vua nop chuyen sang "da nop" o moi man hinh.
 */
export function useSubmitAssignment({ studentId, assignmentId }: AssignmentRef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitAssignmentPayload) => parentDashboardApi.submitAssignment(payload),
    // Cho tai lai xong moi bao thanh cong de man hinh chuyen thang sang bai da nop
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.academic.assignmentSubmissions(assignmentId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parent.student(studentId) }),
      ]),
  });
}
