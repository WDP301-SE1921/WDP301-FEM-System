import type { AxiosAdapter } from 'axios';

import { Endpoints } from './endpoints';
import { matchPath, type RoutePattern } from './route-pattern';

const STUDENT_ID_PARAM = ':studentId';
const REGISTRATION_ID_PARAM = ':registrationId';
const ASSIGNMENT_ID_PARAM = ':assignmentId';
const SESSION_ID_PARAM = ':sessionId';
const NOTIFICATION_ID_PARAM = ':notificationId';

/**
 * Cac endpoint da noi toi BE that (wire). Chi request khop danh sach nay moi ra mang; moi request
 * khac do server gia trong `./mocks` tra loi. Chi them endpoint vao day khi nguoi dung yeu cau wire
 * dung endpoint do, va xoa route mock cua no trong cung thay doi (Luat so 2 trong CLAUDE.md cua
 * workspace).
 */
export const WIRED_ROUTES: readonly RoutePattern[] = [
  { method: 'post', url: Endpoints.auth.login },
  { method: 'post', url: Endpoints.auth.register },
  { method: 'post', url: Endpoints.auth.refresh },
  { method: 'post', url: Endpoints.auth.logout },
  { method: 'get', url: Endpoints.auth.me },
  { method: 'patch', url: Endpoints.auth.me },
  { method: 'post', url: Endpoints.auth.verifyEmail },
  { method: 'post', url: Endpoints.auth.resendVerification },
  { method: 'post', url: Endpoints.auth.changePassword },
  { method: 'post', url: Endpoints.auth.forgotPassword },
  { method: 'get', url: Endpoints.me.students },
  { method: 'post', url: Endpoints.me.students },
  { method: 'patch', url: Endpoints.me.student(STUDENT_ID_PARAM) },
  { method: 'get', url: Endpoints.me.studentEnrollments(STUDENT_ID_PARAM) },
  { method: 'get', url: Endpoints.me.bills },
  { method: 'get', url: Endpoints.registrations.receipt(REGISTRATION_ID_PARAM) },
  { method: 'get', url: Endpoints.registrations.bill(REGISTRATION_ID_PARAM) },
  { method: 'get', url: Endpoints.rooms },
  { method: 'get', url: Endpoints.academic.scheduledSessions },
  { method: 'get', url: Endpoints.academic.scheduledSession(SESSION_ID_PARAM) },
  { method: 'get', url: Endpoints.academic.studentAttendance(STUDENT_ID_PARAM) },
  { method: 'get', url: Endpoints.academic.studentGrades(STUDENT_ID_PARAM) },
  { method: 'get', url: Endpoints.academic.studentCurriculum(STUDENT_ID_PARAM) },
  { method: 'get', url: Endpoints.academic.makeups },
  { method: 'get', url: Endpoints.academic.leaves },
  { method: 'get', url: Endpoints.academic.assignments },
  { method: 'get', url: Endpoints.academic.assignment(ASSIGNMENT_ID_PARAM) },
  { method: 'get', url: Endpoints.academic.assignmentSubmissions(ASSIGNMENT_ID_PARAM) },
  { method: 'post', url: Endpoints.academic.submissions },
  { method: 'get', url: Endpoints.notifications.list },
  { method: 'get', url: Endpoints.notifications.unreadCount },
  { method: 'patch', url: Endpoints.notifications.read(NOTIFICATION_ID_PARAM) },
  { method: 'post', url: Endpoints.notifications.readAll },
];

export function isWiredRequest(method: string | undefined, url: string | undefined): boolean {
  if (!url) return false;
  return WIRED_ROUTES.some(
    (route) => route.method === method && matchPath(route.url, url) !== null,
  );
}

/**
 * Adapter cua moi axios instance trong app: request khop `WIRED_ROUTES` ra BE that qua adapter mang,
 * request khac do server gia tra loi va khong ra mang. Adapter mang chi duoc lay khi co request can
 * no, nen noi nao khong goi endpoint da wire (vd test) khong can co mang.
 */
export function createApiAdapter(
  mockAdapter: AxiosAdapter,
  resolveNetworkAdapter: () => AxiosAdapter,
): AxiosAdapter {
  return (config) =>
    isWiredRequest(config.method, config.url)
      ? resolveNetworkAdapter()(config)
      : mockAdapter(config);
}
