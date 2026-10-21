import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import type { User } from '@/types/auth';

import { useRefreshedUser, useVerifyEmail } from '../hooks/use-email-verification';
import { needsEmailVerification } from '../utils';

import { ResendVerification } from './resend-verification';
import { VerifyEmailForm } from './verify-email-form';
import { VerifyEmailIntro } from './verify-email-intro';

export type VerifyEmailFlowProps = {
  /** Tai khoan cua phien dang nhap. */
  user: User;
  /** Roi man hinh: da xac minh xong, hoac phu huynh chon de sau. */
  onDone: () => void;
};

/**
 * Phu huynh dan ma BE gui qua email de xac minh tai khoan. BE chi cho tao va sua ho so con sau buoc
 * nay; SRS muc 6.1 khong co buoc xac minh nen phu huynh van bo qua duoc de xem app.
 */
export function VerifyEmailFlow({ user, onDone }: VerifyEmailFlowProps) {
  // Mo man hinh thi doc lai tai khoan: email co the da duoc xac minh tu lan truoc
  useRefreshedUser();
  const verifyEmail = useVerifyEmail();
  const isVerified = verifyEmail.isSuccess || !needsEmailVerification(user);

  return (
    <View style={styles.flow}>
      <VerifyEmailIntro email={user.email} isVerified={isVerified} />
      {isVerified ? (
        <Button
          title="Tiếp tục"
          trailingIcon="arrow-forward"
          accessibilityLabel="Tiếp tục"
          onPress={onDone}
          style={styles.pill}
        />
      ) : (
        <>
          <VerifyEmailForm
            onSubmit={(values) => verifyEmail.mutate(values)}
            isPending={verifyEmail.isPending}
            error={verifyEmail.error}
          />
          <ResendVerification email={user.email} />
          <Button title="Để sau" variant="ghost" onPress={onDone} style={styles.pill} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  pill: { borderRadius: Radius.full },
});
