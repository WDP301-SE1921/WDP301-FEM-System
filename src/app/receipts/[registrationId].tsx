import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentReceiptDetail } from '@/features/parent-dashboard';

type ReceiptDetailParams = {
  /** Id don dang ky: BE tra bien lai theo don, khong theo ma bien lai. */
  registrationId: string;
};

export default function ReceiptDetailScreen() {
  const { isAuthenticated, user } = useAuth();
  const { registrationId } = useLocalSearchParams<ReceiptDetailParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tuition'));

  // Chua chot giao vien, quan ly co dung app mobile hay khong: chi phu huynh xem duoc
  if (user?.role !== 'PARENT') {
    return (
      <Screen>
        <EmptyState
          title="Không mở được biên lai"
          description="Vào Học phí và chọn lại biên lai của học sinh."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentReceiptDetail registrationId={registrationId} onBack={goBack} />
    </Screen>
  );
}
