import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';
import { toDateKey } from '@/utils/date';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { SessionRef } from '../types';

/** Don xin nghi cua con cho mot buoi; cho tai xong chi tiet buoi de biet ngay hoc. */
export function useSessionLeave(ref: SessionRef, startsAt: string | undefined) {
  return useQuery({
    queryKey: queryKeys.parent.studentSessionLeave(ref.studentId, ref.sessionId),
    queryFn: () => parentDashboardApi.getSessionLeave(ref, toDateKey(new Date(startsAt ?? ''))),
    enabled: Boolean(startsAt),
  });
}

/**
 * Gui don xin nghi mot buoi roi tai lai du lieu hoc tap cua con (chi tiet buoi, don nghi, diem
 * danh), de the don hien ngay trang thai "Đã gửi đơn xin nghỉ".
 */
export function useRequestSessionLeave(ref: SessionRef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) => parentDashboardApi.requestSessionLeave({ ...ref, reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.student(ref.studentId) }),
  });
}
