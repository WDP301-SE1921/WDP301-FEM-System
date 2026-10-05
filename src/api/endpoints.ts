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
    /** Query `from`, `to` dang `YYYY-MM-DD`. */
    studentSchedule: (studentId: string) => `/parent/students/${studentId}/schedule`,
    /** Chi tiet mot buoi trong lich hoc cua con, `sessionId` lay tu response lich hoc. */
    studentSession: (studentId: string, sessionId: string) =>
      `/parent/students/${studentId}/sessions/${sessionId}`,
    /** Cac mon con da ghi danh (Enrollment), gom ca mon dang bao luu va da ket thuc. */
    studentEnrollments: (studentId: string) => `/parent/students/${studentId}/enrollments`,
    /** Cac bai trong chuong trinh cua mot mon con da ghi danh, kem buoi day va bai tap. */
    enrollmentLessons: (studentId: string, enrollmentId: string) =>
      `/parent/students/${studentId}/enrollments/${enrollmentId}/lessons`,
    /** Cac buoi da ket thuc cua con kem ket qua diem danh, don xin nghi va buoi hoc bu. */
    studentAttendance: (studentId: string) => `/parent/students/${studentId}/attendance`,
    /** Bai tap cua con o cac mon dang hoc, kem lan nop gan nhat va diem da cong bo. */
    studentAssignments: (studentId: string) => `/parent/students/${studentId}/assignments`,
    unreadNotificationCount: '/parent/notifications/unread-count',
  },
  /**
   * Module `registration-flow` cua BE (nhanh `dev`): du lieu cua phu huynh dang dang nhap. Da noi BE
   * that, tru `studentRegistrations`.
   */
  me: {
    /** GET: ho so cac con (StudentProfile) cua phu huynh, kem ngay sinh. POST: tao ho so con moi. */
    students: '/me/students',
    /** PATCH: phu huynh sua ho ten, khoi, ngay sinh cua con. */
    student: (studentId: string) => `/me/students/${studentId}`,
    /** Ghi danh cua con kem lop, lich co dinh va thanh toan cua don dang ky. */
    studentEnrollments: (studentId: string) => `/me/students/${studentId}/enrollments`,
    /**
     * TAM, BE chua co nen con chay bang mock: cac don dang ky cua con, gom don `DRAFT` dang cho xac
     * nhan thu hoc phi.
     */
    studentRegistrations: (studentId: string) => `/me/students/${studentId}/registrations`,
  },
  /** Module `registration-flow` cua BE (nhanh `dev`), da noi BE that. */
  registrations: {
    /** Bien lai cua don dang ky da xac nhan thu hoc phi. */
    receipt: (registrationId: string) => `/registrations/${registrationId}/receipt`,
  },
  /**
   * Module `academic` cua BE (nhanh `dev`): de bai, bai nop va diem da cong bo. Con chay bang mock vi
   * danh sach bai tap dan toi day (`parent.studentAssignments`) chua co o BE.
   */
  academic: {
    /** De bai kem cau hoi; dap an dung chi co sau khi giao vien cong bo dap an. */
    assignment: (assignmentId: string) => `/academic/assignments/${assignmentId}`,
    /** Cac lan nop cua con phu huynh kem diem da cong bo, moi nop truoc. */
    assignmentSubmissions: (assignmentId: string) =>
      `/academic/assignments/${assignmentId}/submissions`,
    /** POST: con nop bai qua phien dang nhap cua phu huynh. */
    submissions: '/academic/submissions',
  },
} as const;
