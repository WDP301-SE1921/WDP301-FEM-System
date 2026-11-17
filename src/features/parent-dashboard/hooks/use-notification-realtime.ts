import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { StorageKeys } from '@/constants/storage-keys';
import { logger } from '@/lib/logger';
import {
  ensureNotificationPermissions,
  presentLocalPushNotification,
  subscribeToNotificationTap,
} from '@/lib/push-notifications';
import { storage } from '@/lib/storage';
import { useAuthStore } from '@/store/auth-store';

import { connectNotificationRealtime } from '../api/notification-realtime';
import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { AppNotification } from '../types';

import { PARENT_DATA_QUERY_KEYS } from './use-refresh-parent-data';

/**
 * Gom cac su kien gan nhau vao mot lan tai lai: BE co the phat lai su kien (worker chay lai) va mot
 * thao tac co the tao nhieu thong bao cung luc.
 */
const REFRESH_DEBOUNCE_MS = 300;
const PUSH_SYNC_PAGE_SIZE = 10;
const MAX_STORED_NOTIFIED_IDS = 100;
const POPUP_DURATION_MS = 5_000;

async function readNotifiedIds(): Promise<Set<string>> {
  const stored = await storage.getJson<string[]>(StorageKeys.notifiedIds);
  return new Set(stored ?? []);
}

async function saveNotifiedIds(ids: Set<string>): Promise<void> {
  const list = [...ids].slice(-MAX_STORED_NOTIFIED_IDS);
  await storage.setJson(StorageKeys.notifiedIds, list);
}

export type NotificationRealtimeResult = {
  /** Thong bao moi vua den de hien popup message noi tren man hinh. */
  activePopup: AppNotification | null;
  /** Dong popup message noi. */
  dismissPopup: () => void;
};

/**
 * Giu ket noi realtime toi hop thu thong bao khi phu huynh dang dang nhap. Co thong bao moi thi tai
 * lai thong bao, du lieu hoc tap dang hien, hien popup message noi trong app va phat OS Push
 * Notification ngay ca khi app dang chay ngam ngoai man hinh chinh.
 */
export function useNotificationRealtime(): NotificationRealtimeResult {
  const queryClient = useQueryClient();
  const isParentSignedIn = useAuthStore((s) => s.isAuthenticated && s.user?.role === 'PARENT');
  const [activePopup, setActivePopup] = useState<AppNotification | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismissPopup = () => {
    clearTimeout(popupTimerRef.current);
    setActivePopup(null);
  };

  useEffect(() => {
    if (!isParentSignedIn) return undefined;

    let stopped = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let shouldRefreshLearningData = false;
    let initializedIds = false;
    let syncChain: Promise<void> = Promise.resolve();

    void ensureNotificationPermissions();

    const showPopupBanner = (notification: AppNotification) => {
      if (stopped) return;
      clearTimeout(popupTimerRef.current);
      setActivePopup(notification);
      popupTimerRef.current = setTimeout(() => {
        if (!stopped) setActivePopup(null);
      }, POPUP_DURATION_MS);
    };

    const syncPushNotifications = async (isCreatedEvent: boolean) => {
      if (stopped) return;
      try {
        const [page, notifiedIds] = await Promise.all([
          parentDashboardApi.getNotifications({ page: 1, limit: PUSH_SYNC_PAGE_SIZE }),
          readNotifiedIds(),
        ]);
        if (stopped || !page?.items) return;

        // Lan dau ket noi: ghi nhan cac thong bao cu da co trong hop thu de khong ban lai hang loat
        if (!initializedIds && !isCreatedEvent) {
          initializedIds = true;
          for (const item of page.items) {
            notifiedIds.add(item.id);
          }
          await saveNotifiedIds(notifiedIds);
          return;
        }

        initializedIds = true;
        let hasNew = false;
        let latestNewItem: AppNotification | null = null;

        for (const item of page.items) {
          if (!item.readAt && !notifiedIds.has(item.id)) {
            notifiedIds.add(item.id);
            hasNew = true;
            if (!latestNewItem) latestNewItem = item;
            await presentLocalPushNotification({
              id: item.id,
              title: item.title,
              body: item.body,
              data: {
                notificationId: item.id,
                targetKind: item.target.kind,
                targetId: item.target.id,
              },
            });
          }
        }

        if (latestNewItem) {
          showPopupBanner(latestNewItem);
        }

        if (hasNew) {
          await saveNotifiedIds(notifiedIds);
        }
      } catch (error) {
        logger.debug('[notifications] Khong dong bo duoc push notification realtime', error);
      }
    };

    const queuePushSync = (isCreatedEvent: boolean) => {
      // Chay qua Promise microtask thay vi setTimeout vi Android tam dung JS Timer khi thoat ra man hinh chinh
      syncChain = syncChain
        .catch(() => undefined)
        .then(() => syncPushNotifications(isCreatedEvent));
    };

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
      onNotificationCreated: () => {
        queuePushSync(true);
        scheduleRefresh(true);
      },
      onReadChanged: () => scheduleRefresh(false),
      onConnected: () => {
        queuePushSync(false);
        scheduleRefresh(false);
      },
    });
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      channel.open();
      queuePushSync(false);
      scheduleRefresh(false);
    });
    const unsubscribeTap = subscribeToNotificationTap(() => {
      router.navigate('/notifications');
    });

    return () => {
      stopped = true;
      clearTimeout(refreshTimer);
      clearTimeout(popupTimerRef.current);
      subscription.remove();
      unsubscribeTap();
      channel.close();
    };
  }, [isParentSignedIn, queryClient]);

  return { activePopup: isParentSignedIn ? activePopup : null, dismissPopup };
}
