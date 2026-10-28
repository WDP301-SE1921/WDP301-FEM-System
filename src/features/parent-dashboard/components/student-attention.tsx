import { useStudentAssignments, useStudentBills } from '../hooks/use-parent-dashboard';
import type { ParentDestination } from '../types';
import { getAttentionItems } from '../utils';

import { AttentionList } from './attention-list';
import { SectionLoadError } from './section-load-error';

export type StudentAttentionProps = {
  studentId: string;
  /** Mo bill hoac bai tap cua viec duoc bam. */
  onOpenDestination: (destination: ParentDestination) => void;
};

/**
 * Viec can chu y cua con, ghep tu bill va bai tap (dung chung cache voi tab Hoc phi va tab Diem & Bai
 * tap). Nguon nao tai loi thi van hien viec cua nguon con lai, kem dong bao loi va thu lai nguon loi.
 * Dang tai hoac khong co viec nao thi khong hien the.
 */
export function StudentAttention({ studentId, onOpenDestination }: StudentAttentionProps) {
  const assignments = useStudentAssignments(studentId);
  const bills = useStudentBills(studentId);

  const failedSources = [
    { name: 'bài tập', query: assignments },
    { name: 'học phí', query: bills },
  ].filter(({ query }) => query.isError);
  const items = getAttentionItems({
    studentId,
    bills: bills.data ?? [],
    assignments: assignments.data ?? [],
  });
  if (items.length === 0 && failedSources.length === 0) return null;

  return (
    <AttentionList items={items} onOpenItem={(item) => onOpenDestination(item.destination)}>
      {failedSources.length > 0 ? (
        <SectionLoadError
          message={`Không tải được ${failedSources.map(({ name }) => name).join(' và ')}.`}
          onRetry={() => failedSources.forEach(({ query }) => void query.refetch())}
        />
      ) : null}
    </AttentionList>
  );
}
