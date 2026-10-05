import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';

import type {
  AssignmentDetail,
  AttendanceRecord,
  EnrollmentLesson,
  LinkedStudent,
  ScheduleRange,
  ScheduleSession,
  SessionDetail,
  SessionRef,
  StudentAssignment,
  StudentDashboard,
  StudentEnrollment,
  StudentProfile,
  StudentRegistration,
  SubmissionReceipt,
  SubmissionRecord,
  SubmitAssignmentPayload,
  TuitionEnrollment,
  TuitionReceipt,
  UnreadNotificationCount,
} from '../types';
import { getActiveSubjectNames } from '../utils';

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

  /** Tong quan hom nay cua mot con: buoi hoc, diem danh, diem, viec can chu y, thong bao. */
  async getStudentDashboard(studentId: string): Promise<StudentDashboard> {
    const { data } = await apiClient.get<ApiResponse<StudentDashboard>>(
      Endpoints.parent.studentDashboard(studentId),
    );
    return data.data;
  },

  /** Cac buoi hoc cua mot con trong khoang ngay, gom ca buoi hoc bu va buoi doi lich. */
  async getStudentSchedule(studentId: string, range: ScheduleRange): Promise<ScheduleSession[]> {
    const { data } = await apiClient.get<ApiResponse<ScheduleSession[]>>(
      Endpoints.parent.studentSchedule(studentId),
      { params: range },
    );
    return data.data;
  },

  /** Mot buoi trong lich hoc cua con kem diem danh, bai hoc, nhan xet va tai lieu. */
  async getSessionDetail({ studentId, sessionId }: SessionRef): Promise<SessionDetail> {
    const { data } = await apiClient.get<ApiResponse<SessionDetail>>(
      Endpoints.parent.studentSession(studentId, sessionId),
    );
    return data.data;
  },

  /** Cac mon con da ghi danh kem lop, lich co dinh, tien do va buoi tiep theo. */
  async getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
    const { data } = await apiClient.get<ApiResponse<StudentEnrollment[]>>(
      Endpoints.parent.studentEnrollments(studentId),
    );
    return data.data;
  },

  /** Lo trinh cua mot mon: cac bai theo thu tu kem buoi day va bai tap cua con. */
  async getEnrollmentLessons(studentId: string, enrollmentId: string): Promise<EnrollmentLesson[]> {
    const { data } = await apiClient.get<ApiResponse<EnrollmentLesson[]>>(
      Endpoints.parent.enrollmentLessons(studentId, enrollmentId),
    );
    return data.data;
  },

  /** Cac buoi da ket thuc cua mot con kem ket qua diem danh, don xin nghi va buoi hoc bu. */
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const { data } = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      Endpoints.parent.studentAttendance(studentId),
    );
    return data.data;
  },

  /** Bai tap giao cho mot con kem lan nop gan nhat va diem da cong bo. */
  async getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
    const { data } = await apiClient.get<ApiResponse<StudentAssignment[]>>(
      Endpoints.parent.studentAssignments(studentId),
    );
    return data.data;
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
    const { data } = await apiClient.get<ApiResponse<SubmissionRecord[]>>(
      Endpoints.academic.assignmentSubmissions(assignmentId),
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

  /** Ghi danh cua mot con kem lop, ky hoc va thanh toan da xac nhan (lich su dong hoc phi). */
  async getTuitionEnrollments(studentId: string): Promise<TuitionEnrollment[]> {
    const { data } = await apiClient.get<ApiResponse<TuitionEnrollment[]>>(
      Endpoints.me.studentEnrollments(studentId),
    );
    return data.data;
  },

  /** Cac don dang ky cua mot con, gom don con cho trung tam xac nhan thu hoc phi. */
  async getStudentRegistrations(studentId: string): Promise<StudentRegistration[]> {
    const { data } = await apiClient.get<ApiResponse<StudentRegistration[]>>(
      Endpoints.me.studentRegistrations(studentId),
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
