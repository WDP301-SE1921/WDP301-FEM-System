import { StyleSheet, View } from 'react-native';

import { type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { TONES, type Tone } from '../constants';
import type { AttentionItem, AttentionItemType } from '../types';

import { ActionChip } from './action-chip';
import { SectionCard } from './section-card';
import { ToneIcon } from './tone-icon';

const ATTENTION_TYPES: Record<
  AttentionItemType,
  { icon: IconName; tone: Tone; actionLabel: string | null }
> = {
  // Hoc phi dong tai trung tam roi quan ly xac nhan (§6.2): app khong co thanh toan nen khong co nut
  TUITION: { icon: 'wallet-outline', tone: 'accent', actionLabel: null },
  ASSIGNMENT: { icon: 'create-outline', tone: 'primary', actionLabel: 'Xem bài' },
};

export type AttentionListProps = {
  items: AttentionItem[];
  /** Nut cua viec loai bai tap mo trang bai tap. */
  onOpenAssignments: () => void;
};

/** Viec phu huynh can xu ly (hoc phi, bai tap sap het han). */
export function AttentionList({ items, onOpenAssignments }: AttentionListProps) {
  return (
    <SectionCard title="Cần chú ý" icon="alert" tone="accent">
      <View style={styles.list}>
        {items.map((item) => (
          <AttentionRow key={item.id} item={item} onAction={onOpenAssignments} />
        ))}
      </View>
    </SectionCard>
  );
}

function AttentionRow({ item, onAction }: { item: AttentionItem; onAction: () => void }) {
  const { icon, tone, actionLabel } = ATTENTION_TYPES[item.type];

  return (
    <ThemedView type={TONES[tone].soft} style={styles.item}>
      <ToneIcon name={icon} tone={tone} variant="solid" />
      <View style={styles.content}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.description}
        </ThemedText>
      </View>
      {actionLabel ? (
        <ActionChip
          label={actionLabel}
          variant="soft"
          accessibilityLabel={`${actionLabel}: ${item.title}`}
          onPress={onAction}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.control,
  },
  content: { flex: 1 },
});
