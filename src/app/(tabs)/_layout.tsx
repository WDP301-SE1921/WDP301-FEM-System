import { Redirect, Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/icon';
import { useAuth } from '@/features/auth';
import { useNotificationRealtime } from '@/features/parent-dashboard';
import { useTheme } from '@/hooks/use-theme';

type TabConfig = {
  /** Ten file route trong `(tabs)/`. */
  name: string;
  title: string;
  icon: IconName;
  focusedIcon: IconName;
};

const TABS: readonly TabConfig[] = [
  { name: 'index', title: 'Trang chủ', icon: 'home-outline', focusedIcon: 'home' },
  { name: 'schedule', title: 'Lịch học', icon: 'calendar-outline', focusedIcon: 'calendar' },
  {
    name: 'grades',
    title: 'Điểm & Bài',
    icon: 'document-text-outline',
    focusedIcon: 'document-text',
  },
  { name: 'tuition', title: 'Học phí', icon: 'wallet-outline', focusedIcon: 'wallet' },
  {
    name: 'profile',
    title: 'Tài khoản',
    icon: 'person-circle-outline',
    focusedIcon: 'person-circle',
  },
];

/**
 * Route nam trong `(tabs)/` nhung khong co nut tren thanh tab, chi mo tu man hinh khac. Thong bao
 * mo tu nut chuong va "Xem tất cả" o trang chu.
 */
const HIDDEN_ROUTES = ['notifications'] as const;

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  // Layout nay song suot phien dang nhap (cac man mo tu tab nam chong len tren), nen giu ket noi
  // thong bao realtime o day
  useNotificationRealtime();

  // Chan truy cap khi chua dang nhap
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Icon name={focused ? tab.focusedIcon : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
      {HIDDEN_ROUTES.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
