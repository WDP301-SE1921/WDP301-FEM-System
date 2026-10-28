import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Images } from '@/constants/images';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LOGO_SIZE = 64;
const BADGE_SIZE = 20;
const BADGE_ICON_SIZE = 12;
const BADGE_BORDER_WIDTH = 2;
const DOT_SIZE = 6;

/** Logo, ten va khau hieu cua trung tam. */
export function BrandHeader() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={Images.logo}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="Logo EduGrade"
        />
        <View
          style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.background }]}
        >
          <Icon name="star" size={BADGE_ICON_SIZE} themeColor="primaryText" />
        </View>
      </View>

      <ThemedText type="subtitle">EduGrade</ThemedText>

      <ThemedView type="backgroundElement" style={styles.tagline}>
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.taglineText}>
          Trung tâm bồi dưỡng kiến thức
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: Radius.full },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: Radius.full,
    borderWidth: BADGE_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  // Chu phong to lam khau hieu dai hon be ngang man hinh: xuong dong trong nhan
  taglineText: { flexShrink: 1, textAlign: 'center' },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
});
