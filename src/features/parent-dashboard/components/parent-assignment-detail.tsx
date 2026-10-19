import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import {
  useAssignmentDetail,
  useAssignmentSubmissions,
  useTuitionEnrollments,
} from '../hooks/use-parent-dashboard';
import type { AssignmentRef } from '../types';
import { findStudentRecipient } from '../utils';

import { AssignmentWorkspace } from './assignment-workspace';
import { DetailHeader } from './detail-header';

export type ParentAssignmentDetailProps = AssignmentRef & {
  onBack: () => void;
};

/**
 * Chi tiet mot bai tap cua con: de bai, lam va nop bai, bai da nop, diem va dap an dung sau khi giao
 * vien cong bo (SRS muc 3.5, 3.9).
 */
export function ParentAssignmentDetail({
  studentId,
  assignmentId,
  onBack,
}: ParentAssignmentDetailProps) {
  const detail = useAssignmentDetail(assignmentId);
  const submissions = useAssignmentSubmissions(assignmentId);
  // BE giao bai theo ghi danh va mot bai co the giao cho nhieu con cua cung phu huynh: ghi danh cua
  // con dang xem cho biet recipient nao la cua con, va cho ten lop
  const enrollments = useTuitionEnrollments(studentId);

  const renderBody = () => {
    if (detail.isPending || submissions.isPending || enrollments.isPending) {
      return <LoadingState />;
    }
    if (detail.isError) {
      return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
    }
    if (submissions.isError) {
      return <ErrorState error={submissions.error} onRetry={() => void submissions.refetch()} />;
    }
    if (enrollments.isError) {
      return <ErrorState error={enrollments.error} onRetry={() => void enrollments.refetch()} />;
    }

    const recipient = findStudentRecipient(
      detail.data.recipients,
      enrollments.data.map(({ id }) => id),
    );
    if (!recipient) {
      return (
        <EmptyState
          title="Bài này không giao cho học sinh"
          description="Vào Điểm & Bài tập và chọn lại bài của học sinh."
        />
      );
    }

    const enrollment = enrollments.data.find(({ id }) => id === recipient.enrollmentId);
    return (
      <AssignmentWorkspace
        studentId={studentId}
        assignmentId={assignmentId}
        detail={detail.data}
        recipientId={recipient.id}
        className={enrollment?.class.name ?? ''}
        submissions={submissions.data}
      />
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Bài tập" onBack={onBack} />
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
