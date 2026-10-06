/**
 * Tap trung duong dan API. Khong hardcode chuoi URL trong component.
 * Moi duong dan o day hoac da noi BE that (`./wired-routes.ts`), hoac co route trong `./mocks/`.
 */
export const Endpoints = {
  /** Module `auth` cua BE (nhanh `dev`), da noi BE that. */
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    /** POST: xac minh email bang ma BE gui qua email sau khi dang ky. */
    verifyEmail: '/auth/verify-email',
    /** POST: gui lai email chua ma xac minh. */
    resendVerification: '/auth/resend-verification',
  },
  /** BE chua co, duong dan TAM va con chay bang mock (xem dau file `./mocks/parent.ts`). */
  parent: {
    studentDashboard: (studentId: string) => `/parent/students/${studentId}/dashboard`,
    /** Cac buoi da ket thuc cua con kem ket qua diem danh, don xin nghi va buoi hoc bu. */
    studentAttendance: (studentId: string) => `/parent/students/${studentId}/attendance`,
    unreadNotificationCount: '/parent/notifications/unread-count',
  },
  /** Module `registration-flow` cua BE (nhanh `dev`): du lieu cua phu huynh dang dang nhap. Da noi BE that. */
  me: {
    /** GET: ho so cac con (StudentProfile) cua phu huynh, kem ngay sinh. POST: tao ho so con moi. */
    students: '/me/students',
    /** PATCH: phu huynh sua ho ten, khoi, ngay sinh cua con. */
    student: (studentId: string) => `/me/students/${studentId}`,
    /** Ghi danh cua con kem lop, lich co dinh va thanh toan cua don dang ky. */
    studentEnrollments: (studentId: string) => `/me/students/${studentId}/enrollments`,
    /**
     * Bill cua moi don dang ky thuoc cac con cua phu huynh, gom bill chua thu tien. Query `page`,
     * `limit`; tra `{ items, page, limit, total }`.
     */
    bills: '/me/bills',
  },
  /** Module `registration-flow` cua BE (nhanh `dev`), da noi BE that. */
  registrations: {
    /** Bien lai cua don dang ky da xac nhan thu hoc phi. */
    receipt: (registrationId: string) => `/registrations/${registrationId}/receipt`,
    /** Bill hoc phi cua don dang ky, ca truoc va sau khi trung tam thu tien. */
    bill: (registrationId: string) => `/registrations/${registrationId}/bill`,
  },
  /**
   * Module `academic` va `curriculum-scheduling` cua BE (nhanh `dev`): buoi hoc, don nghi, bai tap,
   * bai nop va diem da cong bo. Da noi BE that.
   */
  academic: {
    /**
     * Buoi hoc da sinh (ClassSession) trong ky ghi danh cua moi con, kem lop va bai hoc. Query
     * `fromDate`, `toDate` dang `YYYY-MM-DD`, `page`, `limit`, `classId?`.
     */
    scheduledSessions: '/academic/scheduled-sessions',
    /** Don xin nghi va don bao luu cua cac con. Query `studentId`, `kind`, `status`, khoang ngay. */
    leaves: '/academic/leaves',
    /** Bai tap (khong phai `DRAFT`) giao cho cac con, chi co thong tin chung. Query `page`, `limit`. */
    assignments: '/academic/assignments',
    /** De bai kem cau hoi; dap an dung chi co sau khi giao vien cong bo dap an. */
    assignment: (assignmentId: string) => `/academic/assignments/${assignmentId}`,
    /** Cac lan nop cua con phu huynh kem diem da cong bo, moi nop truoc. */
    assignmentSubmissions: (assignmentId: string) =>
      `/academic/assignments/${assignmentId}/submissions`,
    /** POST: con nop bai qua phien dang nhap cua phu huynh. */
    submissions: '/academic/submissions',
  },
} as const;
