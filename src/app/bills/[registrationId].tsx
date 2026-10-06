import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { useAuth } from '@/features/auth';
import { ParentBillDetail } from '@/features/parent-dashboard';

type BillDetailParams = {
  /** Id don dang ky: BE tra bill theo don. */
  registrationId: string;
};

export default function BillDetailScreen() {
  const { isAuthenticated, user } = useAuth();
  const { registrationId } = useLocalSearchParams<BillDetailParams>();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tuition'));

  // Chua chot giao vien, quan ly co dung app mobile hay khong: chi phu huynh xem duoc
  if (user?.role !== 'PARENT') {
    return (
      <Screen>
        <EmptyState
          title="Không mở được bill học phí"
          description="Vào Học phí và chọn lại bill của con."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentBillDetail
        registrationId={registrationId}
        onBack={goBack}
        onOpenReceipt={(id) =>
          router.push({ pathname: '/receipts/[registrationId]', params: { registrationId: id } })
        }
      />
    </Screen>
  );
}
