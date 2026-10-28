import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { useAuthStore } from '@/store/auth-store';

import { connectNotificationRealtime } from '../api/notification-realtime';

import { PARENT_DATA_QUERY_KEYS } from './use-refresh-parent-data';

/**
 * Gom cac su kien gan nhau vao mot lan tai lai: BE co the phat lai su kien (worker chay lai) va mot
 * thao tac co the tao nhieu thong bao cung luc.
 */
const REFRESH_DEBOUNCE_MS = 300;

/**
 * Giu ket noi realtime toi hop thu thong bao khi phu huynh dang dang nhap. Co thong bao moi thi tai
 * lai thong bao va du lieu hoc tap dang hien (diem, diem danh, bill vua doi); thiet bi khac doc thong
 * bao thi chi tai lai thong bao. Khong tu cong tru so chua doc: su kien co the lap hoac bi lo luc
 * offline, nen luon tai lai tu BE, ca khi ket noi lai va khi app tro lai man hinh.
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const isParentSignedIn = useAuthStore((s) => s.isAuthenticated && s.user?.role === 'PARENT');

  useEffect(() => {
    if (!isParentSignedIn) return undefined;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let shouldRefreshLearningData = false;

    const scheduleRefresh = (includeLearningData: boolean) => {
      shouldRefreshLearningData ||= includeLearningData;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        const queryKeysToRefresh = shouldRefreshLearningData
          ? PARENT_DATA_QUERY_KEYS
          : [queryKeys.notifications.all];
        shouldRefreshLearningData = false;
        queryKeysToRefresh.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey });
        });
      }, REFRESH_DEBOUNCE_MS);
    };

    const channel = connectNotificationRealtime({
      onNotificationCreated: () => scheduleRefresh(true),
      onReadChanged: () => scheduleRefresh(false),
      onConnected: () => scheduleRefresh(false),
    });
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      channel.open();
      scheduleRefresh(false);
    });

    return () => {
      clearTimeout(refreshTimer);
      subscription.remove();
      channel.close();
    };
  }, [isParentSignedIn, queryClient]);
}
