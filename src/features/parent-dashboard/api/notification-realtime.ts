import { refreshSession } from '@/api/client';
import { Config } from '@/constants/config';
import { StorageKeys } from '@/constants/storage-keys';
import { createRealtimeChannel, type RealtimeChannel } from '@/lib/realtime';
import { secureStorage } from '@/lib/storage';

/** Namespace va duong dan Socket.IO cua module `notifications` o BE, nam o goc server. */
const NOTIFICATION_NAMESPACE = '/notifications';
const SOCKET_PATH = '/socket.io';

/** Su kien BE phat toi moi thiet bi cua tai khoan; payload chi co id nen app tai lai qua REST. */
export const NotificationEvents = {
  created: 'notification.created',
  readChanged: 'notifications.read-changed',
} as const;

export type NotificationRealtimeHandlers = {
  /** Co thong bao moi: du lieu hoc tap lien quan cung vua doi (diem, diem danh, bill...). */
  onNotificationCreated: () => void;
  /** Thiet bi khac cua tai khoan vua danh dau da doc. */
  onReadChanged: () => void;
  /** Vua ket noi hoac ket noi lai: co the da lo su kien luc mat ket noi. */
  onConnected: () => void;
};

/**
 * Mo ket noi realtime toi hop thu thong bao cua tai khoan dang dang nhap. Token doi qua
 * `refreshSession` de dung chung lan refresh voi REST (BE xoay vong refresh token).
 */
export function connectNotificationRealtime(
  handlers: NotificationRealtimeHandlers,
): RealtimeChannel {
  const channel = createRealtimeChannel({
    url: `${Config.serverOrigin}${NOTIFICATION_NAMESPACE}`,
    path: SOCKET_PATH,
    getToken: () => secureStorage.get(StorageKeys.accessToken),
    renewToken: refreshSession,
    listeners: {
      [NotificationEvents.created]: handlers.onNotificationCreated,
      [NotificationEvents.readChanged]: handlers.onReadChanged,
    },
    onConnect: handlers.onConnected,
  });
  channel.open();
  return channel;
}
