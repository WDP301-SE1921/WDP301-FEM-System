import { act, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import TabsLayout from '@/app/(tabs)/_layout';

jest.mock('@/features/auth', () => ({
  canUseMobileApp: () => true,
  getSignedOutHref: () => '/welcome',
  MobileAccessDenied: () => null,
  useAuth: () => ({
    isAuthenticated: true,
    isSessionExpired: false,
    user: { id: 'parent-1', role: 'PARENT' },
  }),
}));
jest.mock('@/features/parent-dashboard', () => ({ useNotificationRealtime: jest.fn() }));

function screenOf(title: string) {
  return function MockScreen() {
    return <Text>{`Màn ${title}`}</Text>;
  };
}

describe('app/(tabs)/_layout', () => {
  it('mo hop thu thong bao (khong co nut tren thanh tab) tu nut chuong', async () => {
    await renderRouter(
      {
        '(tabs)/_layout': TabsLayout,
        '(tabs)/index': screenOf('Trang chủ'),
        '(tabs)/schedule': screenOf('Lịch học'),
        '(tabs)/grades': screenOf('Điểm & Bài'),
        '(tabs)/tuition': screenOf('Học phí'),
        '(tabs)/profile': screenOf('Tài khoản'),
        '(tabs)/notifications': screenOf('Hộp thư thông báo'),
      },
      { initialUrl: '/' },
    );
    expect(await screen.findByText('Màn Trang chủ')).toBeOnTheScreen();

    await act(() => router.navigate('/notifications'));

    expect(await screen.findByText('Màn Hộp thư thông báo')).toBeOnTheScreen();
    expect(screen).toHavePathname('/notifications');
    // Hop thu khong co nut rieng tren thanh tab
    expect(screen.queryByRole('tab', { name: /thông báo/i })).not.toBeOnTheScreen();
  });
});
