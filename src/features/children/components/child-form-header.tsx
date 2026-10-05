import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const BACK_ICON_SIZE = 22;

export type ChildFormHeaderProps = {
  title: string;
  description: string;
  onBack: () => void;
};

/** Nut quay lai, tieu de va loi giai thich cua man hinh them con va sua ho so con. */
export function ChildFormHeader({ title, description, onBack }: ChildFormHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
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
        <ThemedText
          type="heading"
          accessibilityRole="header"
          numberOfLines={1}
          style={styles.title}
        >
          {title}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
