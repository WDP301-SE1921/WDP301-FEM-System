import { Redirect, router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { getSignedOutHref, useAuth, VerifyEmailFlow } from '@/features/auth';

export default function VerifyEmailScreen() {
  const { isAuthenticated, isSessionExpired, user } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Vao tu dang nhap hoac dang ky thi khong co man hinh truoc de quay lai
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen>
      <VerifyEmailFlow user={user} onDone={leave} />
    </Screen>
  );
}
