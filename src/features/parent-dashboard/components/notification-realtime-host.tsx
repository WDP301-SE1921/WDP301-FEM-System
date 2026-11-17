import { usePathname } from 'expo-router';

import { useNotificationRealtime } from '../hooks/use-notification-realtime';

import { NotificationPopupBanner } from './notification-popup-banner';

// Hop thu da hien thong bao moi o dau danh sach nen khong che them popup len header cua no
const INBOX_PATHNAME = '/notifications';

/**
 * Giu ket noi thong bao realtime khi phu huynh dang nhap va hien popup thong bao moi. Dat o layout
 * goc, canh `Stack`, de popup noi tren moi man, ke ca man chi tiet (bai tap, buoi hoc, bill) mo
 * chong len thanh tab.
 */
export function NotificationRealtimeHost() {
  const pathname = usePathname();
  const { activePopup, dismissPopup } = useNotificationRealtime();

  if (!activePopup || pathname === INBOX_PATHNAME) return null;
  return <NotificationPopupBanner notification={activePopup} onDismiss={dismissPopup} />;
}
