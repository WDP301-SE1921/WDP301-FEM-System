import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { getSignedOutHref, useAuth } from '@/features/auth';
import { ParentSessionDetail } from '@/features/parent-dashboard';

type SessionDetailParams = {
  sessionId: string;
  /** BE chi cho phu huynh doc mot buoi theo con, nen luon di kem id cua con. */
  studentId: string;
};

export default function SessionDetailScreen() {
  const { isAuthenticated, isSessionExpired, user } = useAuth();
  const { sessionId, studentId } = useLocalSearchParams<SessionDetailParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/schedule'));

  // App chi danh cho phu huynh: phien cu cua giao vien, nhan su mo tu deep link thi khong xem duoc
  if (user?.role !== 'PARENT' || !studentId) {
    return (
      <Screen>
        <EmptyState
          title="Không mở được buổi học"
          description="Vào Lịch học và chọn lại buổi học của học sinh."
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
