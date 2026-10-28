import { Redirect, router } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { getSignedOutHref, needsEmailVerification, useAuth } from '@/features/auth';
import { AddChildFlow } from '@/features/children';

export default function AddChildScreen() {
  const { isAuthenticated, isSessionExpired, user } = useAuth();

  // Nam ngoai (tabs) nen tu chan nguoi chua dang nhap
  if (!isAuthenticated || !user) return <Redirect href={getSignedOutHref(isSessionExpired)} />;

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen>
      <AddChildFlow
        parentEmail={user.email}
        isEmailVerified={!needsEmailVerification(user)}
        onVerifyEmail={() => router.push('/verify-email')}
        onBack={goHome}
        onDone={goHome}
      />
    </Screen>
  );
}
