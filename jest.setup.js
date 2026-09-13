/* eslint-disable no-undef */
// Setup chung cho toan bo test suite.

// Reanimated can mock trong moi truong test
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Im lang cac warning khong lien quan trong test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useNativeDriver')) return;
  originalWarn(...args);
};
