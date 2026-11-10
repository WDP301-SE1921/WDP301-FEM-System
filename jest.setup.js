/* eslint-disable no-undef */
// Setup chung cho toan bo test suite.

// `constants/config` bat buoc co dia chi BE. Test khong ra mang nen gia tri nay khong duoc goi toi.
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/api/v1';

// Reanimated can mock trong moi truong test
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock expo-notifications trong moi truong Jest
jest.mock('expo-notifications', () => ({
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Im lang cac warning khong lien quan trong test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useNativeDriver')) return;
  originalWarn(...args);
};
