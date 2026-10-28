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
      {/* Vung dat nhan cach deu hai mep anh: nhan om vua chu, chu phong to thi xuong dong trong vung */}
      <View style={styles.badgeArea}>
        <ThemedView style={styles.badge}>
          <Icon name="shield-checkmark" size={BADGE_ICON_SIZE} themeColor="accent" />
          <ThemedText type="smallBold" style={styles.badgeText}>
            Đồng hành chuẩn mực
          </ThemedText>
        </ThemedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.xl, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: HERO_ASPECT_RATIO },
  badgeArea: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  badgeText: { flexShrink: 1 },
});
