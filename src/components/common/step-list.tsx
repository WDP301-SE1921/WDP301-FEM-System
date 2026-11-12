import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const NUMBER_SIZE = 28;
const ICON_SIZE = 16;

/** `done`: da xong, `current`: dang o buoc nay, `todo`: chua toi. */
export type StepState = 'done' | 'current' | 'todo';

export type StepItem = {
  key: string;
  title: string;
  /** Mot hai cau giai thich, chi hien o kieu doc. */
  description?: ReactNode;
  state: StepState;
};

export type StepListProps = {
  steps: StepItem[];
  /** `vertical`: moi buoc mot dong kem giai thich. `horizontal`: mot hang ngan, chi so va ten buoc. */
  layout?: 'vertical' | 'horizontal';
};

const STATE_TEXT: Record<StepState, string> = {
  done: 'đã xong',
  current: 'đang ở bước này',
  todo: 'chưa tới',
};

/**
 * Cac buoc cua mot viec theo thu tu (dang ky hoc, lam bai), moi buoc co so thu tu va trang thai. Buoc
 * da xong co dau tick, buoc dang o vien mau chinh. Chi hien thi, khong bam duoc.
 */
export function StepList({ steps, layout = 'vertical' }: StepListProps) {
  const isHorizontal = layout === 'horizontal';
  return (
    <View style={isHorizontal ? styles.row : styles.column}>
      {steps.map((step, index) => (
        <View
          key={step.key}
          accessible
          accessibilityLabel={`Bước ${index + 1}: ${step.title}, ${STATE_TEXT[step.state]}`}
          style={isHorizontal ? styles.horizontalItem : styles.verticalItem}
        >
          <StepNumber number={index + 1} state={step.state} />
          <View style={isHorizontal ? styles.horizontalText : styles.verticalText}>
            <ThemedText
              type={step.state === 'current' ? 'smallBold' : 'small'}
              themeColor={step.state === 'todo' ? 'textSecondary' : 'text'}
              style={isHorizontal ? styles.centered : undefined}
            >
              {step.title}
            </ThemedText>
            {!isHorizontal && step.description ? (
              <ThemedText type="small" themeColor="textSecondary">
                {step.description}
              </ThemedText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function StepNumber({ number, state }: { number: number; state: StepState }) {
  const theme = useTheme();
  if (state === 'done') {
    return (
      <View style={[styles.number, { backgroundColor: theme.primary }]}>
        <Icon name="checkmark" size={ICON_SIZE} themeColor="primaryText" />
      </View>
    );
  }
  const isCurrent = state === 'current';
  return (
    <View
      style={[
        styles.number,
        isCurrent ? styles.currentBorder : styles.todoBorder,
        {
          borderColor: isCurrent ? theme.primary : theme.border,
          // Android ve vien bo goc chi khi view co mau nen (xem CLAUDE.md cua repo)
          backgroundColor: isCurrent ? theme.primarySoft : theme.background,
        },
      ]}
    >
      <ThemedText type="smallBold" themeColor={isCurrent ? 'primaryStrong' : 'textSecondary'}>
        {number}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  verticalItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  horizontalItem: { flex: 1, alignItems: 'center', gap: Spacing.one },
  verticalText: { flex: 1, gap: Spacing.half },
  horizontalText: { alignItems: 'center' },
  centered: { textAlign: 'center' },
  number: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBorder: { borderWidth: 2 },
  todoBorder: { borderWidth: 1 },
});
