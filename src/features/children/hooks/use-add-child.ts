import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { childrenApi } from '../api/children-api';
import type { AddChildInput } from '../schemas';
import { toCreateChildPayload } from '../utils';

/** Tao ho so con roi tai lai danh sach con o trang chu, lich hoc va man hinh tai khoan. */
export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AddChildInput) => childrenApi.create(toCreateChildPayload(values)),
    // `exact`: key danh sach con la tien to cua key du lieu tung con, con moi khong lam doi du lieu
    // cua cac con khac. Cho tai lai xong moi bao thanh cong de ve trang chu la thay con moi ngay.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.parent.students, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me.students, exact: true }),
      ]),
  });
}
