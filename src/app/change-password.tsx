import { Redirect, router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { ChangePasswordFlow, getSignedOutHref, useAuth } from '@/features/auth';

export default function ChangePasswordScreen() {
  const { isAuthenticated, isSessionExpired } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return (
    <Screen>
      <ChangePasswordFlow onDone={goBack} />
    </Screen>
  );
}
