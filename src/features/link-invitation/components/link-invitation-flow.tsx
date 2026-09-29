import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { useClaimAndSignUp, useInspectInvitation } from '../hooks/use-link-invitation';
import type { InvitationPreview } from '../types';

import { ClaimSignUpForm } from './claim-sign-up-form';
import { LinkCodeForm } from './link-code-form';
import { LinkCodeIntro } from './link-code-intro';
import { LinkInvitationHeader } from './link-invitation-header';
import { LinkedStudentCard } from './linked-student-card';

export type LinkInvitationFlowProps = {
  /** Thoat khoi luong o buoc nhap ma. */
  onBack: () => void;
  /** Email trong ma da co tai khoan: route dieu huong sang man hinh dang nhap. */
  onSignIn: () => void;
};

/**
 * Luong dung ma lien ket: nhap ma -> xem thong tin -> tao tai khoan hoac dang nhap.
 * Buoc hien tai suy ra tu ket qua kiem tra ma, khong luu rieng vao state.
 */
export function LinkInvitationFlow({ onBack, onSignIn }: LinkInvitationFlowProps) {
  const inspect = useInspectInvitation();
  const invitation = inspect.data;
  const token = inspect.variables;

  if (!invitation || !token) {
    return (
      <View style={styles.flow}>
        <LinkInvitationHeader step={1} stepLabel="Xác thực phụ huynh" onBack={onBack} />
        <LinkCodeIntro />
        <LinkCodeForm
          onSubmit={(code) => inspect.mutate(code)}
          onSignIn={onSignIn}
          isPending={inspect.isPending}
          error={inspect.error}
        />
      </View>
    );
  }

  const isCreateAccount = invitation.mode === 'CREATE_ACCOUNT';

  return (
    <View style={styles.flow}>
      {/* Buoc 2 quay lai buoc nhap ma thay vi roi man hinh */}
      <LinkInvitationHeader
        step={2}
        stepLabel={isCreateAccount ? 'Tạo tài khoản' : 'Đăng nhập'}
        onBack={() => inspect.reset()}
      />

      {isCreateAccount ? (
        <CreateAccountStep invitation={invitation} token={token} onSignIn={onSignIn} />
      ) : (
        <SignInStep
          invitation={invitation}
          token={token}
          onSignIn={onSignIn}
          onChangeCode={() => inspect.reset()}
        />
      )}
    </View>
  );
}

type StepProps = {
  invitation: InvitationPreview;
  token: string;
  onSignIn: () => void;
};

function CreateAccountStep({ invitation, token, onSignIn }: StepProps) {
  const claim = useClaimAndSignUp();

  return (
    <>
      <View style={styles.intro}>
        <ThemedText type="heading" accessibilityRole="header">
          Tạo tài khoản phụ huynh
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Xác thực mã thành công! Hoàn tất thiết lập tài khoản để theo dõi tình hình học tập của
          con.
        </ThemedText>
      </View>

      <LinkedStudentCard invitation={invitation} code={token} />

      <ClaimSignUpForm
        maskedEmail={invitation.maskedEmail}
        onSubmit={(password) => claim.mutate({ token, password })}
        onSignIn={onSignIn}
        isPending={claim.isPending}
        error={claim.error}
      />
    </>
  );
}

function SignInStep({
  invitation,
  token,
  onSignIn,
  onChangeCode,
}: StepProps & { onChangeCode: () => void }) {
  return (
    <>
      <LinkedStudentCard invitation={invitation} code={token} />

      <View style={styles.step}>
        <ThemedText type="small" themeColor="textSecondary">
          Email {invitation.maskedEmail} đã có tài khoản EduGrade. Vui lòng đăng nhập bằng email này
          để tiếp tục.
        </ThemedText>
        <Button title="Đăng nhập" icon="log-in-outline" onPress={onSignIn} />
        <Button title="Nhập mã khác" variant="ghost" onPress={onChangeCode} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: Spacing.four },
  intro: { gap: Spacing.one },
  step: { gap: Spacing.three },
});
