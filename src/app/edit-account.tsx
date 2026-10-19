import { Redirect, router } from 'expo-router';

import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { AccountProfileFlow, useAuth } from '@/features/auth';

export default function EditAccountScreen() {
  const { isAuthenticated, user } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/welcome" />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  // BE chi luu so dien thoai cho phu huynh (PROFILE_PHONE_NOT_ALLOWED voi role khac)
  if (user.role !== 'PARENT') {
    return (
      <Screen>
        <EmptyState
          title="Không mở được thông tin tài khoản"
          description="Chỉ tài khoản phụ huynh sửa được thông tin trên ứng dụng."
          actionLabel="Quay lại"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AccountProfileFlow user={user} onDone={goBack} />
    </Screen>
  );
}
