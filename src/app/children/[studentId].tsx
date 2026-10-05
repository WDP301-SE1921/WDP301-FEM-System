import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { EditChildFlow } from '@/features/children';

type EditChildParams = {
  studentId: string;
};

export default function EditChildScreen() {
  const { isAuthenticated, user } = useAuth();
  const { studentId } = useLocalSearchParams<EditChildParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  // Chi phu huynh co ho so con
  if (user?.role !== 'PARENT') {
    return (
      <Screen>
        <EmptyState
          title="Không mở được hồ sơ"
          description="Chỉ tài khoản phụ huynh có hồ sơ của con."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <EditChildFlow studentId={studentId} onBack={goBack} onDone={goBack} />
    </Screen>
  );
}
