import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { RoadmapLesson } from '../types';

const NODE_SIZE = 28;
const RING_WIDTH = 4;
const DOT_SIZE = 8;
const ICON_SIZE = 16;
const LINE_WIDTH = 2;

type NodeKind = 'DONE' | 'CURRENT' | 'UPCOMING' | 'ASSESSMENT';

/** Nut khong co icon thi hien cham tron (bai dang hoc) hoac so thu tu bai (bai chua hoc). */
const NODES: Record<NodeKind, { background: ThemeColor; icon: IconName | null }> = {
  DONE: { background: 'primary', icon: 'checkmark' },
  CURRENT: { background: 'primary', icon: null },
  UPCOMING: { background: 'backgroundSelected', icon: null },
  ASSESSMENT: { background: 'accent', icon: 'flag' },
};

type StepLesson = Pick<RoadmapLesson, 'kind' | 'progress' | 'sequence'>;

function getNodeKind({ kind, progress }: StepLesson): NodeKind {
  if (progress === 'DONE') return 'DONE';
  return kind === 'ASSESSMENT' ? 'ASSESSMENT' : progress;
}

export type RoadmapStepProps = PropsWithChildren<{
  lesson: StepLesson;
  /** Bai cuoi cua danh sach thi khong ve duong noi xuong duoi. */
  isLast: boolean;
}>;

/** Mot bai tren lo trinh: nut theo vi tri cua bai, duong noi toi bai sau va the bai ben phai. */
export function RoadmapStep({ lesson, isLast, children }: RoadmapStepProps) {
  const theme = useTheme();
  const nodeKind = getNodeKind(lesson);
  const { background, icon } = NODES[nodeKind];
  // Doan noi giua hai bai da hoc to mau chinh de thay quang duong con da di
  const lineColor = lesson.progress === 'DONE' ? theme.primary : theme.border;

  return (
    <View style={styles.step}>
      {/* The bai ben phai da doc du thong tin, nut chi de trang tri */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.rail}
      >
        <ThemedView
          type={background}
          style={[
            styles.node,
            nodeKind === 'CURRENT' && { borderWidth: RING_WIDTH, borderColor: theme.primarySoft },
          ]}
        >
          <NodeContent kind={nodeKind} icon={icon} sequence={lesson.sequence} />
        </ThemedView>
        {isLast ? null : <View style={[styles.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={[styles.content, !isLast && styles.contentSpaced]}>{children}</View>
    </View>
  );
}

type NodeContentProps = { kind: NodeKind; icon: IconName | null; sequence: number };

function NodeContent({ kind, icon, sequence }: NodeContentProps) {
  if (icon) return <Icon name={icon} size={ICON_SIZE} themeColor="primaryText" />;
  if (kind === 'CURRENT') return <ThemedView type="primaryText" style={styles.dot} />;
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {sequence}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: Spacing.three },
  rail: { width: NODE_SIZE, alignItems: 'center' },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
  line: { flex: 1, width: LINE_WIDTH },
  content: { flex: 1 },
  // Khoang cach giua hai bai nam trong cot noi dung de duong noi keo dai qua khoang cach do
  contentSpaced: { paddingBottom: Spacing.three },
});
