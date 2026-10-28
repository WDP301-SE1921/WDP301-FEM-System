import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
  { icon: IconName; tone: Tone; actionLabel: string }
> = {
  // App khong thu tien (dong tai trung tam, §6.2): bill de phu huynh xem so tien va ma bill bao nhan vien
  TUITION: { icon: 'wallet-outline', tone: 'accent', actionLabel: 'Xem bill' },
  ASSIGNMENT: { icon: 'create-outline', tone: 'primary', actionLabel: 'Làm bài' },
};

export type AttentionListProps = PropsWithChildren<{
  items: AttentionItem[];
  /** Bam mot viec: mo bill hoac bai tap cua viec do. */
  onOpenItem: (item: AttentionItem) => void;
}>;

/**
 * Viec phu huynh can xu ly (hoc phi, bai tap sap het han). `children` dat sau danh sach, vd dong bao
 * mot nguon tai loi.
 */
export function AttentionList({ items, onOpenItem, children }: AttentionListProps) {
  return (
    <SectionCard title="Cần chú ý" icon="alert" tone="accent">
      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <AttentionRow key={item.id} item={item} onPress={() => onOpenItem(item)} />
          ))}
        </View>
      ) : null}
      {children}
    </SectionCard>
  );
}

/** Ca dong la mot nut; chip ben phai chi de nguoi dung thay ro dong bam duoc va bam thi lam gi. */
function AttentionRow({ item, onPress }: { item: AttentionItem; onPress: () => void }) {
  const { icon, tone, actionLabel } = ATTENTION_TYPES[item.type];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${actionLabel}: ${item.title}`}
      accessibilityHint={item.description}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
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
        <ActionChip label={actionLabel} variant="soft" trailingIcon="arrow-forward" />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  pressed: { opacity: 0.75 },
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
