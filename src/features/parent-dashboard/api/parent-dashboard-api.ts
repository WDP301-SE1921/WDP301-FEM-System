import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { logger } from '@/lib/logger';
import { AppError, type ApiResponse } from '@/types/api';
import { addDays, toDateKey } from '@/utils/date';

import type {
  AssignmentDetail,
  AssignmentSummary,
  AttendanceRecord,
  AttendanceReport,
  AttendanceSummary,
  BillPage,
  EnrollmentLesson,
  LeaveQuery,
  LeaveRequest,
  LinkedStudent,
  MakeupBooking,
  PageQuery,
  Room,
  ScheduledSession,
  ScheduledSessionDetail,
  ScheduledSessionQuery,
  ScheduleRange,
  ScheduleSession,
  SessionDetail,
  SessionRef,
  StudentAssignment,
  StudentDashboard,
  StudentEnrollment,
  StudentProfile,
  SubmissionReceipt,
  SubmissionRecord,
  SubmitAssignmentPayload,
  TuitionBill,
  TuitionBillDetail,
  TuitionEnrollment,
  TuitionReceipt,
  UnreadNotificationCount,
} from '../types';
import { getActiveSubjectNames, toAttendanceSummary } from '../utils';

import {
  getStudentClassIds,
  getTermRange,
  toAttendanceRecords,
  toEnrollmentLessons,
  toSessionDetail,
  toStudentAssignment,
  toStudentEnrollments,
  toStudentSchedule,
} from './parent-data-mappers';

/** `limit` lon nhat BE nhan (PageDto). */
const PAGE_LIMIT = 100;
/** Chan vong lap khi BE tra trang day mai: 20 trang la 2000 ban ghi. */
const MAX_PAGES = 20;
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
 * Doc het cac trang cua mot route `academic`. BE tra mang khong kem tong so ban ghi, nen doc toi khi
 * gap trang chua day.
 */
async function readAllPages<T>(readPage: (query: PageQuery) => Promise<T[]>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await readPage({ page, limit: PAGE_LIMIT });
    items.push(...batch);
    if (batch.length < PAGE_LIMIT) return items;
  }
  logger.warn('[parent-dashboard] Du lieu vuot qua so trang toi da, bo phan con lai', {
    maxPages: MAX_PAGES,
  });
  return items;
}

/** Phong chi de hien ten phong: tai loi thi an ten phong thay vi lam loi ca man hinh. */
async function readRoomsOrEmpty(): Promise<Room[]> {
  try {
    return await parentDashboardApi.getRooms();
  } catch (error) {
    logger.warn('[parent-dashboard] Khong tai duoc danh sach phong, an ten phong', error);
    return [];
  }
}

export const parentDashboardApi = {
  /**
   * Cac con cua phu huynh dang dang nhap kem mon dang hoc. GET /me/students cua BE khong tra mon,
   * nen doc them ghi danh cua tung con.
   */
  async getStudents(): Promise<LinkedStudent[]> {
    const { data } = await apiClient.get<ApiResponse<StudentProfile[]>>(Endpoints.me.students);
    return Promise.all(
      data.data.map(async ({ id, fullName, grade }) => ({
        id,
        fullName,
        grade,
        subjectNames: getActiveSubjectNames(await parentDashboardApi.getTuitionEnrollments(id)),
      })),
    );
  },

  /** Tong quan cua mot con: ty le di hoc, diem, viec can chu y, thong bao. */
  async getStudentDashboard(studentId: string): Promise<StudentDashboard> {
    const { data } = await apiClient.get<ApiResponse<StudentDashboard>>(
      Endpoints.parent.studentDashboard(studentId),
    );
    return data.data;
  },

  /** Buoi hoc khong bi huy cua mot con trong khoang ngay, theo gio tang dan. */
  async getScheduledSessions(studentId: string, range: ScheduleRange): Promise<ScheduledSession[]> {
    return readAllPages(async (page) => {
      const params: ScheduledSessionQuery = {
        studentId,
        fromDate: range.from,
        toDate: range.to,
        ...page,
      };
      const { data } = await apiClient.get<ApiResponse<ScheduledSession[]>>(
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
        ...page,
      };
      const { data } = await apiClient.get<ApiResponse<LeaveRequest[]>>(Endpoints.academic.leaves, {
        params,
      });
      return data.data;
    });
  },

  /** Don nghi va don bao luu da duyet cua mot con. */
  async getApprovedLeaves(studentId: string): Promise<LeaveRequest[]> {
    return readAllPages(async (page) => {
      const params: LeaveQuery = { studentId, status: 'APPROVED', ...page };
      const { data } = await apiClient.get<ApiResponse<LeaveRequest[]>>(Endpoints.academic.leaves, {
        params,
      });
      return data.data;
    });
  },

  /** Lich hoc bu cua moi con cua phu huynh, moi xep truoc. */
  async getMakeups(): Promise<MakeupBooking[]> {
    return readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<MakeupBooking[]>>(
        Endpoints.academic.makeups,
        { params },
      );
      return data.data;
    });
  },

  /** Moi phong hoc cua trung tam. */
  async getRooms(): Promise<Room[]> {
    const { data } = await apiClient.get<ApiResponse<Room[]>>(Endpoints.rooms);
    return data.data;
  },

  /** Cac buoi con hoc trong khoang ngay, gom buoi hoc bu o lop khac. */
  async getStudentSchedule(studentId: string, range: ScheduleRange): Promise<ScheduleSession[]> {
    return toStudentSchedule(await parentDashboardApi.getScheduledSessions(studentId, range));
  },

  /** Mot buoi cua con. null khi buoi khong co trong lich cua con. */
  async getSessionDetail({ studentId, sessionId }: SessionRef): Promise<SessionDetail | null> {
    try {
      const [{ data }, rooms] = await Promise.all([
        apiClient.get<ApiResponse<ScheduledSessionDetail>>(
          Endpoints.academic.scheduledSession(sessionId),
          { params: { studentId } },
        ),
        readRoomsOrEmpty(),
      ]);
      return toSessionDetail(data.data, rooms);
    } catch (error) {
      if (error instanceof AppError && SESSION_UNAVAILABLE_CODES.includes(error.code)) return null;
      throw error;
    }
  },

  /** Cac mon con da ghi danh kem lop, phong, lich co dinh, tien do, don bao luu va buoi tiep theo. */
  async getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
    const now = new Date();
    const today = toDateKey(now);
    const [enrollments, pauses, upcomingSessions, rooms] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getActivePauses(studentId, today),
      parentDashboardApi.getScheduledSessions(studentId, {
        from: today,
        to: toDateKey(addDays(now, UPCOMING_SESSION_DAYS)),
      }),
      readRoomsOrEmpty(),
    ]);
    return toStudentEnrollments({ enrollments, pauses, upcomingSessions, rooms, now });
  },

  /** Lo trinh cua mot mon: cac buoi trong ky ghi danh theo gio hoc, moi buoi mot bai. */
  async getEnrollmentLessons(studentId: string, enrollmentId: string): Promise<EnrollmentLesson[]> {
    const enrollments = await parentDashboardApi.getTuitionEnrollments(studentId);
    const enrollment = enrollments.find(({ id }) => id === enrollmentId);
    const range = enrollment ? getTermRange(enrollment) : null;
    if (!enrollment || !range) return [];

    const sessions = await parentDashboardApi.getScheduledSessions(studentId, range);
    return toEnrollmentLessons(sessions, enrollment);
  },

  /** So buoi theo ket qua diem danh va cac buoi da chot diem danh cua mot con, tu truoc toi nay. */
  async getAttendanceReport(studentId: string): Promise<AttendanceReport> {
    const { data } = await apiClient.get<ApiResponse<AttendanceReport>>(
      Endpoints.academic.studentAttendance(studentId),
    );
    return data.data;
  },

  /** Ty le di hoc cua mot con, cung cach tinh voi web. */
  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    const { counts } = await parentDashboardApi.getAttendanceReport(studentId);
    return toAttendanceSummary(counts);
  },

  /** Cac buoi da chot diem danh cua mot con kem ket qua, don nghi va lich hoc bu. */
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const [{ history }, enrollments, makeups, leaves] = await Promise.all([
      parentDashboardApi.getAttendanceReport(studentId),
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getMakeups(),
      parentDashboardApi.getApprovedLeaves(studentId),
    ]);
    return toAttendanceRecords({ history, enrollments, makeups, leaves });
  },

  /** Bai tap (khong phai `DRAFT`) giao cho moi con cua phu huynh, moi tao truoc. */
  async getAssignmentSummaries(): Promise<AssignmentSummary[]> {
    return readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<AssignmentSummary[]>>(
        Endpoints.academic.assignments,
        { params },
      );
      return data.data;
    });
  },

  /**
   * Bai tap giao cho mot con kem lan nop gan nhat va diem da cong bo. Danh sach cua BE chi co thong
   * tin chung cho moi con, nen doc them de bai va bai nop cua tung bai thuoc lop cua con.
   */
  async getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
    const [enrollments, summaries] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getAssignmentSummaries(),
    ]);
    const classIds = getStudentClassIds(enrollments);
    const assignments = await Promise.all(
      summaries
        .filter(({ classId }) => classIds.has(classId))
        .map(async ({ id }) => {
          const [detail, submissions] = await Promise.all([
            parentDashboardApi.getAssignmentDetail(id),
            parentDashboardApi.getAssignmentSubmissions(id),
          ]);
          return toStudentAssignment({ detail, submissions, enrollments });
        }),
    );
    return assignments.filter((assignment) => assignment !== null);
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
    return readAllPages(async (params) => {
      const { data } = await apiClient.get<ApiResponse<SubmissionRecord[]>>(
        Endpoints.academic.assignmentSubmissions(assignmentId),
        { params },
      );
      return data.data;
    });
  },

  /** Con nop bai qua phien dang nhap cua phu huynh. */
  async submitAssignment(payload: SubmitAssignmentPayload): Promise<SubmissionReceipt> {
    const { data } = await apiClient.post<ApiResponse<SubmissionReceipt>>(
      Endpoints.academic.submissions,
      payload,
    );
    return data.data;
  },

  /** Ghi danh cua mot con kem lop, ky hoc va thanh toan da xac nhan (lich su dong hoc phi). */
  async getTuitionEnrollments(studentId: string): Promise<TuitionEnrollment[]> {
    const { data } = await apiClient.get<ApiResponse<TuitionEnrollment[]>>(
      Endpoints.me.studentEnrollments(studentId),
    );
    return data.data;
  },

  /** Bill cua moi don dang ky thuoc cac con cua phu huynh, moi lap truoc. Doc het cac trang. */
  async getBills(): Promise<TuitionBill[]> {
    const bills: TuitionBill[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const params: PageQuery = { page, limit: PAGE_LIMIT };
      const { data } = await apiClient.get<ApiResponse<BillPage>>(Endpoints.me.bills, { params });
      bills.push(...data.data.items);
      if (data.data.items.length === 0 || bills.length >= data.data.total) break;
    }
    return bills;
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

  /** So thong bao phu huynh chua doc, de hien cham do tren nut chuong. */
  async getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
    const { data } = await apiClient.get<ApiResponse<UnreadNotificationCount>>(
      Endpoints.parent.unreadNotificationCount,
    );
    return data.data;
  },
};
