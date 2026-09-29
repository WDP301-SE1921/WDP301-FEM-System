import { Redirect, Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/icon';
import { useAuth } from '@/features/auth';
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
  {
    name: 'notifications',
    title: 'Thông báo',
    icon: 'notifications-outline',
    focusedIcon: 'notifications',
  },
  {
    name: 'profile',
    title: 'Tài khoản',
    icon: 'person-circle-outline',
    focusedIcon: 'person-circle',
  },
];

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

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
    </Tabs>
  );
}
