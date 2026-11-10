import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { readAllPages } from '@/api/pagination';
import { logger } from '@/lib/logger';
import { appendFileToForm, type UploadableFile } from '@/lib/upload-file';
import {
  AppError,
  type ApiResponse,
  type Page,
  type PageQuery,
  type PaginatedQuery,
} from '@/types/api';
import { addDays, toDateKey } from '@/utils/date';

import { RECENT_NOTIFICATION_COUNT } from '../constants';
import type {
  AppNotification,
  AssignmentDetail,
  AssignmentListItem,
  AssignmentQuery,
  AttendanceRecord,
  AttendanceReport,
  AttendanceSummary,
  BillPage,
  CenterInfo,
  CourseOutcomeSet,
  CurriculumPage,
  CurriculumUnit,
  EnrollmentLesson,
  GradeReport,
  LeaveQuery,
  LeaveRequest,
  LinkedStudent,
  NotificationQuery,
  ReadAllNotificationsResult,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  ScheduledSessionQuery,
  ScheduleRange,
  ScheduleSession,
  SessionDetail,
  SessionRef,
  SignedFileUrl,
  StudentAssignment,
  StudentEnrollment,
  StudentGrades,
  StudentProfile,
  SubjectGradeAverage,
  SubmissionReceipt,
  SubmissionRecord,
  SubmitAssignmentPayload,
  TuitionBill,
  TuitionBillDetail,
  TuitionEnrollment,
  TuitionReceipt,
  UnreadNotificationCount,
  UploadedFile,
} from '../types';
import { getActiveSubjectNames, toAttendanceSummary } from '../utils';

import {
  getTermRange,
  hasClassRoomNames,
  toAttendanceRecords,
  toEnrollmentLessons,
  toScoreSummary,
  toSessionDetail,
  toStudentAssignment,
  toStudentEnrollments,
  toStudentSchedule,
} from './parent-data-mappers';

/**
 * Gui anh cham hon request thuong: anh 2-4 MB tren 4G yeu, BE con day tiep len kho luu tru (cho toi
 * 30 giay).
 */
const UPLOAD_TIMEOUT_MS = 90_000;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_SERVICE_UNAVAILABLE = 503;
/** Loi BE chi tra `HTTP_ERROR` khi gui tep, phan biet bang status. */
const UPLOAD_STATUS_MESSAGES: Partial<Record<number, string>> = {
  [HTTP_PAYLOAD_TOO_LARGE]: 'Tệp phải nhỏ hơn 10 MB.',
  // Kho luu tru tep cua BE chua cau hinh
  [HTTP_SERVICE_UNAVAILABLE]:
    'Trung tâm chưa nhận ảnh hoặc tệp bài làm qua ứng dụng. Học sinh gõ bài làm, hoặc nộp bài giấy cho giáo viên.',
};

/** Tim buoi tiep theo cua mon trong 30 ngay toi, bang khoang BE mac dinh cho phu huynh. */
const UPCOMING_SESSION_DAYS = 30;
/**
 * Ma loi khi phu huynh mo mot buoi khong (con) thuoc lich cua con: buoi khong ton tai, hoac con da
 * chuyen lop, ket thuc mon truoc buoi do.
 */
const SESSION_UNAVAILABLE_CODES: readonly (string | undefined)[] = [
  'SESSION_NOT_FOUND',
  'FORBIDDEN',
];
/**
 * Ty le di hoc chi can `counts` (BE tinh tren ca ky, khong theo trang): xin trang `history` nho nhat
 * de khong tai lich su.
 */
const ATTENDANCE_COUNTS_ONLY: PageQuery = { page: 1, limit: 1 };
/** Bo CLO moi nhat cua khoa hoc: BE xep phien ban moi nhat truoc. */
const LATEST_OUTCOME_SET: PaginatedQuery = { paginated: true, page: 1, limit: 1 };
/**
 * Ma loi khi khoa hoc khong con xem duoc muc tieu: khoa da xoa, hoac BE khong thay con hoc khoa nay
 * (BE xet theo lop luc dang ky, con co the da chuyen sang lop cua khoa khac).
 */
const OUTCOMES_UNAVAILABLE_CODES: readonly (string | undefined)[] = [
  'PROGRAM_NOT_FOUND',
  'FORBIDDEN',
];
/**
 * Ma loi khi bo CLO cua bai khong con xem duoc: bo da xoa, hoac BE khong thay con hoc khoa cua bo
 * (cung cach xet theo lop luc dang ky).
 */
const OUTCOME_SET_UNAVAILABLE_CODES: readonly (string | undefined)[] = [
  'OUTCOME_SET_NOT_FOUND',
  'FORBIDDEN',
];

/**
 * Du lieu phu (ten phong, diem trung binh mon) chi de hien them: tai loi thi an phan do thay vi lam
 * loi ca man hinh.
 */
async function readOrFallback<T>(read: () => Promise<T>, fallback: T, what: string): Promise<T> {
  try {
    return await read();
  } catch (error) {
    logger.warn(`[parent-dashboard] Khong tai duoc ${what}, an phan nay`, error);
    return fallback;
  }
}

export const parentDashboardApi = {
  /**
   * Cac con cua phu huynh dang dang nhap kem mon dang hoc. GET /me/students cua BE khong tra mon,
   * nen doc them ghi danh cua tung con.
   */
  async getStudents(): Promise<LinkedStudent[]> {
    const students = await readAllPages(async (page) => {
      const { data } = await apiClient.get<ApiResponse<Page<StudentProfile>>>(
        Endpoints.me.students,
        { params: { paginated: true, ...page } },
      );
      return data.data;
    });
    return Promise.all(
      students.map(async ({ id, fullName, grade }) => ({
        id,
        fullName,
        grade,
        subjectNames: getActiveSubjectNames(await parentDashboardApi.getTuitionEnrollments(id)),
      })),
    );
  },

  /** Buoi hoc cua mot con trong khoang ngay (ca buoi bi huy), theo gio tang dan. */
  async getScheduledSessions(studentId: string, range: ScheduleRange): Promise<ScheduledSession[]> {
    return readAllPages(async (page) => {
      const params: ScheduledSessionQuery = {
        studentId,
        fromDate: range.from,
        toDate: range.to,
        paginated: true,
        ...page,
      };
      const { data } = await apiClient.get<ApiResponse<Page<ScheduledSession>>>(
        Endpoints.academic.scheduledSessions,
        { params },
      );
      return data.data;
    });
  },

  /** Don bao luu da duyet cua mot con dang hieu luc vao ngay `date` (`YYYY-MM-DD`). */
  async getActivePauses(studentId: string, date: string): Promise<LeaveRequest[]> {
    return readAllPages(async (page) => {
      const params: LeaveQuery = {
        studentId,
        kind: 'PERIOD_PAUSE',
        status: 'APPROVED',
        fromDate: date,
        toDate: date,
        paginated: true,
        ...page,
      };
      const { data } = await apiClient.get<ApiResponse<Page<LeaveRequest>>>(
        Endpoints.academic.leaves,
        { params },
      );
      return data.data;
    });
  },

  /** Moi phong hoc cua trung tam. */
  async getRooms(): Promise<Room[]> {
    return readAllPages(async (page) => {
      const { data } = await apiClient.get<ApiResponse<Page<Room>>>(Endpoints.rooms, {
        params: { paginated: true, ...page },
      });
      return data.data;
    });
  },

  /** Thong tin lien he cua trung tam do BE khai bao. */
  async getCenterInfo(): Promise<CenterInfo> {
    const { data } = await apiClient.get<ApiResponse<CenterInfo>>(Endpoints.center);
    return data.data;
  },

  /** Cac buoi con hoc trong khoang ngay, gom buoi hoc bu o lop khac va buoi bi huy. */
  async getStudentSchedule(studentId: string, range: ScheduleRange): Promise<ScheduleSession[]> {
    return toStudentSchedule(await parentDashboardApi.getScheduledSessions(studentId, range));
  },

  /** Mot buoi cua con. null khi buoi khong co trong lich cua con. */
  async getSessionDetail({ studentId, sessionId }: SessionRef): Promise<SessionDetail | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<ScheduledSessionDetail>>(
        Endpoints.academic.scheduledSession(sessionId),
        { params: { studentId } },
      );
      return toSessionDetail(data.data);
    } catch (error) {
      if (error instanceof AppError && SESSION_UNAVAILABLE_CODES.includes(error.code)) return null;
      throw error;
    }
  },

  /**
   * Cac mon con da ghi danh kem lop, giao vien, phong, lich co dinh, tien do, don bao luu, buoi tiep
   * theo va diem trung binh mon.
   */
  async getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
    const now = new Date();
    const today = toDateKey(now);
    const [enrollments, pauses, upcomingSessions, subjectGrades] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getActivePauses(studentId, today),
      parentDashboardApi.getScheduledSessions(studentId, {
        from: today,
        to: toDateKey(addDays(now, UPCOMING_SESSION_DAYS)),
      }),
      readOrFallback<SubjectGradeAverage[]>(
        async () => (await parentDashboardApi.getStudentGrades(studentId)).subjects,
        [],
        'diem trung binh mon',
      ),
    ]);
    // BE truoc ngay 03/11 chi tra `roomId` cua lop: moi can danh sach phong de doi ra ten
    const rooms = hasClassRoomNames(enrollments, now)
      ? []
      : await readOrFallback(() => parentDashboardApi.getRooms(), [], 'danh sach phong');
    return toStudentEnrollments({
      enrollments,
      pauses,
      upcomingSessions,
      rooms,
      subjectGrades,
      now,
    });
  },

  /** Hoc phan da duyet (kem bai) cua cac lop con dang hoc. */
  async getCurriculumUnits(studentId: string): Promise<CurriculumUnit[]> {
    return readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<CurriculumPage>>(
        Endpoints.academic.studentCurriculum(studentId),
        { params },
      );
      return data.data;
    });
  },

  /**
   * Chuan dau ra (CLO) moi nhat da duyet cua mot khoa hoc con dang hoc. null khi khoa chua co bo CLO
   * da duyet, hoac khoa khong con xem duoc.
   */
  async getCourseOutcomeSet(programId: string): Promise<CourseOutcomeSet | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<Page<CourseOutcomeSet>>>(
        Endpoints.academic.programOutcomeSets(programId),
        { params: LATEST_OUTCOME_SET },
      );
      return data.data.items[0] ?? null;
    } catch (error) {
      if (error instanceof AppError && OUTCOMES_UNAVAILABLE_CODES.includes(error.code)) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Mot bo chuan dau ra (CLO) theo id, vd bo giao vien chon cho bai tap
   * (`AssignmentDetail.outcomeSetId`). null khi bo khong con xem duoc.
   */
  async getOutcomeSet(outcomeSetId: string): Promise<CourseOutcomeSet | null> {
    try {
      const { data } = await apiClient.get<ApiResponse<CourseOutcomeSet>>(
        Endpoints.academic.outcomeSet(outcomeSetId),
      );
      return data.data;
    } catch (error) {
      if (error instanceof AppError && OUTCOME_SET_UNAVAILABLE_CODES.includes(error.code)) {
        return null;
      }
      throw error;
    }
  },

  /** Lo trinh cua mot mon: bai cua hoc phan da duyet kem buoi day bai trong ky ghi danh. */
  async getEnrollmentLessons(studentId: string, enrollmentId: string): Promise<EnrollmentLesson[]> {
    const enrollments = await parentDashboardApi.getTuitionEnrollments(studentId);
    const enrollment = enrollments.find(({ id }) => id === enrollmentId);
    const range = enrollment ? getTermRange(enrollment) : null;
    if (!enrollment || !range) return [];

    const [sessions, units] = await Promise.all([
      parentDashboardApi.getScheduledSessions(studentId, range),
      parentDashboardApi.getCurriculumUnits(studentId),
    ]);
    return toEnrollmentLessons({ enrollment, sessions, units });
  },

  /**
   * So buoi theo ket qua diem danh (ca ky) va mot trang cac buoi da chot diem danh cua mot con, tu
   * truoc toi nay.
   */
  async getAttendanceReport(studentId: string, params: PageQuery): Promise<AttendanceReport> {
    const { data } = await apiClient.get<ApiResponse<AttendanceReport>>(
      Endpoints.academic.studentAttendance(studentId),
      { params },
    );
    return data.data;
  },

  /** Ty le di hoc cua mot con, cung cach tinh voi web. */
  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    const { counts } = await parentDashboardApi.getAttendanceReport(
      studentId,
      ATTENDANCE_COUNTS_ONLY,
    );
    return toAttendanceSummary(counts);
  },

  /** Cac buoi da chot diem danh cua mot con kem ket qua, don nghi va lich hoc bu. Doc het cac trang. */
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const history = await readAllPages(async (params) => {
      const report = await parentDashboardApi.getAttendanceReport(studentId, params);
      return { items: report.history, total: report.total };
    });
    return toAttendanceRecords(history);
  },

  /** Bai tap (khong phai `DRAFT`) giao cho mot con, moi tao truoc. */
  async getAssignments(studentId: string): Promise<AssignmentListItem[]> {
    return readAllPages(async (page) => {
      const params: AssignmentQuery = { studentId, paginated: true, ...page };
      const { data } = await apiClient.get<ApiResponse<Page<AssignmentListItem>>>(
        Endpoints.academic.assignments,
        { params },
      );
      return data.data;
    });
  },

  /**
   * Bai tap giao cho mot con kem lan nop gan nhat va diem da cong bo. Ten giao vien cua lop lay tu ghi
   * danh cua con.
   */
  async getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
    const [enrollments, items] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getAssignments(studentId),
    ]);
    return items
      .map((item) => toStudentAssignment({ item, studentId, enrollments }))
      .filter((assignment) => assignment !== null);
  },

  /** De bai kem cau hoi; dap an dung chi co sau khi giao vien cong bo dap an. */
  async getAssignmentDetail(assignmentId: string): Promise<AssignmentDetail> {
    const { data } = await apiClient.get<ApiResponse<AssignmentDetail>>(
      Endpoints.academic.assignment(assignmentId),
    );
    return data.data;
  },

  /** Cac lan nop cua con phu huynh cho mot bai, kem diem da cong bo, moi nop truoc. */
  async getAssignmentSubmissions(assignmentId: string): Promise<SubmissionRecord[]> {
    return readAllPages(async (page) => {
      const { data } = await apiClient.get<ApiResponse<Page<SubmissionRecord>>>(
        Endpoints.academic.assignmentSubmissions(assignmentId),
        { params: { paginated: true, ...page } },
      );
      return data.data;
    });
  },

  /** Tai mot anh hoac tep PDF bai lam len de gui kem bai nop. */
  async uploadSubmissionFile(file: UploadableFile): Promise<UploadedFile> {
    const form = new FormData();
    await appendFileToForm(form, 'file', file);
    try {
      const { data } = await apiClient.post<ApiResponse<UploadedFile>>(
        Endpoints.academic.files,
        form,
        {
          // apiClient mac dinh gui JSON: axios se doi FormData thanh JSON neu khong doi header
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: UPLOAD_TIMEOUT_MS,
        },
      );
      return data.data;
    } catch (error) {
      const message = error instanceof AppError ? UPLOAD_STATUS_MESSAGES[error.status ?? 0] : null;
      if (error instanceof AppError && message) {
        throw new AppError(message, error.status, error.code);
      }
      throw error;
    }
  },

  /** Link xem lai mot anh hoac tep bai lam da nop, hoac tep de giao vien cho hoc sinh xem. */
  async getFilePreview(fileId: string): Promise<SignedFileUrl> {
    const { data } = await apiClient.get<ApiResponse<SignedFileUrl>>(
      Endpoints.academic.filePreview(fileId),
    );
    return data.data;
  },

  /** Con nop bai qua phien dang nhap cua phu huynh. */
  async submitAssignment(payload: SubmitAssignmentPayload): Promise<SubmissionReceipt> {
    const { data } = await apiClient.post<ApiResponse<SubmissionReceipt>>(
      Endpoints.academic.submissions,
      payload,
    );
    return data.data;
  },

  /**
   * Diem trung binh cac bai da cong bo (kem chenh lech so voi thang truoc) va theo mon cua mot con.
   * Doc het lich su diem vi diem trung binh chung can moi bai; diem theo mon do BE tinh.
   */
  async getStudentGrades(studentId: string): Promise<StudentGrades> {
    let subjects: SubjectGradeAverage[] = [];
    const history = await readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<GradeReport>>(
        Endpoints.academic.studentGrades(studentId),
        { params },
      );
      // `subjects` tinh tren ca lich su, trang nao cung nhu nhau
      subjects = data.data.subjects;
      return { items: data.data.history, total: data.data.total };
    });
    return { summary: toScoreSummary(history), subjects };
  },

  /**
   * Ghi danh cua mot con (ca mon da ket thuc) kem lop, ky hoc va thanh toan da xac nhan (lich su dong
   * hoc phi). Doc het cac trang.
   */
  async getTuitionEnrollments(studentId: string): Promise<TuitionEnrollment[]> {
    return readAllPages(async (page) => {
      const { data } = await apiClient.get<ApiResponse<Page<TuitionEnrollment>>>(
        Endpoints.me.studentEnrollments(studentId),
        { params: { paginated: true, ...page } },
      );
      return data.data;
    });
  },

  /** Bill cua moi don dang ky thuoc cac con cua phu huynh, moi lap truoc. Doc het cac trang. */
  async getBills(): Promise<TuitionBill[]> {
    return readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<BillPage>>(Endpoints.me.bills, { params });
      return data.data;
    });
  },

  /**
   * Bill cua mot con, gom bill con cho trung tam xac nhan thu hoc phi. BE tra bill chung cho moi con
   * nen loc theo con o day.
   */
  async getStudentBills(studentId: string): Promise<TuitionBill[]> {
    const bills = await parentDashboardApi.getBills();
    return bills.filter(({ student }) => student.id === studentId);
  },

  /** Bill hoc phi cua mot don dang ky: chua thu tien, da thu tien hoac da huy. */
  async getBill(registrationId: string): Promise<TuitionBillDetail> {
    const { data } = await apiClient.get<ApiResponse<TuitionBillDetail>>(
      Endpoints.registrations.bill(registrationId),
    );
    return data.data;
  },

  /** Bien lai cua mot don dang ky da xac nhan thu hoc phi. */
  async getReceipt(registrationId: string): Promise<TuitionReceipt> {
    const { data } = await apiClient.get<ApiResponse<TuitionReceipt>>(
      Endpoints.registrations.receipt(registrationId),
    );
    return data.data;
  },

  /** Mot trang hop thu thong bao, moi nhat truoc. `studentId` chi lay thong bao lien quan toi con do. */
  async getNotifications(query: NotificationQuery): Promise<Page<AppNotification>> {
    const { data } = await apiClient.get<ApiResponse<Page<AppNotification>>>(
      Endpoints.notifications.list,
      { params: query },
    );
    return data.data;
  },

  /** Vai thong bao moi nhat lien quan toi mot con, cho trang chu. */
  async getRecentNotifications(studentId: string): Promise<AppNotification[]> {
    const { items } = await parentDashboardApi.getNotifications({
      studentId,
      page: 1,
      limit: RECENT_NOTIFICATION_COUNT,
    });
    return items;
  },

  /** So thong bao chua doc cua ca hop thu, de hien cham do tren nut chuong. */
  async getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
    const { data } = await apiClient.get<ApiResponse<UnreadNotificationCount>>(
      Endpoints.notifications.unreadCount,
    );
    return data.data;
  },

  /** Danh dau da doc mot thong bao. Doc lai thong bao da doc thi BE giu thoi diem doc dau tien. */
  async markNotificationRead(notificationId: string): Promise<AppNotification> {
    const { data } = await apiClient.patch<ApiResponse<AppNotification>>(
      Endpoints.notifications.read(notificationId),
    );
    return data.data;
  },

  /** Danh dau da doc moi thong bao co tai thoi diem goi. */
  async markAllNotificationsRead(): Promise<ReadAllNotificationsResult> {
    const { data } = await apiClient.post<ApiResponse<ReadAllNotificationsResult>>(
      Endpoints.notifications.readAll,
    );
    return data.data;
  },
};
