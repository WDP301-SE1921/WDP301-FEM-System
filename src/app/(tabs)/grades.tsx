import { router, useLocalSearchParams } from 'expo-router';

import { Screen, TAB_SCREEN_EDGES } from '@/components/common/screen';
import { TabHeader } from '@/components/common/tab-header';
import {
  NotificationBell,
  ParentAssignments,
  toAssignmentTab,
  useRefreshParentData,
} from '@/features/parent-dashboard';

type GradesParams = {
  /** Tab bai tap (`TODO`, `SUBMITTED`, `GRADED`), vd trang chu mo thang bai da co diem. */
  tab?: string;
};

export default function GradesScreen() {
  const { isRefreshing, refresh } = useRefreshParentData();
  const { tab } = useLocalSearchParams<GradesParams>();

  return (
    <Screen edges={TAB_SCREEN_EDGES} onRefresh={refresh} isRefreshing={isRefreshing}>
      <TabHeader
        title="Điểm & Bài tập"
        subtitle="Bài cần làm, bài đã nộp và điểm"
        trailing={<NotificationBell onPress={() => router.navigate('/notifications')} />}
      />
      <ParentAssignments
        tab={toAssignmentTab(tab)}
        onChangeTab={(nextTab) => router.setParams({ tab: nextTab })}
        onAddChild={() => router.push('/add-child')}
        onOpenAssignment={({ studentId, assignmentId }) =>
          router.push({
            pathname: '/assignments/[assignmentId]',
            params: { assignmentId, studentId },
          })
        }
      />
    </Screen>
  );
}
