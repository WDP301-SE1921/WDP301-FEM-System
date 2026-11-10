import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logger } from './logger';

const ANDROID_CHANNEL_ID = 'edugrade-notifications';
const PRIMARY_NOTIFICATION_COLOR = '#208AEF';

export type LocalPushPayload = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

let isConfigured = false;
let hasChannel = false;

/**
 * Cau hinh hien thi thong bao he dieu hanh ngay ca khi app dang mo hay o nen.
 * Chi chay tren native (Android/iOS).
 */
export function configureNotificationHandler(): void {
  if (Platform.OS === 'web' || isConfigured) return;
  isConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Xin quyen thong bao va thu tao Android notification channel (bo qua neu chay trong Expo Go). */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    configureNotificationHandler();

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Thông báo học tập EduGrade',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: PRIMARY_NOTIFICATION_COLOR,
          sound: 'default',
        });
        hasChannel = true;
      } catch {
        // Expo Go tren Android khong nap NotificationsChannelsProvider: dung default channel
        hasChannel = false;
      }
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    logger.warn('[push-notifications] Khong xin duoc quyen thong bao', error);
    return false;
  }
}

/** Phat thong bao tren thanh trang thai he dieu hanh (hoat dong ca khi thoat ra ngoai man hinh chinh). */
export async function presentLocalPushNotification(payload: LocalPushPayload): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `edugrade-${payload.id}`,
      content: {
        title: payload.title,
        body: payload.body,
        data: { notificationId: payload.id, ...payload.data },
        sound: 'default',
      },
      trigger: Platform.OS === 'android' && hasChannel ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch (error) {
    logger.warn('[push-notifications] Khong hien thi duoc thong bao he dieu hanh', error);
  }
}

/** Lang nghe su kien nguoi dung bam vao thong bao tren thanh trang thai. */
export function subscribeToNotificationTap(
  onTap: (data: Record<string, unknown>) => void,
): () => void {
  if (Platform.OS === 'web') return () => undefined;

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && typeof data === 'object') {
      onTap(data as Record<string, unknown>);
    }
  });

  return () => subscription.remove();
}
