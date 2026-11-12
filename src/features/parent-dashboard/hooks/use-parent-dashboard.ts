import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';
import { Config } from '@/constants/config';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import { getUnscheduledClassNames } from '../api/parent-data-mappers';
import { CENTER_INFO_STALE_MS, CENTER_NAME, FILE_PREVIEW_STALE_MS } from '../constants';
import type { ScheduleRange, SessionRef } from '../types';

export function useLinkedStudents() {
  return useQuery({
    queryKey: queryKeys.parent.students,
    queryFn: () => parentDashboardApi.getStudents(),
  });
}

export function useStudentGrades(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentGrades(studentId),
    queryFn: () => parentDashboardApi.getStudentGrades(studentId),
  });
}

export function useStudentSchedule(studentId: string, range: ScheduleRange) {
  return useQuery({
    queryKey: queryKeys.parent.studentSchedule(studentId, range),
    queryFn: () => parentDashboardApi.getStudentSchedule(studentId, range),
  });
}

export function useSessionDetail(ref: SessionRef) {
  return useQuery({
    queryKey: queryKeys.parent.studentSession(ref.studentId, ref.sessionId),
    queryFn: () => parentDashboardApi.getSessionDetail(ref),
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentEnrollments(studentId),
    queryFn: () => parentDashboardApi.getStudentEnrollments(studentId),
  });
}

/** Lo trinh cua mot mon. `enrollmentId` null thi khong tai (vd buoi con khong co cho). */
export function useEnrollmentLessons(studentId: string, enrollmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.parent.enrollmentLessons(studentId, enrollmentId ?? ''),
    queryFn: () => parentDashboardApi.getEnrollmentLessons(studentId, enrollmentId ?? ''),
    enabled: enrollmentId !== null,
  });
}

export function useCourseOutcomeSet(programId: string) {
  return useQuery({
    queryKey: queryKeys.academic.programOutcomeSet(programId),
    queryFn: () => parentDashboardApi.getCourseOutcomeSet(programId),
  });
}

/** Mot bo chuan dau ra theo id, vd bo CLO giao vien chon cho bai tap. */
export function useOutcomeSet(outcomeSetId: string) {
  return useQuery({
    queryKey: queryKeys.academic.outcomeSet(outcomeSetId),
    queryFn: () => parentDashboardApi.getOutcomeSet(outcomeSetId),
  });
}

export function useStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentAttendance(studentId),
    queryFn: () => parentDashboardApi.getStudentAttendance(studentId),
  });
}

export function useAttendanceSummary(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentAttendanceSummary(studentId),
    queryFn: () => parentDashboardApi.getAttendanceSummary(studentId),
  });
}

export function useStudentAssignments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentAssignments(studentId),
    queryFn: () => parentDashboardApi.getStudentAssignments(studentId),
  });
}

export function useAssignmentDetail(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.academic.assignment(assignmentId),
    queryFn: () => parentDashboardApi.getAssignmentDetail(assignmentId),
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.academic.assignmentSubmissions(assignmentId),
    queryFn: () => parentDashboardApi.getAssignmentSubmissions(assignmentId),
  });
}

/** Link xem mot anh bai lam da nop. Link het han sau vai phut nen chi giu trong `FILE_PREVIEW_STALE_MS`. */
export function useFilePreview(fileId: string) {
  return useQuery({
    queryKey: queryKeys.academic.filePreview(fileId),
    queryFn: () => parentDashboardApi.getFilePreview(fileId),
    staleTime: FILE_PREVIEW_STALE_MS,
  });
}

/**
 * Ten va so dien thoai cua trung tam de hien tren bill, bien lai va man hoc phi. BE chua khai bao (hoac
 * BE cu chua co GET /center) thi dung ten mac dinh cua app va `EXPO_PUBLIC_CENTER_PHONE`.
 */
export function useCenterContact(): { name: string; phone: string | null } {
  const { data } = useQuery({
    queryKey: queryKeys.center,
    queryFn: () => parentDashboardApi.getCenterInfo(),
    staleTime: CENTER_INFO_STALE_MS,
    // BE cu tra 404: dung gia tri mac dinh, khong thu lai
    retry: false,
  });
  return {
    name: data?.name ?? CENTER_NAME,
    phone: data?.phone ?? Config.centerPhone,
  };
}

export function useTuitionEnrollments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.me.studentEnrollments(studentId),
    queryFn: () => parentDashboardApi.getTuitionEnrollments(studentId),
  });
}

/**
 * Ten lop con hoc vao mot ngay theo lich co dinh ma trung tam chua xep buoi (xem
 * `getUnscheduledClassNames`). undefined khi ghi danh chua tai xong; tai loi thi coi nhu khong co lop
 * nao, man hinh giu thong bao ngay nghi nhu truoc thay vi chan ca lich.
 */
export function useUnscheduledClasses(studentId: string): ((date: Date) => string[]) | undefined {
  const enrollments = useTuitionEnrollments(studentId);
  if (enrollments.isError) return () => [];
  const { data } = enrollments;
  return data ? (date) => getUnscheduledClassNames(data, date) : undefined;
}

export function useStudentBills(studentId: string) {
  return useQuery({
    queryKey: queryKeys.me.studentBills(studentId),
    queryFn: () => parentDashboardApi.getStudentBills(studentId),
  });
}

export function useBill(registrationId: string) {
  return useQuery({
    queryKey: queryKeys.registrations.bill(registrationId),
    queryFn: () => parentDashboardApi.getBill(registrationId),
  });
}

export function useReceipt(registrationId: string) {
  return useQuery({
    queryKey: queryKeys.registrations.receipt(registrationId),
    queryFn: () => parentDashboardApi.getReceipt(registrationId),
  });
}
