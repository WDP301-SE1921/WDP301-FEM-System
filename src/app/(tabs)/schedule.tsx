import { router, useLocalSearchParams } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import { TabHeader } from '@/components/common/tab-header';
import {
  NotificationBell,
  ParentSchedule,
  toScheduleView,
  useRefreshParentData,
} from '@/features/parent-dashboard';

type ScheduleParams = {
  /** Che do xem (`WEEK`, `COURSES`, `ROADMAP`, `ATTENDANCE`), vd trang chu mo thang diem danh. */
  view?: string;
};

export default function ScheduleScreen() {
  const { isRefreshing, refresh } = useRefreshParentData();
  const { view } = useLocalSearchParams<ScheduleParams>();

  return (
    <Screen edges={TAB_SCREEN_EDGES} onRefresh={refresh} isRefreshing={isRefreshing}>
      <TabHeader
        title="Lịch học"
        subtitle="Lịch tuần, môn học và điểm danh"
        trailing={<NotificationBell onPress={() => router.navigate('/notifications')} />}
      />
      <ParentSchedule
        view={toScheduleView(view)}
        onChangeView={(nextView) => router.setParams({ view: nextView })}
        onAddChild={() => router.push('/add-child')}
        onOpenAssignments={() => router.navigate({ pathname: '/grades', params: { tab: 'TODO' } })}
        onOpenSession={({ studentId, sessionId }) =>
          router.push({ pathname: '/sessions/[sessionId]', params: { sessionId, studentId } })
        }
      />
    </Screen>
  );
}
