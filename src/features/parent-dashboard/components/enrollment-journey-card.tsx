import { StyleSheet, View } from 'react-native';

import { StepList, type StepItem, type StepState } from '@/components/common/step-list';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import {
  getEnrollmentJourney,
  type EnrollmentJourney,
  type EnrollmentJourneyStep,
} from '../api/parent-data-mappers';
import { useStudentBills, useTuitionEnrollments } from '../hooks/use-parent-dashboard';
import type { ParentDestination } from '../types';

import { SectionCard } from './section-card';

const STEP_ORDER: EnrollmentJourneyStep[] = ['PROFILE', 'REGISTER', 'PAYMENT', 'SCHEDULE'];

export type EnrollmentJourneyCardProps = {
  studentId: string;
  /** Ten goi cua con, vd `Minh Anh`. */
  childName: string;
  /** Email dang nhap cua phu huynh, nhan vien tra cuu tai khoan theo email nay. */
  parentEmail: string;
  /** Con dang co mon hoc (`LinkedStudent.subjectNames` khong rong). */
  hasActiveSubjects: boolean;
  onOpenDestination: (destination: ParentDestination) => void;
};

/**
 * The "Dang ky hoc" o trang chu (Luong 3, PLAN_GUIDED_WORKFLOWS.md): bon buoc tu tao ho so toi lich hoc,
 * moi buoc co trang thai that tu bill va ghi danh. Phu huynh khong tu dang ky hay dong tien tren app
 * (SRS muc 6.1): the chi chi buoc tiep theo va mo bill, bien lai, lich. Khong co gi can hien thi an.
 */
export function EnrollmentJourneyCard({
  studentId,
  childName,
  parentEmail,
  hasActiveSubjects,
  onOpenDestination,
}: EnrollmentJourneyCardProps) {
  const bills = useStudentBills(studentId);
  const enrollments = useTuitionEnrollments(studentId);
  // Loi tai thi an the: trang chu van con cac khoi khac, tab Hoc phi bao loi rieng
  if (!bills.data || !enrollments.data) return null;
  const journey = getEnrollmentJourney({
    bills: bills.data,
    enrollments: enrollments.data,
    hasActiveSubjects,
  });
  if (!journey) return null;

  const isDone = journey.current === null;
  return (
    <SectionCard
      title={
        isDone
          ? `Đã đăng ký xong ${journey.className ?? ''}`.trim()
          : `Đăng ký học cho ${childName}`
      }
      icon={isDone ? 'checkmark-circle-outline' : 'school-outline'}
      tone={isDone ? 'success' : 'accent'}
      highlightTone={isDone ? 'success' : 'accent'}
    >
      <StepList steps={toSteps(journey, childName, parentEmail)} />
      <JourneyActions
        journey={journey}
        studentId={studentId}
        onOpenDestination={onOpenDestination}
      />
    </SectionCard>
  );
}

function stateOf(step: EnrollmentJourneyStep, current: EnrollmentJourneyStep | null): StepState {
  if (current === null) return 'done';
  const index = STEP_ORDER.indexOf(step);
  const currentIndex = STEP_ORDER.indexOf(current);
  if (index < currentIndex) return 'done';
  return index === currentIndex ? 'current' : 'todo';
}

function toSteps(journey: EnrollmentJourney, childName: string, parentEmail: string): StepItem[] {
  const { current, className } = journey;
  const classText = className ? `lớp ${className}` : 'lớp';
  const descriptions: Record<EnrollmentJourneyStep, Record<StepState, string>> = {
    PROFILE: {
      done: `Đã có hồ sơ của ${childName} trên ứng dụng.`,
      current: '',
      todo: '',
    },
    REGISTER: {
      done: className ? `Đã đăng ký ${classText}.` : 'Đã đăng ký.',
      current: `Đến trung tâm, đọc email ${parentEmail} cho nhân viên. Nhân viên chọn hồ sơ của ${childName} và lớp đúng khối.`,
      todo: '',
    },
    PAYMENT: {
      done: 'Trung tâm đã xác nhận thu tiền, có biên lai trên ứng dụng.',
      current: 'Đóng học phí tại quầy. Trung tâm xác nhận xong là có biên lai ngay trên ứng dụng.',
      todo: 'Đóng tại quầy sau khi đăng ký.',
    },
    SCHEDULE: {
      done: 'Lịch học đã có ở tab Lịch học.',
      current: `Trung tâm đang xếp buổi học cho ${classText}. Lịch hiện ở tab Lịch học ngay khi xếp xong; kéo màn hình xuống để tải lại.`,
      todo: 'Có sau khi đóng học phí và trung tâm xếp buổi.',
    },
  };
  const titles: Record<EnrollmentJourneyStep, string> = {
    PROFILE: 'Tạo hồ sơ học sinh',
    REGISTER: 'Đăng ký môn tại trung tâm',
    PAYMENT: 'Đóng học phí',
    SCHEDULE: 'Lịch học',
  };
  return STEP_ORDER.map((key) => {
    const state = stateOf(key, current);
    return { key, title: titles[key], state, description: descriptions[key][state] || undefined };
  });
}

function JourneyActions({
  journey,
  studentId,
  onOpenDestination,
}: {
  journey: EnrollmentJourney;
  studentId: string;
  onOpenDestination: (destination: ParentDestination) => void;
}) {
  const { billRegistrationId, receiptRegistrationId, current } = journey;
  const canOpenSchedule = current === null;
  if (!billRegistrationId && !receiptRegistrationId && !canOpenSchedule) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Môn học và lịch học hiện ở đây ngay sau khi trung tâm xác nhận đã thu học phí.
      </ThemedText>
    );
  }
  return (
    <View style={styles.actions}>
      {billRegistrationId ? (
        <Button
          title="Xem bill học phí"
          size="sm"
          icon="receipt-outline"
          onPress={() => onOpenDestination({ kind: 'BILL', registrationId: billRegistrationId })}
        />
      ) : null}
      {receiptRegistrationId ? (
        <Button
          title="Xem biên lai"
          size="sm"
          variant={canOpenSchedule ? 'secondary' : 'primary'}
          icon="document-text-outline"
          onPress={() =>
            onOpenDestination({ kind: 'RECEIPT', registrationId: receiptRegistrationId })
          }
        />
      ) : null}
      {canOpenSchedule ? (
        <Button
          title="Xem lịch học"
          size="sm"
          icon="calendar-outline"
          onPress={() => onOpenDestination({ kind: 'SCHEDULE', studentId, view: 'WEEK' })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
