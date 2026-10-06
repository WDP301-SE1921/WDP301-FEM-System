import { router } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentSchedule, useRefreshParentData } from '@/features/parent-dashboard';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { isRefreshing, refresh } = useRefreshParentData();

  if (user?.role === 'PARENT') {
    return (
      <Screen onRefresh={refresh} isRefreshing={isRefreshing}>
        <ParentSchedule
          onAddChild={() => router.push('/add-child')}
          onOpenAssignments={() => router.navigate('/grades')}
          onOpenSession={({ studentId, sessionId, startsAt }) =>
            router.push({
              pathname: '/sessions/[sessionId]',
              params: { sessionId, studentId, startsAt },
            })
          }
        />
      </Screen>
    );
  }

  // Chua chot giao vien, quan ly co dung app mobile hay khong: giu man hinh tam
  return (
    <Screen>
      <EmptyState title="Lịch học" description="Tính năng đang được phát triển." />
    </Screen>
  );
}
