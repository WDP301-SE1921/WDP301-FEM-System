import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { TONES, type Tone } from '../constants';
import type { ClassSessionStatus, SessionDetail, SessionMaterial } from '../types';

import { SectionCard } from './section-card';

const BLOCK_ICON_SIZE = 16;
const MATERIAL_ICON_SIZE = 18;

/** Chua co nhan xet va tai lieu thi giai thich theo trang thai cua buoi. */
const EMPTY_MESSAGES: Record<ClassSessionStatus, string> = {
  SCHEDULED: 'Nhận xét và tài liệu sẽ có sau buổi học.',
  COMPLETED: 'Giáo viên không gửi nhận xét hay tài liệu cho buổi học này.',
  CANCELLED: 'Buổi học bị huỷ nên không có nhận xét hay tài liệu.',
};

export type SessionReviewCardProps = {
  session: SessionDetail;
};

/** Nhan xet cua giao vien va tai lieu cua buoi hoc. */
export function SessionReviewCard({ session }: SessionReviewCardProps) {
  const { teacherComment, materials } = session;
  const isEmpty = !teacherComment && materials.length === 0;

  return (
    <SectionCard title="Nhận xét & tài liệu" icon="document-text-outline" tone="accent">
      {isEmpty ? (
        <ThemedText type="small" themeColor="textSecondary">
          {EMPTY_MESSAGES[session.status]}
        </ThemedText>
      ) : null}

      {teacherComment ? (
        <ReviewBlock
          icon="chatbubble-ellipses-outline"
          title="Nhận xét của giáo viên"
          tone="primary"
        >
          <ThemedText type="small" style={styles.comment}>
            “{teacherComment}”
          </ThemedText>
        </ReviewBlock>
      ) : null}

      {materials.length > 0 ? (
        <ReviewBlock icon="folder-open-outline" title="Tài liệu buổi học" tone="accent">
          {materials.map((material) => (
            <MaterialItem key={material.id} material={material} />
          ))}
        </ReviewBlock>
      ) : null}

      {/* BE chuyen buoi sang COMPLETED khi giao vien chot diem danh */}
      {session.status === 'COMPLETED' ? (
        <View style={styles.row}>
          <Icon name="shield-checkmark-outline" size={BLOCK_ICON_SIZE} themeColor="success" />
          <ThemedText type="small" themeColor="textSecondary">
            Điểm danh đã được giáo viên xác nhận
          </ThemedText>
        </View>
      ) : null}
    </SectionCard>
  );
}

type ReviewBlockProps = PropsWithChildren<{
  icon: IconName;
  title: string;
  tone: Tone;
}>;

function ReviewBlock({ icon, title, tone, children }: ReviewBlockProps) {
  const { color } = TONES[tone];

  return (
    <ThemedView style={styles.block}>
      <View style={styles.row}>
        <Icon name={icon} size={BLOCK_ICON_SIZE} themeColor={color} />
        <ThemedText type="smallBold" themeColor={color}>
          {title}
        </ThemedText>
      </View>
      {children}
    </ThemedView>
  );
}

function MaterialItem({ material }: { material: SessionMaterial }) {
  return (
    <View style={styles.material}>
      <Icon name="document-outline" size={MATERIAL_ICON_SIZE} themeColor="textSecondary" />
      <View style={styles.materialText}>
        <ThemedText type="smallBold">{material.name}</ThemedText>
        {material.note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {material.note}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.control },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  comment: { fontStyle: 'italic' },
  material: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  materialText: { flex: 1, gap: Spacing.half },
});
