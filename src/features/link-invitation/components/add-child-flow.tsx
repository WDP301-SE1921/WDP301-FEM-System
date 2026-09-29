import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useClaimInvitation, useInspectInvitation } from '../hooks/use-link-invitation';
import type { InvitationPreview } from '../types';

import { InvitationErrorMessage } from './invitation-error-message';
import { LinkCodeForm } from './link-code-form';
import { LinkCodeIntro } from './link-code-intro';
import { LinkInvitationHeader } from './link-invitation-header';
import { LinkSuccess } from './link-success';
import { LinkedStudentCard } from './linked-student-card';

export type AddChildFlowProps = {
  /** Thoat khoi luong o buoc nhap ma. */
  onBack: () => void;
  /** Lien ket xong, phu huynh bam ve trang chu. */
  onDone: () => void;
};

/**
 * Phu huynh da dang nhap dung ma lien ket de them con (§6.5): nhap ma -> xac nhan -> xong.
 * Buoc hien tai suy ra tu ket qua hai mutation, khong luu rieng vao state.
 */
export function AddChildFlow({ onBack, onDone }: AddChildFlowProps) {
  const inspect = useInspectInvitation('ADD_CHILD');
  const claim = useClaimInvitation();
  const invitation = inspect.data;
  const token = inspect.variables;

  if (claim.data) return <LinkSuccess studentName={claim.data.studentName} onDone={onDone} />;

  if (!invitation || !token) {
    return (
      <View style={styles.flow}>
        <LinkInvitationHeader step={1} stepLabel="Nhập mã liên kết" onBack={onBack} />
        <LinkCodeIntro />
        <LinkCodeForm
          onSubmit={(code) => inspect.mutate(code)}
          isPending={inspect.isPending}
          error={inspect.error}
        />
      </View>
    );
  }

  const changeCode = () => {
    claim.reset();
    inspect.reset();
  };

  return (
    <View style={styles.flow}>
      <LinkInvitationHeader step={2} stepLabel="Xác nhận liên kết" onBack={changeCode} />
      <ConfirmStep
        invitation={invitation}
        token={token}
        onConfirm={() => claim.mutate(token)}
        onChangeCode={changeCode}
        isPending={claim.isPending}
        error={claim.error}
      />
    </View>
  );
}

type ConfirmStepProps = {
  invitation: InvitationPreview;
  token: string;
  onConfirm: () => void;
  onChangeCode: () => void;
  isPending: boolean;
  error: unknown;
};

function ConfirmStep({
  invitation,
  token,
  onConfirm,
  onChangeCode,
  isPending,
  error,
}: ConfirmStepProps) {
  return (
    <>
      <View style={styles.intro}>
        <ThemedText type="heading" accessibilityRole="header">
          Thêm con vào tài khoản
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Kiểm tra đúng tên và lớp của con trước khi liên kết.
        </ThemedText>
      </View>

      <LinkedStudentCard invitation={invitation} code={token} />

      <ThemedText type="small" themeColor="textSecondary">
        Mã được gửi tới {invitation.maskedEmail}. Chỉ tài khoản đăng nhập bằng email này mới liên
        kết được.
      </ThemedText>

      <InvitationErrorMessage error={error} />

      <View style={styles.actions}>
        <Button
          title="Liên kết với tài khoản"
          icon="link-outline"
          loading={isPending}
          onPress={onConfirm}
          style={styles.pill}
        />
        <Button
          title="Nhập mã khác"
          variant="ghost"
          disabled={isPending}
          onPress={onChangeCode}
          style={styles.pill}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: Spacing.four },
  intro: { gap: Spacing.one },
  actions: { marginTop: 'auto', gap: Spacing.three },
  pill: { borderRadius: Radius.full },
});
