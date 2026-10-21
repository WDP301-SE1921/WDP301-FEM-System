import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/api/query-client';

/** Moi nhom du lieu phu huynh xem: con, lich hoc, diem danh, bai tap, hoc phi, bien lai. */
const REFRESH_QUERY_KEYS = [
  queryKeys.parent.all,
  queryKeys.me.all,
  queryKeys.registrations.all,
  queryKeys.academic.all,
] as const;

/**
 * Tai lai du lieu dang hien khi phu huynh keo man hinh xuong. Nhan vien dang ky mon va xac nhan hoc
 * phi tren web trong luc phu huynh dang mo app, nen can cach xem thay doi ma khong phai mo lai app
 * (SRS muc 6.1).
 */
export function useRefreshParentData() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      // Query loi tu hien loi o cho cua no, o day chi can doi tai xong
      await Promise.all(
        REFRESH_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, refresh: () => void refresh() };
}
