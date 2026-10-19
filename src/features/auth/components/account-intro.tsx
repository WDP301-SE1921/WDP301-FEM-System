import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';

const ILLUSTRATION_SIZE = 80;
const ICON_SIZE = 40;
const TEXT_MAX_WIDTH = 320;

type IntroTone = 'primary' | 'success';

const TONES: Record<IntroTone, { background: ThemeColor; color: ThemeColor }> = {
  primary: { background: 'primarySoft', color: 'primary' },
  success: { background: 'successSoft', color: 'success' },
};

export type AccountIntroProps = {
  icon: IconName;
  /** `success` khi thao tac da xong. */
  tone: IntroTone;
  title: string;
  /** Loi giai thich duoi tieu de; dat `ThemedText` `smallBold` ben trong de nhan manh. */
  children: ReactNode;
};

/** Hinh minh hoa, tieu de va loi giai thich o dau cac man tai khoan (email, mat khau, thong tin). */
export function AccountIntro({ icon, tone, title, children }: AccountIntroProps) {
  const { background, color } = TONES[tone];

  return (
    <View style={styles.container}>
      <ThemedView type={background} style={styles.illustration}>
        <Icon name={icon} size={ICON_SIZE} themeColor={color} />
      </ThemedView>
      <ThemedText type="heading" accessibilityRole="header" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
        {children}
      </ThemedText>
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
