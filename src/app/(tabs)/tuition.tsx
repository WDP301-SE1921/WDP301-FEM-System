import { router } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentTuition, useRefreshParentData } from '@/features/parent-dashboard';

export default function TuitionScreen() {
  const { user } = useAuth();
  const { isRefreshing, refresh } = useRefreshParentData();

  if (user?.role === 'PARENT') {
    return (
      <Screen onRefresh={refresh} isRefreshing={isRefreshing}>
        <ParentTuition
          onAddChild={() => router.push('/add-child')}
          onOpenReceipt={(registrationId) =>
            router.push({ pathname: '/receipts/[registrationId]', params: { registrationId } })
          }
        />
      </Screen>
    );
  }

  // Chua chot giao vien, quan ly co dung app mobile hay khong: giu man hinh tam
  return (
    <Screen>
      <EmptyState title="Học phí" description="Tính năng đang được phát triển." />
    </Screen>
  );
}
