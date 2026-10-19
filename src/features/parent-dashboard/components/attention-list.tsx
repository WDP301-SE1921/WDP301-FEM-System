import type { PropsWithChildren } from 'react';
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

const CONTENT_MIN_WIDTH = 120;

const ATTENTION_TYPES: Record<
  AttentionItemType,
  { icon: IconName; tone: Tone; actionLabel: string | null }
> = {
  // Hoc phi dong tai trung tam roi quan ly xac nhan (§6.2): app khong co thanh toan nen khong co nut
  TUITION: { icon: 'wallet-outline', tone: 'accent', actionLabel: null },
  ASSIGNMENT: { icon: 'create-outline', tone: 'primary', actionLabel: 'Xem bài' },
};

export type AttentionListProps = PropsWithChildren<{
  items: AttentionItem[];
  /** Nut cua viec loai bai tap mo trang bai tap. */
  onOpenAssignments: () => void;
}>;

/**
 * Viec phu huynh can xu ly (hoc phi, bai tap sap het han). `children` dat sau danh sach, vd dong bao
 * mot nguon tai loi.
 */
export function AttentionList({ items, onOpenAssignments, children }: AttentionListProps) {
  return (
    <SectionCard title="Cần chú ý" icon="alert" tone="accent">
      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <AttentionRow key={item.id} item={item} onAction={onOpenAssignments} />
          ))}
        </View>
      ) : null}
      {children}
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
  // Khong du cho cho noi dung rong toi thieu CONTENT_MIN_WIDTH (man hinh 360dp) thi nut roi xuong
  // hang duoi, can phai, thay vi ep noi dung con mot cot chu hep
  item: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: Spacing.three,
    rowGap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.control,
  },
  content: { flexGrow: 1, flexShrink: 1, flexBasis: CONTENT_MIN_WIDTH },
});
