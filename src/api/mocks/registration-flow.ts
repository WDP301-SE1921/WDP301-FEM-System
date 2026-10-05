/**
 * Phan con chay bang mock cua module `registration-flow` (BE nhanh `dev`). Cac route BE da co
 * (GET, POST /me/students, PATCH /me/students/:id, GET /me/students/:id/enrollments,
 * GET /registrations/:id/receipt) da noi BE that, xem `@/api/wired-routes`. Con lai mot route BE chua
 * co:
 * - GET /me/students/:studentId/registrations
 *     TAM: BE moi co GET /registrations/:id doc tung don. Tra moi don dang ky cua con, moi lap truoc,
 *     moi don cung dang GET /registrations/:id, de app hien don `DRAFT` nhan vien da lap nhung chua
 *     xac nhan thu hoc phi. Chi PARENT (403 FORBIDDEN). Route, thu tu va viec loc theo trang thai can
 *     BE chot.
 *
 * Ho so con do BE that quan ly nen server gia khong biet con nao ton tai: con khong co trong du lieu
 * mau (`./mock-students.ts`) la con that va chua co don nao (mang rong); hoc sinh mau cua phu huynh
 * khac thi 403 nhu BE. Du lieu mau: `./mock-registrations.ts`.
 */
import { Endpoints } from '@/api/endpoints';

import { type MockReply, type MockRequest, type MockRoute, mockOk } from './mock-adapter';
import { authorizeParent, FORBIDDEN } from './mock-guard';
import { buildMockRegistrations } from './mock-registrations';
import { findStudentById } from './mock-students';

const STUDENT_ID_PARAM = ':studentId';

function getMyStudentRegistrations(
  _body: unknown,
  { accessToken, params }: MockRequest,
): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;

  const sample = findStudentById(params.studentId ?? '');
  if (!sample) return mockOk([]);
  if (sample.parentUserId !== check.parent.id) return FORBIDDEN;
  return mockOk(buildMockRegistrations(sample));
}

export const registrationFlowRoutes: readonly MockRoute[] = [
  {
    method: 'get',
    url: Endpoints.me.studentRegistrations(STUDENT_ID_PARAM),
    handle: getMyStudentRegistrations,
  },
];
