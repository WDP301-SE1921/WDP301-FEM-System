import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { useCourseOutcomeSet } from '../hooks/use-parent-dashboard';

import { LearningTargetRow } from './learning-target-row';
import { SectionCard } from './section-card';
import { SectionLoadError } from './section-load-error';

/** So muc tieu hien khi thu gon: bo CLO cua mot khoa thuong co 4-8 muc tieu. */
const COLLAPSED_OUTCOME_COUNT = 3;
const TITLE = 'Mục tiêu khóa học';
const ICON = 'flag-outline';

export type CourseOutcomesCardProps = {
  programId: string;
};

/**
 * Muc tieu khoa hoc: bo chuan dau ra (CLO) da duyet moi nhat cua khoa con dang hoc. Chi liet ke muc
 * tieu, khong ghi "đạt chuẩn" vi BE chua tinh muc dat CLO cua hoc sinh. Khoa chua co bo CLO da duyet
 * thi an; dang tai cung an de the khong hien roi bien mat voi khoa chua co CLO.
 */
export function CourseOutcomesCard({ programId }: CourseOutcomesCardProps) {
  const outcomeSet = useCourseOutcomeSet(programId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (outcomeSet.isPending) return null;
  if (outcomeSet.isError) {
    return (
      <SectionCard title={TITLE} icon={ICON}>
        <SectionLoadError
          message="Không tải được mục tiêu khóa học."
          onRetry={() => void outcomeSet.refetch()}
        />
      </SectionCard>
    );
  }

  const outcomes = outcomeSet.data?.outcomes ?? [];
  if (outcomes.length === 0) return null;

  const visibleOutcomes = isExpanded ? outcomes : outcomes.slice(0, COLLAPSED_OUTCOME_COUNT);
  const canToggle = outcomes.length > COLLAPSED_OUTCOME_COUNT;

  return (
    <SectionCard title={TITLE} icon={ICON}>
      <ThemedText type="small" themeColor="textSecondary">
        Những gì học sinh hướng tới sau khi học xong khóa này.
      </ThemedText>
      <View style={styles.list}>
        {visibleOutcomes.map(({ id, code, title, required }) => (
          <LearningTargetRow
            key={id}
            code={code}
            title={title}
            note={required ? undefined : 'Mục tiêu mở rộng, không bắt buộc'}
          />
        ))}
      </View>
      {canToggle ? (
        <Button
          variant="secondary"
          size="sm"
          title={isExpanded ? 'Thu gọn' : `Xem cả ${outcomes.length} mục tiêu`}
          icon={isExpanded ? 'chevron-up' : 'chevron-down'}
          onPress={() => setIsExpanded((expanded) => !expanded)}
        />
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
