import { QueryClient } from '@tanstack/react-query';

import { AppError } from '@/types/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 phut
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Khong retry loi 4xx (client sai request)
        const status = error instanceof AppError ? error.status : undefined;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      // "Focus" la luc app tro lai man hinh, xem `providers/app-providers.tsx`
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Key factory: tranh trung/lech query key giua cac feature. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  parent: {
    /** Tien to cua moi key `parent`, dung khi tai lai toan bo du lieu cua phu huynh. */
    all: ['parent'] as const,
    students: ['parent', 'students'] as const,
    /** Tien to cua moi du lieu hoc tap cua mot con. */
    student: (studentId: string) => ['parent', 'students', studentId] as const,
    studentDashboard: (studentId: string) =>
      ['parent', 'students', studentId, 'dashboard'] as const,
    studentSchedule: (studentId: string, range: { from: string; to: string }) =>
      ['parent', 'students', studentId, 'schedule', range] as const,
    studentSession: (studentId: string, sessionId: string) =>
      ['parent', 'students', studentId, 'sessions', sessionId] as const,
    studentEnrollments: (studentId: string) =>
      ['parent', 'students', studentId, 'enrollments'] as const,
    enrollmentLessons: (studentId: string, enrollmentId: string) =>
      ['parent', 'students', studentId, 'enrollments', enrollmentId, 'lessons'] as const,
    studentAttendance: (studentId: string) =>
      ['parent', 'students', studentId, 'attendance'] as const,
    /** Chi ty le di hoc, cho trang chu: khong doc them ghi danh, lich hoc bu, don nghi. */
    studentAttendanceSummary: (studentId: string) =>
      ['parent', 'students', studentId, 'attendance', 'summary'] as const,
    studentAssignments: (studentId: string) =>
      ['parent', 'students', studentId, 'assignments'] as const,
    unreadNotificationCount: ['parent', 'notifications', 'unread-count'] as const,
  },
  me: {
    all: ['me'] as const,
    students: ['me', 'students'] as const,
    studentEnrollments: (studentId: string) =>
      ['me', 'students', studentId, 'enrollments'] as const,
    studentBills: (studentId: string) => ['me', 'students', studentId, 'bills'] as const,
  },
  registrations: {
    all: ['registrations'] as const,
    receipt: (registrationId: string) => ['registrations', registrationId, 'receipt'] as const,
    bill: (registrationId: string) => ['registrations', registrationId, 'bill'] as const,
  },
  academic: {
    all: ['academic'] as const,
    assignment: (assignmentId: string) => ['academic', 'assignments', assignmentId] as const,
    assignmentSubmissions: (assignmentId: string) =>
      ['academic', 'assignments', assignmentId, 'submissions'] as const,
  },
} as const;
