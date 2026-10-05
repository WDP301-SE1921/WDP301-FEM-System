import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { ScheduleRange, SessionRef } from '../types';

export function useLinkedStudents() {
  return useQuery({
    queryKey: queryKeys.parent.students,
    queryFn: () => parentDashboardApi.getStudents(),
  });
}

export function useStudentDashboard(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentDashboard(studentId),
    queryFn: () => parentDashboardApi.getStudentDashboard(studentId),
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

export function useEnrollmentLessons(studentId: string, enrollmentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.enrollmentLessons(studentId, enrollmentId),
    queryFn: () => parentDashboardApi.getEnrollmentLessons(studentId, enrollmentId),
  });
}

export function useStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: queryKeys.parent.studentAttendance(studentId),
    queryFn: () => parentDashboardApi.getStudentAttendance(studentId),
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

export function useTuitionEnrollments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.me.studentEnrollments(studentId),
    queryFn: () => parentDashboardApi.getTuitionEnrollments(studentId),
  });
}

export function useStudentRegistrations(studentId: string) {
  return useQuery({
    queryKey: queryKeys.me.studentRegistrations(studentId),
    queryFn: () => parentDashboardApi.getStudentRegistrations(studentId),
  });
}

export function useReceipt(registrationId: string) {
  return useQuery({
    queryKey: queryKeys.registrations.receipt(registrationId),
    queryFn: () => parentDashboardApi.getReceipt(registrationId),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.parent.unreadNotificationCount,
    queryFn: () => parentDashboardApi.getUnreadNotificationCount(),
  });
}
