import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { getSignedOutHref, useAuth } from '@/features/auth';
import { ParentAssignmentDetail } from '@/features/parent-dashboard';

type AssignmentDetailParams = {
  assignmentId: string;
  /** Mot bai co the giao cho nhieu con, nen luon di kem id cua con dang xem. */
  studentId: string;
};

export default function AssignmentDetailScreen() {
  const { isAuthenticated, isSessionExpired, user } = useAuth();
  const { assignmentId, studentId } = useLocalSearchParams<AssignmentDetailParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/grades'));

  // App chi danh cho phu huynh: phien cu cua giao vien, nhan su mo tu deep link thi khong xem duoc
  if (user?.role !== 'PARENT' || !studentId) {
    return (
      <Screen>
        <EmptyState
          title="Không mở được bài tập"
          description="Vào Điểm & Bài tập và chọn lại bài của học sinh."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentAssignmentDetail studentId={studentId} assignmentId={assignmentId} onBack={goBack} />
    </Screen>
  );
}
