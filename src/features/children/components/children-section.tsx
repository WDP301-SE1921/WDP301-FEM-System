import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useChildren } from '../hooks/use-children';

import { ChildRow } from './child-row';

export type ChildrenSectionProps = {
  /** Route quyet dinh dieu huong toi form them con va man hinh sua ho so. */
  onAddChild: () => void;
  onEditChild: (studentId: string) => void;
};

/** Danh sach ho so con o man hinh Tai khoan: bam mot con de sua ho so, hoac them con moi. */
export function ChildrenSection({ onAddChild, onEditChild }: ChildrenSectionProps) {
  const children = useChildren();

  const renderBody = () => {
    if (children.isPending) return <LoadingState />;
    if (children.isError) {
      return <ErrorState error={children.error} onRetry={() => void children.refetch()} />;
    }
    if (children.data.length === 0) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có hồ sơ nào. Thêm con vào tài khoản để theo dõi việc học của con.
        </ThemedText>
      );
    }
    return children.data.map((child) => (
      <ChildRow key={child.id} child={child} onPress={() => onEditChild(child.id)} />
    ));
  };

  return (
    <View style={styles.section}>
      <ThemedText type="default" accessibilityRole="header" style={styles.title}>
        Hồ sơ của con
      </ThemedText>
      {renderBody()}
      {children.isSuccess ? (
        <Button
          title="Thêm con"
          variant="ghost"
          icon="person-add-outline"
          accessibilityLabel="Thêm con"
          onPress={onAddChild}
          style={styles.addButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  title: { fontWeight: 700 },
  addButton: { borderRadius: Radius.full },
});
