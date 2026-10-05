import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { childrenApi } from '../api/children-api';
import type { AddChildInput } from '../schemas';
import { toUpdateChildPayload } from '../utils';

/** Ho so cac con cua phu huynh dang dang nhap. */
export function useChildren() {
  return useQuery({
    queryKey: queryKeys.me.students,
    queryFn: () => childrenApi.list(),
  });
}

/** Sua ho so mot con roi tai lai danh sach con o man hinh tai khoan, trang chu va lich hoc. */
export function useUpdateChild(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AddChildInput) =>
      childrenApi.update(studentId, toUpdateChildPayload(values)),
    // `exact`: key danh sach con la tien to cua key du lieu tung con, sua ho so khong lam doi du lieu
    // hoc tap. Cho tai lai xong moi bao thanh cong de quay lai la thay ho so moi ngay.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me.students, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.parent.students, exact: true }),
      ]),
  });
}
