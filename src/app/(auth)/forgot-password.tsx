import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/common/screen';
import { ForgotPasswordFlow } from '@/features/auth';

type ForgotPasswordParams = {
  /** Email da nhap o man dang nhap. */
  email?: string;
};

export default function ForgotPasswordScreen() {
  const { email } = useLocalSearchParams<ForgotPasswordParams>();

  // Mo thang tu deep link thi khong co man hinh truoc de quay lai
  const goToLogin = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  return (
    <Screen>
      <ForgotPasswordFlow defaultEmail={email ?? ''} onBack={goToLogin} />
    </Screen>
  );
}
