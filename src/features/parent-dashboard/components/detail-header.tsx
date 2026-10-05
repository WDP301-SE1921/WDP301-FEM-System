import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const BACK_ICON_SIZE = 22;

export type DetailHeaderProps = {
  title: string;
  onBack: () => void;
};

/** Thanh tren cung cua man hinh chi tiet (buoi hoc, bien lai): nut quay lai va tieu de. */
export function DetailHeader({ title, onBack }: DetailHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="arrow-back" size={BACK_ICON_SIZE} />
      </Pressable>
      <ThemedText type="heading" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  backButton: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  title: { flexShrink: 1 },
});
