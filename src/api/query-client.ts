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
      refetchOnWindowFocus: false,
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
    students: ['parent', 'students'] as const,
    studentDashboard: (studentId: string) =>
      ['parent', 'students', studentId, 'dashboard'] as const,
    studentSchedule: (studentId: string, range: { from: string; to: string }) =>
      ['parent', 'students', studentId, 'schedule', range] as const,
    unreadNotificationCount: ['parent', 'notifications', 'unread-count'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params ?? {}] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
} as const;
