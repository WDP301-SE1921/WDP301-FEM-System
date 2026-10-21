import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

/** Anh goc 512x382, giu ty le 4:3 nhu thiet ke. */
const HERO_ASPECT_RATIO = 4 / 3;
const BADGE_ICON_SIZE = 16;

/** Anh minh hoa lon kem nhan "Dong hanh chuan muc". */
export function WelcomeHero() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/welcome-hero.jpg')}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel="Mẹ và con gái cùng học bài tại bàn học"
      />
      <ThemedView style={styles.badge}>
        <Icon name="shield-checkmark" size={BADGE_ICON_SIZE} themeColor="accent" />
        <ThemedText type="smallBold">Đồng hành chuẩn mực</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.xl, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: HERO_ASPECT_RATIO },
  badge: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
});
