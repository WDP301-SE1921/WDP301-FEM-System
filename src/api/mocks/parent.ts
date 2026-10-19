/**
 * Mock cho cac man hinh phu huynh ma BE chua co endpoint: tong quan trang chu va thong bao. Ten route,
 * field va ma loi duoi day deu la TAM, can BE chot:
 * - GET /parent/students/:studentId/dashboard : tong quan cua mot con: diem trung binh, viec can chu
 *                                               y, thong bao gan day. Buoi hoc hom nay va ty le di
 *                                               hoc khong nam o day: app lay tu lich hoc va diem
 *                                               danh that (GET /academic/scheduled-sessions,
 *                                               GET /academic/me/students/:id/attendance)
 * - GET /parent/notifications/unread-count    : so thong bao chua doc cua phu huynh (moi con)
 * Chi role PARENT duoc goi (403 FORBIDDEN theo §11). Chi xoa route o day khi nguoi dung yeu cau wire.
 *
 * Lich hoc, chi tiet buoi, mon hoc, lo trinh, diem danh va bai tap da noi BE that
 * (`@/api/wired-routes`), khong con route o day.
 *
 * Dang nhap va ho so con da noi BE that, nen server gia khong biet con nao ton tai: `studentId` khong
 * co trong du lieu mau la con that va chua co du lieu (tong quan rong, khong co thong bao). Du lieu mau
 * chi thuoc phu huynh mau trong `./mock-students.ts` (2 con, 2 thong bao chua doc).
 */
import { Endpoints } from '@/api/endpoints';

import {
  mockError,
  mockOk,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-adapter';
import { authorizeParent } from './mock-guard';
import { findStudentById, SAMPLE_PARENT } from './mock-students';

const HOUR_MS = 60 * 60 * 1000;
const STUDENT_ID_PARAM = ':studentId';

const STUDENT_NOT_FOUND = mockError(404, 'RESOURCE_NOT_FOUND', 'Student not found');

/** Key la `User.id` cua phu huynh; phu huynh khong co trong map thi da doc het. */
const UNREAD_NOTIFICATION_COUNTS: Partial<Record<string, number>> = { [SAMPLE_PARENT.id]: 2 };

type MockDashboard = {
  scoreSummary: { average: number; changeFromLastMonth: number | null } | null;
  attentionItems: {
    id: string;
    type: 'TUITION' | 'ASSIGNMENT';
    title: string;
    description: string;
  }[];
  recentNotifications: {
    id: string;
    type: 'ATTENDANCE' | 'GRADE';
    title: string;
    message: string;
    createdAt: string;
  }[];
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

const EMPTY_DASHBOARD: MockDashboard = {
  scoreSummary: null,
  attentionItems: [],
  recentNotifications: [],
};

/** Tao luc nhan request de thoi gian thong bao luon tinh theo hom nay. */
const DASHBOARDS: Partial<Record<string, () => MockDashboard>> = {
  'mock-student-1': () => ({
    scoreSummary: { average: 8.2, changeFromLastMonth: 0.4 },
    attentionItems: [
      {
        id: 'mock-attention-1',
        type: 'TUITION',
        title: 'Học phí tháng 10',
        description: 'Chưa xác nhận đóng, vui lòng đóng tại trung tâm',
      },
      {
        id: 'mock-attention-2',
        type: 'ASSIGNMENT',
        title: 'Bài tập Toán Đại số',
        description: 'Hạn nộp: 23:59, 20/10',
      },
    ],
    recentNotifications: [
      {
        id: 'mock-notification-1',
        type: 'ATTENDANCE',
        title: 'Đã điểm danh buổi học Toán',
        message: 'Minh Anh đã có mặt đúng giờ tại phòng P.203.',
        createdAt: hoursAgo(2),
      },
      {
        id: 'mock-notification-2',
        type: 'GRADE',
        title: 'Kết quả kiểm tra 15 phút',
        message: 'Cô Yến đã chấm bài kiểm tra Hình học: đạt 9.0 điểm.',
        createdAt: hoursAgo(26),
      },
    ],
  }),
  'mock-student-2': () => ({
    scoreSummary: { average: 6.8, changeFromLastMonth: -0.3 },
    attentionItems: [],
    recentNotifications: [
      {
        id: 'mock-notification-3',
        type: 'ATTENDANCE',
        title: 'Đã điểm danh buổi học Tiếng Anh',
        message: 'Hoàng Long đã có mặt tại phòng P.105.',
        createdAt: hoursAgo(50),
      },
    ],
  }),
};

type StudentCheck = { studentId: string } | { reply: MockReply };

/**
 * Giong guard cua BE roi kiem tra con thuoc phu huynh. Id khong co trong du lieu mau la con that do BE
 * quan ly: cho qua, route tra du lieu rong cho id do.
 */
function authorizeStudent({ accessToken, params }: MockRequest): StudentCheck {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check;

  const studentId = params.studentId ?? '';
  const sample = findStudentById(studentId);
  if (sample && sample.parentUserId !== check.parent.id) return { reply: STUDENT_NOT_FOUND };
  return { studentId };
}

function getStudentDashboard(_body: unknown, request: MockRequest): MockReply {
  const check = authorizeStudent(request);
  if ('reply' in check) return check.reply;
  return mockOk(DASHBOARDS[check.studentId]?.() ?? EMPTY_DASHBOARD);
}

function getUnreadNotificationCount(_body: unknown, { accessToken }: MockRequest): MockReply {
  const check = authorizeParent(accessToken);
  if ('reply' in check) return check.reply;
  return mockOk({ unreadCount: UNREAD_NOTIFICATION_COUNTS[check.parent.id] ?? 0 });
}

export const parentRoutes: readonly MockRoute[] = [
  {
    method: 'get',
    url: Endpoints.parent.studentDashboard(STUDENT_ID_PARAM),
    handle: getStudentDashboard,
  },
  {
    method: 'get',
    url: Endpoints.parent.unreadNotificationCount,
    handle: getUnreadNotificationCount,
  },
];
