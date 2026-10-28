import { Redirect, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';

import { Screen } from '@/components/common/screen';
import { TabBar, type TabBarItem } from '@/components/common/tab-bar';
import type { IconName } from '@/components/ui/icon';
import { canUseMobileApp, getSignedOutHref, MobileAccessDenied, useAuth } from '@/features/auth';
import { useNotificationRealtime } from '@/features/parent-dashboard';

type TabConfig = {
  /** Ten file route trong `(tabs)/`. */
  name: string;
  title: string;
  icon: IconName;
  focusedIcon: IconName;
};

/**
 * Cac nut tren thanh tab. Route nam trong `(tabs)/` ma khong co o day (`notifications`) khong co nut,
 * chi mo tu man hinh khac: thong bao mo tu nut chuong va "Xem tất cả" o trang chu.
 */
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

function renderTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const focusedKey = state.routes[state.index]?.key;
  const items: TabBarItem[] = state.routes.flatMap((route) => {
    const tab = TABS.find(({ name }) => name === route.name);
    if (!tab) return [];
    const { title: label, icon, focusedIcon } = tab;
    return [{ key: route.key, label, icon, focusedIcon, isFocused: route.key === focusedKey }];
  });

  // Giu hanh vi cua thanh tab mac dinh: phat `tabPress` truoc de man hinh chan duoc (vd cuon len dau
  // khi bam lai tab dang mo), roi moi chuyen tab
  const handlePress = (routeKey: string) => {
    const route = state.routes.find(({ key }) => key === routeKey);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (route.key !== focusedKey && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <TabBar
      items={items}
      bottomInset={insets.bottom}
      onPress={handlePress}
      onLongPress={(routeKey) => navigation.emit({ type: 'tabLongPress', target: routeKey })}
    />
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isSessionExpired, user } = useAuth();
  // Layout nay song suot phien dang nhap (cac man mo tu tab nam chong len tren), nen giu ket noi
  // thong bao realtime o day
  useNotificationRealtime();

  // Chan truy cap khi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Dang nhap da chan giao vien, nhan su trung tam; con lai phien cua ho luu tu truoc
  if (!canUseMobileApp(user)) {
    return (
      <Screen>
        <MobileAccessDenied />
      </Screen>
    );
  }

  return (
    // `history`: nut quay lai cua Android va cua man Thong bao ve dung tab vua mo, khong nhay ve trang chu
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar} backBehavior="history">
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
