import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { ASSIGNMENT_TAB_ORDER, ASSIGNMENT_TABS } from '../constants';
import type { AssignmentTab } from '../types';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const OPTION_MIN_HEIGHT = 44;
const COUNT_MIN_WIDTH = 22;

export type AssignmentTabSwitchProps = {
  value: AssignmentTab;
  /** So bai cua moi tab, hien canh ten tab. */
  counts: Record<AssignmentTab, number>;
  onChange: (tab: AssignmentTab) => void;
};

/** Chuyen giua bai can lam, bai da nop cho cham va bai da co diem. */
export function AssignmentTabSwitch({ value, counts, onChange }: AssignmentTabSwitchProps) {
  return (
    <ThemedView type="backgroundElement" accessibilityRole="tablist" style={styles.container}>
      {ASSIGNMENT_TAB_ORDER.map((tab) => {
        const isSelected = tab === value;
        const { label } = ASSIGNMENT_TABS[tab];
        const color = isSelected ? 'primary' : 'textSecondary';
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={`${label}, ${counts[tab]} bài`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <ThemedView
              type={isSelected ? 'background' : 'backgroundElement'}
              style={styles.optionContent}
            >
              <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={color}>
                {label}
              </ThemedText>
              <ThemedView
                type={isSelected ? 'primarySoft' : 'backgroundSelected'}
                style={styles.count}
              >
                <ThemedText type="smallBold" themeColor={color}>
                  {counts[tab]}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.full,
  },
  option: { flex: 1 },
  pressed: { opacity: 0.75 },
  // Man hinh 360dp khong du cho ten tab dai ("Đã có điểm") va so bai tren mot dong: cho so bai
  // xuong dong thay vi cat chu
  optionContent: {
    flexGrow: 1,
    minHeight: OPTION_MIN_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: Spacing.one,
    rowGap: Spacing.half,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.full,
  },
  count: {
    minWidth: COUNT_MIN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.full,
  },
});
