import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentSessionDetail } from '@/features/parent-dashboard';

type SessionDetailParams = {
  sessionId: string;
  /** Id buoi chi co nghia trong lich cua mot con, nen luon di kem id cua con. */
  studentId: string;
};

export default function SessionDetailScreen() {
  const { isAuthenticated, user } = useAuth();
  const { sessionId, studentId } = useLocalSearchParams<SessionDetailParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/schedule'));

  // Chua chot giao vien, quan ly co dung app mobile hay khong: chi phu huynh xem duoc
  if (user?.role !== 'PARENT' || !studentId) {
    return (
      <Screen>
        <EmptyState
          title="Không mở được buổi học"
          description="Vào Lịch học và chọn lại buổi học của con."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentSessionDetail studentId={studentId} sessionId={sessionId} onBack={goBack} />
    </Screen>
  );
}
