/**
 * Tap trung duong dan API. Khong hardcode chuoi URL trong component.
 * App chi dung mock: moi duong dan o day phai co route trong `src/api/mocks/`.
 */
export const Endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  /** BE chua co, duong dan tam theo quy uoc `/manager/...` cua EDUGRADE_BACKEND_FLOW.md. */
  parent: {
    /** GET: cac con cua phu huynh. POST: phu huynh tao ho so con moi. */
    students: '/parent/students',
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
  /** Module `registration-flow` cua BE (nhanh `dev`): du lieu cua phu huynh dang dang nhap. */
  me: {
    /** GET: ho so cac con (StudentProfile) cua phu huynh, kem ngay sinh. */
    students: '/me/students',
    /** PATCH: phu huynh sua ho ten, khoi, ngay sinh cua con. */
    student: (studentId: string) => `/me/students/${studentId}`,
    /** Ghi danh cua con kem lop, lich co dinh va thanh toan cua don dang ky. */
    studentEnrollments: (studentId: string) => `/me/students/${studentId}/enrollments`,
    /** TAM, BE chua co: cac don dang ky cua con, gom don `DRAFT` dang cho xac nhan thu hoc phi. */
    studentRegistrations: (studentId: string) => `/me/students/${studentId}/registrations`,
  },
  /** Module `registration-flow` cua BE (nhanh `dev`). */
  registrations: {
    /** Bien lai cua don dang ky da xac nhan thu hoc phi. */
    receipt: (registrationId: string) => `/registrations/${registrationId}/receipt`,
  },
  /** Module `academic` cua BE (nhanh `dev`): de bai, bai nop va diem da cong bo. */
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
