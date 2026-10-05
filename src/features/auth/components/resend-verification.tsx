import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useResendVerification } from '../hooks/use-email-verification';

const SENT_MESSAGE = 'Đã gửi lại mã. Kiểm tra hộp thư đến và cả thư rác.';
const NOT_SENT_MESSAGE =
  'Trung tâm chưa gửi được email lúc này. Vui lòng thử lại sau hoặc liên hệ trung tâm.';

export type ResendVerificationProps = {
  /** Email dang nhap, noi BE gui ma xac minh. */
  email: string;
};

/** Nut gui lai email chua ma xac minh va ket qua cua lan gui gan nhat. */
export function ResendVerification({ email }: ResendVerificationProps) {
  const resend = useResendVerification(email);

  return (
    <View style={styles.container}>
      <Button
        title="Gửi lại mã"
        variant="ghost"
        icon="refresh-outline"
        accessibilityLabel="Gửi lại mã"
        loading={resend.isPending}
        onPress={() => resend.mutate()}
        style={styles.pill}
      />
      {resend.data ? (
        <ThemedText
          type="small"
          themeColor={resend.data.sent ? 'success' : 'danger'}
          accessibilityRole="alert"
          style={styles.center}
        >
          {resend.data.sent ? SENT_MESSAGE : NOT_SENT_MESSAGE}
        </ThemedText>
      ) : null}
      <FormError error={resend.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  pill: { borderRadius: Radius.full },
  center: { textAlign: 'center' },
});
