import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { ASSIGNMENT_FORMATS } from '../constants';
import type { StudentAssignment } from '../types';
import { getAssignmentFormat } from '../utils';

import { ToneBadge } from './tone-badge';

export type AssignmentCardHeaderProps = {
  assignment: Pick<StudentAssignment, 'questionCounts' | 'className'>;
  /** Noi dung o goc phai, vd nhan han nop. */
  trailing?: ReactNode;
};

/** Dong dau the bai tap: hinh thuc bai (trac nghiem, tu luan), lop va nhan o goc phai. */
export function AssignmentCardHeader({ assignment, trailing }: AssignmentCardHeaderProps) {
  const format = ASSIGNMENT_FORMATS[getAssignmentFormat(assignment.questionCounts)];

  return (
    <View style={styles.row}>
      {/* Man hinh hep thi ten lop xuong dong thay vi bi cat */}
      <View style={styles.meta}>
        <ToneBadge label={format.label} tone={format.tone} />
        <ThemedText type="small" themeColor="textSecondary">
          {assignment.className}
        </ThemedText>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  meta: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Spacing.two,
    rowGap: Spacing.one,
  },
});
