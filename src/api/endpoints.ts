/**
 * Tap trung duong dan API. Khong hardcode chuoi URL trong component.
 * Moi duong dan o day da noi BE that (`./wired-routes.ts`); endpoint chua wire thi co route trong
 * `./mocks/`.
 */
export const Endpoints = {
  /** Module `auth` cua BE (nhanh `dev`), da noi BE that. */
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    /** GET: tai khoan dang dang nhap. PATCH: sua ten hien thi va so dien thoai cua phu huynh. */
    me: '/auth/me',
    /** POST: xac minh email bang ma BE gui qua email sau khi dang ky. */
    verifyEmail: '/auth/verify-email',
    /** POST: gui lai email chua ma xac minh. */
    resendVerification: '/auth/resend-verification',
    /** POST: doi mat khau, BE dang xuat cac thiet bi khac. */
    changePassword: '/auth/change-password',
    /** POST: gui email chua lien ket dat lai mat khau (trang web `/reset-password`). */
    forgotPassword: '/auth/forgot-password',
  },
  /**
   * Module `notifications` cua BE (nhanh `dev`): hop thu thong bao cua tai khoan dang dang nhap. Da
   * noi BE that. Thong bao moi den qua Socket.IO (`Config.serverOrigin`, xem
   * `features/parent-dashboard/api/notification-realtime.ts`), khong qua cac duong dan nay.
   */
  notifications: {
    /** Query `page`, `limit`, `unreadOnly?`, `type?`, `studentId?`; tra `{ items, page, limit, total }`. */
    list: '/notifications',
    /** So thong bao chua doc cua ca hop thu, khong theo bo loc. */
    unreadCount: '/notifications/unread-count',
    /** PATCH: danh dau da doc mot thong bao. */
    read: (notificationId: string) => `/notifications/${notificationId}/read`,
    /** POST: danh dau da doc moi thong bao. */
    readAll: '/notifications/read-all',
  },
  /** Module `registration-flow` cua BE (nhanh `dev`): danh sach phong hoc. Da noi BE that. */
  rooms: '/rooms',
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
     * Buoi hoc da sinh (ClassSession) cua mot con, ca buoi bi huy, kem lop, giao vien, phong, bai hoc
     * va cho cua con trong buoi. Query `studentId`, `fromDate`, `toDate` dang `YYYY-MM-DD`, `page`,
     * `limit`, `paginated`, `classId?`.
     */
    scheduledSessions: '/academic/scheduled-sessions',
    /** Mot buoi kem giao vien, phong, ghi chu va diem danh cua con. Query `studentId` bat buoc. */
    scheduledSession: (sessionId: string) => `/academic/scheduled-sessions/${sessionId}`,
    /**
     * Ty le di hoc va cac buoi da chot diem danh cua mot con, kem lop, don nghi va lich hoc bu cua
     * buoi. Query `fromDate?`, `toDate?`.
     */
    studentAttendance: (studentId: string) => `/academic/me/students/${studentId}/attendance`,
    /** Diem da cong bo cua mot con va diem trung binh theo mon. Query `page`, `limit`. */
    studentGrades: (studentId: string) => `/academic/me/students/${studentId}/grades`,
    /** Hoc phan da duyet (kem bai hoc) cua lop con dang hoc. Query `page`, `limit`. */
    studentCurriculum: (studentId: string) => `/academic/me/students/${studentId}/curriculum`,
    /**
     * Lich hoc bu (MakeupBooking) cua cac con, moi xep truoc. App khong con goi: lich su diem danh da
     * kem lich hoc bu. Van de trong `WIRED_ROUTES` vi da wire.
     */
    makeups: '/academic/makeups',
    /** Don xin nghi va don bao luu cua cac con. Query `studentId`, `kind`, `status`, khoang ngay. */
    leaves: '/academic/leaves',
    /**
     * Bai tap (khong phai `DRAFT`) giao cho cac con kem lop, so cau, lan nop gan nhat va diem da cong
     * bo. Query `studentId`, `page`, `limit`, `paginated`.
     */
    assignments: '/academic/assignments',
    /** De bai kem cau hoi; dap an dung chi co sau khi giao vien cong bo dap an. */
    assignment: (assignmentId: string) => `/academic/assignments/${assignmentId}`,
    /** Cac lan nop cua con phu huynh kem diem da cong bo, moi nop truoc. */
    assignmentSubmissions: (assignmentId: string) =>
      `/academic/assignments/${assignmentId}/submissions`,
    /** POST: con nop bai qua phien dang nhap cua phu huynh. */
    submissions: '/academic/submissions',
    /**
     * POST multipart (truong `file`): phu huynh tai anh bai lam (JPEG, PNG) hoac PDF toi da 10 MB, tra
     * id de gui kem bai nop qua `fileIds`.
     */
    files: '/academic/files',
  },
} as const;
