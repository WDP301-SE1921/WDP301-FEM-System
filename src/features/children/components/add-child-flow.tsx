import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { useAddChild } from '../hooks/use-add-child';

import { AddChildSuccess } from './add-child-success';
import { ChildForm } from './child-form';
import { ChildFormHeader } from './child-form-header';
import { EmailVerificationNotice } from './email-verification-notice';

export type AddChildFlowProps = {
  /** Email dang nhap cua phu huynh, hien o buoc huong dan dang ky mon tai trung tam. */
  parentEmail: string;
  /** false khi phu huynh chua xac minh email: BE chua cho tao ho so con. */
  isEmailVerified: boolean;
  /** Route quyet dinh dieu huong toi man hinh xac minh email. */
  onVerifyEmail: () => void;
  /** Thoat khoi man hinh khi chua tao ho so. */
  onBack: () => void;
  /** Tao xong, phu huynh bam ve trang chu. */
  onDone: () => void;
};

/** Phu huynh dien form tao ho so con; tao xong thi thay form bang thong bao va buoc tiep theo. */
export function AddChildFlow({
  parentEmail,
  isEmailVerified,
  onVerifyEmail,
  onBack,
  onDone,
}: AddChildFlowProps) {
  const addChild = useAddChild();

  if (addChild.data) {
    return (
      <AddChildSuccess
        childName={addChild.data.fullName}
        grade={addChild.data.grade}
        parentEmail={parentEmail}
        onDone={onDone}
      />
    );
  }

  return (
    <View style={styles.flow}>
      <ChildFormHeader
        title="Thêm học sinh"
        description="Tạo hồ sơ học sinh để theo dõi lịch học, điểm danh và kết quả học tập."
        onBack={onBack}
      />
      {isEmailVerified ? (
        <ChildForm
          submitLabel="Thêm học sinh"
          submitIcon="person-add-outline"
          onSubmit={(values) => addChild.mutate(values)}
          isPending={addChild.isPending}
          error={addChild.error}
        />
      ) : (
        <EmailVerificationNotice parentEmail={parentEmail} onVerifyEmail={onVerifyEmail} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: Spacing.four },
});
