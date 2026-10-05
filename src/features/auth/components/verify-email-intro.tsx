import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';

const ILLUSTRATION_SIZE = 80;
const ICON_SIZE = 40;
const TEXT_MAX_WIDTH = 320;

type Appearance = { icon: IconName; background: ThemeColor; color: ThemeColor; title: string };

const APPEARANCES: Record<'pending' | 'verified', Appearance> = {
  pending: {
    icon: 'mail-unread-outline',
    background: 'primarySoft',
    color: 'primary',
    title: 'Xác minh email',
  },
  verified: {
    icon: 'checkmark-circle',
    background: 'successSoft',
    color: 'success',
    title: 'Email đã được xác minh',
  },
};

export type VerifyEmailIntroProps = {
  /** Email dang nhap, noi BE gui ma xac minh. */
  email: string;
  isVerified: boolean;
};

/** Hinh minh hoa, tieu de va loi giai thich cua man hinh xac minh email. */
export function VerifyEmailIntro({ email, isVerified }: VerifyEmailIntroProps) {
  const { icon, background, color, title } = APPEARANCES[isVerified ? 'verified' : 'pending'];

  return (
    <View style={styles.container}>
      <ThemedView type={background} style={styles.illustration}>
        <Icon name={icon} size={ICON_SIZE} themeColor={color} />
      </ThemedView>
      <ThemedText type="heading" accessibilityRole="header" style={styles.center}>
        {title}
      </ThemedText>
      {isVerified ? (
        <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
          Bạn đã có thể tạo hồ sơ cho con và đăng ký môn học tại trung tâm.
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
          Trung tâm đã gửi mã xác minh tới{' '}
          <ThemedText type="smallBold" selectable>
            {email}
          </ThemedText>
          . Dán mã vào ô bên dưới để tạo được hồ sơ cho con.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: { textAlign: 'center' },
  text: { maxWidth: TEXT_MAX_WIDTH },
});
