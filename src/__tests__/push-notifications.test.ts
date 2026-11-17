import * as Notifications from 'expo-notifications';
import { AppState, type AppStateStatus } from 'react-native';

import { configureNotificationHandler } from '@/lib/push-notifications';

const originalCurrentState = Object.getOwnPropertyDescriptor(AppState, 'currentState');

/** Mock AppState cua React Native de `currentState` la ham nen dat thang gia tri cho tung ca. */
function setAppState(status: AppStateStatus) {
  Object.defineProperty(AppState, 'currentState', { value: status, configurable: true });
}

afterEach(() => {
  if (originalCurrentState) Object.defineProperty(AppState, 'currentState', originalCurrentState);
});

describe('lib/push-notifications', () => {
  it('app dang mo thi chi ghi vao khay (popup trong app da hien), app o nen thi hien banner OS', async () => {
    configureNotificationHandler();
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];
    // Handler cua app khong doc noi dung thong bao nen chi can mot object rong
    const notification = {} as Notifications.Notification;

    setAppState('active');
    await expect(handler?.handleNotification(notification)).resolves.toMatchObject({
      shouldShowBanner: false,
      shouldShowList: true,
    });

    setAppState('background');
    await expect(handler?.handleNotification(notification)).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
    });
  });
});
