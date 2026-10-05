import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useLinkedStudents, useSessionDetail } from '../hooks/use-parent-dashboard';
import type { SessionRef } from '../types';

import { DetailHeader } from './detail-header';
import { SessionHero } from './session-hero';
import { SessionInfoCard } from './session-info-card';
import { SessionNoticeCard } from './session-notice-card';
import { SessionReviewCard } from './session-review-card';

export type ParentSessionDetailProps = SessionRef & {
  onBack: () => void;
};

/** Chi tiet mot buoi hoc cua con: trang thai, thong tin buoi, diem danh, nhan xet va tai lieu. */
export function ParentSessionDetail({ studentId, sessionId, onBack }: ParentSessionDetailProps) {
  const detail = useSessionDetail({ studentId, sessionId });
  // Chi de hien ten va khoi cua con; mo tu lich hoc thi danh sach con da co san trong cache
  const students = useLinkedStudents();
  const student = students.data?.find((item) => item.id === studentId);

  const renderBody = () => {
    if (detail.isPending) return <LoadingState />;
    if (detail.isError) {
      return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
    }

    const session = detail.data;
    return (
      <>
        <SessionHero session={session} student={student} />
        {session.note ? <SessionNoticeCard type={session.type} note={session.note} /> : null}
        <SessionInfoCard session={session} />
        <SessionReviewCard session={session} />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Chi tiết buổi học" onBack={onBack} />
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
