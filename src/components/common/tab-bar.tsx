import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 24;
/** Vien nen bao quanh icon cua tab dang mo, kieu thanh dieu huong Material 3. */
const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;
/**
 * Nhan tab la chu dieu huong, khong phai noi dung chinh: 12px de 5 tab vua man hinh 360dp ma khong
 * cat chu ("Điểm & Bài").
 */
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 16;
/** Chu phong to qua muc nay thi nhan tab bi cat, thanh tab cua he dieu hanh cung gioi han tuong tu. */
const LABEL_MAX_FONT_SCALE = 1.3;

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconName;
  /** Icon khi tab dang mo (ban to dac). */
  focusedIcon: IconName;
  isFocused: boolean;
};

export type TabBarProps = {
  items: readonly TabBarItem[];
  /** Phan safe area phia duoi (thanh home cua iOS, thanh dieu huong cua Android). */
  bottomInset: number;
  onPress: (key: string) => void;
  onLongPress?: (key: string) => void;
};

/** Thanh tab duoi man hinh: tab dang mo co nen tron quanh icon va nhan dam mau chinh. */
export function TabBar({ items, bottomInset, onPress, onLongPress }: TabBarProps) {
  const theme = useTheme();

  return (
    <ThemedView
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { borderTopColor: theme.border, paddingBottom: Math.max(bottomInset, Spacing.two) },
      ]}
    >
      {items.map(({ key, label, icon, focusedIcon, isFocused }) => {
        const color = isFocused ? 'primary' : 'textSecondary';
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
            onPress={() => onPress(key)}
            onLongPress={onLongPress && (() => onLongPress(key))}
            style={styles.item}
          >
            {({ pressed }) => (
              <>
                <View
                  style={[
                    styles.indicator,
                    pressed && { backgroundColor: theme.backgroundElement },
                    isFocused && { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Icon name={isFocused ? focusedIcon : icon} size={ICON_SIZE} themeColor={color} />
                </View>
                <ThemedText
                  type={isFocused ? 'smallBold' : 'small'}
                  themeColor={color}
                  numberOfLines={1}
                  maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
                  style={styles.label}
                >
                  {label}
                </ThemedText>
              </>
            )}
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingBottom: Spacing.one,
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  label: { fontSize: LABEL_FONT_SIZE, lineHeight: LABEL_LINE_HEIGHT },
});
