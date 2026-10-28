import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useChildren, useUpdateChild } from '../hooks/use-children';
import type { ChildProfile } from '../types';
import { toChildFormDefaults } from '../utils';

import { ChildForm } from './child-form';
import { ChildFormHeader } from './child-form-header';

export type EditChildFlowProps = {
  studentId: string;
  /** Thoat khoi man hinh khi chua luu. */
  onBack: () => void;
  /** Luu xong ho so. */
  onDone: () => void;
};

/**
 * Phu huynh sua ho ten, lop va ngay sinh cua con. Trung tam chi xep lop dung khoi ghi trong ho so
 * (BE: CLASS_GRADE_MISMATCH), nen chon nham khoi thi phai sua o day truoc khi dang ky mon.
 */
export function EditChildFlow({ studentId, onBack, onDone }: EditChildFlowProps) {
  const children = useChildren();
  const child = children.data?.find((item) => item.id === studentId);

  const renderBody = () => {
    if (children.isPending) return <LoadingState />;
    if (children.isError) {
      return <ErrorState error={children.error} onRetry={() => void children.refetch()} />;
    }
    if (!child) {
      return (
        <EmptyState
          title="Không tìm thấy hồ sơ học sinh"
          description="Hồ sơ này không thuộc tài khoản của bạn."
        />
      );
    }
    return <EditChildForm child={child} onDone={onDone} />;
  };

  return (
    <View style={styles.flow}>
      <ChildFormHeader
        title="Hồ sơ học sinh"
        description="Trung tâm xếp lớp theo đúng khối ghi ở đây. Không đổi được khối khi học sinh đang có môn học tại trung tâm."
        onBack={onBack}
      />
      {renderBody()}
    </View>
  );
}

/** Tach rieng de form chi khoi tao khi da co ho so hien tai lam gia tri ban dau. */
function EditChildForm({ child, onDone }: { child: ChildProfile; onDone: () => void }) {
  const updateChild = useUpdateChild(child.id);

  return (
    <ChildForm
      defaultValues={toChildFormDefaults(child)}
      submitLabel="Lưu thay đổi"
      submitIcon="checkmark"
      onSubmit={(values) => updateChild.mutate(values, { onSuccess: onDone })}
      isPending={updateChild.isPending}
      error={updateChild.error}
    />
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: Spacing.four },
});
