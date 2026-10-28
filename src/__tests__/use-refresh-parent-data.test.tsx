import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { queryKeys } from '@/api/query-client';
import { useRefreshParentData } from '@/features/parent-dashboard/hooks/use-refresh-parent-data';

describe('features/parent-dashboard/useRefreshParentData', () => {
  it('tai lai moi nhom du lieu cua phu huynh va tat trang thai dang tai khi xong', async () => {
    // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useRefreshParentData(), { wrapper });
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      result.current.refresh();
    });

    expect(invalidateQueries.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      queryKeys.parent.all,
      queryKeys.me.all,
      queryKeys.registrations.all,
      queryKeys.academic.all,
      queryKeys.notifications.all,
    ]);
    expect(result.current.isRefreshing).toBe(false);
  });
});
