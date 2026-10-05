import { router } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentAssignments, useRefreshParentData } from '@/features/parent-dashboard';

export default function GradesScreen() {
  const { user } = useAuth();
  const { isRefreshing, refresh } = useRefreshParentData();

  if (user?.role === 'PARENT') {
    return (
      <Screen onRefresh={refresh} isRefreshing={isRefreshing}>
        <ParentAssignments
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

  // Chua chot giao vien, quan ly co dung app mobile hay khong: giu man hinh tam
  return (
    <Screen>
      <EmptyState title="Điểm & Bài tập" description="Tính năng đang được phát triển." />
    </Screen>
  );
}
