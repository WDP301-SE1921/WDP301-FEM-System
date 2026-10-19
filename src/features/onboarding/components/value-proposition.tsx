import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';

const HIGHLIGHT_ICON_SIZE = 16;
const DESCRIPTION_MAX_WIDTH = 320;

type Highlight = { icon: IconName; label: string; tone: ThemeColor };

const HIGHLIGHTS: readonly Highlight[] = [
  { icon: 'time-outline', label: 'Điểm danh tức thì', tone: 'primary' },
  { icon: 'clipboard', label: 'Theo dõi bài tập', tone: 'accent' },
  { icon: 'bar-chart-outline', label: 'Báo cáo minh bạch', tone: 'primary' },
];

/** Thong diep chinh va cac diem noi bat cua app. */
export function ValueProposition() {
  return (
    <View style={styles.container}>
      <ThemedText type="heading" style={styles.center}>
        Đồng hành cùng học sinh mỗi buổi học
      </ThemedText>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={[styles.center, styles.description]}
      >
        Xem lịch học, điểm danh, kết quả học tập của học sinh ở một nơi
      </ThemedText>

      <View style={styles.highlights}>
        {HIGHLIGHTS.map((item) => (
          <ThemedView key={item.label} type="backgroundElement" style={styles.pill}>
            <Icon name={item.icon} size={HIGHLIGHT_ICON_SIZE} themeColor={item.tone} />
            <ThemedText type="small" style={styles.pillText}>
              {item.label}
            </ThemedText>
          </ThemedView>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  center: { textAlign: 'center' },
  description: { maxWidth: DESCRIPTION_MAX_WIDTH },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  pill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  // Chu phong to lam mot nhan dai hon ca hang: xuong dong trong nhan, khong de icon day chu tran ra
  pillText: { flexShrink: 1 },
});
