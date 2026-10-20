import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CHILD_GRADES } from '../constants';
import type { ChildGrade } from '../types';

/** Cao bang o nhap `Input` de cac o trong form thang hang, du vung cham 44 (design-mobile.md). */
const OPTION_MIN_HEIGHT = 48;
const LABEL = 'Khối';

export type GradePickerProps = {
  /** Chua chon thi `undefined`. */
  value: ChildGrade | undefined;
  onChange: (grade: ChildGrade) => void;
  error?: string;
};

function getBorderColor(isSelected: boolean, hasError: boolean): ThemeColor {
  if (isSelected) return 'primary';
  if (hasError) return 'danger';
  return 'border';
}

/** Chon lop cua con: bon o 6-9 xep mot hang, chon mot o. */
export function GradePicker({ value, onChange, error }: GradePickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {LABEL}
      </ThemedText>

      <View accessibilityRole="radiogroup" accessibilityLabel={LABEL} style={styles.row}>
        {CHILD_GRADES.map((grade) => {
          const isSelected = grade === value;
          return (
            <Pressable
              key={grade}
              accessibilityRole="radio"
              accessibilityLabel={`${LABEL} ${grade}`}
              accessibilityState={{ checked: isSelected }}
              onPress={() => onChange(grade)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                  borderColor: theme[getBorderColor(isSelected, Boolean(error))],
                },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                type={isSelected ? 'smallBold' : 'small'}
                themeColor={isSelected ? 'primaryText' : 'text'}
              >
                {LABEL} {grade}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.two },
  option: {
    flex: 1,
    minHeight: OPTION_MIN_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
