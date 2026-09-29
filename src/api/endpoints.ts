/**
 * Tap trung duong dan API. Khong hardcode chuoi URL trong component.
 */
export const Endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  linkInvitations: {
    inspect: '/link-invitations/inspect',
    claimAndSignUp: '/link-invitations/claim-and-sign-up',
    /** Phu huynh da dang nhap dung ma de lien ket them con (§6.5). */
    claim: '/link-invitations/claim',
  },
  /** BE chua co, duong dan tam theo quy uoc `/manager/...` cua EDUGRADE_BACKEND_FLOW.md. */
  parent: {
    students: '/parent/students',
    studentDashboard: (studentId: string) => `/parent/students/${studentId}/dashboard`,
    /** Query `from`, `to` dang `YYYY-MM-DD`. */
    studentSchedule: (studentId: string) => `/parent/students/${studentId}/schedule`,
    unreadNotificationCount: '/parent/notifications/unread-count',
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
  },
} as const;
