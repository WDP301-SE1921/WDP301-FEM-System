import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import type { ScheduleRange } from '../types';

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

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.parent.unreadNotificationCount,
    queryFn: () => parentDashboardApi.getUnreadNotificationCount(),
  });
}
