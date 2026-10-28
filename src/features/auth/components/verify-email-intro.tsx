import { ThemedText } from '@/components/ui/themed-text';

import { AccountIntro } from './account-intro';

export type VerifyEmailIntroProps = {
  /** Email dang nhap, noi BE gui ma xac minh. */
  email: string;
  isVerified: boolean;
};

/** Hinh minh hoa, tieu de va loi giai thich cua man hinh xac minh email. */
export function VerifyEmailIntro({ email, isVerified }: VerifyEmailIntroProps) {
  if (isVerified) {
    return (
      <AccountIntro icon="checkmark-circle" tone="success" title="Email đã được xác minh">
        Bạn đã có thể tạo hồ sơ học sinh và đăng ký môn học tại trung tâm.
      </AccountIntro>
    );
  }

  return (
    <AccountIntro icon="mail-unread-outline" tone="primary" title="Xác minh email">
      Trung tâm đã gửi mã xác minh tới{' '}
      <ThemedText type="smallBold" selectable>
        {email}
      </ThemedText>
      . Dán mã vào ô bên dưới để tạo được hồ sơ học sinh.
    </AccountIntro>
  );
}
