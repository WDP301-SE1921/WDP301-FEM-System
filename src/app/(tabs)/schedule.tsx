import { router } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentSchedule } from '@/features/parent-dashboard';

export default function ScheduleScreen() {
  const { user } = useAuth();

  if (user?.role === 'PARENT') {
    return (
      <Screen>
        <ParentSchedule
          onAddChild={() => router.push('/add-child')}
          onOpenAssignments={() => router.navigate('/grades')}
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
