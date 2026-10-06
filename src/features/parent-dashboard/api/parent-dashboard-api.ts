import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api';
import { addDays, toDateKey } from '@/utils/date';

import type {
  AssignmentDetail,
  AssignmentSummary,
  AttendanceRecord,
  BillPage,
  EnrollmentLesson,
  LeaveQuery,
  LeaveRequest,
  LinkedStudent,
  PageQuery,
  ScheduledSession,
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
import { getActiveSubjectNames } from '../utils';

import {
  findSessionDetail,
  getStudentClassIds,
  getTermRange,
  toEnrollmentLessons,
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

  /** Buoi hoc khong bi huy cua moi con trong khoang ngay, theo gio tang dan. */
  async getScheduledSessions(range: ScheduleRange): Promise<ScheduledSession[]> {
    return readAllPages(async (page) => {
      const params: ScheduledSessionQuery = { fromDate: range.from, toDate: range.to, ...page };
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

  /** Cac buoi hoc cua mot con trong khoang ngay. */
  async getStudentSchedule(studentId: string, range: ScheduleRange): Promise<ScheduleSession[]> {
    const [enrollments, sessions] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getScheduledSessions(range),
    ]);
    return toStudentSchedule(sessions, enrollments);
  },

  /**
   * Mot buoi trong lich hoc cua con. BE khong co route doc mot buoi cho phu huynh, nen tim trong lich
   * cua ngay hoc. null khi khong thay buoi (khong thuoc con, da huy hoac doi sang ngay khac).
   */
  async getSessionDetail({
    studentId,
    sessionId,
    startsAt,
  }: SessionRef): Promise<SessionDetail | null> {
    const day = toDateKey(new Date(startsAt));
    const [enrollments, sessions] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getScheduledSessions({ from: day, to: day }),
    ]);
    return findSessionDetail(sessions, enrollments, sessionId);
  },

  /** Cac mon con da ghi danh kem lop, lich co dinh, tien do, don bao luu va buoi tiep theo. */
  async getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
    const now = new Date();
    const today = toDateKey(now);
    const [enrollments, pauses, upcomingSessions] = await Promise.all([
      parentDashboardApi.getTuitionEnrollments(studentId),
      parentDashboardApi.getActivePauses(studentId, today),
      parentDashboardApi.getScheduledSessions({
        from: today,
        to: toDateKey(addDays(now, UPCOMING_SESSION_DAYS)),
      }),
    ]);
    return toStudentEnrollments({ enrollments, pauses, upcomingSessions, now });
  },

  /** Lo trinh cua mot mon: cac buoi trong ky ghi danh theo gio hoc, moi buoi mot bai. */
  async getEnrollmentLessons(studentId: string, enrollmentId: string): Promise<EnrollmentLesson[]> {
    const enrollments = await parentDashboardApi.getTuitionEnrollments(studentId);
    const enrollment = enrollments.find(({ id }) => id === enrollmentId);
    const range = enrollment ? getTermRange(enrollment) : null;
    if (!enrollment || !range) return [];

    const sessions = await parentDashboardApi.getScheduledSessions(range);
    return toEnrollmentLessons(sessions, enrollment);
  },

  /** Cac buoi da ket thuc cua mot con kem ket qua diem danh, don xin nghi va buoi hoc bu. */
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const { data } = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      Endpoints.parent.studentAttendance(studentId),
    );
    return data.data;
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
